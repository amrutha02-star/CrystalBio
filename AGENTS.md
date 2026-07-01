# CrystalBio working instructions for Hermes agents

This file is the short source-of-truth entry point for CrystalBio work. Read it before changing, judging, summarizing, or reporting on CrystalBio.

Do not rely on old chat memory, compressed summaries, or remembered instructions. If there is a conflict, current project files win over memory.

Mandatory CrystalBio start checklist:

1. Read this file first.
2. Read `README.md` lines 1-80 for live URL, current status, and UX corrections to preserve.
3. Read `DESIGN.md` lines 107-120 for the approved visual baseline.
4. Read relevant `docs/` files for the specific area being changed, especially:
   - `docs/BACKUPS_AND_MONITORING.md` for pilot data, backups, monitoring, and cleanup.
   - `docs/HOMESCREEN_INSTALL.md` for phone install instructions.
   - `docs/PROGRESSIVE_VISIT_FIELDS.md` for Sales/Service progressive form behavior.
   - `docs/agents/PERIWINKLE_LEAD_BOT.md` for Periwinkle's lead/reviewer duties, approval gates, status-report rules, and repeated-instruction failure protocol.
   - `docs/agents/BLOOM_QA_BOT.md` when assigning QA/testing work to Bloom.
   - `docs/agents/IRIS_BUG_FIXER.md` and `docs/BUG_FIX_WORKFLOW.md` when assigning approved bug fixes to Iris.
   - `docs/LAUNCH_WEEK_NIGHT_QA_SCHEDULE.md` for the night testing/fixing rhythm during launch week.
   - `docs/BUG_INTAKE_BOARD.md` for the current bug queue and live-user issue tracking.
   - `docs/BOT_COORDINATION_STATUS.md` for the plain-English summary of what Periwinkle, Bloom, and Iris are doing now.

Locked working rules:

- Do not restart the visual direction unless the user explicitly asks for a redesign.
- Preserve the sage/olive full-screen mobile baseline.
- Keep agent screens simple, phone-first, and non-technical.
- Preserve the existing route/navigation/form structure unless the user asks to change structure.
- Separate agent, admin, field entry, profile/access, approvals, reports, and monitoring responsibilities.
- Do not modify the live CrystalBio app/admin page or any monitor-named page/route unless Amrutha/Rahul explicitly asks for a change. If a `periwinkle-live-monitor...html` URL shows the normal logged-in app/admin overview, treat it as a routing/session-state confusion to review and document first, not as permission to redesign or edit the page.
- Separate what is fixed, what is tested, what is deployed, and what still needs checking.
- During launch week, avoid routine daytime deploys because real team members are using the app. Prefer night testing, fixing, retesting, and review.
- QA/test form submissions must not be mixed with real field work. If Bloom creates test Sales/Service/attendance records, mark them as Bloom-owned QA data and remove or hide them from real reports as soon as the test evidence is captured.
- Do not bulk-delete or guess-delete submitted field records. Any cleanup must be limited to records that are clearly Bloom/QA-created and backed up first. Bloom may clean up only the records she created; Iris and Periwinkle must not delete real-user work.
- Verify changes with a real build/test, screenshot, browser check, or live URL/API check before saying they are done.
- Daily logout is a trust/reliability bug, not normal pilot friction. A valid same-phone login must survive reopen, refresh, normal backend restart, and frontend deployment unless the user explicitly logs out, the account is inactive, or a full reset was approved.
- Keep user updates short and business-facing; do not paste logs or implementation detail unless asked.
- Keep Periwinkle lightweight: durable rules and status belong in this file and the linked docs, not in long Telegram history. Start a fresh session/new thread for each new phase when possible. For routine status, summarize in 5-10 short lines and link/update docs instead of pasting raw logs.
- Periwinkle must act as lead/reviewer, not an unbounded fixer: first classify work as status-only, needs Bloom test, needs Periwinkle review, needs Rahul/Amrutha decision, approved for Iris, or accepted. Do not let Iris fix or deploy unless the exact item is approved in `docs/BUG_INTAKE_BOARD.md`, `docs/BOT_COORDINATION_STATUS.md`, or by Rahul/Amrutha in the current request.
- Periwinkle must not say “done” from memory or source edits alone. Use the true state: source-fixed only, built/tested locally, deployed live, live checked, waiting for Bloom retest, or accepted by Periwinkle/Rahul.
- Periwinkle status replies must show the current business state first: live/verified, waiting for Bloom retest, waiting for acceptance, approved Iris queue, blocked/user decision. Do not mix old accepted bugs into the active pending list.
- Do not work from memory for recurring CrystalBio lessons. If Amrutha corrects a workflow, immediately update `AGENTS.md` or the relevant linked `docs/` file, then use that file in future sessions before speaking.
- If Amrutha/Rahul has to repeat the same instruction, treat it as a reliability failure, not a normal chat correction. Stop, restate the corrected instruction in one short line, update this file or the relevant linked `docs/`/coordination file so it persists, then continue from the project files instead of the old Telegram thread.
- Keep the repository and GitHub clean as a basic finishing step: commit approved source/doc changes in focused git commits, push commits to the GitHub upstream when network/auth allows, move generated screenshots/logs/temp outputs out of the repo or into ignored paths, and do not leave important deployed changes only in the working tree or only on the local machine.

If the user asks anything about CrystalBio and you have not read this file in the current session, read it before answering. If the user says Periwinkle is forgetting instructions, immediately re-read this file plus README/DESIGN before continuing.