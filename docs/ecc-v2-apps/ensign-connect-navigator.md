# ensign-connect-navigator: ECC v2 matrix and runbook

Family: F forms (pilot). Generated 2026-10-23 from the GitHub default branch and a read of the Mac Studio over SSH. Re-check before each phase: lines marked "candidate" came from a pattern scan and need a human or browser to confirm.

## Hosts

- Vercel production: https://ensign-connect-navigator.vercel.app
- Mac Studio: `~/CCowork-Local-Apps/ensign-connect-navigator` on `main`, port 5065, open suite route `https://mac-studio-2.tail299fc7.ts.net/ensign-connect/`, `com.rob.ensign-connect-navigator` (runs `/usr/bin/python3`, Python 3.9). Restart: `launchctl kickstart -k gui/$(id -u)/com.rob.ensign-connect-navigator`.

## Web dirs that vendor ECC

`public`, `static`

## Pages

| HTML file |
|---|
| `public/index.html` |
| `static/index.html` |

## AI and upload calls

- fetch: `/api/config`, `/api/outreach-draft`
- No `text/event-stream` in server code: JSON replies.

## States to set up for the runtime audit (candidate)

Each needs a `--setup` script with fictional data before the audit can see it.

- public/index.html: outreach-result
- static/index.html: outreach-result

## Baseline (fill before any edit)

| Host | Route | Static | Runtime 5 widths | Upload-to-reply | HTTP |
|---|---|---|---|---|---|
| | | | | | |

## Rollback

- Record the deployed commit before the change (Vercel deployment SHA, or `git -C <checkout> rev-parse HEAD` on the Studio).
- Vercel: promote the previous production deployment. Studio: `git -C <checkout> checkout <recorded sha>` on the served branch, then the restart above.
- Trigger: a live check that passed at baseline fails after the change.
