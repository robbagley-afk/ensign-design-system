# Handoff Prompts

Fill the `<...>` slots and paste. Each prompt stands alone: the receiving agent has not seen the conversation that produced it.

Shared facts every prompt relies on:

- Design-system repo: `robbagley-afk/ensign-design-system`, local clone `~/Local-Infra/ensign-design-system` (Mac Studio). Pull before starting.
- Skill: `ui-ux-principles` v2 (installed for Claude, Codex and Antigravity). Canonical copy in `skill/ui-ux-principles/` of that repo.
- Shared board: `ROLLOUT.md` in that repo. Claim a row before work, update it after each step.
- Never push to main. Never use student records. Screenshots use example data.

---

## 1. Rob's Coding Helper: write the migration patch (default code author)

Claude sends this through its own Playwright profile per the rob-coding-helper skill (write the prompt to `~/Local-Infra/helper_prompt.txt`, pbcopy, paste, confirm length, Enter). Record the conversation URL in `ROLLOUT.md` as soon as it changes to `/conversation/{id}`.

Before sending, Claude has pushed branch `ecc/<app-repo>` containing only the vendor commit, so the helper reads exactly what the patch applies to.

```
Coding task, not a review. Read with your GitHub connector:
- App: robbagley-afk/<app-repo>, branch ecc/<app-repo>. Files: <list the index.html files and the app's own CSS files>.
- Standard: robbagley-afk/ensign-design-system, branch main. Read README.md, tokens/tokens.json, tokens/overrides.json, css/ecc-app.css, css/ecc-ces-compat.css, and skill/ui-ux-principles/SKILL.md.

Write the migration of this app to the Ensign Career Coach design system as a unified diff (git format, paths relative to the repo root, 3 lines of context) that applies cleanly to ecc/<app-repo>. Scope:
1. In every index.html <head>, add the Montserrat link and ecc-tokens.css, ecc-ces-compat.css, ecc-components.base.css, ecc-app.css after ces-tokens.css and before the app's own CSS.
2. In the app's own CSS: raise every font-size under 17px (body text 19px), map private brand vars to ECC tokens, remove dark-theme blocks, give every text field the .ecc-field look (fill var(--input-fill), 2px var(--input-border), var(--text-body), min-height 44px, brand focus with shadow-focus and a 2px outline), let the chat feed and composer fill the width to var(--gutter), and remove gold from any control.
3. Replace emoji used as icons with inline SVG (aria-hidden="true") beside a text label.
4. If the repo has both public/ and static/, emit identical hunks for both.
Do not change JavaScript behavior, API calls, prompts or data handling. Do not touch the vendored ecc-*.css or ces-*.css files.

Output format: one fenced ```diff block per file, in order, nothing between blocks except the file name as a heading. After the last block, list any design decision you made that the standard did not settle. If the diff will not fit in one reply, stop after a complete file and write CONTINUE; I will ask for the rest.
```

Revision message (send in the same conversation, at most twice):

```
The patch applied. The audits report these failures on ecc/<app-repo> after applying it:
<paste the FAIL lines from ecc_audit_static.py and ecc_audit_runtime.mjs>
Write a follow-up unified diff against the patched files that fixes only these. Same output format.
```

Model: the helper's own Sonnet router, which is the only part of the helper with GitHub access. Never ask for the Opus specialist on a patch: the specialist cannot read GitHub (confirmed 2026-09-25 on the pilot, it asked for the files to be pasted), and a full stylesheet is larger than the roughly 15,000-character input box, so pasting is not a way around it. The specialist is useful only for a question small enough to paste, such as reviewing one excerpt or deciding a design conflict.

---

## 1b. Codex: migrate one app (fallback)

Use when the helper's patch fails the audit after two revisions, or the change needs running code.
Model: least costly Codex model likely to succeed. Effort: medium.

```
Invoke the ui-ux-principles skill and follow it.

Task: migrate <app-repo> (github robbagley-afk/<app-repo>) to the Ensign Career Coach design system.

1. cd ~/Local-Infra/ensign-design-system && git pull. Claim the row for <app-repo> in ROLLOUT.md (agent: Codex, branch: ecc/<app-repo>, status: in progress), commit and push that one line.
2. In the app clone: git checkout main && git pull && git checkout -b ecc/<app-repo>.
3. Run ~/Local-Infra/ensign-design-system/scripts/vendor_into_app.sh <path-to-app>. Add the <head> links it prints to every index.html (and admin.html if present) before the app's own CSS.
4. Edit the app's own CSS so that: every font-size is at least 17px (body 19px), private brand vars map to ECC tokens (--brand, --ink, --ink-muted, --surface, --surface-sunken, --border, --border-strong), no dark theme remains, every text field uses the .ecc-field look (fill #f1f5f9, 2px #64748b, 19px, 44px min, brand focus), the chat feed and composer fill the width to var(--gutter), and gold is not used on any control. Replace emoji icons with inline SVG (aria-hidden) plus a text label.
5. Keep public/ and static/ byte-identical if both exist.
6. python3 ~/Local-Infra/ensign-design-system/scripts/ecc_audit_static.py <path-to-app>  until 0 FAIL.
7. Commit (one commit per concern is fine), push the branch, open a PR titled "ECC design system migration" with the audit output pasted in.
8. Update ROLLOUT.md: status "needs runtime check", PR URL.

