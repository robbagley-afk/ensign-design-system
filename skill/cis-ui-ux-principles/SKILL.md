---
name: cis-ui-ux-principles
description: Apply the Ensign Career Coach design system (Ensign College / Career Services brand, type, color, spacing, text fields, accessibility gates, audits) when designing, building, reviewing, restyling or migrating any Career Services app or web page, and when coordinating that UI work across Claude, Codex, Antigravity and the coding helper. Use for "make this match the Ensign style", "apply the design system", "review this UI", "restyle this app", "is this accessible", "fix the fonts/colors/layout", or any student- or mentor-facing screen. One skill for Rob and coworkers.
version: 3.0.0
---

# CIS UI/UX Principles (Ensign Career Coach)

Every Ensign student- and mentor-facing app should read and behave like one product. That product is defined by the organization's default design system in Claude Design, **Ensign Career Coach**. This skill tells any AI tool how to apply it.

## Source of truth

| What | Where |
|---|---|
| Design system (canonical) | Claude Design: the organization's default design system, "Ensign Career Coach" (tokens, README, 5 components). Claude users in the Ensign organization see it automatically. |
| Code mirror all tools use | GitHub `robbagley-afk/ensign-design-system` (public). Anyone can read and clone it. Ask Rob Bagley for write access before you push a branch or open a PR. It holds `tokens/tokens.json`, the four ECC CSS files, the audit scripts and `ROLLOUT.md`. |

Never hand-edit `tokens/tokens.json`. Local deviations go in `tokens/overrides.json`, each with a reason and a status. If the design system itself looks wrong, tell Rob instead of changing it.

**Precedence:** the request in front of you, then the design system (tokens, README, component notes), then `overrides.json`, then the exemplar patterns (`references/exemplar-patterns.md`), then the gates in this skill, then general design craft. If two conflict and it changes what ships, say so in the PR and let the app owner decide.

**Scope:** Ensign College and Career Services apps only. Personal or non-Ensign projects don't get the Ensign brand.

## The design system in brief

Read `README.md` and `docs/components.md` in the repo before a first migration. The rules most often broken:

1. **Audience first.** Mentors and students, often over 60, often on shared 1080p desktops, reading paragraphs of advice. Body text **19px**, line-height 1.6. **Nothing renders below 17px**, including captions, chips, timestamps, disclaimers and feedback controls.
2. **Fill the width.** Chat feed and composer fill the width up to `--gutter`: `clamp(24px, 3vw, 56px)` from 640px up, 16px under 640px, 12px at 375px and below. Header, step header, feed and composer share it so edges line up. No 65ch or 1180px cap on the chat canvas. The same holds for the page shell and every view inside it (app container, mode-selection screen, intake forms, cards): no fixed `max-width` in px. The page container uses `max-width: 100vw` (or none) plus `padding-inline: var(--gutter)`. Center narrow content inside a full-width card with grid columns, never by capping the card.
3. **One theme, light.** Page `surface-sunken` #f8fafc, cards and panels `surface` #ffffff. No dark mode.
4. **Ensign green `--brand` #006645 means "do this".** Primary buttons, links, the active step, focus rings. Nothing decorative.
5. **Gold `--accent-gold` #FDB515 is an identity mark only.** Never a button, link, badge, border or highlight.
6. **One typeface.** Montserrat 400/500/600/700 with the system sans fallback. No serif, no Inter, no mono for UI.
7. **Radius carries meaning.** `radius-md` 10px = clickable control. `radius-lg` 14px = content container. `radius-pill` = chip or status. User chat bubble alone uses `14px 14px 4px 14px`.
8. **Two text colors.** `ink` #0f172a and `ink-muted` #475569. Borders `border` #cbd5e1 for structure, `border-strong` for controls.
9. **Cards are rare.** Border plus `shadow-card` only on distinct objects (assistant message, video frame, dropzone). Never a card on a card.
10. **User bubble:** solid `--brand` with white text, max 78% (90% at 375px and below), a "You" label. Assistant message: full-width card with a 17px green speaker label.
11. **State is never color alone.** Status pill = tinted fill plus label. Active step = tint plus border plus numbered badge.
12. **Voice.** Buttons are verbs in sentence case ("Copy prompt", "Book a mentor appt"). Confirmations state the outcome ("Thank you. Your feedback was saved.").

## Text fields (Career Services standard)

Every text entry control (chat composer, feedback form, intake, search, admin form) looks the same so people find it instantly:
- fill `--input-fill` #f1f5f9, turning `--surface` #ffffff on focus
- border 2px `--input-border` #64748b (4.75:1 on white. `border-strong` is also #64748b through overrides.json, pending upstream; fields continue to use `--input-border`)
- text `--ink` at 19px, placeholder `--ink-muted`
- min-height 44px, padding 14px 18px, `radius-lg` for textareas and `radius-md` for single-line inputs
- `shadow-card` at rest, `shadow-focus` on focus, plus a 2px brand `:focus-visible` outline offset 2px
- on phones the field takes its own full-width row. Buttons wrap below it.

