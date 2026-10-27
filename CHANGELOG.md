# Changelog

## 2026-10-27: Next button ready state (skill v3.1.2)

- Best practice: any Next or advance-page button starts in its normal color and turns Amazon orange only when every required item on the current step is complete. SKILL.md rule 13 and `references/exemplar-patterns.md`.
- Tokens in `tokens/overrides.json` (`rob-decision`): `next-ready` #FF9900, `next-ready-hover` #FA8900, `next-ready-ink` #0F1111. Contrast 8.85:1 and 7.8:1. White text on #FF9900 is 2.1:1 and fails.
- No animation, so reduced-motion users see the same static color change. Forced-colors mode adds a `Highlight` outline.
- Reference implementations: Career Explorer PRs 27 (student) and 28 (mentor), ENS 101 Guide PR 29.

## 2026-10-23: ECC v2 rollout tooling, Phase 0 part A (skill v3.1.1)

- `scripts/v2_revendor.sh <app> <full-sha>`: refuses a short SHA or one not on main, vendors from a clean extract of that release, checks the four hashes, moves both CI refs (`uses: ...@sha` and `design-system-ref`) and runs the static audit from the release copy. Tested on a scratch clone of career-services-tools: 0 FAIL.
- `css/ecc-app.css`:
  - `.ecc-composer--v2`: 56px chat composer with 21px text that grows with typing (Chromium `field-sizing`) up to 40vh. `textarea.ecc-field--lg` stays the 210px note field.
  - `.ecc-side-nav` and `.ecc-side-link`: light sidebar nav, 48px rows, current item marked with tint, a brand-deep bar and bold text. `.ecc-nav-link` stays dark-band only.
  - Fix: `.ecc-btn--lg` inside `.ecc-hdr-band` now gets the gold focus ring. Before, its green ring on the deep-green band was 1.87:1. Found by the new `--v2` audit on `step-screen.html`. ENS 101 picks this up when it re-vendors.
- `scripts/ecc_audit_runtime.mjs --v2`: FAIL on body under 20px, primary buttons and fields under 56px, nav links and chips under 48px, AA text contrast, control borders under 3:1, focus rings missing or under 3:1. WARN on 18-19px paragraphs, no hover change, and a current item that looks like its siblings. Without `--v2` the audit is unchanged.
- `scripts/fixtures/chat-screen-v2.html`: fictional chat reference (header band, light sidebar, feed, danger callout, v2 composer, drawer under 900px). 0 FAIL 0 WARN with and without `--v2` at five widths. `step-screen.html` also passes `--v2`. `runtime-good.html` (v1) fails it, as it should.
- `docs/ecc-v2-migration.md`: release invariant, Phase 1 hunt for hardcoded v1 values, Phase 2 pattern swaps, traps.
- Skill assets: `ecc-app.css` re-copied, `SHA256.json` rebuilt.
- Review fixes (Coding Helper, then Codex on the iMac):
  - `v2_revendor.sh` validates the workflow (it must exist, with one `uses@sha` and one `design-system-ref`) and every web dir before the first write. It stages only the files it wrote and restores them if anything fails after writing. Tested: short, unmerged and missing-dir inputs exit 2. A missing workflow exits 2 with nothing changed. A failed copy restores a clean tree. A real run on career-services-tools gives 0 FAIL with both pins moved.
  - The reusable workflow fails when a caller's `uses: ...@sha` and `design-system-ref` differ. The self-test is exempt because it calls the workflow by local path.
  - `--v2`: the 56px and border checks cover every text-entry type and `select`, whatever `--field` says. The ring background composites every translucent layer. Outline alpha counts toward contrast. A shadow counts as a ring only if focus added it, and it is reported as a WARN with contrast unmeasured. Elements that cannot take focus (inert) are skipped. The current-state check compares siblings inside the nearest nav or list. The hover probe parks the mouse first. One known limit is documented in the code: a translucent border is blended over the parent background, not over the control's own fill.
  - `chat-screen-v2.html`: the closed drawer is inert under 900px. Escape and the scrim close it and return focus to Menu.

## 2026-10-23: ECC v2, bolder color and desktop step screens (skill v3.1.0)

- Source: the ENS 101 Guide redesign (Claude Design canvas RzcqxdeUvTmWLbU5r17hiL), approved by Rob on 2026-10-23. Senior mentors on desktop monitors found v1 nearly monochrome and the type small.
- 22 new tokens in `tokens/overrides.json`, status `rob-decision` until Claude Design adopts them. `tokens.json` is unchanged.
  - Color roles: `brand-deep` #00382A (where you are), `brand-tint-strong`, `info` and `info-tint` (Civitas, outside records), `ai`, `ai-tint` and `ai-border` (Mentor AI), `caution-text`, `caution-bg` and `caution-border`, `danger` and `danger-bg` (cannot be undone). Each pair's contrast ratio is recorded in its reason. Body-text pairs reach AAA.
  - `surface-sunken` #f8fafc to #F3F6F4 so white cards stand out.
  - Type: `text-body` 19px to 20px, plus `text-item` 22px, `text-field` 21px, `text-button` 20px, `text-section` 26px, `text-title` 30px, `text-display` 36px.
  - Size: `control-height` 56px, `target-min` 48px.
  - `ai-border` is #7C3AED (5.7:1). The canvas mockup's #C4B1EF was 1.93:1 and failed the 3:1 control-boundary floor.