Do not change app logic, API calls, prompts, or data handling. If a fix needs a design decision, stop and write the question in the ROLLOUT.md notes column.
```

---

## 2. Antigravity: bulk sweep across repos

Model: Gemini 3.8 Flash, effort low (vendoring, audits) or med (screenshots).

```
Invoke the ui-ux-principles skill and follow it.

Task: <one of: vendor ECC CSS | run static audit | screenshot sweep> across these repos: <list>.
Clones live in ~/Local-Infra/ui-audit/<repo>. Pull ~/Local-Infra/ensign-design-system first.

For vendoring: in each repo, on branch ecc/<repo> (create from main if missing), run scripts/vendor_into_app.sh <repo>, commit "Vendor ECC <version>", push the branch. Do not edit any other file.
For the audit: run python3 scripts/ecc_audit_static.py <all repos> --json ~/Local-Infra/ensign-design-system/audits/static-<YYYY-MM-DD>.json and paste the summary into ROLLOUT.md under "Latest audit".
For screenshots: start each app locally, capture 375px and 1440px with a sample conversation, save to audits/screens/<repo>-<width>.png.

Use only your own Playwright profile. Everything is mechanical: if a step needs a judgment call, skip that repo and note why in ROLLOUT.md.
```

---

## 3. Rob's Coding Helper: independent review of a PR

Send through Claude's Playwright profile per the rob-coding-helper skill. Paste as one message. Start a **new** conversation, not the one that wrote the patch, so the review is independent of the author's reasoning.

```
Review this pull request against the Ensign Career Coach design system. Use your GitHub connector to read the PR diff and the files it touches.

PR: https://github.com/robbagley-afk/<app-repo>/pull/<n>
Standard: https://github.com/robbagley-afk/ensign-design-system (read README.md, tokens/tokens.json, tokens/overrides.json, css/ecc-app.css, and skill/ui-ux-principles/references/acceptance-checklist.md)

Answer every line of the acceptance checklist with pass, fail or n/a and cite file:line. Then list anything the automated audits would miss: selectors that no longer match the HTML, cascade order problems, !important rules that defeat the ECC styles, inline styles, text that can still render under 17px, and fields that escape the .ecc-field look. Finish with the three highest-risk items. Do not summarize the repo or the session.
```

Treat the reply as advisory. Verify each claimed failure against the code before acting on it.

---

## 4. Claude: supervise one app end to end

Model: Opus 5.5 medium. Switch to Opus 5.5 high only for a design-system conflict or a layout restructure.

```
Invoke the ui-ux-principles and rob-coding-helper skills.

App: <app-repo>. Clone: ~/Local-Infra/ui-audit/<app-repo>.
0. Claim the ROLLOUT.md row (agent: Claude + Helper). Create ecc/<app-repo> from main, run vendor_into_app.sh, commit "Vendor ECC <version>", push the branch.
0b. Send prompt 1 to Rob's Coding Helper. Save each diff block to /tmp/ecc-<app-repo>.patch, then git apply --3way --check, then git apply --3way. If it does not apply, send the git apply error back as the revision message.
0c. Run the static audit. Send FAIL lines back with the revision message (max two rounds, then hand the app to Codex with prompt 1b).
1. Start the app locally from the branch.
2. node ~/Local-Infra/ensign-design-system/scripts/ecc_audit_runtime.mjs <local-url> --json audits/runtime-<app-repo>.json until 0 FAIL at all widths.
3. Screenshot 375 and 1440 with a sample conversation. Look once. Judge hierarchy, radius grammar, card rarity, copy voice.
4. Send the PR to Rob's Coding Helper with prompt 3, verify its findings, fix or delegate.
5. Comment on the PR with the audit output, screenshots and a sign-off line, then set ROLLOUT.md status to "ready for Rob".
```

---

## 5. Claude: sync the design system from Claude Design

```
Read https://claude.ai/artifact/2Nz7EPn8vjHGM5cwrXpy4v path project/tokens.json and project/README.md with the Artifact tool.
If tokens.json differs from ensign-design-system/tokens/tokens.json (compare sha256), replace it byte for byte, run scripts/build_tokens.py, copy the README to docs/design-system-README.md, add a CHANGELOG entry, and open a PR. Remove any override in tokens/overrides.json that the new tokens.json now covers.
```
