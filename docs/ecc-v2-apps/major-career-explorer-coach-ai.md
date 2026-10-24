# major-career-explorer-coach-ai: ECC v2 matrix and runbook

Family: A chat. Generated 2026-10-23 from the GitHub default branch and a read of the Mac Studio over SSH. Re-check before each phase: lines marked "candidate" came from a pattern scan and need a human or browser to confirm.

## Hosts

- Vercel production: https://major-career-explorer-coach-ai.vercel.app
- Mac Studio: two checkouts. `~/CCowork-Local-Apps/major-career-explorer-coach-ai` on `main`, port 5045, open route `https://mac-studio-2.tail299fc7.ts.net/major-explorer/`. `~/CCowork-Local-Apps/mentor-career-explorer-coach-ai` on branch `mentor-career-explorer-coach` (one uncommitted file), port 5046, gated route `https://mac-studio-2.tail299fc7.ts.net/mentor-explorer/`. Both restarted by `start_all_agents.sh` under `com.rob.local-ai-agent-suite`. Kickstarting that label restarts every app it manages: find or add a single-app restart before using it. Decide which branch gets the v2 change before deploying the mentor checkout.

## Web dirs that vendor ECC

`public`, `static`

## Pages

| HTML file |
|---|
| `public/index.html` |
| `static/index.html` |

## AI and upload calls

- none found by scan
- No `text/event-stream` in server code: JSON replies.

## States to set up for the runtime audit (candidate)

Each needs a `--setup` script with fictional data before the audit can see it.

- public/index.html: coach-panel
- public/index.html: upload-panel
- static/index.html: coach-panel
- static/index.html: upload-panel

## Baseline (fill before any edit)

| Host | Route | Static | Runtime 5 widths | Upload-to-reply | HTTP |
|---|---|---|---|---|---|
| | | | | | |

## Rollback

- Record the deployed commit before the change (Vercel deployment SHA, or `git -C <checkout> rev-parse HEAD` on the Studio).
- Vercel: promote the previous production deployment. Studio: `git -C <checkout> checkout <recorded sha>` on the served branch, then the restart above.
- Trigger: a live check that passed at baseline fails after the change.
