# Agent instructions: ensign-design-system

Read this before touching any Ensign app's UI.

1. Invoke the `ui-ux-principles` skill (installed for Claude, Codex and Antigravity; canonical copy in `skill/ui-ux-principles/`). If it is not installed, read `skill/ui-ux-principles/SKILL.md` directly.
2. `tokens/tokens.json`, `css/ecc-components.base.css`, `docs/design-system-README.md` and `docs/components.md` mirror Claude Design. Never hand-edit them. Put deviations in `tokens/overrides.json` with a reason.
3. `css/ecc-tokens.css` is generated. Run `python3 scripts/build_tokens.py` after any token change and commit both.
4. Claim an app in `ROLLOUT.md` before working on it and update the row at every step. Never work an app someone else holds.
5. Work on `ecc/<app>` branches. Never push to any app's main. Rob merges.
6. Done means: `scripts/ecc_audit_static.py` 0 FAIL, `scripts/ecc_audit_runtime.mjs` 0 FAIL at all five widths, public/ and static/ identical, screenshots with example data, review addressed.
7. No student records, credentials or `.env` contents in prompts, screenshots, commits or PRs.
