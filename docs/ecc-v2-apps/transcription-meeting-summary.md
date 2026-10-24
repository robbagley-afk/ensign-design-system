# transcription-meeting-summary: ECC v2 matrix and runbook

Family: G Tailwind. Generated 2026-10-23 from the GitHub default branch and a read of the Mac Studio over SSH. Re-check before each phase: lines marked "candidate" came from a pattern scan and need a human or browser to confirm.

## Hosts

- Mac Studio: `~/CCowork-Local-Apps/transcription-meeting-summary` on branch `gemma-qat/single-model-20260930`, port 5070 (not a suite route), `com.rob.transcriber-web`. Restart: `launchctl kickstart -k gui/$(id -u)/com.rob.transcriber-web`. Tailwind config hardcodes 19px and #f8fafc: Phase 1 fixes and rebuilds.

## Web dirs that vendor ECC

`.`, `static`

## Pages

| HTML file |
|---|
| `index.html` |
| `static/index.html` |

## Server routes (decorators)

- `/  (app.py:203)`
- `/api/config  (app.py:208)`
- `/api/health  (app.py:232)`
- `/api/models  (app.py:244)`
- `/api/models/load  (app.py:351)`
- `/api/upload  (app.py:415)`
- `/api/jobs/<job_id>  (app.py:476)`
- `/api/jobs/<job_id>/audio  (app.py:484)`
- `/api/jobs/<job_id>/speakers  (app.py:535)`
- `/api/jobs/<job_id>/speaker_sample/<cluster_id>  (app.py:619)`
- `/api/jobs/<job_id>/audio/download  (app.py:670)`
- `/api/jobs/<job_id>/download/<file_type>  (app.py:682)`
- `/api/voiceprints  (app.py:700)`
- `/api/voiceprints/enroll  (app.py:714)`
- `/api/voiceprints/<name>  (app.py:814)`
- `/api/history  (app.py:824)`

## AI and upload calls

- fetch: `/api/config`, `/api/history`, `/api/jobs/${jobId}`, `/api/jobs/${jobId}/speakers`, `/api/models`, `/api/models/load`, `/api/upload`, `/api/voiceprints`, `/api/voiceprints/${encodeURIComponent(name)}`, `/api/voiceprints/enroll`
- No `text/event-stream` in server code: JSON replies.

## States to set up for the runtime audit (candidate)

Each needs a `--setup` script with fictional data before the audit can see it.

- index.html: enroll-modal
- index.html: enroll-preview-container
- index.html: flex items-center gap-3 text-xs tabular-nums
- index.html: history-list
- index.html: mt-4 bg-sunken rounded-xl p-3 border border-line tabular-num
- index.html: record-preview-container
- index.html: result-downloads-bar
- index.html: speaker-review-card
- index.html: speaker-review-list
- index.html: tab-view hidden space-y-6
- index.html: tab-view space-y-6
- index.html: text-3xl tabular-nums font-bold tracking-wider text-ink
- static/index.html: enroll-modal
- static/index.html: enroll-preview-container
- static/index.html: flex items-center gap-3 text-xs tabular-nums
- static/index.html: history-list
- static/index.html: mt-4 bg-sunken rounded-xl p-3 border border-line tabular-num
- static/index.html: record-preview-container
- static/index.html: result-downloads-bar
- static/index.html: speaker-review-card
- static/index.html: speaker-review-list
- static/index.html: tab-view hidden space-y-6
- static/index.html: tab-view space-y-6
- static/index.html: text-3xl tabular-nums font-bold tracking-wider text-ink

## Baseline (fill before any edit)

| Host | Route | Static | Runtime 5 widths | Upload-to-reply | HTTP |
|---|---|---|---|---|---|
| | | | | | |

## Rollback

- Record the deployed commit before the change (Vercel deployment SHA, or `git -C <checkout> rev-parse HEAD` on the Studio).
- Vercel: promote the previous production deployment. Studio: `git -C <checkout> checkout <recorded sha>` on the served branch, then the restart above.
- Trigger: a live check that passed at baseline fails after the change.
