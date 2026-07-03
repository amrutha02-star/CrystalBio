#!/usr/bin/env python3
import asyncio, base64, json, os, re, time, urllib.request
from pathlib import Path
import websockets

APP='https://work.convogenie.ai'
API='https://work-api.convogenie.ai'
ROOT=Path('/root/workspace/CrystalBio')
SHOT=ROOT/'dogfood-output/screenshots/full-ui-journey-2026-07-02'
OUT=ROOT/'dogfood-output/full-ui-user-journey-2026-07-02-results.json'
CREDS=Path('/root/workspace/crystalbio-credentials/bloom-assigned/BLOOM_ASSIGNED_CREDENTIALS.txt')
SHOT.mkdir(parents=True, exist_ok=True)

text=CREDS.read_text()
admin_email='bloom.admin@crystalbio.in'; agent_email='bloom.agent@crystalbio.in'
admin_pass=re.search(r'Bloom QA Admin[\s\S]*?Password: (\S+)', text).group(1)
agent_pass=re.search(r'Bloom QA Agent[\s\S]*?Password: (\S+)', text).group(1)
RUN='BLOOM FULL UI 20260702 0745'

class CDP:
  def __init__(self, ws): self.ws=ws; self.i=0; self.pending={}; self.events=[]
  async def send(self, method, params=None):
    self.i+=1; mid=self.i
    fut=asyncio.get_event_loop().create_future(); self.pending[mid]=fut
    await self.ws.send(json.dumps({'id':mid,'method':method,'params':params or {}}))
    return await fut
  async def recv_loop(self):
    async for msg in self.ws:
      data=json.loads(msg)
      if 'id' in data and data['id'] in self.pending: self.pending.pop(data['id']).set_result(data)
      else: self.events.append(data)

async def new_client():
  # attach to the first available tab opened by the headless browser
  targets=json.load(urllib.request.urlopen('http://127.0.0.1:9223/json/list'))
  target=next(t for t in targets if t.get('type')=='page')
  wsurl=target['webSocketDebuggerUrl']
  ws=await websockets.connect(wsurl, max_size=50_000_000)
  c=CDP(ws); asyncio.create_task(c.recv_loop())
  for m in ['Page.enable','Runtime.enable','Network.enable','DOM.enable']:
    await c.send(m)
  try: await c.send('Browser.grantPermissions', {'origin':APP,'permissions':['geolocation']})
  except Exception: pass
  await c.send('Emulation.setGeolocationOverride', {'latitude':12.9716,'longitude':77.5946,'accuracy':20})
  await c.send('Emulation.setDeviceMetricsOverride', {'width':390,'height':844,'deviceScaleFactor':2,'mobile':True})
  return c

async def evaljs(c, expr, awaitp=False):
  r=await c.send('Runtime.evaluate', {'expression':expr, 'awaitPromise':awaitp, 'returnByValue':True})
  if 'exceptionDetails' in r.get('result',{}): return {'exception': r['result']['exceptionDetails']}
  return r.get('result',{}).get('result',{}).get('value')

HELPERS=r'''
window.qa = {
 text(){return document.body.innerText.slice(0,5000)},
 buttons(){return [...document.querySelectorAll('button,a')].map((e,i)=>({i,t:e.innerText||e.getAttribute('aria-label')||e.textContent, dis:e.disabled})).filter(x=>x.t&&x.t.trim())},
 inputs(){return [...document.querySelectorAll('input,textarea,select')].map((e,i)=>({i, tag:e.tagName, type:e.type, ph:e.placeholder, label:(e.closest('label')?.innerText||''), value:e.type==='password'?'***':e.value}))},
 click(txt){let els=[...document.querySelectorAll('button,a,[role=button]')]; let e=els.find(x=>(x.innerText||x.textContent||x.getAttribute('aria-label')||'').toLowerCase().includes(txt.toLowerCase()) && !x.disabled); if(e){e.scrollIntoView({block:'center'}); e.click(); return true} return false},
 setInput(match,val){let els=[...document.querySelectorAll('input,textarea')]; let e=els.find(x=>((x.placeholder||'')+' '+(x.closest('label')?.innerText||'')+' '+(x.name||'')).toLowerCase().includes(match.toLowerCase())); if(!e && /email/.test(match)) e=els.find(x=>x.type==='email'||(x.placeholder||'').toLowerCase().includes('email')); if(!e && /password/.test(match)) e=els.find(x=>x.type==='password'); if(!e) return false; e.focus(); e.value=val; e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true})); return true},
 fillVisible(vals){let els=[...document.querySelectorAll('input,textarea')].filter(e=>e.offsetParent!==null && e.type!=='hidden' && e.type!=='password' && e.type!=='email'); els.forEach((e,i)=>{ if(!e.value){e.focus(); e.value=vals[i%vals.length]; e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true}));}}); return els.length},
 selectVisible(){let sels=[...document.querySelectorAll('select')].filter(e=>e.offsetParent!==null); sels.forEach(s=>{ if(s.options.length>1){s.selectedIndex=1; s.dispatchEvent(new Event('change',{bubbles:true}))}}); return sels.length},
 localClear(){localStorage.clear(); document.cookie.split(';').forEach(c=>document.cookie=c.replace(/^ +/,'').replace(/=.*/,'=;expires='+new Date(0).toUTCString()+';path=/')); return true},
 session(){return {ls:{...localStorage}, cookies:document.cookie}}
}
'''

