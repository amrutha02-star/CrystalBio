# CrystalBio Agent Operating Model

## Do we have separate QA and bug-fixing bots?

Yes.

CrystalBio has a small bot team under Periwinkle.

## Team roles

### Periwinkle — lead / reviewer / decision-maker

Periwinkle oversees the project.

Periwinkle reviews Bloom's QA findings, decides what matters, approves bugs for fixing, reviews Iris's work, and gives final acceptance.

### Bloom — QA testing bot

Bloom owns testing.

Bloom tests CrystalBio journeys, tries multiple scenarios, finds bugs, collects evidence, and writes QA reports.

Bloom must not fix bugs unless Rahul explicitly asks.

Bloom's detailed instructions live in:

`docs/agents/BLOOM_QA_BOT.md`

Bloom also maintains its own profile log at:

`/root/workspace/.hermes/profiles/bloom/BLOOM_QA_LOG.md`

### Iris — bug-fixing bot

Iris owns approved bug fixes.

Iris fixes only bugs approved by Periwinkle or Rahul. Iris does not decide product direction, redesign screens, or add new features unless asked.

Iris's detailed instructions live in:

`docs/agents/IRIS_BUG_FIXER.md`

The shared bug-fix workflow lives in:

`docs/BUG_FIX_WORKFLOW.md`

The repo-level fix log lives in:

`docs/BUG_FIX_LOG.md`

Iris also maintains its own profile log at:

`/root/workspace/.hermes/profiles/iris/IRIS_FIX_LOG.md`

---

## Recommended workflow

1. Bloom tests a journey.
2. Bloom records bugs with evidence.
3. Periwinkle reviews the bugs.
4. Periwinkle decides whether each bug is:
   - fix now
   - fix later
   - needs more testing
   - needs Rahul decision
   - not a bug
5. Iris fixes only the bugs marked fix now.
6. Iris runs checks and updates the fix log.
7. Bloom retests the fixed journey.
8. Periwinkle accepts, rejects, or asks for another fix.

---

## Important boundaries

- Bloom finds and retests bugs.
- Iris fixes approved bugs.
- Periwinkle supervises and decides.
- Rahul can override everything.

This separation is important because it prevents one bot from testing, deciding, and fixing its own work without review.

---

## When to automate further

Later, we can add scheduled Hermes runs for:

- nightly QA smoke tests by Bloom
- daily bug summaries
- automatic reports to Telegram
- automatic issue creation from failed tests
- automatic Iris fix tasks after Periwinkle approval

For now, manual Periwinkle approval is safer because the product logic and pilot needs are still being finalized.
