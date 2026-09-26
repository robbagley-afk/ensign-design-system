# ECC Rollout Board

One row per app. Claim before work (owner + branch + status), update at every step, never take a row someone else holds. Status values: `todo`, `vendored`, `patch requested`, `patch applied`, `static pass`, `runtime pass`, `in review`, `ready for Rob`, `merged`, `blocked`.

Family = apps sharing a layout, so the first app in a family sets the pattern and the helper's Opus specialist writes that first patch.

| App repo | Family | Owner | Branch | Status | Helper conversation | PR | Notes |
|---|---|---|---|---|---|---|---|
| major-career-explorer-coach-ai (exemplar commit) | A | | ecc/exemplar | todo | | | FIRST: commit the Claude Design redesign (project 91725828, "Mentor explorer redesign request") to this repo so every agent can read the reference implementation. Needs the Claude Design files: import blocked 2026-09-25 (no design-login in Cowork) |
| ensign-career-fair-coach | A (messages/composer) | Claude + Helper | ecc/ensign-career-fair-coach | in review | https://m365.cloud.microsoft/chat/agent/T_f14842f5-33be-4845-fed9-3991fee2e5ea.da0360c5-0abe-406e-ad17-e735f454fc15/conversation/1831be62-58fc-45ab-bb25-9766404ebc60 | https://github.com/robbagley-afk/ensign-career-fair-coach/pull/2 | pilot. Static + runtime (index, admin) 0 FAIL at all 5 widths. admin.html/admin.css included. Fresh-chat helper review still to run. Lesson: helper scrape text ("Show more lines") corrupted CSS, blocks.py now strips it. |
| gemini-coaching-agent-starter | A | | | todo | | | public/ + static/ |
| major-career-explorer-coach-ai | A | | | todo | | | public/ + static/. Has dark tokens in styles.css |
| internship-expert-coach-ai | B (sidebar + chat-history) | | | todo | | | |
| brewcoach-for-linkedin | C (messages-feed + input-box-wrapper) | | | todo | | | index.html loads CSS from /static/ |
| resume-coach-ai | D (dark resume coach) | | | todo | | | full dark theme to convert. public/ + static/. tutor.html too |
| resume-coach-llm | D | | | todo | | | full dark theme to convert |
| ensign-connect-navigator | F (forms) | Claude dispatcher (iMac, gmail acct, Edge lane edge2) | ecc/ensign-connect-navigator | in progress |  |  | public/ + static/. Claimed 2026-09-26 13:05 MDT: first real run of scripts/helper/dispatch.mjs (parallel helper batches). Stops at audited branch, PR by Rob or rollout thread. |
| ensign-student-readiness-hub | F | | | todo | | | static/ only. PeopleGrove data app: sample data only in screenshots |
| ai-agents-local-llm | mono | | | todo | | | In scope (Rob 2026-09-26). Plan first: sync app folders from standalone repos instead of patching stale copies. Academic Advisor and Interview Coach now split out to their own repos (below); migrate there, then sync back |
| ensign-academic-advisor | mono-split (A-like chat + admin) | | | todo | | | NEW repo 2026-09-26, subtree split of ai-agents-local-llm/Ensign Academic Advisor (10 commits). Identical to OneDrive copy. index.html + admin.html |
| interview-coach-local-llm | mono-split | | | todo | | | NEW repo 2026-09-26, subtree split of ai-agents-local-llm/Interview Coach LOCAL LLM (9 commits). GitHub copy newer than OneDrive (CES files added 2026-09-24). Mac Studio live copy not checked: SSH timed out |
| career-services-tools | pages | | | todo | | | no chat. Link pages only |
| transcription-meeting-summary | G (Tailwind dark) | | | todo | | | IN SCOPE (Rob 2026-09-26). Tailwind dark UI to convert |

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
