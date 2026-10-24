# internship-expert-coach-ai: ECC v2 matrix and runbook

Family: B sidebar chat (pilot). Generated 2026-10-23 from the GitHub default branch and a read of the Mac Studio over SSH. Re-check before each phase: lines marked "candidate" came from a pattern scan and need a human or browser to confirm.

## Hosts

- Vercel production: https://internship-expert-coach-ai.vercel.app
- Mac Studio: suite route `/internship/` (port 5035) serves an embedded copy inside the ai-agents-local-llm checkout. The suite-restructure plan owns that copy. This rollout does not edit or restart it.

## Web dirs that vendor ECC

`public`

## Pages

| HTML file |
|---|
| `public/index.html` |

## AI and upload calls

- fetch: `/api/chat`, `/api/feedback`, `/api/status`
- Streams `text/event-stream` at: `api/index.py:426`, `api/index.py:430`. The client must read SSE and JSON.

## States to set up for the runtime audit (candidate)

Each needs a `--setup` script with fictional data before the audit can see it.

- public/index.html: chat-history
- public/index.html: chat-panel
- public/index.html: source-panel

## Baseline (fill before any edit)

| Host | Route | Static | Runtime 5 widths | Upload-to-reply | HTTP |
|---|---|---|---|---|---|
| | | | | | |

## Rollback

- Record the deployed commit before the change (Vercel deployment SHA, or `git -C <checkout> rev-parse HEAD` on the Studio).
- Vercel: promote the previous production deployment. Studio: `git -C <checkout> checkout <recorded sha>` on the served branch, then the restart above.
- Trigger: a live check that passed at baseline fails after the change.