async def prep(c): await evaljs(c, HELPERS)
async def wait(c, sec=1): await asyncio.sleep(sec); await prep(c)
async def snap(c, name, notes):
  await prep(c)
  img=await c.send('Page.captureScreenshot', {'format':'png','captureBeyondViewport':False})
  p=SHOT/f'{name}.png'; p.write_bytes(base64.b64decode(img['result']['data']))
  notes['screenshots'].append(str(p))
  notes['steps'].append({'name':name, 'text': await evaljs(c,'qa.text()'), 'buttons': await evaljs(c,'qa.buttons()'), 'inputs': await evaljs(c,'qa.inputs()'), 'screenshot':str(p)})
  return str(p)
async def click(c, txt, notes, name=None, delay=1):
  ok=await evaljs(c, f"qa.click({json.dumps(txt)})")
  await wait(c, delay)
  if name: await snap(c,name,notes)
  return ok
async def login(c,email,pw,notes,prefix):
  await evaljs(c, f"qa.setInput('email',{json.dumps(email)}); qa.setInput('password',{json.dumps(pw)});")
  await snap(c,f'{prefix}-filled-login',notes)
  await click(c,'Login',notes,f'{prefix}-after-login',2)
async def logout(c,notes,prefix):
  if not await click(c,'Profile',notes,None,1): await click(c,'Open profile',notes,None,1)
  await snap(c,f'{prefix}-profile',notes)
  await click(c,'Logout',notes,f'{prefix}-after-logout',1)