Use `.ecc-field` or the `.ecc-composer textarea` pattern from `css/ecc-app.css`.

## Gates the design system assumes

- **Six interactive states** on every control: default, hover, active, `:focus-visible`, disabled (`:disabled` and `[aria-disabled="true"]`), and current (`aria-current="page"` or `aria-selected`).
- **Focus:** never `outline: none` without a replacement. `ecc-ces-compat.css` points `--ces-focus-ring` at brand green.
- **Touch targets** 44x44 minimum, including icon buttons.
- **Contrast:** 4.5:1 for text, 3:1 for control boundaries and focus rings. Check any new tint pair before shipping.
- **Scroll model (wheel must work everywhere):** one owner per scroll axis. The page scrolls by default. The chat feed is the only inner scroller, and it has a bounded height (`max-height: max(320px, calc(100dvh - <top chrome>px))`) so the composer stays on screen. Rules that prevent dead wheel zones:
  - Never put `overflow-y: auto` on a container whose height is not bounded. It never overflows, but it still becomes a scroll container.
  - Never set `overscroll-behavior: contain` on such a container, or on the feed. With `contain`, Chromium and Edge (Mac trackpad and mouse latching) stop the wheel at that element and the page will not scroll, so the wheel only works over the page margins. Use `overscroll-behavior: auto` so the feed hands the wheel back to the page at its top and bottom.
  - No custom `wheel` listeners that push `deltaY` into another element. They fight native scrolling.
  - Runtime check: with a long sample conversation loaded, wheel over the feed scrolls the feed to its end and then the page; wheel over the landing and intake cards scrolls the page; the composer is reachable at 375 and 1440.
- **Upload sits at the top and does what it says:** in a chat screen the file upload goes in the chat header or a document bar above the feed, never in the composer under the conversation. A successful upload starts the work it promises (an AI review of the selected scope), with a status message, so the mentor never has to type a second request.
- **Same behavior local and serverless:** when an app runs both locally (`app.py`) and on Vercel (`api/index.py`), the page must handle every response format either server sends. If any server path streams `text/event-stream`, the client reads SSE (stop at `data: [DONE]`, the connection can stay open) as well as JSON. Test the AI reply on both hosts, not only one.
- **Flex overflow:** `min-width: 0` on every flex or grid child in the chat layout. This, not `overflow: hidden`, fixes clipped text.
- **Breakpoints:** 1280px (status pill appears), 1200px (organization suffix), under 900px (drawer plus 4-column step bar), under 640px (icon-only header buttons with aria-label, gutter 16px, composer wraps), 375px and below (gutter 12px, user bubble up to 90%). No horizontal page scroll at 320, 375, 768, 1440 or 1920px.
- **Motion:** honor `prefers-reduced-motion` in CSS and in JS scrolling (`behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'`).
- **Windows High Contrast:** `@media (forced-colors: active)` keeps borders as `ButtonText` and focus as `Highlight`. No blanket `border: ... !important` on every control.
- **Semantics:** every field has `<label for>` or `aria-label`. Errors use `aria-invalid` plus `aria-describedby`. Async results announce through `role="status"`.
- **No emoji as icons or section markers.** Inline SVG with `aria-hidden="true"` plus a visible text label.
- **Layout:** fixed left sidebar `--sidebar-width` 232px (never over 280px) for steps, videos, resources and the handoff card. Under 900px it becomes an off-canvas drawer opened by a 44px hamburger with `aria-expanded`. The chat canvas takes `minmax(0, 1fr)`.
- **Screen patterns** (header, messages, feedback, thinking state, suggested questions, composer, dropzone, video, toast, drawer) are in `references/exemplar-patterns.md`. Read it before building or restyling a chat screen.

## Check and correct (every UI change, every app)

The audits enforce the gates above. Run both before any PR and fix every FAIL in the same PR:

| Code | Audit | Fix |
|---|---|---|
| `width-cap` | static | Replace a `max-width` of 760px or more on a layout container (container, app, shell, main, page, layout, wrapper, card, grid, view, workspace, feed, content) with `max-width: 100vw` or none plus `padding-inline: var(--gutter)`. Overlays and print rules are exempt. |
| `width-underfilled` | runtime, 1440px and up | The widest in-flow block spans under 85% of the viewport. Find the capped ancestor and apply the `width-cap` fix. |
| `scroll-trap` | static and runtime | Remove `overscroll-behavior: contain/none` outside overlays. Views get `overflow: visible`. The feed gets `overscroll-behavior: auto` and a `max-height`. |
| `unbounded-scroller` (WARN) | static | `overflow-y: auto` with no height in the rule. Bound it (feed) or make it `visible` (views). Answer in the PR if the height is set elsewhere. |
| `wheel-hijack` | static | Delete custom `wheel` listeners. |
| `response-format-mismatch` | static | Client parses only JSON while a server path streams SSE. Read both. |
| `upload-below-feed` (WARN) | static | Move the chat upload into the chat header. |

