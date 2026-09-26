# ECC Rollout Board

One row per app. Claim before work (owner + branch + status), update at every step, never take a row someone else holds. Status values: `todo`, `vendored`, `patch requested`, `patch applied`, `static pass`, `runtime pass`, `in review`, `ready for Rob`, `merged`, `blocked`.

Family = apps sharing a layout, so the first app in a family sets the pattern and the helper's Opus specialist writes that first patch.

| App repo | Family | Owner | Branch | Status | Helper conversation | PR | Notes |
|---|---|---|---|---|---|---|---|
| ensign-career-fair-coach | A (messages/composer) | | ecc/ensign-career-fair-coach | todo | | | pilot app. public/ + static/ |
| gemini-coaching-agent-starter | A | | | todo | | | public/ + static/ |
| major-career-explorer-coach-ai | A | | | todo | | | public/ + static/. Has dark tokens in styles.css |
| internship-expert-coach-ai | B (sidebar + chat-history) | | | todo | | | |
| brewcoach-for-linkedin | C (messages-feed + input-box-wrapper) | | | todo | | | index.html loads CSS from /static/ |
| resume-coach-ai | D (dark resume coach) | | | todo | | | full dark theme to convert. public/ + static/. tutor.html too |
| resume-coach-llm | D | | | todo | | | full dark theme to convert |
| ensign-connect-navigator | F (forms) | | | todo | | | public/ + static/ |
| ensign-student-readiness-hub | F | | | todo | | | static/ only. PeopleGrove data app: sample data only in screenshots |
| ai-agents-local-llm | mono | | | todo | | | Plan first: sync app folders from standalone repos instead of patching stale copies. Ensign Academic Advisor and Interview Coach have no standalone repo |
| career-services-tools | pages | | | todo | | | no chat. Link pages only |
| transcription-meeting-summary | out of scope? | | | todo | | | Tailwind dark UI, personal tool. Rob to decide |

## Superseded work

Branch `ui-ux-alignment-2026-09-25` exists locally (never pushed) in 10 clones under `~/Local-Infra/ui-audit`. It used the retired v1.2 numbers (16px text, 1180px cap). Do not push it. Delete it after each app's `ecc/` branch merges.

## Latest audit

(Antigravity or Claude pastes the `ecc_audit_static.py` summary here with the date.)
