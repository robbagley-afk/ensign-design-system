# Career Explorer Coach exemplar patterns

Carried forward from ui-ux-principles v1.3.0 (2026-09-25), which was built from the Claude Design redesign of the Student Career Explorer Coach (Claude Design project "Mentor explorer redesign request"). The design-system tokens and the five components in the ensign-design-system repo take precedence. These patterns fill in the screen-level detail the tokens do not cover. Where a number here conflicts with `tokens/tokens.json`, the tokens win. Two such conflicts, resolved:

- Composer radius: the exemplar used 16px, the design system says `radius-lg` (14px). Use 14px.
- Composer fill: the exemplar used white. Rob's standing requirement is `--input-fill` (#f1f5f9, white on focus). Use `--input-fill`.

Gap: the exemplar's code is not yet committed to GitHub (checked 2026-09-25: `major-career-explorer-coach-ai` main ends at 788fe81, before the redesign). Until it is, agents that cannot read Claude Design work from this file.

## Screen patterns

- **Header**: A white bar with a 1.5px bottom line and 6px vertical padding. On the left is a 34px Ensign Green brand mark (a white letter with a 3px gold inset underline) and the app title in 19px/700, ellipsized. On the right are labeled secondary buttons ("Career Tools" back link, "New chat"), an optional status pill, and one **green primary CTA** ("Book a mentor appt"). Show only one primary action in the header.
- **Step header**: A compact bar above the feed reading `Step N of 4 · Title`, where "Step N of 4 ·" is Ensign Green, at 21px/700. A secondary **"Next: {short title} →"** button sits on the right. Hide long descriptions so the feed keeps the space.
- **Sidebar**: Sections carry 17px/700 muted headings ("Your four steps", "Watch", "Resources"). Step buttons are 52px rows with a 30px numbered circle. The active step gets a green circle, a `#e7f3ee` wash, a green border, and `aria-current="step"`. Video rows get an amber play badge and `aria-pressed`. Resource links get an external-arrow icon. A bordered handoff card ("Prefer ChatGPT Edu? → Copy prompt") comes next, and a privacy reminder is pinned to the bottom ("Keep private personal identifiers out of chat.").
- **Assistant message**: A full-width white card with a 1.5px `#cbd5e1` border, 14px radius, and card shadow. It opens with a 17px/700 green speaker label ("Career Explorer Coach"). Content renders as headings, paragraphs, numbered and bulleted items with green markers, and underlined green links (`text-underline-offset: 3px`).
- **User message**: Right-aligned, `max-width: 78%` (90% ≤ 375px), solid `#006645` with white text, radius `14px 14px 4px 14px`, and a "You" label in `#d1e7dd`.
- **Feedback**: Use **worded buttons** ("Yes, helpful", "Suggest an improvement"), not bare thumbs icons. They sit above a 1.5px top divider. Replace them with a `role="status"` confirmation ("Thank you. Your feedback was saved.").
- **Thinking state**: A bordered row with a pulsing green dot and plain-language text ("Thinking about your question…"). The pulse is disabled under reduced motion.
- **Suggested questions**: Use a **single-row horizontal rail**, not a wrapping grid, so it never pushes the composer down. Put 44px round ← / → buttons on each side; they are disabled with light borders when there's nothing to scroll. Pill chips (radius 22) stay on one line. Show the rail until the user sends a first message, then collapse it behind a "Show suggested questions" text button, with "Hide" to collapse it again. Chips may send a prompt, open a link, or open a video.
- **Composer dock**: A white dock with a 1.5px top line holding the rail and composer. The textarea auto-grows to 160px, then scrolls. Enter sends and Shift+Enter adds a new line. The Send button is labeled ("Send →") and turns gray `#64748b` when disabled or busy. It has a visually hidden `<label>`. Pad the bottom with `env(safe-area-inset-bottom)` on phones.
- **Upload dropzone** (step-specific): A 2px dashed border with a clear title and helper text. The border turns green while dragging, green when a valid file is ready, and red with a text message for an invalid type. Include a "Choose file" primary button and a visually hidden file input.
- **Inline media**: Videos open in a card at the top of the feed with a title bar, a 44px close button, and a 16:9 frame. They don't open in a modal or a new tab.
- **Toast**: A bottom-right `role="status"` card for confirmations such as "Prompt copied". It has a 44px close button and next-step links, and auto-dismisses after about 12s.
- **Mobile drawer**: The sidebar slides over a `rgba(15,23,42,.45)` scrim with a "Menu" title and a 44px close button. It closes on scrim tap, on step select, and when resizing to desktop.

## Breakpoints

   ```css
   /* ≥ 1280px: show the AI status pill in the header */
   /* ≥ 1200px: show the organization suffix after the app title */
   /* < 900px: sidebar becomes a drawer; show hamburger + 4-column step bar */
   /* < 640px: icon-only header buttons (keep aria-label), padX 16px,
      tighter bubble padding (14px 16px), step bar shows numbers only */
   /* ≤ 375px: padX 12px, user bubble max-width 90% */
   ```

## min-width: 0 checklist (class names from the older apps)

   - `body` → `max-width: 100vw`
   - `.app-header` / `.page-header` → `min-width: 0;` (use `flex-wrap: nowrap` with ellipsized title, and drop labels/badges by breakpoint instead of wrapping)
   - `.brand-section` / `.header-left` → `min-width: 0; flex: 1 1 auto;` and the title `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`
   - `.header-controls` / `.header-right` → `flex-shrink: 0;`
   - `.main-container` / `.layout-root` → `min-width: 0;`
   - `.chat-area` / `main` → `min-width: 0; overflow: hidden;`
   - `.messages-feed` → `min-width: 0; overflow-x: hidden;`
   - `.message-row` → `min-width: 0;`
   - `.msg-bubble` / `.message-content` → `min-width: 0; word-break: break-word; overflow-wrap: break-word;`

## Design decisions

- **Full width beats a fixed reading cap in chat.** Older guidance capped chat at 1180px. The mentor audience on 1080p screens needs the full canvas, so buffer padding (`clamp(24px, 3vw, 56px)`) now provides the breathing room. Prose pages that aren't chat may still use a readable measure.
- **Words over icons.** Header buttons, feedback, and Send carry text labels at tablet and desktop widths. Icon-only buttons are allowed only under 640px and must keep an `aria-label`.
- **Progressive disclosure.** Hide step descriptions, collapse starters after the first message, and show the status pill only on wide screens. Keep the chat above the fold.
- **One primary action per region.** Green solid buttons go to the main CTA (header), Send, and Choose file. Everything else is a white button with a 1.5px border.
- **Contrast & canvas.** A white or `#f8fafc` canvas with Ensign Green. No dark themes or dark gray containers.
- **Typography & font fallbacks.** Montserrat with `display=swap` and the fallback stack `Montserrat, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`. Headings have a solid color before any gradient-clip enhancement.
- **Forced colors mode.** Support `@media (forced-colors: active)`: `Highlight` focus outlines, `CanvasText` text, and `ButtonFace`/`ButtonText` pills.
- **Programmatic & live state.** Use `aria-invalid` + `aria-describedby` for errors, `aria-current` for the active step, `aria-pressed` for toggles, `aria-expanded` for the drawer, `role="log" aria-live="polite"` on the message feed, and `role="status"` for toasts and confirmations.
- **Data displays.** Use lists for key-value metadata and tables only for real tabular data, with captions and scoped headers.
