# career-services-tools: ECC v2 matrix and runbook

Family: pages (pilot). Generated 2026-10-23 from the GitHub default branch and a read of the Mac Studio over SSH. Re-check before each phase: lines marked "candidate" came from a pattern scan and need a human or browser to confirm.

## Hosts

- GitHub Pages: https://robbagley-afk.github.io/career-services-tools/
- Mac Studio: not served on the Mac Studio.

## Web dirs that vendor ECC

`.`

## Pages

| HTML file |
|---|
| `beginner.html` |
| `index.html` |
| `projects.html` |
| `student.html` |

## AI and upload calls

- none found by scan
- No `text/event-stream` in server code: JSON replies.

## States to set up for the runtime audit (candidate)

Each needs a `--setup` script with fictional data before the audit can see it.

- student.html: interview-practice

## Baseline (fill before any edit)

| Host | Route | Static | Runtime 5 widths | Upload-to-reply | HTTP |
|---|---|---|---|---|---|
| | | | | | |

## Rollback

- Record the deployed commit before the change (Vercel deployment SHA, or `git -C <checkout> rev-parse HEAD` on the Studio).
- Vercel: promote the previous production deployment. Studio: `git -C <checkout> checkout <recorded sha>` on the served branch, then the restart above.
- Trigger: a live check that passed at baseline fails after the change.