async def main():
  c=await new_client(); notes={'run':RUN,'screenshots':[],'steps':[],'journeys':{},'console':[],'createdQaLabels':[]}
  await wait(c,2); await evaljs(c, 'qa.localClear(); location.href='+json.dumps(APP)); await wait(c,3); await snap(c,'01-visible-login-page',notes)
  # empty/wrong login
  await click(c,'Login',notes,'02-empty-login-result',1)
  await evaljs(c,"qa.setInput('email','wrong.bloom.qa@example.invalid'); qa.setInput('password','wrong-password');")
  await snap(c,'03-wrong-login-filled',notes); await click(c,'Login',notes,'04-wrong-login-result',2)
  notes['journeys']['login_empty_wrong']='tested visible login, empty click, wrong credentials result'
  # direct admin without session
  await evaljs(c,'qa.localClear(); location.href="/admin"'); await wait(c,2); await snap(c,'05-direct-admin-without-session',notes)
  # admin
  await login(c, admin_email, admin_pass, notes, '06-admin')
  await evaljs(c,'location.reload()'); await wait(c,3); await snap(c,'07-admin-after-refresh',notes)
  for tab in ['Overview','Field entry','Agents','Approvals','Reports','Profile']:
    await click(c,tab,notes,f'admin-{tab.lower().replace(" ","-")}',2)
    if tab=='Field entry':
      await click(c,'All entries',notes,'admin-field-entry-all',1)
      await evaljs(c,f"qa.setInput('search',{json.dumps('BLOOM')});")
      await wait(c,1); await snap(c,'admin-field-entry-search-bloom',notes)
      await click(c,'View details',notes,'admin-field-entry-detail-if-available',1)
    if tab=='Reports':
      await click(c,'Download PDF',notes,'admin-reports-download-click',2)
    if tab=='Profile':
      pass
  await logout(c,notes,'admin')
  # agent
  await login(c, agent_email, agent_pass, notes, 'agent')
  await evaljs(c,'location.reload()'); await wait(c,3); await snap(c,'agent-after-refresh-reopen',notes)
  # attendance
  await click(c,'Check in',notes,'agent-attendance-checkin-click',3)
  await click(c,'Check in',notes,'agent-attendance-repeat-tap',2)
  await evaljs(c,'location.reload()'); await wait(c,3); await snap(c,'agent-attendance-after-refresh',notes)
  await click(c,'Check out',notes,'agent-attendance-checkout',3)
  # visits
  await click(c,'Visits',notes,'agent-visits-my-entries',2)
  # sales create
  if not await click(c,'New Sales',notes,'sales-step1-open',1): await click(c,'Sales',notes,'sales-step1-open',1)
  vals=[RUN+' Sales Customer','Bloom Contact','BLOOM QA Lab','Bengaluru QA Area','Special notes !@# long owner-visible QA text','1234567890','QA product']
  await evaljs(c, f"qa.fillVisible({json.dumps(vals)}); qa.selectVisible();")
  await snap(c,'sales-step1-filled',notes)
  await click(c,'Save',notes,'sales-step1-save-result',3); notes['createdQaLabels'].append(RUN+' Sales Customer')
  await evaljs(c, f"qa.fillVisible({json.dumps(vals)}); qa.selectVisible();")
  await snap(c,'sales-step2-filled',notes); await click(c,'Save',notes,'sales-step2-save-result',3)
  await evaljs(c, f"qa.fillVisible({json.dumps(vals)}); qa.selectVisible();")
  await snap(c,'sales-step3-filled',notes); await click(c,'Save',notes,'sales-step3-save-result',3)
  # service create
  await click(c,'Visits',notes,'agent-visits-before-service',1)
  if not await click(c,'New Service',notes,'service-step1-open',1): await click(c,'Service',notes,'service-step1-open',1)
  vals2=[RUN+' Service Customer','Bloom Service Contact','BLOOM QA Equipment','Bengaluru Service Area','Service special chars !@#','9876543210','QA issue']
  await evaljs(c, f"qa.fillVisible({json.dumps(vals2)}); qa.selectVisible();")
  await snap(c,'service-step1-filled',notes); await click(c,'Save',notes,'service-step1-save-result',3); notes['createdQaLabels'].append(RUN+' Service Customer')
  await evaljs(c, f"qa.fillVisible({json.dumps(vals2)}); qa.selectVisible();")
  await snap(c,'service-step2-filled',notes); await click(c,'Save',notes,'service-step2-save-result',3)
  await evaljs(c, f"qa.fillVisible({json.dumps(vals2)}); qa.selectVisible();")
  await snap(c,'service-step3-filled',notes); await click(c,'Save',notes,'service-step3-save-result',3)
  # previous entries reopen/continue
  await click(c,'Visits',notes,'agent-visits-after-saves',2)
  await evaljs(c,f"qa.setInput('search',{json.dumps(RUN)});")
  await wait(c,1); await snap(c,'agent-visits-search-created',notes)
  await click(c,RUN,notes,'agent-previous-entry-reopen',2)
  # reports/pdf
  await click(c,'Reports',notes,'agent-reports',2)
  await click(c,'Download report',notes,'agent-reports-download-click',2)
  # leave if visible
  await click(c,'Attendance',notes,'agent-attendance-screen',1)
  if await click(c,'Leave',notes,'agent-leave-open-if-available',1):
    await evaljs(c, f"qa.fillVisible({json.dumps(['Bloom QA leave request '+RUN,'2026-07-03'])}); qa.selectVisible();")
    await snap(c,'agent-leave-filled-if-available',notes)
  await logout(c,notes,'agent')
  # fresh admin verify records and approvals
  await login(c, admin_email, admin_pass, notes, 'admin-verify')
  await click(c,'Field entry',notes,'admin-verify-field-entry',2); await click(c,'All entries',notes,'admin-verify-all-entries',1)
  await evaljs(c,f"qa.setInput('search',{json.dumps(RUN)});"); await wait(c,1); await snap(c,'admin-verify-search-created-qa',notes)
  await click(c,'Reports',notes,'admin-verify-reports-after-qa',2); await click(c,'Download PDF',notes,'admin-verify-report-pdf-after-qa',2)
  await click(c,'Approvals',notes,'admin-verify-approvals',1)
  await logout(c,notes,'admin-verify')
  notes['console']=[e for e in c.events if e.get('method') in ['Runtime.consoleAPICalled','Runtime.exceptionThrown','Network.loadingFailed']]
  OUT.write_text(json.dumps(notes,indent=2))
  print(OUT)

asyncio.run(main())
