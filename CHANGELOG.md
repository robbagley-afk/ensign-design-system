# Changelog

## 2026-09-29: control font reset

- `ecc-app.css` sets `button, input, select, textarea { font-family: inherit; }`. The runtime audit's `control-font` WARN found controls rendering in Arial in 9 apps, each patched locally on its ecc/ branch. After this merges and apps re-vendor, those local copies can go.

## 2026-09-25: first mirror

- Mirrored Claude Design artifact 2Nz7EPn8vjHGM5cwrXpy4v version 1790394927-ae41: tokens.json (sha256 41a46c1e...), README, five components (bundle.css).
- Overrides: `input-border` #64748b (pending upstream: border-strong fails 3:1 on white), `input-fill` #f1f5f9 (Rob's decision), `gutter`, `sidebar-width`.
- Added `ecc-ces-compat.css` so the 14 identical vendored `ces-tokens.css` v1.1 copies move to ECC values without selector edits.
- Added `ecc-app.css` app patterns and the static and runtime audits.
- Merged the v1.3.0 Career Explorer Coach exemplar (built by a parallel session the same night): sidebar 232px with a drawer under 900px, gutter clamp(24px, 3vw, 56px) / 16px / 12px, solid-green user bubble, 1280/1200/900/640/375 breakpoints, screen patterns in `skill/ui-ux-principles/references/exemplar-patterns.md`.
- `ui-ux-principles` skill rewritten as v2.0.0 around this repo. v1.2.0 rules retired: 16px body and 14px secondary text, 1180px chat cap, gold badges, navy header, Libre Baskerville.
