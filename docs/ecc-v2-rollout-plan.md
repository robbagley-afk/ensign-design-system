# ECC v2 rollout plan

Status: draft for Rob's approval. Written 2026-10-23 on robs-imac-9.

ECC v2 (PR #30, skill v3.1.0) is live in one app, ENS 101 Guide. This plan brings the other Career Services apps to v2 without breaking any of them. Nothing here starts until Rob approves the plan, and Rob merges every PR.

## Starting conditions

- ai-agents-local-llm PR 17 (mentor login page, ECC v2) merged and live on the Mac Studio. It is the first screen mentors see before every gated app.
- This plan approved, with the open questions at the end answered.
- Design system main at `f3657b5` or later. Every app PR names the exact commit it vendors.

## What changes in an app

Re-vendoring the four ECC files changes three things in every app with no markup edits:

| Change | v1 | v2 | Risk |
|---|---|---|---|
| `--text-body` | 19px | 20px | Wrapping and overflow in dense chat and admin screens at 320 and 375 |
| `--surface-sunken` page color | #f8fafc | #F3F6F4 | Custom tints sitting on the page lose contrast. Recheck any private color pair |
| New tokens and classes | none | 22 tokens, v2 classes in `ecc-app.css` | None until markup opts in |

The v2 components (`.ecc-hdr-band`, `.ecc-btn--lg`, `.ecc-field--lg`, `.ecc-callout`, `.ecc-feature-card`, `.ecc-stepper`, `.ecc-step-layout` and the rest) only apply where an app's markup uses them. So the rollout has two phases: a mechanical re-vendor that every app gets, then a per-family pattern pass that brings in the v2 look.

## Inventory (GitHub HEAD, 2026-10-23)

Host is Vercel where the repo has `vercel.json`. Suite routes come from `UPSTREAMS` in ai-agents-local-llm `public_suite_server.py`. Confirm the served folder for each suite route on the Mac Studio before deploying.

| App repo | Family | Web dirs with ECC | Host | ECC CI | On v2 |
|---|---|---|---|---|---|
| ENS-101-Guide | forms | 1 | local, suite route `/ens101/` (gated) | yes | yes |
| ensign-connect-navigator | F forms | 2 | Vercel | yes | no |
| ensign-student-readiness-hub | F forms | 1 | local, suite route `/readiness/` (gated) | yes | no |
| ensign-career-fair-coach | A chat | 2 | Vercel | yes | no |
| gemini-coaching-agent-starter | A chat | 2 | Vercel | yes | no |
| major-career-explorer-coach-ai | A chat | 2 | Vercel | yes | no |
| ensign-academic-advisor | A-like chat plus admin | 1 | local | yes | no |
| internship-expert-coach-ai | B sidebar chat | 1 | Vercel | yes | no |
| brewcoach-for-linkedin | C chat | 1 | Vercel, suite route `/linkedin/` (open) | yes | no |
| brewcoach-local | C-like chat plus admin | 1 | local (Vercel project returns 500) | yes | no |
| resume-coach-ai | D resume coach | 2 | Vercel, suite route `/mentor-resume/` (gated) | yes | no |
| resume-coach-llm | D | 1 | local | yes | no |
| interview-coach-local-llm | mono-split | 1 | local | yes | no |
| transcription-meeting-summary | G Tailwind | 2 | local | yes | no |
| career-services-tools | pages | 1 | GitHub Pages | yes | no |

Out of scope:
- ai-agents-local-llm suite dashboard. The suite-restructure row in `ROLLOUT.md` holds it (581 FAIL on main, 7-PR plan). The ECC work on its dashboards stays in that plan. The mentor login page is the one exception, and PR 17 already handles it.
- your-portable-ai-team keeps its own branding (Rob, 2026-10-22).
- linkedin-networking-tutor-coach-ensign, resume-ai-tutor-coach and career-mentor-powerapps have no vendored ECC web UI on GitHub. Confirm each before deciding. Power Apps screens need their own plan.
- Non-Ensign repos.

## Phase 0: design-system prep (one PR, this repo)

1. Add a v2 chat reference fixture, `scripts/fixtures/chat-screen-v2.html`, built from fictional data. Families A to D are chat apps, and the only v2 reference today is the step screen. The fixture shows the header band over a chat shell, a 56px composer with `.ecc-field--lg`, `.ecc-btn--lg` send, the AI button role and a danger callout. It has to pass both audits at five widths before any app copies it.
2. Write `docs/ecc-v2-migration.md`: the exact markup swap for each v2 pattern (old class to new class), which tokens moved, and the 320px overflow checks. Coding Helper and Codex prompts point at this one file, not at a summary.
3. Add a `scripts/v2_revendor.sh <app-repo>` wrapper. It runs `vendor_into_app.sh`, moves both pins in `.github/workflows/ecc-audit.yml` (the `uses:` ref and `design-system-ref`) to the chosen commit, and runs the static audit. Re-vendoring without moving the pin turns that app's CI red with `ds-stale`, so the two always land in one commit.
4. Pick the pin: the merge commit of this Phase 0 PR.

## Phase 1: re-vendor every app (14 PRs, mechanical)

One PR per app, branch `ecc/<app>-v2-revendor`, claimed in `ROLLOUT.md` first.

Per app:
1. `scripts/v2_revendor.sh <app>`. public/ and static/ stay byte-identical.
2. Static audit to 0 FAIL.
3. Run the app locally and run the runtime audit at 320, 375, 768, 1440 and 1920 on every view (landing, chat with a long fictional conversation, admin where present). Fix only what the 20px body or the new page color broke, using tokens. No design changes in this phase.
4. Screenshots at 375 and 1440, viewed. Wheel test on the feed at both widths.
5. Upload-to-AI-reply check on every host the app runs on, as the skill requires.
6. Codex on the iMac reviews the diff read-only (`codex exec -s read-only`, focus: only vendored files, pin and token fixes changed). Findings checked against the code before acting.

Order (lowest risk first, so a regression shows up on a small app):
- Wave 1: career-services-tools, ensign-student-readiness-hub, ensign-connect-navigator (forms and pages, no chat feed).
- Wave 2: family A, 4 apps. Then B, C (2), D (2).
- Wave 3: interview-coach-local-llm, transcription-meeting-summary (Tailwind, compiled CSS needs a rebuild check).

Run up to 4 apps at once, one session per app, one writer per repo. Phase 1 is a good Codex or Antigravity handoff after Wave 1 sets the pattern, since every judgment call is already made.

## Phase 2: v2 patterns by family

The first app in each family sets the pattern. Coding Helper reviews that pilot (its Opus specialist for the first patch), then Codex. The rest of the family copies the pilot's diff shape, and Codex alone reviews them.

| Family | Pilot | v2 changes |
|---|---|---|
| F forms | ensign-connect-navigator | Header band, stepper and step layout where the app has steps, `.ecc-task` checklist rows, `.ecc-callout` for alerts, 56px controls. Closest to the ENS 101 pattern |
| A chat | ensign-career-fair-coach | Header band, 56px composer and send button, AI button role on "Ask" actions, callouts for errors, feature card for the upload or intake card |
| B sidebar chat | internship-expert-coach-ai | Family A changes, plus `.ecc-nav-link` states in the sidebar |
| C chat | brewcoach-for-linkedin | Family A changes. Keep the SSE and JSON parsing untouched |
| D resume coach | resume-coach-ai | Family A changes, plus the document bar upload as a feature card |
| pages | career-services-tools | Header band and `.ecc-btn--lg` links only |
| G and mono-split | after the A pilot | Same as A. Tailwind config maps to tokens, not hex |

Each Phase 2 PR follows the full definition of done in the skill: both audits 0 FAIL at five widths, screenshots reviewed, WARNs answered, review findings verified.

## Deploy and live readback

- Vercel apps deploy on merge. Read back `ecc-app.css` sha256 from the live URL against the pin, then run the runtime audit on the live URL.
- Mac Studio apps: update the served checkout, restart through the app's owner (LaunchAgent), and read back the same way. Gated apps redirect to the mentor login, so the live runtime audit can only reach the login page. Audit gated apps on their direct local port on the Mac Studio, and audit the login page on the public URL. See open question 3.
- GitHub Pages: read back after the Pages build.
- Update the app's `ROLLOUT.md` row with merge commit, deploy evidence and audit results.

## Roles

| Who | Does |
|---|---|
| Claude (iMac) | Phase 0, Wave 1, every family pilot, live readback |
| Codex (iMac) | Read-only review of every PR. Phase 1 Waves 2 and 3 as a handoff once Wave 1 sets the pattern |
| Rob's Coding Helper | Review of each family pilot, before Codex |
| Rob | Approves this plan, merges every PR, answers open questions |

## Risks

- 20px body text overflows dense chat and admin screens at 320. The runtime audit catches overflow, and Phase 1 fixes it with tokens, not by lowering the size.
- Private color pairs on the new page color can drop under 4.5:1. The contrast audit catches text. Check control boundaries by eye.
- A re-vendor without the pin bump turns CI red. The wrapper script makes them one step.
- brewcoach-local's Vercel project already returns 500. Phase 1 does not fix it. It stays a separate question.
- The 22 v2 tokens are `rob-decision` overrides until Claude Design adopts them. If Claude Design picks different values, every app re-vendors again (a Phase 1 rerun, which the wrapper keeps cheap).

## Open questions for Rob

1. Approve Phase 0 before any app work, or run Wave 1 on `f3657b5` now and add the chat fixture in parallel?
2. Should Phase 2 apply to student-facing apps too, or only mentor and staff screens first? The v2 brief came from senior mentors on desktop monitors.
3. For live audits behind the mentor gate: audit on the direct local ports (no gate change), or add an audit-only path? The plan assumes direct ports.
4. linkedin-networking-tutor-coach-ensign, resume-ai-tutor-coach, career-mentor-powerapps: in scope or not?