- `css/ecc-app.css`: new ECC v2 section with `.ecc-hdr-band`, `.ecc-nav-link`, `.ecc-btn--lg` and the ai/info/danger button roles, `.ecc-stepper`, `.ecc-step-layout` (rail, work, record columns, desktop first), `.ecc-task` (whole-row target, 44px check box), `.ecc-numpick` (replaces drag sliders), `.ecc-choice`, `.ecc-callout` (caution, info, success, danger), `.ecc-feature-card`, `.ecc-field--lg`, `.ecc-ai-panel`, `.ecc-actionbar` (sticky Back, progress, Next).
- New fictional reference page `scripts/fixtures/step-screen.html`. Runtime audit 0 FAIL at 320, 375, 768, 1440 and 1920. Static audit 0 FAIL, 0 WARN when vendored into a test app.
- Skill `cis-ui-ux-principles` v3.1.0: 20px body, desktop first, one job per color, 56px controls, bundled CSS assets and `SHA256.json` rebuilt.
- Rollout impact: once merged, every app with vendored ECC CSS reports `ds-stale` until re-vendored. Re-vendoring also brings the 20px body text and the new page color to that app.

## 2026-10-22: one shared design skill (skill v3.0.0)

- Merged PR #27 at `0af2ff625595773a970c5aeba65a237a00afbf7f`: `skill/cis-ui-ux-principles` is the one shared design skill for Rob and coworkers.
- Retired `ui-ux-principles`; its history remains in Git. Active invocations and installs use `cis-ui-ux-principles`.
- Design rules remain unchanged from v2.2.0. The shared skill adds the write-access line, JavaScript reduced-motion snippet, push-vendor-commit-first step and orchestration pointer. Rob-specific orchestration guidance ships in `rob-coding-helper/references/design-rollout.md`.

## 2026-10-20: enforcement and dashboard pattern (skill v2.2.0)

- Added a pinned, secret-free reusable static audit and candidate-commit self-tests with positive and negative CLI contracts.
- Added a responsive ECC dashboard pattern, fictional preview and briefcase favicon.
- Expanded the skill correction table to all static codes and corrected border-strong/app-name references. Packaged matching CSS and static auditor with SHA-256 manifest for offline use.
- Skill distribution and app rollout remain gated on the reviewed release.

## 2026-10-02: scroll, width, upload and response-format checks (skill v2.1.0)

- Static audit: `width-cap` is now FAIL (760px+ cap on a layout container), new FAIL `scroll-trap` (overscroll-behavior contain/none outside overlays), `wheel-hijack` (custom wheel listeners), `response-format-mismatch` (client parses only JSON while a server path streams SSE), new WARN `unbounded-scroller` and `upload-below-feed`. Fixtures: `scripts/fixtures/static-scroll-bad` (6 codes) and `static-scroll-good` (clean).
- Runtime audit: new FAIL `scroll-trap` (large scroller that cannot scroll but traps the wheel) and `width-underfilled` (widest in-flow block under 85% of the viewport at 1440px and up).
- Found on Resume Coach Mentor (resume-coach-ai #43, #44). A sweep of the local app folders found the same codes in 10 more apps; they fail until fixed.

## 2026-09-29: static audit catches U+00A0

- New FAIL `nbsp-in-css`: a non-breaking space outside comments and strings is not CSS whitespace, so it silently invalidates the next selector or declaration. It had disabled the `:root` aliases in major-career-explorer-coach-ai and five theme variables in resume-coach-ai. Fixtures: `scripts/fixtures/static-nbsp-bad` (1 FAIL) and `static-nbsp-good` (clean).

## 2026-09-29: border-strong darkened

- Override: `border-strong` #94a3b8 to #64748b (pending upstream). Secondary buttons and chips were 2.6:1 on white, below the 3:1 control-boundary floor. Now 4.75:1, matching `input-border`. Rob approved.

## 2026-09-25: first mirror

- Mirrored Claude Design artifact 2Nz7EPn8vjHGM5cwrXpy4v version 1790394927-ae41: tokens.json (sha256 41a46c1e...), README, five components (bundle.css).
- Overrides: `input-border` #64748b (pending upstream: border-strong fails 3:1 on white), `input-fill` #f1f5f9 (Rob's decision), `gutter`, `sidebar-width`.
- Added `ecc-ces-compat.css` so the 14 identical vendored `ces-tokens.css` v1.1 copies move to ECC values without selector edits.
- Added `ecc-app.css` app patterns and the static and runtime audits.
- Merged the v1.3.0 Career Explorer Coach exemplar (built by a parallel session the same night): sidebar 232px with a drawer under 900px, gutter clamp(24px, 3vw, 56px) / 16px / 12px, solid-green user bubble, 1280/1200/900/640/375 breakpoints, screen patterns in `skill/ui-ux-principles/references/exemplar-patterns.md`.
- `ui-ux-principles` skill rewritten as v2.0.0 around this repo. v1.2.0 rules retired: 16px body and 14px secondary text, 1180px chat cap, gold badges, navy header, Libre Baskerville.
