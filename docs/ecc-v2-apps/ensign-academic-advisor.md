# ensign-academic-advisor: ECC v2 matrix and runbook

Family: A-like chat plus admin. Generated 2026-10-23 from the GitHub default branch and a read of the Mac Studio over SSH. Re-check before each phase: lines marked "candidate" came from a pattern scan and need a human or browser to confirm.

## Hosts

- Mac Studio: suite route `/advisor/` (port 5030) serves an embedded copy inside the ai-agents-local-llm checkout. The suite-restructure plan owns that copy. This rollout does not edit or restart it. The standalone repo has no deployed host, so its PRs are verified locally only.

## Web dirs that vendor ECC

`.`

## Pages

| HTML file |
|---|
| `admin.html` |
| `index.html` |

## Server routes (decorators)

- `/  (server.py:691)`
- `/favicon.ico  (server.py:696)`
- `/admin  (server.py:708)`
- `/admin/  (server.py:713)`
- `/api/status  (server.py:718)`
- `/api/chat  (server.py:737)`
- `/api/feedback  (server.py:771)`
- `/api/admin/login  (server.py:829)`
- `/api/admin/password  (server.py:846)`
- `/api/admin/summary  (server.py:869)`
- `/api/admin/feedback  (server.py:877)`
- `/api/admin/faqs  (server.py:892)`
- `/api/admin/sources  (server.py:900)`
- `/api/admin/feedback/<int:feedback_id>/approve  (server.py:910)`
- `/api/admin/feedback/<int:feedback_id>/reject  (server.py:941)`
- `/api/admin/faqs/<int:faq_id>/deactivate  (server.py:955)`
- `/<path:path>  (server.py:973)`

## AI and upload calls

- fetch: `api/admin/login`, `api/chat`, `api/status`
- No `text/event-stream` in server code: JSON replies.

## States to set up for the runtime audit (candidate)

Each needs a `--setup` script with fictional data before the audit can see it.

- admin.html: admin-auth-status
- admin.html: admin-credential-fields
- admin.html: admin-header-brand
- admin.html: admin-login-card
- admin.html: admin-login-row
- admin.html: admin-login-section
- admin.html: admin-logo-circle
- admin.html: admin-review-list
- admin.html: admin-review-section
- admin.html: admin-score-grid
- admin.html: admin-section-header
- admin.html: admin-security-content
- admin.html: admin-toolbar
- admin.html: admin-toolbar-actions
- admin.html: admin-workspace
- index.html: chat-history
- index.html: modal-overlay

## Baseline (fill before any edit)

| Host | Route | Static | Runtime 5 widths | Upload-to-reply | HTTP |
|---|---|---|---|---|---|
| | | | | | |

## Rollback

- Record the deployed commit before the change (Vercel deployment SHA, or `git -C <checkout> rev-parse HEAD` on the Studio).
- Vercel: promote the previous production deployment. Studio: `git -C <checkout> checkout <recorded sha>` on the served branch, then the restart above.
- Trigger: a live check that passed at baseline fails after the change.
