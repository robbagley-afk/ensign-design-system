# Fixed-domain student email field

Use this for **Ensign student email lookups only**: staff type a student's username and the page adds `@ensign.edu`. Do not use it for contact, employer, guest or personal email entry. Those stay ordinary email fields.

Reference files (fictional `demo.user` data, synthetic responses):

| File | What it is |
|---|---|
| `scripts/fixtures/student-email-field.css` | The composition CSS. Copy into the app's own CSS. Not a vendored ECC file, so it never makes an app `ds-stale` |
| `scripts/fixtures/student-email-field.js` | `normalizeStudentEmail()` and `bindStudentEmailField()` |
| `scripts/fixtures/student-email-lookup.html` | Working example page |
| `scripts/test_student_email_field.mjs` | Regression checks for normalization, paste, invalid input, identity changes, response races and the five-width layout |

## Markup

```html
<label for="student-username" id="student-label">Student email</label>
<div class="ecc-email-fixed" role="group" aria-labelledby="student-label">
  <input id="student-username" class="ecc-field ecc-field--lg" type="text"
         autocomplete="off" autocapitalize="none" spellcheck="false" inputmode="email"
         placeholder="demo.user" aria-describedby="student-hint student-suffix student-error">
  <span id="student-suffix" class="ecc-email-fixed__suffix">@ensign.edu</span>
</div>
<p id="student-hint" class="ecc-email-fixed__hint">Type only the part before @ensign.edu. You can also paste a full @ensign.edu address.</p>
<p id="student-error" class="ecc-field-error ecc-email-fixed__error" role="alert" hidden></p>
```

## Rules

1. **Look.** The editable username is an ordinary `.ecc-field` (fill, 2px `--input-border`, brand focus ring). The `@ensign.edu` suffix sits in the same group, attached on the right, as plain text that cannot be edited or selected. ECC tokens and Montserrat only. No gold. No text under 17px.
2. **Layout.** The username section is `flex: 1 1 0` with `min-width: 0`. The suffix is `flex: none` and `white-space: nowrap`. The suffix stays fully visible at 320, 375, 768, 1440 and 1920px. The username scrolls inside its box when it is long.
3. **Normalize.** Trim outer whitespace and lowercase. Send exactly one complete `username@ensign.edu` to the existing API. Show that full email in results. Never change the username's spelling or guess a different person.
4. **Paste.** A pasted `name@ensign.edu` keeps only `name`, so the suffix is never doubled. A pasted address on any other domain stays as pasted and fails validation. Never convert it.
5. **Reject** empty values, internal whitespace, more than one `@`, and any domain other than `ensign.edu`. Set `aria-invalid="true"`, show the message in the `aria-describedby` error, return focus to the field, and send nothing.
6. **Accessibility.** Visible label. The helper text and the suffix are both in `aria-describedby`, so a screen reader hears that `@ensign.edu` is added. Keyboard focus, Enter-to-submit and the form's existing submit path stay as they were. Forced-colors mode keeps the suffix border as `ButtonText`.
7. **Identity freshness.** Any edit to the field hides earlier results and clears the status line at once. Each lookup carries a request number. A response for an older number is dropped, so one student's username never sits above another student's results.

## Adopting it in an app

Follow the app's approved ECC release and phase. Copy the CSS and the controller into the app's own files, keep the app's existing API call, and pass it in as `lookup(email)`. Do not mix a newer vendored ECC CSS set with an older CI pin to get this pattern. It needs only `.ecc-field`, which every ECC release has, plus `.ecc-field--lg` on v2 screens.

Verify with synthetic responses only: username entry, normalization, full-email paste, invalid inputs, clearing and re-entry, identity changes, and a slow response for an earlier username. Run the static audit, the runtime audit at five widths (plus `--v2` on v2 screens) and review 375px and 1440px screenshots.

### Expected audit WARN

`field-narrow` at 320px and 375px: the username section is narrower than 200px because the fixed suffix shares the row. This is by design. Disposition: accepted. The suffix stays fully visible and the username scrolls inside its box.
