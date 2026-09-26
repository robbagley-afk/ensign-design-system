# Components (mirrored from Claude Design)

Source: https://claude.ai/artifact/2Nz7EPn8vjHGM5cwrXpy4v, version 1790394927-ae41. Styles in css/ecc-components.base.css (class prefix ecc-). App patterns built on them (shell, feed, messages, composer, fields, chip rail) are in css/ecc-app.css.

## Button

Three variants, one job each. **Primary** (`brand` fill) marks the single action the screen most wants taken — there's normally exactly one per view ("Book a mentor appt", "Choose file"). **Secondary** (outlined in `border-strong`) is everything else clickable that isn't a chip or nav row — "New chat", "Next: Majors". **Ghost** is an underlined text action for something low-stakes and reversible, like "Hide" or "Show suggested questions".

Never use gold on a button — see the README's color section. Labels are verbs in sentence case ("Copy prompt", not "Copy Prompt" or "Submit"). Every button holds the 44px minimum height regardless of variant.

## Card

The assistant's own message surface, and the general-purpose content container elsewhere in the product (the video player frame, the upload dropzone). A card always sits on `surface-sunken`, never on another card. The title line, when present, is small (17px) and brand-colored — it names *who* is speaking or *what* this box is, not a heading for the content below it.

Don't add a card's border-and-shadow treatment to something that isn't a distinct object on the page; the system relies on cards being rare enough to mean something.

## Chip

A suggested-question or quick-filter pill that scrolls horizontally in a single row rather than wrapping. Always paired with a left/right scroll button pair at the ends of the row once content overflows — never rely on a bare scrollbar, since this audience may not recognize a horizontal-scroll affordance.

Chips are for *choosing among short options*, not for status (use StatusPill) and not for primary navigation (use NavItem).

## NavItem

A step or resource row in the sidebar. The numbered circle is the primary "where am I" cue — filled brand-green on the active row, neutral otherwise — so the active state reads at a glance even before a person notices the tinted background. Always pair the badge with a visible label; never ship an icon-only nav row in this product.

Use for the four-step sequence and for anything else that behaves like "go to a named place" (a video toggle, a resource link). A one-off action button is a Button, not a NavItem.

## StatusPill

Reports a live system state, always as color *and* text together, never color alone — "Qwen Local AI" while idle, "Analyzing…" while busy, or the one-line "Thank you. Your feedback was saved." confirmation after a rating. Positive/neutral states use the success tokens; don't invent new tones without a matching pair of background/border/text tokens that clear 4.5:1.

Reserved for state the *system* is reporting, not a label you'd put on a button or nav item — those use plain text, not a pill.
