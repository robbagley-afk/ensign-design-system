# gemini-coaching-agent-starter: ECC v2 matrix and runbook

Family: A chat. Generated 2026-10-23 from the GitHub default branch and a read of the Mac Studio over SSH. Re-check before each phase: lines marked "candidate" came from a pattern scan and need a human or browser to confirm.

## Hosts

- Vercel production: https://gemini-coaching-agent-starter.vercel.app
- Mac Studio: not served on the Mac Studio.

## Web dirs that vendor ECC

`public`, `static`

## Pages

| HTML file |
|---|
| `public/index.html` |
| `static/index.html` |

## AI and upload calls

- fetch: `/api/chat`, `/api/feedback`
- No `text/event-stream` in server code: JSON replies.

## States to set up for the runtime audit (candidate)

Each needs a `--setup` script with fictional data before the audit can see it.

- public/index.html: coach-panel
- static/index.html: coach-panel

## Baseline (fill before any edit)

| Host | Route | Static | Runtime 5 widths | Upload-to-reply | HTTP |
|---|---|---|---|---|---|
| | | | | | |

## Rollback

- Record the deployed commit before the change (Vercel deployment SHA, or `git -C <checkout> rev-parse HEAD` on the Studio).
- Vercel: promote the previous production deployment. Studio: `git -C <checkout> checkout <recorded sha>` on the served branch, then the restart above.
- Trigger: a live check that passed at baseline fails after the change.
