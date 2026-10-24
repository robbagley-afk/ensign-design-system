# ENS-101-Guide: ECC v2 matrix and runbook

Family: forms. Generated 2026-10-23 from the GitHub default branch and a read of the Mac Studio over SSH. Re-check before each phase: lines marked "candidate" came from a pattern scan and need a human or browser to confirm.

Already on v2. Needs one re-vendor for the header-band focus-ring fix.

## Hosts

- Mac Studio: `~/CCowork-Local-Apps/ens-101-mentor-desk` on `main`, port 5050, gated suite route `https://mac-studio-2.tail299fc7.ts.net/ens101/`. No LaunchAgent: restart with `python3 ~/Local-Infra/ui-audit/tools/ens101_restart.py` on the Studio, which keeps the app's environment.

## Web dirs that vendor ECC

`static`

## Pages

| HTML file |
|---|
| `static/admin.html` |
| `static/index.html` |

## AI and upload calls

- fetch: `/api/admin/password`, `/api/admin/suggestions`, `/api/admin/suggestions/delete`, `/api/admin/suggestions/status`, `/api/admin/verify`, `/api/appointments`, `/api/appointments/civitas-confirm`, `/api/appointments/delete`, `/api/appointments/get?id=`, `/api/appointments/save`, `/api/career-explorer/guidance`, `/api/career-explorer/parse-pdf`, `/api/chat`, `/api/status`, `/api/student-readiness/lookup`, `/api/student-report`, `/api/suggestions`
- No `text/event-stream` in server code: JSON replies.

## States to set up for the runtime audit (candidate)

Each needs a `--setup` script with fictional data before the audit can see it.

- static/admin.html: admin-brand-center
- static/admin.html: admin-login-card
- static/admin.html: admin-nav-cluster
- static/admin.html: admin-state-indicator
- static/admin.html: admin-toast
- static/admin.html: admin-workspace
- static/admin.html: app-shell admin-shell
- static/admin.html: dialog notes-dialog-box
- static/admin.html: dialog-actions
- static/admin.html: dialog-backdrop
- static/admin.html: suggestion-dialog-header
- static/index.html: ai-panel__prompts
- static/index.html: copilot-panel
- static/index.html: dialog
- static/index.html: dialog suggestion-dialog-box
- static/index.html: dialog-actions
- static/index.html: dialog-backdrop
- static/index.html: dialog-icon
- static/index.html: dialog-icon suggestion-bulb-icon
- static/index.html: ecc-ai-panel
- static/index.html: staff-admin-link-row
- static/index.html: suggestion-dialog-header
- static/index.html: view
- static/index.html: view active

## Baseline (fill before any edit)

| Host | Route | Static | Runtime 5 widths | Upload-to-reply | HTTP |
|---|---|---|---|---|---|
| | | | | | |

## Rollback

- Record the deployed commit before the change (Vercel deployment SHA, or `git -C <checkout> rev-parse HEAD` on the Studio).
- Vercel: promote the previous production deployment. Studio: `git -C <checkout> checkout <recorded sha>` on the served branch, then the restart above.
- Trigger: a live check that passed at baseline fails after the change.
