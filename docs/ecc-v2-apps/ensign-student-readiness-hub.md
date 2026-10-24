# ensign-student-readiness-hub: ECC v2 matrix and runbook

Family: F forms. Generated 2026-10-23 from the GitHub default branch and a read of the Mac Studio over SSH. Re-check before each phase: lines marked "candidate" came from a pattern scan and need a human or browser to confirm.

## Hosts

- Mac Studio: `~/CCowork-Local-Apps/ensign-student-readiness-hub` on `main` (one uncommitted file on 2026-10-23), port 5055, gated suite route `https://mac-studio-2.tail299fc7.ts.net/readiness/`, restarted by `start_all_agents.sh` under `com.rob.local-ai-agent-suite`. Kickstarting that label restarts every app it manages: find or add a single-app restart before using it.

## Web dirs that vendor ECC

`static`

## Pages

| HTML file |
|---|
| `static/index.html` |

## AI and upload calls

- fetch: `/api/admin/import-latest`, `/api/lookup`, `/api/pathwayu/login`, `/api/pathwayu/session`, `/api/sources`
- No `text/event-stream` in server code: JSON replies.

## States to set up for the runtime audit (candidate)

Each needs a `--setup` script with fictional data before the audit can see it.

- static/index.html: panel activity-panel
- static/index.html: panel results
- static/index.html: panel source-panel
- static/index.html: result-detail
- static/index.html: result-row
- static/index.html: result-source
- static/index.html: result-state neutral
- static/index.html: result-state-value
- static/index.html: results-header
- static/index.html: table-wrap
- static/index.html: view
- static/index.html: view active
- static/index.html: vmock-mock-interview-data-status

## Baseline (fill before any edit)

| Host | Route | Static | Runtime 5 widths | Upload-to-reply | HTTP |
|---|---|---|---|---|---|
| | | | | | |

## Rollback

- Record the deployed commit before the change (Vercel deployment SHA, or `git -C <checkout> rev-parse HEAD` on the Studio).
- Vercel: promote the previous production deployment. Studio: `git -C <checkout> checkout <recorded sha>` on the served branch, then the restart above.
- Trigger: a live check that passed at baseline fails after the change.
