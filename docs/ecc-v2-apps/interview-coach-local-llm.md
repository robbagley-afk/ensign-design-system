# interview-coach-local-llm: ECC v2 matrix and runbook

Family: mono-split. Generated 2026-10-23 from the GitHub default branch and a read of the Mac Studio over SSH. Re-check before each phase: lines marked "candidate" came from a pattern scan and need a human or browser to confirm.

## Hosts

- Mac Studio: suite route `/interview/` (port 5015) serves an embedded copy inside the ai-agents-local-llm checkout. The suite-restructure plan owns that copy. This rollout does not edit or restart it. The standalone repo has no deployed host.

## Web dirs that vendor ECC

`.`

## Pages

| HTML file |
|---|
| `index.html` |

## Server routes (decorators)

- `/  (interviewcoach.py:102)`
- `/shared/safe_markdown.js  (interviewcoach.py:106)`
- `/<path:path>  (interviewcoach.py:110)`
- `/api/status  (interviewcoach.py:114)`
- `/api/transcribe  (interviewcoach.py:130)`
- `/api/chat  (interviewcoach.py:168)`
- `/healthz  (interviewcoach.py:215)`

## AI and upload calls

- fetch: `api/chat`, `api/status`, `api/transcribe`
- Streams `text/event-stream` at: `interviewcoach.py:205`. The client must read SSE and JSON.

## States to set up for the runtime audit (candidate)

Each needs a `--setup` script with fictional data before the audit can see it.

- index.html: evaluation-view
- index.html: interview-controls
- index.html: main-view
- index.html: panel
- index.html: panel-header
- index.html: panel-question

## Baseline (fill before any edit)

| Host | Route | Static | Runtime 5 widths | Upload-to-reply | HTTP |
|---|---|---|---|---|---|
| | | | | | |

## Rollback

- Record the deployed commit before the change (Vercel deployment SHA, or `git -C <checkout> rev-parse HEAD` on the Studio).
- Vercel: promote the previous production deployment. Studio: `git -C <checkout> checkout <recorded sha>` on the served branch, then the restart above.
- Trigger: a live check that passed at baseline fails after the change.
