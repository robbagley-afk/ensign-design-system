# ensign-career-fair-coach: ECC v2 matrix and runbook

Family: A chat (pilot). Generated 2026-10-23 from the GitHub default branch and a read of the Mac Studio over SSH. Re-check before each phase: lines marked "candidate" came from a pattern scan and need a human or browser to confirm.

## Hosts

- Vercel production: https://ensign-career-fair-coach.vercel.app
- Mac Studio: suite route `/career-fair/` (port 5040, `com.rob.corey-career-fair-coach`) serves an embedded copy inside the ai-agents-local-llm checkout. The suite-restructure plan owns that copy. This rollout does not edit or restart it.

## Web dirs that vendor ECC

`public`, `static`

## Pages

| HTML file |
|---|
| `public/admin.html` |
| `public/index.html` |
| `static/admin.html` |
| `static/index.html` |

## AI and upload calls

- fetch: `api/admin/login`, `api/chat`, `api/feedback`, `api/transcribe`
- No `text/event-stream` in server code: JSON replies.

## States to set up for the runtime audit (candidate)

Each needs a `--setup` script with fictional data before the audit can see it.

- public/admin.html: admin-login
- public/admin.html: admin-nav
- public/admin.html: admin-state
- public/admin.html: admin-toolbar
- public/admin.html: admin-toolbar-actions
- public/admin.html: admin-workspace
- public/admin.html: review-list
- public/admin.html: review-section
- public/index.html: coach-panel
- public/index.html: voice-panel-header
- public/index.html: voice-panel-title-row
- public/index.html: voice-practice-panel
- static/admin.html: admin-login
- static/admin.html: admin-nav
- static/admin.html: admin-state
- static/admin.html: admin-toolbar
- static/admin.html: admin-toolbar-actions
- static/admin.html: admin-workspace
- static/admin.html: review-list
- static/admin.html: review-section
- static/index.html: coach-panel
- static/index.html: voice-panel-header
- static/index.html: voice-panel-title-row
- static/index.html: voice-practice-panel

## Baseline (fill before any edit)

| Host | Route | Static | Runtime 5 widths | Upload-to-reply | HTTP |
|---|---|---|---|---|---|
| | | | | | |

## Rollback

- Record the deployed commit before the change (Vercel deployment SHA, or `git -C <checkout> rev-parse HEAD` on the Studio).
- Vercel: promote the previous production deployment. Studio: `git -C <checkout> checkout <recorded sha>` on the served branch, then the restart above.
- Trigger: a live check that passed at baseline fails after the change.
