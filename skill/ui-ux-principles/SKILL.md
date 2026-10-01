---
name: ui-ux-principles
description: Use when designing, building, reviewing, or migrating the interface of any Ensign College / Career Services app in Rob's GitHub, or when coordinating that UI work across Claude, Codex, Antigravity and Rob's Coding Helper. Applies the org's default Claude design system (Ensign Career Coach) through the ensign-design-system repo.
version: 2.0.3
category: general
status: published
---

# UI/UX Principles (Ensign Career Coach)

Every Ensign student- and mentor-facing app should read and behave like one product. That product is defined by the organization's default design system in Claude Design, **Ensign Career Coach**. This skill tells any agent how to apply it and how the agents split the work.

## Source of truth

| What | Where | Who can read it |
|---|---|---|
| Design system (canonical) | Claude Design artifact `https://claude.ai/artifact/2Nz7EPn8vjHGM5cwrXpy4v` (tokens.json, README, 5 components) | Claude only |
| Mirror all agents use | GitHub `robbagley-dev/ensign-design-system` (private). Local clone `~/Local-Infra/ensign-design-system` on the Mac Studio | Claude, Codex, Antigravity, Rob's Coding Helper |
| This skill (canonical copy) | `skill/ui-ux-principles/` in that repo | all |

`tokens/tokens.json` in the repo is a byte-exact copy of the artifact's `project/tokens.json`. Never hand-edit it. Local deviations live in `tokens/overrides.json`, each with a reason and a status.

**Precedence:** Rob's words in the current request, then the design system (tokens.json, its README, its component notes), then `overrides.json`, then the Career Explorer Coach exemplar patterns (`references/exemplar-patterns.md`), then the gates in this skill, then general craft defaults. If two of these conflict and the answer changes what ships, say so in the PR and let Rob decide.

**Scope:** Ensign College and Career Services apps. Personal or non-Ensign apps do not get the Ensign brand. Use general design craft there instead.

## The design system in brief

Read `README.md` and `docs/components.md` in the repo before a first migration. The rules that most often get broken:

1. **Audience first.** Mentors and students, often over 60, often on shared 1080p desktops, reading paragraphs of advice. Body text is **19px**, line-height 1.6. **Nothing renders below 17px**, including captions, chips, timestamps, disclaimers and feedback controls.
2. **Fill the width.** The chat feed and composer fill the available width up to the `--gutter`: `clamp(24px, 3vw, 56px)` from 640px up, 16px under 640px, 12px at 375px and below. The header, step header, feed and composer share it so their edges line up. No 65ch or 1180px cap on the chat canvas.
3. **One theme, light.** Page `surface-sunken` #f8fafc, cards and panels `surface` #ffffff. No dark mode.
4. **Ensign green `--brand` #006645 means "do this".** Primary buttons, links, the active step, focus rings. Nothing decorative.
5. **Gold `--accent-gold` #FDB515 is an identity mark only.** It never marks a button, link, badge, border or highlight.
6. **One typeface.** Montserrat 400/500/600/700 with the system sans fallback. No serif, no Inter, no mono for UI.
7. **Radius carries meaning.** `radius-md` 10px = clickable control. `radius-lg` 14px = content container (cards, bubbles, composer). `radius-pill` = chip or status. User chat bubble alone uses `14px 14px 4px 14px`.
8. **Two text colors.** `ink` #0f172a and `ink-muted` #475569. Borders `border` #cbd5e1 for structure, `border-strong` for controls.
9. **Cards are rare.** Border plus `shadow-card` only on distinct objects (assistant message, video frame, dropzone). A card never sits on a card.
10. **User bubble:** solid `--brand` with white text, max 78% (90% at 375px and below), radius `14px 14px 4px 14px`, a "You" label. Assistant message: full-width card with a 17px green speaker label.
11. **State is never color alone.** Status pill = tinted fill plus label. Active step = tint plus border plus numbered badge.
12. **Voice.** Buttons are verbs in sentence case ("Copy prompt", "Book a mentor appt"). Confirmations state the outcome ("Thank you. Your feedback was saved.").

## Text fields (Rob's standing requirement)

Every text entry control (chat composer, feedback form, intake, search, admin form) looks the same so people find it instantly:

- fill `--input-fill` #f1f5f9, turning `--surface` #ffffff on focus
- border 2px `--input-border` #64748b (4.75:1 on white; `border-strong` #94a3b8 fails the 3:1 control-boundary rule, so it is not used for fields)
- text `--ink` at `--text-body` 19px, placeholder `--ink-muted`
- min-height 44px, padding 14px 18px, `radius-lg` for textareas and `radius-md` for single-line inputs
- `shadow-card` at rest, replaced by `shadow-focus` on focus, plus a 2px brand `:focus-visible` outline offset 2px
- on phones the field takes its own full-width row. Buttons wrap below it.

