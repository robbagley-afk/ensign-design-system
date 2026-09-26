# Ensign Career Coach

The design system behind Ensign College's student-facing coaching tools — extracted from the Career Explorer Coach chat experience. It exists to keep every future advising tool (career coaching, admissions, tutoring, whatever comes next) reading and behaving like the same product, without re-deriving these decisions each time.

## Who this is for

The primary reader is a career mentor or student, often on a shared desktop, sometimes over 60, working through emotionally loaded decisions (choosing a major, a first career) with a screen full of text. That drives almost every rule below more than aesthetics does:

- **Nothing reads smaller than 17px.** Body copy sits at 19px. This is not a "comfortable" choice — it is the floor below which real users in this program cannot read the page.
- **Every touch target is at least 44×44px.** Buttons, chips, and links all clear this even when the visible glyph is small.
- **The reading column is not artificially narrowed.** Chat text and the composer fill the available width up to generous side gutters, instead of the usual 65-character measure. This audience is reading paragraphs of advice, not scanning a feed.
- **State is never color-only.** Status uses a filled pill *and* a label; the active step uses a filled background *and* a border *and* a numbered badge — never a bare color shift a colorblind reader would miss.

## Voice

Direct, warm, and mission-grounded without being preachy. Buttons say what happens ("Copy prompt", "Book a mentor appt"), not what the system is doing ("Submit"). Confirmations state the outcome ("Thank you. Your feedback was saved.") instead of just closing silently.

## Color

One theme, deliberately — this product has never needed dark mode, and introducing one would dilute the brand green everywhere it currently reads as "action." If a future surface needs dark mode, add it as a second theme in `tokens.json` rather than reinterpreting these values.

**Ensign green (`brand`, `#006645`) means "do this."** It is the only color used for primary actions, links, the active step, and focus rings. Because it carries that much meaning, it appears nowhere else — not as decoration, not as a section divider.

**Ensign gold (`accent-gold`, `#FDB515`) is an identity mark, not a UI color.** In the product it appears exactly once, as a 3px inset shadow under the logo tile. It does not badge buttons, underline links, or highlight text. Treat it the way you'd treat a seal — present, but not doing interface work.

**Slate neutrals carry structure.** `border` divides panels and cards; `border-strong` outlines interactive controls, which need the extra contrast to read as clickable against a white surface. `ink` and `ink-muted` are the only two text colors on light surfaces — a UI this text-dense doesn't get a third gray.

**Semantic colors are borrowed states, not the palette.** Success green (status pill, saved-feedback message) and the rare warning/danger tones are intentionally *not* brand green, so a person scanning quickly can tell "the system is fine" apart from "you did something."

## Type

Montserrat, one family, four weights (400/500/600/700) doing all the work — headings, labels, and body all differ by size and weight, never by switching typeface. Load it from Google Fonts:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Fall back to the system sans stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`) — never a serif or mono substitute; the whole product reads as one geometric sans.

Four style groups, in order of how often you'll reach for them: **Body** (the reading size), **Label** (buttons, pills, eyebrows), **Display** (the handful of headings), **Caption** (the floor). See `tokens.json` for exact sizes and the usage note on each style — the note is the rule, not a suggestion.

## Spacing & radius

An 4px-based spacing scale (`space-1`…`space-8`) and four radii. The radius choice itself carries meaning: **10px (`radius-md`) means "you can click this"** — every button, input, and clickable row uses it. **14px (`radius-lg`) means "this is a container of content"** — cards, bubbles, the composer. **A full pill (`radius-pill`) means "this is a chip or status," something you tap and move past.** Don't mix these up — a card with a pill radius reads as a button; a button with a card's radius reads inert.

One shape lives outside the token grammar: the assistant's own message uses a uniform `radius-lg` on all four corners, but the **user's** chat bubble uses an asymmetric `14px 14px 4px 14px` — square on the bottom-right corner, pointing toward the sender. It's a deliberate one-off "who said this" cue; don't generalize it into a token.

## Elevation

Two shadow levels only. `shadow-card` sits under anything resting on the sunken background (message cards, the video player, a mobile drawer). `shadow-focus` replaces it — doesn't stack with it — the moment the composer gains focus, adding a brand-colored halo so keyboard and low-vision users get an unmistakable "you are here." `shadow-toast` is reserved for the one floating element in the product, the copy-prompt confirmation.

## Accessibility notes

- Every interactive element keeps a visible `:focus-visible` outline in `brand`, offset 2px, even where the design also shows a hover border.
- Text-on-tint pairs in this system (`ink` on `surface`, `success-text` on `success-bg`, `warning-text` on `warning-bg`) all clear 4.5:1. If you introduce a new tint, check the pairing before shipping it.
- Respect `prefers-reduced-motion`: this product's only animation (a "thinking…" pulse dot) drops straight to static under that setting, and scroll-into-view drops from smooth to instant.

## Components

Five components ship with this system, covering the recurring patterns across the product: **Button** (primary/secondary/ghost), **StatusPill** (the online/analyzing indicator and the saved-feedback confirmation), **Card** (the assistant message surface and the plain content card), **Chip** (suggested-question and filter chips), and **NavItem** (sidebar step and resource rows). Each component's guidelines call out which tokens it consumes and why — read the card before reusing the pattern.
