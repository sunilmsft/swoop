# Swoop — Claude Code Instructions

## Git status reporting (standing rule)

After making any change, end the response by clearly stating one of: **local-only**, **committed-but-not-pushed**, or **committed-and-pushed**.

If a change is not yet pushed, explicitly ask **"want me to commit and push this?"** — never commit or push proactively, even when confident the change is complete and correct. Only commit/push after the user answers that question affirmatively in that turn; a prior general approval does not carry forward to the next change.

See also `.github/copilot-instructions.md` for the Squad Review and Backlog Sync process to run before committing.

## docs/STATUS.md maintenance (standing rule)

Keep docs/STATUS.md current without being asked. Update it immediately after shipping any major feature, fixing a significant bug, or resolving a blocker. Also check periodically — if 5 or more commits have happened since STATUS.md was last touched, update it as a catch-up even if no single recent change felt "major" on its own (use git log -- docs/STATUS.md to check). When updating, do a full rewrite of the relevant sections to keep it an accurate current snapshot, not a growing log — don't just append. Always show the diff and confirm before committing, same as any other change.