Use the `.ecc-field` class or the `.ecc-composer textarea` pattern from `css/ecc-app.css`.

## Gates the design system assumes but does not spell out

- **Six interactive states** on every control: default, hover, active, `:focus-visible`, disabled (`:disabled` and `[aria-disabled="true"]`), and current (`aria-current="page"` or `aria-selected`).
- **Focus:** never `outline: none` without a replacement. The shared CES components set the ring with `!important` from `--ces-focus-ring`. `ecc-ces-compat.css` points that variable at brand green.
- **Touch targets** 44x44 minimum, including icon buttons and chip scroll buttons.
- **Contrast:** 4.5:1 for text, 3:1 for control boundaries and focus rings. Check any new tint pair before shipping.
- **Flex overflow:** `min-width: 0` on every flex or grid child in the chat layout (shell, main, feed, message, bubble, composer row). This, not `overflow: hidden`, is the fix for clipped text.
- **Breakpoints:** 1280px (status pill appears), 1200px (organization suffix), under 900px (drawer plus 4-column step bar), under 640px (icon-only header buttons with aria-label, gutter 16px, composer wraps), 375px and below (gutter 12px, user bubble up to 90%). No horizontal page scroll at 320, 375, 768, 1440 or 1920px.
- **Motion:** honor `prefers-reduced-motion` in CSS and in JS scrolling (`behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'`).
- **Windows High Contrast:** `@media (forced-colors: active)` keeps borders as `ButtonText` and focus as `Highlight`. Never blanket `border: ... !important` on every control, since it blocks field styling.
- **Semantics:** every field has a `<label for>` or `aria-label`. Errors use `aria-invalid` plus `aria-describedby`. Async results announce through `role="status"`.
- **No emoji as section markers or icons.** Use inline SVG with `aria-hidden="true"` plus a visible text label.
- **Layout:** fixed left sidebar `--sidebar-width` 232px (never over 280px, never flexing) for steps, videos, resources and the handoff card. Under 900px it becomes an off-canvas drawer (`.ecc-sidebar.is-open` over `.ecc-scrim`) opened by a 44px hamburger with `aria-expanded`. The chat canvas takes `minmax(0, 1fr)`.
- **Screen patterns:** header, step header, sidebar sections, assistant and user messages, worded feedback, thinking state, collapsing suggested-question rail, composer dock, upload dropzone, inline video, toast and drawer are specified in `references/exemplar-patterns.md`. Read it before building or migrating a chat screen.

## How to migrate an app

1. Claim the app in `ROLLOUT.md` in the design-system repo (one owner per app at a time).
2. Branch `ecc/<app>` from the app's main.
3. `scripts/vendor_into_app.sh <app>` copies the four ECC CSS files into every web dir (public/ and static/ stay identical). Add the `<head>` links the script prints.
4. `ecc-ces-compat.css` moves every `--ces-*` variable to ECC values with no selector edits. Then fix the app's own CSS: replace the app's private color vars (`--green`, `--primary`, `--accent-blue` and similar) with ECC tokens, raise every font size below 17px, remove dark theme blocks, swap emoji for SVG, restyle fields as above.
   In the default split, step 4 is the helper's patch (see "Who does what"). Push the vendor commit first so the helper reads the same files the patch will apply to.
5. `python3 scripts/ecc_audit_static.py <app>` until 0 FAIL.
6. Run the app locally, then `node scripts/ecc_audit_runtime.mjs <url>` until 0 FAIL at all five widths. Take screenshots at 375 and 1440 with a sample conversation loaded (example data only, never student records).
7. Push the branch, open a PR with the audit output and screenshots, and log it in `ROLLOUT.md`.
8. Review, design sign-off, and Rob merges. Never push to main.

Apps not yet migrated to ECC keep their CES tokens, and status UI there uses `--ces-status-{success,warning,neutral}-{bg,text,border}` (never navy or gold).

**Definition of done:** static audit 0 FAIL, runtime audit 0 FAIL at 320/375/768/1440/1920, every WARN answered in the PR, public/ and static/ byte-identical, screenshots attached, Rob's Coding Helper review addressed, Claude design sign-off.

## Who does what

Default split: **Rob's Coding Helper writes most of the code, Claude supervises.** The helper can read any repo through GitHub but has no filesystem, cannot run code, and does not commit. So it authors patches, and the supervisor applies, audits, verifies and commits them.

