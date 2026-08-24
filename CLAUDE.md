# Swoop — Claude Code Instructions

## Git status reporting (standing rule)

After making any change, end the response by clearly stating one of: **local-only**, **committed-but-not-pushed**, or **committed-and-pushed**.

If a change is not yet pushed, explicitly ask **"want me to commit and push this?"** — never commit or push proactively, even when confident the change is complete and correct. Only commit/push after the user answers that question affirmatively in that turn; a prior general approval does not carry forward to the next change.

See also `.github/copilot-instructions.md` for the Squad Review and Backlog Sync process to run before committing.
