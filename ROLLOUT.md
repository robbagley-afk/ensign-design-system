# ECC Rollout Board

One row per app. Claim before work (owner + branch + status), update at every step, never take a row someone else holds. Status values: `todo`, `vendored`, `patch requested`, `patch applied`, `static pass`, `runtime pass`, `in review`, `ready for Rob`, `merged`, `blocked`.

Family = apps sharing a layout, so the first app in a family sets the pattern and the helper's Opus specialist writes that first patch.

| App repo | Family | Owner | Branch | Status | Helper conversation | PR | Notes |
|---|---|---|---|---|---|---|---|
| major-career-explorer-coach-ai (exemplar commit) | A | | ecc/exemplar | todo | | | FIRST: commit the Claude Design redesign (project 91725828, "Mentor explorer redesign request") to this repo so every agent can read the reference implementation. Needs the Claude Design files: import blocked 2026-09-25 (no design-login in Cowork) |
| ensign-career-fair-coach | A (messages/composer) | Claude + Helper | ecc/ensign-career-fair-coach | in review | https://m365.cloud.microsoft/chat/agent/T_f14842f5-33be-4845-fed9-3991fee2e5ea.da0360c5-0abe-406e-ad17-e735f454fc15/conversation/1831be62-58fc-45ab-bb25-9766404ebc60 | https://github.com/robbagley-afk/ensign-career-fair-coach/pull/2 | pilot. Static + runtime (index, admin) 0 FAIL at all 5 widths. admin.html/admin.css included. Fresh-chat helper review still to run. Lesson: helper scrape text ("Show more lines") corrupted CSS, blocks.py now strips it. |
| gemini-coaching-agent-starter | A | Claude + Helper | ecc/gemini-coaching-agent-starter | in review | https://m365.cloud.microsoft/chat/agent/T_f14842f5-33be-4845-fed9-3991fee2e5ea.da0360c5-0abe-406e-ad17-e735f454fc15/conversation/1c7a1dde-3265-494b-9353-1af9eee216c0 | https://github.com/robbagley-afk/gemini-coaching-agent-starter/pull/1 | Static + runtime 0 FAIL. Fresh-chat helper review done and fixes pushed. |
| major-career-explorer-coach-ai | A | Claude + Helper | ecc/major-career-explorer-coach-ai | in review | https://m365.cloud.microsoft/chat/agent/T_f14842f5-33be-4845-fed9-3991fee2e5ea.da0360c5-0abe-406e-ad17-e735f454fc15/conversation/8e10235b-68f3-4768-bbe3-89a01e3c30e3 | https://github.com/robbagley-afk/major-career-explorer-coach-ai/pull/2 | Static + runtime 0 FAIL (one 320px field-narrow WARN). Helper review done, fixes pushed. Removed @import ces-tokens from styles.css (it defeated compat). |
| internship-expert-coach-ai | B (sidebar + chat-history) | Claude + Helper | ecc/internship-expert-coach-ai | in review | https://m365.cloud.microsoft/chat/agent/T_f14842f5-33be-4845-fed9-3991fee2e5ea.da0360c5-0abe-406e-ad17-e735f454fc15/conversation/16e70ab9-d0b3-4cba-a4b9-2049b3b98368 | https://github.com/robbagley-afk/internship-expert-coach-ai/pull/2 | Static + runtime 0 FAIL. Helper review done (second run on lane 9227), dark-theme leftovers in feedback block fixed. |
| brewcoach-for-linkedin | C (messages-feed + input-box-wrapper) | Claude + Helper | ecc/brewcoach-for-linkedin | in review | https://m365.cloud.microsoft/chat/agent/T_f14842f5-33be-4845-fed9-3991fee2e5ea.da0360c5-0abe-406e-ad17-e735f454fc15/conversation/1564c3de-f8a1-4815-a665-222daab2db2d | https://github.com/robbagley-afk/brewcoach-for-linkedin/pull/4 | Static + runtime (index, admin) 0 FAIL. Helper review found bugs from my scripted emoji edits, fixed. Removed dead theme toggle. |
| resume-coach-ai | D (dark resume coach) | Claude + Helper | ecc/resume-coach-ai | in review | https://m365.cloud.microsoft/chat/agent/T_f14842f5-33be-4845-fed9-3991fee2e5ea.da0360c5-0abe-406e-ad17-e735f454fc15/conversation/bc702123-7ee8-407c-a7e1-656041538d57 | https://github.com/robbagley-afk/resume-coach-ai/pull/18 | Static + runtime (index, tutor) 0 FAIL at 320/375/768/1440/1920. Helper review answered: fixed --font-heading (Outfit unloaded), summary focus ring, error text token. Rejected print-hex, focus-shadow and .ecc-composer claims with evidence (PR comment). Open for Rob: session-tab close is a click-only span. Signed-in mentor views and Python tests not checked. Commit 197dd81. |
| resume-coach-llm | D | Claude cloud (2026-09-29) | ecc/resume-coach-llm | in review |  | https://github.com/robbagley-afk/resume-coach-llm/pull/1 | Static + runtime 0 FAIL in mode selection, resume options, dual intake, chat with feedback form. Not exercised: real replies, file attach, live LM Studio. Helper review 2026-09-29 verified (af08839): 5 fixed (F1,F2 active,F3,F5,F6), rest rejected with evidence (F2 visited, F7 shell restructure, F8 no public/static, F9 harmless; F4/F10 vendored, upstream only). Audits re-run 0 FAIL, 375/1440 viewed. Next: Rob merges. |
| ensign-connect-navigator | F (forms) | Claude dispatcher (iMac, gmail acct, Edge lane edge2) | ecc/ensign-connect-navigator | in progress (local branch, not pushed) | dispatch jobs cn-a 50786bb0, cn-b 40ca1c48, cn-c e58c579c |  | public/ + static/. Clone ~/Local-Infra/ui-audit/ensign-connect-navigator, branch ecc/ensign-connect-navigator, commits bd4b268 (vendor) and styles.css pass. Static audit 0 FAIL, 2 WARN emoji (18 emoji in index.html, use scripts/helper/ecc_emoji.py). Runtime FAIL left: 36 inline style font-size under 17px in index.html (not seen by static audit), 6 in ces-components.css, 9 step links 21px tall (need min-height 44px), 1 field with outline none. Next: fix inline sizes in index.html, then extract the link and field rules as blocks and run scripts/helper/dispatch.mjs, copy public to static, rerun both audits and screenshots, then PR. |
| ensign-student-readiness-hub | F | | | todo | | | static/ only. PeopleGrove data app: sample data only in screenshots |
| ai-agents-local-llm | mono | | | todo | | | In scope (Rob 2026-09-26). Plan first: sync app folders from standalone repos instead of patching stale copies. Academic Advisor and Interview Coach now split out to their own repos (below); migrate there, then sync back |
| ensign-academic-advisor | mono-split (A-like chat + admin) | Claude cloud (2026-09-29) | ecc/ensign-academic-advisor | in review |  | https://github.com/robbagley-afk/ensign-academic-advisor/pull/1 | index + admin. Static + runtime 0 FAIL in wizard, planner with chat, admin locked and unlocked. Gold/amber decoration removed, real warnings keep the warning tint. Not run: server.py, catalog fetch, admin login. |
| interview-coach-local-llm | mono-split | Claude cloud (2026-09-29) | ecc/interview-coach-local-llm | in review |  | https://github.com/robbagley-afk/interview-coach-local-llm/pull/1 | Static + runtime 0 FAIL at 5 widths (main and feedback views). style.css rewritten light. Not exercised: live model, mic, shared/safe_markdown.js (not in this repo). Helper review 2026-09-29 verified (e8e79eb): 4 fixed (F-01,02,06,07), 3 rejected with evidence (F-03 no disabled path; F-04/05 vendored files, upstream only). Audits re-run 0 FAIL, 375/1440 viewed. Next: Rob merges. |
| career-services-tools | pages | Claude cloud (2026-09-29) | ecc/career-services-tools | in review |  | https://github.com/robbagley-afk/career-services-tools/pull/9 | Four link pages. Static + runtime 0 FAIL on all four. Private vars alias ECC tokens. No public/static copy in this repo. Helper review 2026-09-29 verified (bf7dc8e): 2 fixed (F4 pressed state, F6 projects.html note), rest rejected with evidence (F1 plain labels allowed, F5 valid CSS, F7 1.08rem above floor; F2/F3 vendored, upstream only). Audits re-run 0 FAIL, 375/1440 viewed. Next: Rob merges. |
| transcription-meeting-summary | G (Tailwind dark) | Claude cloud (2026-09-29) | ecc/transcription-meeting-summary | in review |  | https://github.com/robbagley-afk/transcription-meeting-summary/pull/1 | Tailwind CDN replaced by compiled tailwind.css (rebuild command in tailwind.config.js). Static 0 FAIL, runtime 0 FAIL in Studio, Results, Voiceprints, History, Enroll modal, progress card. Pre-existing bug on main: escapeHtml() is never defined (results, voiceprints and history throw). Not fixed, asked Rob. Next: review, Rob decides on escapeHtml follow-up. Helper review 2026-09-29 verified (ffcb988): F1,F2(aria-current),F4,F5 fixed, F3 rejected (global focus-visible rule wins), plus 375px pill-wrap fix. Audits 0 FAIL, shots viewed. Next: Rob merges. |

