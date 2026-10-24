# ECC v2 migration guide

How to move a Career Services app from ECC v1 to v2. The rollout order, waves and gates are in `docs/ecc-v2-rollout-plan.md`. This file is the how-to that helper and Codex prompts point at. References: `scripts/fixtures/step-screen.html` (forms and step flows) and `scripts/fixtures/chat-screen-v2.html` (chat). Both pass the runtime audit with `--v2` at 320, 375, 768, 1440 and 1920.

## Release invariant

CI passes only when three things name the same design-system release:
- the `uses: ...ecc-audit-reusable.yml@<sha>` ref in `.github/workflows/ecc-audit.yml`
- `design-system-ref: <sha>` in the same file
- the four vendored CSS files in every web dir

Design-system main moving ahead does not break a pinned app. A mismatch in any direction does. Never re-vendor by hand. Use the wrapper:

```bash
scripts/v2_revendor.sh /absolute/path/to/app <full-40-character-release-sha>
```

It refuses a short SHA or one not on main, extracts the release into a clean temp dir, copies the four files into every dir that already vendors ECC (or the dirs you name after the SHA), checks the hashes, moves both workflow refs, stages the touched files and runs the static audit from the release copy. It does not commit.

## Phase 1: bring the app to the v2 tokens

Re-vendoring changes `--text-body` (19px to 20px) and `--surface-sunken` (#f8fafc to #F3F6F4) everywhere the app reads the tokens. It changes nothing where the app copied the old value. Find the copies:

```bash
git -C /absolute/path/to/app grep -nE "19px|1\.1875rem|#f8fafc|f8fafc" -- '*.css' '*.html' '*.js' '*.config.js' ':!**/ecc-*.css'
```

Typical copies: a Tailwind config (`base: ['19px', ...]`, `sunken: '#f8fafc'`), a private alias (`--app-body: 19px`), an inline `style="font-size: 19px"`. Point each one at the token (`var(--text-body)`, `var(--surface-sunken)`) or, in Tailwind, at the CSS variable. Rebuild generated CSS. Then confirm in the browser console on each matrix route:

```js
[getComputedStyle(document.body).fontSize, getComputedStyle(document.body).backgroundColor]
// expect ["20px", "rgb(243, 246, 244)"] on a page that uses the ECC page color
```

Fix what the bigger text broke (overflow at 320 and 375, clipped labels, wrapped buttons) with tokens and layout, never by lowering the size. Phase 1 adds no new components.

Gates: static audit 0 FAIL, runtime audit 0 FAIL at five widths on every route in the app's matrix, AA text contrast fixed rather than answered, the computed check above, screenshots at 375 and 1440 viewed, upload-to-reply on every host compared with the baseline.

## Phase 2: v2 components

| Old pattern | v2 pattern | Notes |
|---|---|---|
| App header, title bar | `<header class="ecc-hdr-band"><div class="ecc-hdr-band__inner">` with the app name and `.ecc-hdr-band__sub` "Ensign College Career Services" | The gold stripe is built in. Focus rings inside the band are gold, including `.ecc-btn--lg` |
| Top nav links in the header | `.ecc-nav-link`, `aria-current="page"` on the current one | Dark band only. Never on a white surface |
| Sidebar nav (white rail) | `<nav class="ecc-side-nav">` with `.ecc-side-link` rows, `aria-current="page"` on the current one | Current = tint, brand-deep bar, bold. 48px rows. Inline SVG plus visible label |
| Primary and secondary buttons | add `.ecc-btn--lg` to `.ecc-btn .ecc-btn-primary` or `.ecc-btn-secondary` | 56px, 20px/700 |
| "Ask the AI" actions | `.ecc-btn .ecc-btn--lg .ecc-btn-ai` | Purple means Mentor AI and nothing else |
| Outside records (Civitas, Workday) | `.ecc-btn-info`, `.ecc-callout--info`, `.ecc-feature-card--info` | Blue means outside systems |
| Delete, cannot be undone | `.ecc-btn-danger` | Red means cannot be undone |
| Single-line field | `.ecc-field .ecc-field--lg` | 56px, 21px typed text |
| Long note field (not chat) | `textarea.ecc-field.ecc-field--lg` | 210px start height. Wrong for a chat composer |
| Chat composer | `<form class="ecc-composer ecc-composer--v2">` with `textarea.ecc-field` (no `--lg`) and an `.ecc-btn .ecc-btn-primary` send | Starts at 56px, grows with typing to 40vh in Chromium, scrolls inside after that |
| Alert, banner, inline error | `.ecc-callout .ecc-callout--{caution,info,success,danger}` with an SVG and `.ecc-callout__lead` | `role="alert"` for errors. Never color alone |
| Upload or intake card | `.ecc-feature-card` with `__head` and `__body` | One per screen, the thing that matters most |
| Multi-step flow | `.ecc-stepper`, `.ecc-step-layout`, `.ecc-task`, `.ecc-actionbar` | Copy `step-screen.html` |
| Range slider | `.ecc-numpick` number keys | Sliders are hard to use with a mouse at 60+ |
| Radio cards | `.ecc-choice` with `role="radio"` and `aria-checked` | |

Color roles, one job each: brand green = do this, brand-deep = where you are, gold = identity only, info blue = outside records, AI purple = Mentor AI, caution amber = be careful, danger red = cannot be undone.

Gates: everything from Phase 1, plus `node scripts/ecc_audit_runtime.mjs <url> --v2` at 0 FAIL on every matrix route. `--v2` fails on body text under 20px, primary buttons and fields under 56px, nav links and chips under 48px, AA text contrast, control borders under 3:1 and focus rings missing or under 3:1. It warns on 18-19px paragraphs, a primary action with no hover change, and a current item that looks like its siblings.

## Traps

- `.ecc-composer textarea` outranks `.ecc-field--lg`. Use `.ecc-composer--v2`, which outranks both.
- The chat feed stays the one inner scroller: `max-height: max(320px, calc(100dvh - <top chrome>px))` and `overscroll-behavior: auto`.
- An app's own `display` on a menu button can override ECC's `@media (min-width: 900px) { .ecc-menu-button { display: none } }`. Put the app's display rule inside the under-900px query.
- Fixtures load CSS from `/css/`. Apps load their vendored copies. Never link the design-system repo from an app.
- Helper and Codex prompts name the release SHA and quote the real files. Neither may claim to have read a file it was not given.
