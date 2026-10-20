# Dashboard pattern

Use `body.ecc` and a full-width `main.ecc-dash`. Load the four ECC stylesheets in
the documented order, then app-specific CSS. Montserrat must actually load.

The header contains a title, subtitle and factual summary metrics. Each section
uses a heading, count, thin brand rule and `.ecc-dash-grid`. Each distinct tool is
an `.ecc-tool-card` with an aria-hidden inline SVG, worded status, title,
description and sentence-case action. Status needs a text label, not color alone.
Do not put card surfaces inside another card.

The grid uses `minmax(min(100%, 320px), 1fr)` so narrow phones account for gutters.
Keep children shrinkable and text wrappable. Do not add fixed page-width caps,
wheel handlers or nested scroll traps. Disabled links need application behavior
that prevents activation as well as the CSS state. Use `aria-current="page"`
only when the action actually represents the current page.

The fictional fixture is `/scripts/fixtures/dashboard.html`. From the repository
root, run `python3 -m http.server 8773 --bind 127.0.0.1`, then open that route.
The root `favicon.ico` serves the required favicon endpoint. Do not expose this
preview server publicly. The fixture loads Google Fonts and connects to no AI or
student-record services. Its tools and metrics are sample content.

Run the static and runtime audits. Review screenshots at 375 and 1440 pixels and
check all five required widths. Screen states and deployment hosts still need
app-specific verification during migration.