## Superseded work

Branch `ui-ux-alignment-2026-09-25` exists locally (never pushed) in 10 clones under `~/Local-Infra/ui-audit`. It used the retired v1.2 numbers (16px text, 1180px cap). Do not push it. Delete it after each app's `ecc/` branch merges.

## Latest audit

2026-09-25 baseline, before any migration (`audits/static-2026-09-25-baseline.json`):

```
ensign-career-fair-coach: 128 FAIL  8 WARN  2 INFO
gemini-coaching-agent-starter: 74 FAIL  10 WARN  2 INFO
major-career-explorer-coach-ai: 126 FAIL  16 WARN  2 INFO
internship-expert-coach-ai: 60 FAIL  3 WARN  0 INFO
brewcoach-for-linkedin: 79 FAIL  17 WARN  0 INFO
resume-coach-ai: 218 FAIL  24 WARN  0 INFO
resume-coach-llm: 43 FAIL  9 WARN  0 INFO
ensign-connect-navigator: 54 FAIL  6 WARN  0 INFO
ensign-student-readiness-hub: 49 FAIL  3 WARN  0 INFO
career-services-tools: 48 FAIL  7 WARN  0 INFO
```

Most FAILs are text under 17px. Every app also fails `ds-missing` and `tokens-not-linked` until vendored.
