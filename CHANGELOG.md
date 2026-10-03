# Changelog

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
