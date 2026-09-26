# ECC Acceptance Checklist

Use for every migration PR. Reviewers (Rob's Coding Helper, Claude) answer each line with pass, fail, or n/a plus evidence (file path and line, audit output, or screenshot).

## Automated (paste output into the PR)

- [ ] `python3 scripts/ecc_audit_static.py <app>` shows 0 FAIL
- [ ] `node scripts/ecc_audit_runtime.mjs <url>` shows 0 FAIL at 320, 375, 768, 1440 and 1920px
- [ ] every WARN from either audit has a one-line reason in the PR

## Tokens and brand

- [ ] Four ECC CSS files vendored unmodified in every web dir. `ECC_VERSION` present
- [ ] `<head>` loads Montserrat, then ecc-tokens, ecc-ces-compat, ecc-components.base, ecc-app, then app CSS
- [ ] No private color vars left for brand roles (`--green`, `--primary`, `--accent-blue`...). They map to ECC tokens
- [ ] Brand green only on actions, links, active step and focus
- [ ] Gold appears only as an identity mark (logo tile), never on UI
- [ ] Montserrat only. No serif, Inter or mono in UI
- [ ] Light theme only. Page `surface-sunken`, panels `surface`

## Type and layout

- [ ] Body text 19px, line-height 1.6. No rendered text under 17px
- [ ] Chat feed and composer fill the width to the gutter. No 65ch or 1180px cap on the canvas
- [ ] Left sidebar fixed at `--sidebar-width`, stacks at 900px
- [ ] `min-width: 0` on every flex or grid child in the chat layout
- [ ] Assistant message is a card (border, `shadow-card`, `radius-lg`). User bubble uses `14px 14px 4px 14px`, max 80%
- [ ] Radius grammar holds: controls 10px, containers 14px, chips and status pills

## Text fields

- [ ] Every text field: fill #f1f5f9, 2px #64748b border, 19px ink text, placeholder ink-muted, min-height 44px
- [ ] Focus: fill white, border brand, `shadow-focus`, 2px brand outline offset 2px
- [ ] Field has `<label for>` or `aria-label`. Errors use `aria-invalid` and `aria-describedby`
- [ ] On phones the field sits on its own full-width row

## Interaction and accessibility

- [ ] Six states styled on every control: default, hover, active, focus-visible, disabled, current
- [ ] Every control at least 44x44
- [ ] No `outline: none` without a visible replacement
- [ ] Status and active state use a label or shape as well as color
- [ ] `prefers-reduced-motion` honored in CSS and JS scrolling
- [ ] `forced-colors` block present and no blanket `!important` border on all controls
- [ ] No emoji used as icons or section markers
- [ ] Async results announced with `role="status"` or `role="alert"`

## Copy

- [ ] Buttons are verbs in sentence case and say what happens
- [ ] Confirmations state the outcome. Errors say what went wrong and how to fix it

## Process

- [ ] Branch `ecc/<app>`, not main. public/ and static/ byte-identical
- [ ] Screenshots at 375 and 1440 with example data (no student records)
- [ ] `ROLLOUT.md` row updated