| Agent | Role | Typical work | Model and effort |
|---|---|---|---|
| **Claude** (Cowork on the Mac Studio) | Supervisor and design owner | Owns `ROLLOUT.md` and sequencing. Pushes the vendor branch so the helper can read it, sends the helper its patch prompt, applies the returned diff, runs both audits, sends failures back for a revision, gives design sign-off, opens the PR. Syncs `tokens.json` from the Claude Design artifact (only Claude can read it). Edits the artifact only with Rob's yes. | Opus 5.5 medium for the rollout loop. Switch to Opus 5.5 high only for design-system conflicts, sync changes, or an app whose layout needs restructuring. Sonnet 5.5 low or medium (pilot, Mem 46ad2482) is enough for the pure apply-the-approved-diff and run-the-audit steps. |
| **Rob's Coding Helper** (Copilot Studio) | Primary code author, then reviewer | Reads the app and `ensign-design-system` on GitHub and writes the migration as unified diffs (prompt 1 in `references/handoffs.md`). Revises from audit output. After the PR opens, a fresh conversation reviews the PR against the acceptance checklist. Never gets local-only files, credentials or student data. | Its Sonnet router, which holds the GitHub connector, writes every patch. The Opus specialist cannot read GitHub, so use it only for small pasted questions. |
| **Codex** | Fallback implementer | Takes an app when the helper's patch fails the audit twice, or when the change needs running code to get right (JS behavior, build steps). | Least costly Codex model likely to succeed, medium effort. |
| **Antigravity** | Bulk runner | Mechanical, fully specified sweeps: vendor CSS into many repos, run the static audit across all repos, batch screenshots. | Gemini 3.8 Flash, low effort (med for screenshots). |

Handoff prompts for each lane are in `references/handoffs.md`. Every handoff names the repo, branch, app, the audit commands, and the definition of done, so the receiving agent needs no other context.

**Supervisor loop per app:** vendor branch pushed, then helper writes the patch, then Claude applies it (`git apply --3way`), then static audit, then runtime audit. Up to two revisions go back to the helper with the exact failing lines. After a second failed revision the app goes to Codex. Then the PR opens, a fresh helper conversation reviews it, Claude verifies each claimed finding, and Claude signs off. Rob merges. Record each helper conversation URL in the app's `ROLLOUT.md` row so any session can resume it.

**Coordination rule:** `ROLLOUT.md` in the design-system repo is the shared board. Before starting, an agent commits its claim (`app | agent | branch | status`). It updates the row at each step. Two agents never hold the same app. Anything an agent could not finish goes in the row's notes with the exact next command.

## Syncing the design system (Claude only)

1. `Artifact` read `https://claude.ai/artifact/2Nz7EPn8vjHGM5cwrXpy4v` path `project/tokens.json` and `project/README.md`.
2. If the sha256 differs from `tokens/tokens.json`, replace the file byte for byte, run `python3 scripts/build_tokens.py`, update `docs/design-system-README.md`, add a CHANGELOG entry, and open a PR.
3. Re-vendor into apps through the normal rollout. Apps fail `ds-stale` in the static audit until they do.

## Version history

v2.0.3 (2026-09-29) adds the rule that unmigrated apps keep their CES tokens and use `--ces-status-*` for status UI. Nothing else changed.

v2.0.2 (2026-09-28) adds Sonnet 5.5 low or medium as a pilot option for the apply-and-audit steps only, per Mem 46ad2482. Nothing else changed.

v2.0.1 (2026-09-28) changes only model recommendations: Claude's supervisor loop moves from Sonnet 5 high to Opus 5.5 medium (Opus 5.5 high for restructures), per the living Model & Effort Selection Guide (Mem 46ad2482), which shows Opus 5.5 beating Sonnet 5 at lower cost.

v2.0.0 (2026-09-25) supersedes v1.3.0 and earlier. It makes the Claude Design system and the ensign-design-system repo the source of truth, adds the audits, the rollout board and the agent roles, and moves the v1.3.0 exemplar screen patterns to `references/exemplar-patterns.md`. Retired: 16px body and 14px secondary text, the 1180px cap, gold on badges and callouts, Heritage Navy as a UI color, Libre Baskerville in app UI (it stays for formal print and editorial documents only). Earlier versions are backed up under `~/Local-Infra/_retired/` on the Mac Studio.

## Boundary

This skill governs interface quality and brand consistency. It does not authorize product-scope changes, data-flow changes, pushing to main, or edits to the Claude Design artifact without Rob's approval.
