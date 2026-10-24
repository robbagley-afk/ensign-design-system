# ECC v2 rollout plan

Status: draft for Rob's approval. Written 2026-10-23 on robs-imac-9. Reviewed by Codex (iMac, read-only) the same day. All 14 findings were verified against the repo and folded in.

ECC v2 (PR #30, skill v3.1.0) is live in one app, ENS 101 Guide. This plan brings the other Career Services apps to v2 without breaking any of them. Nothing here starts until Rob approves the plan, and Rob merges every PR.

## Starting conditions

- ai-agents-local-llm PR 17 (ECC v2 mentor login page): pending. It counts as met only with the merge commit plus a live readback on the Mac Studio public URL. That page is the first screen mentors see before every gated app.
- This plan approved, with the open questions at the end answered.
- A reviewed design-system release, named by its full 40-character SHA (Phase 0 sets it). Every app PR vendors and pins that one SHA.

## What changes in an app

Re-vendoring the four ECC files changes three things in an app that reads the ECC tokens:

| Change | v1 | v2 | Risk |
|---|---|---|---|
| `--text-body` | 19px | 20px | Wrapping and overflow in dense chat and admin screens at 320 and 375 |
| `--surface-sunken` page color | #f8fafc | #F3F6F4 | Custom tints on the page lose contrast. Recheck private color pairs |
| New tokens and classes | none | 22 tokens, v2 classes in `ecc-app.css` | None until markup opts in |

An app that copied a token value instead of reading it does not change. Example: transcription-meeting-summary's `tailwind.config.js` hardcodes `base: ['19px', '1.6']` and `sunken: '#f8fafc'`. Phase 1 fixes those copies. Phase 1 brings the existing look up to the v2 tokens. Phase 2 adds the new v2 components (`.ecc-hdr-band`, `.ecc-btn--lg`, `.ecc-callout`, `.ecc-feature-card`, `.ecc-stepper` and the rest), which apply only where markup opts in.

## Inventory (GitHub HEAD, 2026-10-23)

Host is Vercel where the repo has `vercel.json`. Suite routes come from `UPSTREAMS` in ai-agents-local-llm `public_suite_server.py`. Phase 0 confirms the served folder for each suite route on the Mac Studio.

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
| brewcoach-local | C-like chat plus admin | 1 | local (its Vercel project returns 500) | yes | no |
| resume-coach-ai | D resume coach | 2 | Vercel, suite route `/mentor-resume/` (gated) | yes | no |
| resume-coach-llm | D | 1 | local | yes | no |
| interview-coach-local-llm | mono-split | 1 | local | yes | no |
| transcription-meeting-summary | G Tailwind | 2 | local | yes | no |
| career-services-tools | pages | 1 | GitHub Pages | yes | no |

Out of scope:
- ai-agents-local-llm suite dashboards. The suite-restructure row in `ROLLOUT.md` holds them (581 FAIL on main, 7-PR plan). PR 17 covers only the mentor login page.
- your-portable-ai-team keeps its own branding (Rob, 2026-10-22).
- linkedin-networking-tutor-coach-ensign, resume-ai-tutor-coach and career-mentor-powerapps have no vendored ECC web UI on GitHub. Confirm before deciding. Power Apps screens need their own plan.
- Non-Ensign repos.

## Phase 0: design-system prep (this repo, one or two PRs)

1. **Release invariant.** CI passes only when both refs in `.github/workflows/ecc-audit.yml` (`uses: ...@<sha>` and `design-system-ref`) and all four vendored CSS files match the same release. Design-system main moving ahead does not break a pinned app. A mismatch in either direction does.
2. **`scripts/v2_revendor.sh <app-repo> <full-sha>`.** It refuses an abbreviated SHA (the reusable workflow does too), makes a clean temporary checkout of this repo at that SHA, vendors from it into every web dir, checks all four sha256 hashes against that checkout, moves both workflow refs, and keeps the caller's `audit-path`. Then it runs the static audit from the same checkout. `vendor_into_app.sh` copies its own working tree, so it cannot do this alone.
3. **Chat composer variant.** `textarea.ecc-field--lg` has a 210px minimum height, and `.ecc-composer textarea` overrides the modifier's size. Add a dedicated v2 composer rule (56px start height, bounded growth, 21px typed text) with a clear cascade order, and prove its computed size and reachability at 375 and 1440.
4. **Light sidebar nav variant.** `.ecc-nav-link` is built for the dark header band: pale text and white hover on a dark background. On the white `.ecc-sidebar` it would be unreadable. Add a light variant, or pick a dark sidebar, before the family B pilot.
5. **v2 runtime assertions.** The runtime audit accepts 44px controls and 17px text, reports 3:1 to 4.5:1 text as WARN, and does not measure control boundaries. Add a `--v2` mode that FAILs when: body text is under 20px, primary buttons and fields are under 56px, nav and chip targets are under 48px, text contrast is under 4.5:1, or control boundary and focus ring contrast is under 3:1. It should also check hover, focus-visible, disabled and current states on a sample of controls.
6. **v2 chat reference fixture** `scripts/fixtures/chat-screen-v2.html`, fictional data: header band over a chat shell, the new composer, `.ecc-btn--lg` send, AI button role, danger callout. It passes both audits, including `--v2`, at five widths.
7. **`docs/ecc-v2-migration.md`.** The markup swaps for each v2 pattern, the token moves, the hardcoded-copy hunt (Tailwind configs, private `--*` aliases with literal 19px or #f8fafc), and the overflow checks. Helper and Codex prompts point at this file.
8. **Per-app matrix** `docs/ecc-v2-apps/<app>.md`, one file per app:
   - Routes and states to audit, each with a repeatable fictional setup script. Examples: all four career-services-tools pages, resume-coach-ai index and tutor, Transcriber Studio, Results, Voiceprints, History, Enroll modal and progress card. Include landing and intake wheel tests, not only the feed.
   - Hosts and the upload-to-reply check for each.
   - Deploy runbook: served checkout path, served directory, launch mechanism (LaunchAgent, restart helper or none), restart command, and the names (never values) of environment variables it needs. ENS 101 has no LaunchAgent and restarts through `ens101_restart`, so runbooks are per app.
   - Rollback: last deployed commit and the exact rollback command.
9. Merge Phase 0. Its merge commit becomes the release SHA. Install skill v3.1.0 where workers run (this iMac still has v3.0.0, with 19px guidance). Every worker reads the skill and migration guide from that SHA and records it in its handoff.

## Phase 1: bring each app to the v2 tokens (14 PRs)

One PR per app, branch `ecc/<app>-v2-revendor`, claimed in `ROLLOUT.md` first.

Per app:
1. **Baseline first, before any edit.** Run the matrix routes on every host: both audits, upload-to-reply, live status codes. Record what already fails (brewcoach-local's Vercel 500 is not verified as pre-existing, for example). A host that cannot be reached is marked blocked with a reason, and the PR says so instead of claiming every-host done.
2. `scripts/v2_revendor.sh <app> <release-sha>`. public/ and static/ stay byte-identical.
3. Fix hardcoded copies of the old values (Tailwind config, private aliases) and rebuild generated CSS. Check computed body size and page color in the browser rather than assuming the tokens flowed through.
4. Fix only what 20px text or the new page color broke, using tokens. No new components in this phase.
5. Static audit 0 FAIL. Runtime audit 0 FAIL at 320, 375, 768, 1440 and 1920 on every matrix route and state. Text-contrast WARNs get fixed, not just answered.
6. Screenshots at 375 and 1440 viewed. Wheel test on landing, intake and feed.
7. Upload-to-reply on every host, compared with the baseline.
8. Codex on the iMac reviews the diff read-only. Each finding is checked against the code before acting.

## Phase 2: v2 components by family

The first app in each family is the pilot. Coding Helper reviews the pilot first, then Codex. The rest of the family copies the pilot's diff shape, and Codex alone reviews them. Every Phase 2 PR must pass the runtime audit's `--v2` mode as well.

| Family | Pilot | v2 changes |
|---|---|---|
| F forms | ensign-connect-navigator | Header band, stepper and step layout where the app has steps, `.ecc-task` rows, `.ecc-callout` alerts, 56px controls. Closest to ENS 101 |
| A chat | ensign-career-fair-coach | Header band, Phase 0 composer, `.ecc-btn--lg` send, AI button role on "Ask" actions, callouts for errors, feature card for upload or intake |
| B sidebar chat | internship-expert-coach-ai | Family A changes plus the Phase 0 light sidebar nav variant |
| C chat | brewcoach-for-linkedin | Family A changes. SSE and JSON parsing untouched |
| D resume coach | resume-coach-ai | Family A changes plus the document-bar upload as a feature card |
| pages | career-services-tools | Header band and `.ecc-btn--lg` links |
| G and mono-split | after the A pilot | Family A changes. Tailwind maps to tokens, not hex |

## Waves, gates and rollback

- Wave 1: career-services-tools, ensign-student-readiness-hub, ensign-connect-navigator (forms and pages, no chat feed). Wave 2: family A, then B, C and D. Wave 3: interview-coach-local-llm, transcription-meeting-summary.
- Inside a wave, the first app goes alone: merge, deploy and live acceptance. The rest of the wave starts only after that passes. After that, at most 4 apps at once, one session per app, one writer per repo.
- **Pause the wave** on any failed CI, deploy, upload-to-reply or live interaction check. Diagnose on the failing app before another app merges.
- **Rollback** uses the runbook's recorded last good commit and command. Trigger: a live check that passed at baseline now fails.
- Phase 1 Waves 2 and 3 are good Codex or Antigravity handoffs once Wave 1 sets the pattern. Each handoff names the release SHA, the app matrix file and the runbook.

## Deploy and live readback

For every deploy:
- Confirm the deployed app commit (Vercel deployment SHA, the Mac Studio checkout `git rev-parse HEAD`, or the Pages build SHA).
- Fetch all four ECC stylesheets and every changed HTML or compiled asset from the live host. Each must return 200 with the right content type before its sha256 counts. A redirect or login page is not evidence.
- Run the runtime audit on the live host, `--v2` from Phase 2 on.
- Gated suite apps: run the audits on the direct local port on the Mac Studio. Then, in a session where Rob has signed in through the mentor login, open the public route and check assets, upload-to-reply and SSE through the gateway, which rewrites URLs and streams separately. Separately confirm that a request without the cookie still gets 302 to the login page (or 401 JSON for API paths). No audit-only bypass of the gate.
- Mac Studio restarts follow each app's runbook and never print environment values.
- Update the app's `ROLLOUT.md` row with merge commit, deploy evidence, audit results and any blocked host.

## Roles

| Who | Does |
|---|---|
| Claude (iMac) | Phase 0, the first app of each wave, every family pilot, live readback |
| Codex (iMac) | Read-only review of every PR and of Phase 0. Phase 1 Waves 2 and 3 by handoff |
| Rob's Coding Helper | Review of Phase 0 and each family pilot, before Codex |
| Rob | Approves this plan, merges every PR, signs in for gated live checks, answers the open questions |

## Risks

- 20px text overflows dense chat and admin screens at 320. The runtime audit catches overflow. Fix with tokens, never by lowering the size.
- Hardcoded copies of v1 values pass both audits while staying on v1. Phase 1 step 3 checks computed values.
- Shared CSS regressions spread across apps. The one-app-first gate and wave pause contain them.
- The 22 v2 tokens are `rob-decision` overrides until Claude Design adopts them. If Claude Design picks different values, Phase 1 reruns with a new release SHA. The wrapper keeps that cheap.

## Open questions for Rob

1. Phase 0 is now substantial (wrapper, composer, sidebar nav, `--v2` audit mode, matrices). Run it before any app, or start Wave 1 Phase 1 on the current release while Phase 0 is built?
2. Phase 2 for student-facing apps too, or mentor and staff screens first? The v2 brief came from senior mentors on desktop monitors.
3. linkedin-networking-tutor-coach-ensign, resume-ai-tutor-coach, career-mentor-powerapps: in scope or not?
4. Sidebar for family B: light nav variant, or a dark sidebar that matches the header band?
