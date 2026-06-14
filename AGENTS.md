# CrystalBio working instructions for Hermes agents

Before changing or judging CrystalBio work, read the current project guardrails instead of relying on memory from the chat.

Start every CrystalBio task by checking:

1. `README.md` lines 1-80 for live URL, current status, and UX corrections to preserve.
2. `DESIGN.md` lines 107-120 for the approved visual baseline.
3. Any relevant file in `docs/` for the specific area being changed, especially:
   - `docs/BACKUPS_AND_MONITORING.md` for pilot data, backups, monitoring, and cleanup.
   - `docs/HOMESCREEN_INSTALL.md` for phone install instructions.
   - `docs/PROGRESSIVE_VISIT_FIELDS.md` for Sales/Service progressive form behavior.

Important working rules:

- Do not restart the visual direction unless the user explicitly asks for a redesign.
- Preserve the sage/olive full-screen mobile baseline.
- Keep agent screens simple, phone-first, and non-technical.
- Separate what is fixed, what is tested, what is deployed, and what still needs checking.
- Verify changes with a real build/test or live check before saying they are done.
- If the user says the bot is forgetting instructions, re-read this file plus the README/DESIGN guardrails before continuing.
