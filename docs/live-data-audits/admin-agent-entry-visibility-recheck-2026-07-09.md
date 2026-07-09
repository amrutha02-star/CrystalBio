# Admin Agent Entry Visibility Recheck — 2026-07-09

Live recheck requested by Amrutha. Used Bloom QA Admin credentials only. No real-user credentials used. No records changed and no QA records created.

Checked at: 2026-07-09 13:03 IST

## Summary

- Live API health: `200 OK`
- Bloom QA Admin login: `200 OK`
- Active seats returned by admin agents endpoint: `20`
- Admin Reports for 2026: `91` Sales + `35` Service = `126` Sales/Service forms
- Admin Field Entry `All entries` API: `91` Sales + `35` Service = `126` entries
- Mismatch by agent between Reports and Field Entry API: `0`
- Today's report totals for 2026-07-09: `1` Sales, `0` Service, `4` checked in
- Latest live form found: Sanjeev / IISC / Sales / 09/07/2026 11:18

## Agent-by-agent Sales/Service count match

| Agent | Reports Sales | Reports Service | Field Entry Sales | Field Entry Service | Status |
|---|---:|---:|---:|---:|---|
| Ajay | 0 | 1 | 0 | 1 | Match |
| Ajay AS | 3 | 5 | 3 | 5 | Match |
| Deekshak | 21 | 0 | 21 | 0 | Match |
| Dr. Swati Priya | 10 | 0 | 10 | 0 | Match |
| Girish | 0 | 16 | 0 | 16 | Match |
| Madhu | 0 | 5 | 0 | 5 | Match |
| Manjunath | 9 | 0 | 9 | 0 | Match |
| Padmakumar | 15 | 0 | 15 | 0 | Match |
| Raghavendra K | 1 | 0 | 1 | 0 | Match |
| Sanjeev | 32 | 0 | 32 | 0 | Match |
| Surendra | 0 | 8 | 0 | 8 | Match |

## Browser admin screen check

- Admin Field Entry initially showed Bloom QA Admin `My entries`: `0 of 0 shown`.
- Switching to `All entries` showed `10 of 126 shown` and the latest live entries.
- Search for `Dr. Swati` showed `10 of 10 shown`, including older entries from 17/06/2026 through 30/06/2026.
- Browser console showed `0` messages / `0` JavaScript errors during this check.
- Follow-up needed: In this Hermes browser run, tapping `Show all 126 entries` did **not** expand from `10 of 126 shown` to `126 of 126 shown`. Data is still searchable/reachable by search and the API is complete, but the Show all control needs Bloom/Periwinkle retest before accepting BUG-20260708-028 fully.

## Business conclusion

Recording is current and complete in the checked admin data paths. Admin Field Entry now has all 126 Sales/Service forms in the live backend/API and counts match agent-by-agent. The only remaining concern from this recheck is the visible `Show all` button behavior in the browser UI; search still reaches older entries.
