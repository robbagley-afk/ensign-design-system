# brewcoach-for-linkedin: ECC v2 matrix and runbook

Family: C chat (pilot). Generated 2026-10-23 from the GitHub default branch and a read of the Mac Studio over SSH. Re-check before each phase: lines marked "candidate" came from a pattern scan and need a human or browser to confirm.

## Hosts

- Vercel production: https://brewcoach-for-linkedin.vercel.app
- Mac Studio: not served on the Mac Studio. The suite `/linkedin/` route serves brewcoach-local.

## Web dirs that vendor ECC

`public`

## Pages

| HTML file |
|---|
| `public/admin.html` |
| `public/index.html` |

## AI and upload calls

- fetch: `/api/admin/change-password`, `/api/admin/faqs`, `/api/admin/faqs/${id}`, `/api/admin/faqs/${id}/toggle`, `/api/admin/feedback`, `/api/admin/feedback/${id}/approve`, `/api/admin/feedback/${id}/reject`, `/api/admin/feedback?status=pending`, `/api/admin/login`, `/api/admin/logout`, `/api/admin/sources`, `/api/admin/status`, `/api/admin/summary`, `/api/chat/stream`, `/api/feedback`, `/api/feedback/stats`, `/api/health`, `/api/ingest/pdf`, `/api/profile`, `/api/profile/export?user_id=${encodeURIComponent(currentUserId)}`
- Streams `text/event-stream` at: `api/index.py:350`. The client must read SSE and JSON.

## States to set up for the runtime audit (candidate)

Each needs a `--setup` script with fictional data before the audit can see it.

- public/admin.html: admin-container
- public/admin.html: admin-nav-tabs
- public/admin.html: dashboardView
- public/admin.html: login-error
- public/admin.html: loginView
- public/admin.html: reviews-list
- public/admin.html: tab-content
- public/admin.html: tab-content active
- public/admin.html: tab-header
- public/admin.html: table-container
- public/index.html: drawer-actions
- public/index.html: drawer-body
- public/index.html: drawer-header
- public/index.html: ingest-tab-view
- public/index.html: ingest-tab-view active
- public/index.html: ingest-tabs
- public/index.html: modal-actions
- public/index.html: modal-card
- public/index.html: modal-header
- public/index.html: modal-icon
- public/index.html: modal-overlay
- public/index.html: source-panel
- public/index.html: traceDrawer
- public/index.html: workbenchDrawer

## Baseline (fill before any edit)

| Host | Route | Static | Runtime 5 widths | Upload-to-reply | HTTP |
|---|---|---|---|---|---|
| | | | | | |

## Rollback

- Record the deployed commit before the change (Vercel deployment SHA, or `git -C <checkout> rev-parse HEAD` on the Studio).
- Vercel: promote the previous production deployment. Studio: `git -C <checkout> checkout <recorded sha>` on the served branch, then the restart above.
- Trigger: a live check that passed at baseline fails after the change.
