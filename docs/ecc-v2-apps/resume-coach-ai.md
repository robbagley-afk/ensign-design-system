# resume-coach-ai: ECC v2 matrix and runbook

Family: D resume coach (pilot). Generated 2026-10-23 from the GitHub default branch and a read of the Mac Studio over SSH. Re-check before each phase: lines marked "candidate" came from a pattern scan and need a human or browser to confirm.

## Hosts

- Vercel production: https://resume-coach-ai-ten.vercel.app
- Mac Studio: `~/CCowork-Local-Apps/mentor-resume-coach-ai` on branch `live/origin-main-20261002`, port 5012, gated suite route `https://mac-studio-2.tail299fc7.ts.net/mentor-resume/`, restarted by `start_all_agents.sh` under `com.rob.local-ai-agent-suite`. Kickstarting that label restarts every app it manages: find or add a single-app restart before using it. Decide whether the Studio moves to `main` or the change is cherry-picked.

## Web dirs that vendor ECC

`public`, `static`

## Pages

| HTML file |
|---|
| `public/index.html` |
| `public/tutor.html` |
| `static/index.html` |
| `static/tutor.html` |

## AI and upload calls

- fetch: `/api/chat`, `/api/mentor/session-notes`, `/api/mentor/vmock/lookup?q=${encodeURIComponent(q)}`, `/api/mentor/vmock/resume?email=${encodeURIComponent(cur.student.email)}`, `/api/tutor/analyze`, `/api/upload`
- Streams `text/event-stream` at: `api/index.py:526`, `api/index.py:548`. The client must read SSE and JSON.

## States to set up for the runtime audit (candidate)

Each needs a `--setup` script with fictional data before the audit can see it.

- public/index.html: intake-panel
- public/index.html: intake-panel-header
- public/index.html: mentor-auth-dialog
- public/index.html: mentor-auth-error
- public/index.html: mentor-auth-modal
- public/index.html: modal-content email-modal-content
- public/index.html: modal-content print-modal-content
- public/index.html: modal-header
- public/index.html: modal-header-actions
- public/index.html: modal-overlay hidden
- public/index.html: printable-sheet
- public/index.html: session-tabs-list
- public/index.html: session-tabs-strip
- public/index.html: view-chat
- public/index.html: view-resume-tracks
- public/index.html: view-targeted-intake
- public/tutor.html: glossary-panel
- public/tutor.html: resume-review-screen
- public/tutor.html: targeting-results
- static/index.html: intake-panel
- static/index.html: intake-panel-header
- static/index.html: mentor-auth-dialog
- static/index.html: mentor-auth-error
- static/index.html: mentor-auth-modal
- static/index.html: modal-content email-modal-content

## Baseline (fill before any edit)

| Host | Route | Static | Runtime 5 widths | Upload-to-reply | HTTP |
|---|---|---|---|---|---|
| | | | | | |

## Rollback

- Record the deployed commit before the change (Vercel deployment SHA, or `git -C <checkout> rev-parse HEAD` on the Studio).
- Vercel: promote the previous production deployment. Studio: `git -C <checkout> checkout <recorded sha>` on the served branch, then the restart above.
- Trigger: a live check that passed at baseline fails after the change.
