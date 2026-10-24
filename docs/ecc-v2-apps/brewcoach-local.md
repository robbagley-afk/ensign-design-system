# brewcoach-local: ECC v2 matrix and runbook

Family: C-like chat plus admin. Generated 2026-10-23 from the GitHub default branch and a read of the Mac Studio over SSH. Re-check before each phase: lines marked "candidate" came from a pattern scan and need a human or browser to confirm.

## Hosts

- Vercel production: its Vercel project returns 500 (open question, not part of this rollout)
- Mac Studio: `~/CCowork-Local-Apps/BrewCoach for Linkedin` (origin brewcoach-local) on `main` (one uncommitted file), port 8000, open suite route `https://mac-studio-2.tail299fc7.ts.net/linkedin/`, `com.rob.brewcoach` (uvicorn `app.main:app`). Restart: `launchctl kickstart -k gui/$(id -u)/com.rob.brewcoach`.

## Web dirs that vendor ECC

`app/static`

## Pages

| HTML file |
|---|
| `app/static/admin.html` |
| `app/static/index.html` |

## Server routes (decorators)

- `/favicon.ico  (app/main.py:49)`
- `/  (app/main.py:56)`
- `/api/chat/stream  (app/main.py:63)`
- `/api/profile  (app/main.py:81)`
- `/api/profile  (app/main.py:88)`
- `/api/profile/export  (app/main.py:102)`
- `/api/ingest/url  (app/main.py:116)`
- `/api/ingest/pdf  (app/main.py:142)`
- `/api/feedback  (app/main.py:209)`
- `/api/feedback/stats  (app/main.py:227)`
- `/api/feedback/pending  (app/main.py:233)`
- `/admin  (app/main.py:326)`
- `/admin/  (app/main.py:327)`
- `/api/admin/login  (app/main.py:334)`
- `/api/admin/logout  (app/main.py:358)`
- `/api/admin/status  (app/main.py:366)`
- `/api/admin/summary  (app/main.py:377)`
- `/api/admin/sources  (app/main.py:384)`
- `/api/admin/feedback  (app/main.py:391)`
- `/api/admin/feedback/{feedback_id}/approve  (app/main.py:398)`
- `/api/admin/feedback/{feedback_id}/reject  (app/main.py:416)`
- `/api/admin/faqs  (app/main.py:426)`
- `/api/admin/faqs/{faq_id}/toggle  (app/main.py:433)`
- `/api/admin/change-password  (app/main.py:453)`
- `/api/health  (app/main.py:464)`

## AI and upload calls

- fetch: `/api/admin/change-password`, `/api/admin/faqs`, `/api/admin/faqs/${id}`, `/api/admin/faqs/${id}/toggle`, `/api/admin/feedback`, `/api/admin/feedback/${id}/approve`, `/api/admin/feedback/${id}/reject`, `/api/admin/feedback?status=pending`, `/api/admin/login`, `/api/admin/logout`, `/api/admin/sources`, `/api/admin/status`, `/api/admin/summary`, `/api/chat/stream`, `/api/feedback`, `/api/feedback/stats`, `/api/health`, `/api/ingest/pdf`, `/api/profile`, `/api/profile/export?user_id=${encodeURIComponent(currentUserId)}`
- Streams `text/event-stream` at: `app/main.py:78`. The client must read SSE and JSON.

## States to set up for the runtime audit (candidate)

Each needs a `--setup` script with fictional data before the audit can see it.

- app/static/admin.html: admin-container
- app/static/admin.html: admin-nav-tabs
- app/static/admin.html: dashboardView
- app/static/admin.html: login-error
- app/static/admin.html: loginView
- app/static/admin.html: reviews-list
- app/static/admin.html: tab-content
- app/static/admin.html: tab-content active
- app/static/admin.html: tab-header
- app/static/admin.html: table-container
- app/static/index.html: drawer-actions
- app/static/index.html: drawer-body
- app/static/index.html: drawer-header
- app/static/index.html: ingest-tab-view
- app/static/index.html: ingest-tab-view active
- app/static/index.html: ingest-tabs
- app/static/index.html: modal-actions
- app/static/index.html: modal-card
- app/static/index.html: modal-header
- app/static/index.html: modal-icon
- app/static/index.html: modal-overlay
- app/static/index.html: source-panel
- app/static/index.html: traceDrawer
- app/static/index.html: workbenchDrawer

## Baseline (fill before any edit)

| Host | Route | Static | Runtime 5 widths | Upload-to-reply | HTTP |
|---|---|---|---|---|---|
| | | | | | |

## Rollback

- Record the deployed commit before the change (Vercel deployment SHA, or `git -C <checkout> rev-parse HEAD` on the Studio).
- Vercel: promote the previous production deployment. Studio: `git -C <checkout> checkout <recorded sha>` on the served branch, then the restart above.
- Trigger: a live check that passed at baseline fails after the change.
