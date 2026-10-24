# resume-coach-llm: ECC v2 matrix and runbook

Family: D. Generated 2026-10-23 from the GitHub default branch and a read of the Mac Studio over SSH. Re-check before each phase: lines marked "candidate" came from a pattern scan and need a human or browser to confirm.

## Hosts

- Mac Studio: not running on the Mac Studio on 2026-10-23. Local verification only.

## Web dirs that vendor ECC

`.`

## Pages

| HTML file |
|---|
| `index.html` |

## Server routes (decorators)

- `/  (resumecoach.py:165)`
- `/favicon.ico  (resumecoach.py:169)`
- `/shared/safe_markdown.js  (resumecoach.py:174)`
- `/<path:path>  (resumecoach.py:178)`
- `/api/status  (resumecoach.py:182)`
- `/api/upload  (resumecoach.py:201)`
- `/api/chat  (resumecoach.py:342)`
- `/chat  (resumecoach.py:343)`
- `/api/feedback  (resumecoach.py:401)`
- `/healthz  (resumecoach.py:446)`

## AI and upload calls

- fetch: `api/chat`, `api/feedback`, `api/status`, `api/upload`
- Streams `text/event-stream` at: `resumecoach.py:392`. The client must read SSE and JSON.

## States to set up for the runtime audit (candidate)

Each needs a `--setup` script with fictional data before the audit can see it.

- index.html: chat-history
- index.html: intake-error-message
- index.html: intake-panel
- index.html: intake-panel-header
- index.html: intake-panel-title
- index.html: view-chat
- index.html: view-mode-selection
- index.html: view-resume-options
- index.html: view-resume-specific-intake

## Baseline (fill before any edit)

| Host | Route | Static | Runtime 5 widths | Upload-to-reply | HTTP |
|---|---|---|---|---|---|
| | | | | | |

## Rollback

- Record the deployed commit before the change (Vercel deployment SHA, or `git -C <checkout> rev-parse HEAD` on the Studio).
- Vercel: promote the previous production deployment. Studio: `git -C <checkout> checkout <recorded sha>` on the served branch, then the restart above.
- Trigger: a live check that passed at baseline fails after the change.
