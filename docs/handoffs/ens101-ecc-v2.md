# [Opus 5.5 medium] Handoff: ENS 101 Guide ECC v2 redesign

Written 2026-10-23 on the iMac (robbagley@gmail.com, design work only, no student data). Run it on the **Mac Studio** as robbagley@ensign.edu, in Claude or Codex. GPT-6.1 Sol medium in Codex is an equal choice.

## Before you start

1. Read `AGENTS.md` in this repo and invoke `cis-ui-ux-principles` (v3.1.0 or later).
2. This handoff depends on design-system branch `ds/v2-bold-desktop` being merged to `main` in `robbagley-afk/ensign-design-system`. Check with `git log origin/main --oneline -5` for the "ECC v2" commit. If it is not on main, stop and tell Rob.
3. Claim `ENS 101 Guide` in this repo's `ROLLOUT.md` and keep the row current.
4. App repo: `robbagley-afk/ENS-101-Guide`, local copy on the Studio at `~/Local-Infra/work/ens101-ecc-followups`. Branch `ecc/ens101-v2` from the app's `main`. Never push to main. Rob merges.
5. `~/Local-Infra/ens101-phase2-ui-yeuGLj` may hold another session's ENS 101 UI work. Read it and ask Rob before you start if it overlaps.
6. Use only fictional people in screenshots (the design uses "Jordan Avery, Example student").

## Source of truth

