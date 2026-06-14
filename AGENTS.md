# CrystalBio working instructions for Hermes agents

This file is the short source-of-truth entry point for CrystalBio work. Read it before changing, judging, summarizing, or reporting on CrystalBio.

Do not rely on old chat memory, compressed summaries, or remembered instructions. If there is a conflict, current project files win over memory.

Start every CrystalBio task by checking:

1. `README.md` lines 1-80 for live URL, current status, and UX corrections to preserve.
2. `DESIGN.md` lines 107-120 for the approved visual baseline.
3. Relevant `docs/` files for the specific area being changed, especially:
   - `docs/BACKUPS_AND_MONITORING.md` for pilot data, backups, monitoring, and cleanup.
   - `docs/HOMESCREEN_INSTALL.md` for phone install instructions.
   - `docs/PROGRESSIVE_VISIT_FIELDS.md` for Sales/Service progressive form behavior.

Locked working rules:

- Do not restart the visual direction unless the user explicitly asks for a redesign.
- Preserve the sage/olive full-screen mobile baseline.
- Keep agent screens simple, phone-first, and non-technical.
- Preserve the existing route/navigation/form structure unless the user asks to change structure.
- Separate agent, admin, field entry, profile/access, approvals, reports, and monitoring responsibilities.
- Separate what is fixed, what is tested, what is deployed, and what still needs checking.
- Verify changes with a real build/test, screenshot, browser check, or live URL/API check before saying they are done.
- Keep user updates short and business-facing; do not paste logs or implementation detail unless asked.

If the user says Periwinkle is forgetting instructions, immediately re-read this file plus README/DESIGN before continuing.