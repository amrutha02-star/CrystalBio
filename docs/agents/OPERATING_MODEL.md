# CrystalBio Agent Operating Model

## Do we need a separate bot?

No.

For now, CrystalBio does not need a separate Telegram/Discord bot for QA.

The agents are operating roles inside the development workflow:

1. Testing Agent
2. Bug-Fixer Agent

They can be run through Hermes when needed and will document work in GitHub.

A separate bot is only useful later if the client wants automated notifications like:

- “New bug found”
- “Bug fixed and ready for retest”
- “Daily QA summary”
- “Backend test failed”

That can be added later, but it is not required to start building and testing.

---

## Recommended setup

### Agent 1: Testing Agent

Owns:

- testing journeys
- finding bugs
- creating GitHub issues
- attaching evidence
- writing QA run reports
- retesting fixed bugs

### Agent 2: Bug-Fixer Agent

Owns:

- fixing confirmed GitHub bugs
- running tests/builds
- documenting fix commits
- sending issues back for retest

---

## Workflow

1. Backend/app feature is built.
2. Testing Agent runs checklist.
3. Testing Agent creates GitHub issues for confirmed bugs.
4. Bug-Fixer Agent fixes one issue at a time.
5. Testing Agent retests.
6. Bug is closed only after verified fixed.

---

## When to automate further

Later, we can add GitHub Actions or scheduled Hermes runs for:

- nightly QA smoke test
- daily bug summary
- automatic report to Telegram
- automatic issue creation from failed tests

For the first backend phase, manual agent runs with GitHub documentation are safer because the product logic is still being finalised.