- Approved design canvas: https://claude.ai/artifact/RzcqxdeUvTmWLbU5r17hiL (Step 3 and Step 4 artboards at 1920 wide, plus the style guide).
- Working reference markup: `scripts/fixtures/step-screen.html` in this repo. Copy class names from it, not from the canvas. The canvas uses inline styles and one known contrast bug (Mentor AI button outline #C4B1EF), which the CSS fixes with `--ai-border` #7C3AED.
- Classes: the "ECC v2" section at the end of `css/ecc-app.css`. Tokens: `tokens/overrides.json` (status `rob-decision`).

## Changes, in order

All paths are in the app repo. `static/` is the web root. If a `public/` copy exists, keep it byte-identical.

### 1. Re-vendor the design system

`scripts/vendor_into_app.sh <app>` from this repo (or copy the four `css/ecc-*.css` files into `static/`). Update `static/ECC_VERSION`. Keep the existing `<head>` link order. Drop the `?v=` cache-busters on the ECC files only if the app's server does not need them.

### 2. Header (`static/index.html`, `header.topbar`)

- Add class `ecc-hdr-band` to the header and wrap its children in `<div class="ecc-hdr-band__inner">`.
- Brand: keep the "E" mark. Make it the gold identity tile (48px, `--accent-gold` fill, `--brand-deep` letter). Under "ENS 101 Guide" show "Ensign College Career Services" with `ecc-hdr-band__sub`. Move "v1.0" into the brand link's `aria-label` only.
- Nav: `top-nav-button` gets `ecc-nav-link`. Rename the "Tasks" label to "Appointment".
- Student switcher: keep the `<select id="student-switcher">` for now and style it at 52px tall on the band. The "Meeting with" card in the rail (step 4) is the main display of who the mentor is meeting.
- Status: replace the two-line status box with one pill, "Saved on this computer" (check icon), on `--brand-hover` with `--brand-tint` text. Keep `#ai-engine-badge` but move it into the Mentor AI panel footer, since mentors do not need the engine name in the header.
- Buttons: "CIS AI Dashboard" becomes `ecc-btn ecc-btn--lg` outlined in white. Add an "Ask Mentor AI" button (`ecc-btn ecc-btn--lg ecc-btn-ai`) that calls `openCopilot()`. "New Student" stays, outlined in white, label "New student".

### 3. Stepper replaces the workflow sidebar

- Delete the `.workflow-sidebar` contents. Add `<nav class="ecc-stepper" aria-label="Appointment progress"><ol id="workflow-nav"></ol></nav>` directly under the header.
- Rewrite `renderWorkflow()` (`static/app.js`) to emit four `li.ecc-stepper__step` items with `li.ecc-stepper__line` between them: 1 "Look up the student" (PREPARE_STEPS[0]), 2 "Begin the appointment", 3 "Plan and wrap up", 4 "Log in Civitas".
  - Done steps get `is-done`, a check SVG in the badge (no "✓" text character) and state text "Done".
  - The current step gets `aria-current="step"` and state "You are here". The step after it gets `is-next` and "Up next". Later steps show no state text.
  - Each step is a `<button type="button">` inside the `li`, keeping today's click-to-jump behavior.
- `renderProgress()` now writes "N of M done" plus the bar into the action bar (step 7). Remove the old sidebar progress elements.

### 4. Make Civitas its own step

- In `WORKFLOW`, add a third entry `{ id: 'civitas', label: 'Log in Civitas', short: 'Copy the note, confirm, finish', duration: '3 min', title: 'Log the appointment in Civitas', description: 'Five short steps. Each number turns green when it is done.', tasks: [] }`.
- `stepComplete()`: for `id === 'civitas'` return `Boolean(state.civitasRecorded)`. `totalTasks()` and `completedTasks()` stay task-based, so they are unchanged.
- `renderAppointmentWorkspace()`: show `#civitas-card` when `step.id === 'civitas'` (was `stepIdx === WORKFLOW.length - 1`). Hide the task card and the notes card on that step.
- Rebuild `#civitas-card` as the two-column layout on the Step 4 artboard (`ecc-step-layout ecc-step-layout--two`):
  - **Left:** five numbered parts. 1 "Make the Civitas note" (primary button that renders `buildCivitasNote()` into the right panel). 2 "Copy the note" (existing `#btn-copy-civitas` behavior, plus a `role="status"` line "Copied. Now paste it into Civitas."). 3 "Paste it into Civitas" (`ecc-btn-info` link that opens Civitas in a new tab, URL from the current Resources entry). 4 "Confirm it is saved" (`#civitas-confirm-checkbox` inside a full-row label, text "I saved this note in Civitas."). 5 "Finish and clear this student" (`#btn-complete-delete-record`, `ecc-btn-danger`, label "Finish appointment", helper "Removes this student's checklist and notes from this computer. Civitas keeps the note.", disabled until step 4 is checked, with "Check the box in step 4 first." shown while disabled).
  - **Right:** `ecc-feature-card ecc-feature-card--info` titled "Your Civitas note", with a Copy button in its head. The note shows in Montserrat 21px with `white-space: pre-line`. No monospace.
  - Number badges use `.is-done` (green) and `.is-now` (deep green, gold ring), the same as the stepper badges.
- Previous and Next on step 3 lead to this step. On step 4, the action bar shows only "Back to step 3" and "N of 5 done".

### 5. Three-column layout for steps 2 and 3

Wrap the appointment workspace in `<main class="ecc-step-layout">` with three children:

- **Rail** (`aside.ecc-step-rail`):
  - A "Meeting with" card: initials avatar (`--brand-tint-strong` fill), preferred name, major, career direction, and "Career confidence: 5 at the start, 7 now". Add a `confidenceStart` field to state, set the first time confidence is chosen on step 2. Add a "Change student" secondary button that focuses the switcher.
  - The Mentor AI panel (`ecc-ai-panel`), titled "Need help with this step?". Render the step's `copilot` prompts as `button.ecc-ai-ask` that call `openCopilot(prompt)`. Keep `#ai-engine-badge` in the panel footer.
- **Work column:** a `.card` with `ecc-step-eyebrow` ("Step 3 of 4 · About 12 to 15 minutes"), `h1.ecc-step-title`, one lead sentence, then the task list (step 6). On step 2, `#session-details-card` stays in this column above the tasks.
- **Record column:** step 3 shows the "Student's next step" feature card and the conversation notes card (step 8). Step 2 shows only conversation notes.

Under 1180px the rail moves above the other two columns. Under 820px everything stacks. The CSS does this. Do not add other breakpoints.

### 6. Checklist rows (`renderAppointmentWorkspace()` task loop)

- Group headings: `p.task-group-heading` becomes `h2.ecc-group-label`. Rename group "Close" to "Close the appointment".
- Each task becomes `label.ecc-task` (add `is-done` when checked) with `input.ecc-task__check[type=checkbox]` as the first child. The title goes in `.ecc-task__title`, the detail in `.ecc-task__detail`, and a status pill (`ecc-pill-done` "Done" or `ecc-pill-todo` "To do") sits beside the title.
  - This replaces the icon button `button.task-check`, so the whole row toggles.
  - Bind `change` on the input, not `click` on the row.
  - Rows with inline controls use a `div.ecc-task` instead of a label, with `aria-labelledby` on the input pointing at the title, so clicks on the number keys do not toggle the row.
- `task.action` links stay inside `.ecc-task__detail`, bold, with the external-link SVG.
- Plain-language titles (edit `WORKFLOW` in `app.js`):
  - `internship-timeline`: "Talk about timing and options"
  - `internship-international`: "International students only: check the rules"
  - `close-confidence`: "Ask again: how sure is the student about their career?"
  - `career-followup`: "Choose the next appointment together"
  - Details: write "6 to 9 months" instead of "6–9 months". Shorten the international detail to "No immigration advice. Help the student check vacation-semester and work rules."

### 7. Action bar

- Replace `.step-actions` with `<nav class="ecc-actionbar" aria-label="Step navigation">`, placed once after `main` (not inside the task card).
  - Left: "Back to step N" (`ecc-btn ecc-btn--lg ecc-btn-secondary`, `#previous-step`).
  - Center: `.ecc-actionbar__progress` with "N of M done" and `.ecc-progress > span`. This counts the current step's tasks.
  - Right: `#next-step` (`ecc-btn ecc-btn--lg ecc-btn-primary`), labeled "Next: Plan and wrap up" on step 2 and "Next: Write the Civitas note" on step 3.
- It is the only green primary button on the screen.

### 8. Next step, notes and the confidence picker

- **Student's next step:**
  - Move `#student-next-step` out of `.notes-grid` into `section.ecc-feature-card` titled "Student's next step", with a gold "Goes into the Civitas note" pill in the head.
  - Label it "What will the student do?" with helper text "Use the student's own words. One or two clear actions." The textarea gets `ecc-field ecc-field--lg` (210px tall, resizable).
  - Add a "By when?" input (`#student-next-by`, `ecc-field ecc-field--lg`) and three `button.chip` quick dates: "This Friday", "In 2 weeks", "Before next appointment". The first two fill a formatted date such as "Friday, November 6".
  - Store it as `state.studentNextBy`. In `buildCivitasNote()` and `buildSummary()`, append " By " + the value to the student's next step when it is set.
- **Conversation notes:** its own `.card`. Move the "Keep notes appropriate" text from the sidebar into an `ecc-callout ecc-callout--caution` above `#session-notes`. Shorten it to "Keep notes appropriate. No student IDs, passwords, money or health details." Delete `.privacy-card`.
- **Confidence:**
  - Replace both range inputs (`#career-confidence` on step 2 and `.task-confidence-input` on step 3) with `div.ecc-numpick[role=group]` of ten `button.ecc-numpick__key` using `aria-pressed`.
  - Mark the start value with `<small>start</small>` on step 3. Add "1 = Not sure at all" and "10 = Very sure" under the keys, and a live line "Now 7. Up 2 from the start."
  - Picking a number sets `state.student.confidence`, `confidenceEngaged = true` and checks `close-confidence`.
  - `bindTaskInlineControl()` no longer needs the drag workaround.
- **Suggestion:**
  - Render `confidenceSuggestion()` as an `ecc-callout`: info for 5 or below (Career Explorer), caution for 6 to 7 (talk about both), success for 8 or above (Create Resume). Keep the existing thresholds.
  - Below it, add `div.ecc-choice-row[role=radiogroup]` with two `button.ecc-choice[role=radio]`: "Career Explorer appointment" and "Create Resume appointment". The choice sets `state.student.followup` and checks `career-followup`.

### 9. Remove from `static/styles.css`

Delete the rules for `.workflow-sidebar`, `.workflow-button`, `.workflow-num`, `.progress-track`, `.privacy-card`, `.task-check`, `.task-confidence*`, `.civitas-badge`, `.civitas-confirmation-box`, `.notes-grid` and any `max-width` on `.main-area` or `.workspace`. Keep app-specific rules that are not replaced. Never hand-edit the vendored `ecc-*.css` files.

## Definition of done

- `python3 scripts/ecc_audit_static.py <app>`: 0 FAIL, every WARN answered in the PR.
- `node scripts/ecc_audit_runtime.mjs <local url>`: 0 FAIL at 320, 375, 768, 1440 and 1920.
- Look at the 1440 and 1920 screenshots yourself:
  - One green primary button per screen.
  - Gold only on the logo tile, the header stripe and the current-step ring.
  - Montserrat only, no monospace.
  - No card inside a card.
  - The "Student's next step" box visible without scrolling at 1920×1080.
- Click through the flow with fictional data: Prepare, Begin, Plan, Civitas. Check the note text includes "By" and the follow-up choice. Check Finish stays disabled until the box is checked.
- Run the app's own tests (`tests/`) and the Civitas note builder tests, if any.
- Open a PR from `ecc/ens101-v2` with the audit output and screenshots. Update the `ROLLOUT.md` row. Do not merge or deploy. Rob merges.