| `dark-theme` (FAIL) | static | Use the light ECC surface tokens and remove dark-theme overrides. |
| `ds-missing` (FAIL) | static | Vendor all four ECC CSS files into every web directory. |
| `ds-stale` (FAIL) | static | Re-vendor from the approved design-system revision. Never hand-edit vendored files. |
| `emoji-markers` (WARN) | static | Replace emoji markers with aria-hidden inline SVG and a visible label. |
| `field-unlabeled` (WARN) | static | Associate a visible label or provide an accessible aria-label. |
| `focus-removed` (FAIL) | static | Keep or restore the visible 2px brand focus outline. |
| `font-not-loaded` (WARN) | static | Load Montserrat weights 400/500/600/700 and verify the rendered font. |
| `gold-as-ui` (WARN) | static | Reserve gold for identity marks. Use approved brand or status tokens for UI. |
| `nbsp-in-css` (FAIL) | static | Replace non-breaking spaces outside CSS strings with ordinary spaces. |
| `off-family` (WARN) | static | Use Montserrat with the system sans fallback. |
| `public-static-drift` (FAIL) | static | Regenerate matching public/ and static/ assets from one source. |
| `text-below-floor` (FAIL) | static | Raise rendered text to at least 17px. Body text uses 19px. |
| `tokens-not-linked` (FAIL) | static | Link ecc-tokens.css in the documented stylesheet order. |

Then do the manual checks the audits cannot: upload a fictional sample resume on each host (local and Vercel) and confirm an AI reply renders, and wheel-test the feed and landing at 375 and 1440 with Playwright `mouse.wheel`.

## How to migrate an app

Commands run the same on Mac (zsh) and Windows (PowerShell), from the design-system repo root, with Python 3 and Node installed. On Windows run the `.sh` step in Git Bash, or copy the four files by hand (step 3).

1. Claim the app in `ROLLOUT.md` (one owner per app at a time): `app | your name | branch | status`.
2. Branch `ecc/<app>` from the app's main.
3. Mac: `scripts/vendor_into_app.sh <app>`. Windows: Git Bash, same command, or copy the four `css/ecc-*.css` files into every web dir (public/ and static/ stay identical). Add the `<head>` links in the order the acceptance checklist lists. Push this vendor commit before asking any coding helper for a patch, so it reads the same files the patch applies to.
4. Replace the app's private color vars (`--green`, `--primary`, `--accent-blue`) with ECC tokens, raise every font size below 17px, remove dark theme blocks, swap emoji for SVG, restyle fields as above.
5. `python3 scripts/ecc_audit_static.py <app>` (Windows: `py scripts\ecc_audit_static.py <app>`) until 0 FAIL. Use the Check and correct table for the scroll, width, upload and response-format codes.
6. Run the app locally, then `node scripts/ecc_audit_runtime.mjs <url>` until 0 FAIL at all five widths. Screenshot 375 and 1440 with example data only, never student records.
7. Push the branch, open a PR with the audit output and screenshots, update the `ROLLOUT.md` row. Never push to main.

Apps not yet migrated to ECC keep their CES tokens, and status UI there uses `--ces-status-{success,warning,neutral}-{bg,text,border}` (never navy or gold).

A second opinion helps: the cis-coding-helper skill can review the PR against `references/acceptance-checklist.md`. Verify each finding before acting on it.

**Definition of done:** static audit 0 FAIL, upload-to-AI-reply verified on every host the app runs on, runtime audit 0 FAIL at 320/375/768/1440/1920, every WARN answered in the PR, public/ and static/ byte-identical, screenshots attached, checklist reviewed.

## Orchestration in Rob's setup

If the `rob-coding-helper` skill is installed (Rob's own Claude, Codex and Antigravity), also read its `references/design-rollout.md` before a migration. It holds the agent roles, the supervisor loop, the design-system sync from Claude Design and the ready-to-paste handoff prompts. Coworkers skip this section and use `cis-coding-helper` for a second opinion.

## Boundary

Governs interface quality and brand consistency only. It doesn't authorize product-scope changes, data-flow changes, pushing to main, or edits to the design system.

## Portable assets

The bundled assets/ folder contains the four ECC stylesheets and the matching static auditor, with a SHA-256 manifest. Follow assets/README.md to vendor and audit without repository access. Runtime and visual verification remain required.

## Version history

v3.0.0 (2026-10-22) merges `ui-ux-principles` into this skill so Rob and coworkers share one copy. The design rules are unchanged from v2.2.0. Rob-only orchestration (agent roles, supervisor loop, design sync, handoff prompts) moved to `rob-coding-helper/references/design-rollout.md`. `ui-ux-principles` is retired. Its history lives in this repo's git log.
