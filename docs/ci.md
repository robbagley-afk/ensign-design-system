# ECC audit in pull requests

The current code repository is public: `robbagley-afk/ensign-design-system`.
Older `robbagley-dev` URLs redirect. No private-repository read token is required.

Copy this caller into `.github/workflows/ecc-audit.yml`. Replace both placeholders
with the same reviewed, full 40-character release commit. Never paste a moving
`main` reference as the production pin.

```yaml
name: ECC audit
on: [pull_request, push]
permissions:
  contents: read
jobs:
  ecc-audit:
    uses: robbagley-afk/ensign-design-system/.github/workflows/ecc-audit-reusable.yml@REVIEWED_FULL_COMMIT_SHA
    with:
      audit-path: .
      design-system-ref: REVIEWED_FULL_COMMIT_SHA
```

The caller scope must exist inside the caller checkout and contain tracked HTML
or CSS. Empty, missing, traversing and multiline scopes fail validation. The audit
fails on FAIL findings and uploads its JSON report even when findings block it.
WARN findings need an explicit disposition in the pull request.

No secret is used, including in fork pull requests. This workflow does not run
application code. It performs static inspection only. Runtime checks, fictional
upload/reply tests on supported hosts, and visual review remain release gates.

The design-system self-test checks the candidate commit, not main. It runs real
CLI tests with temporary conforming, layout-violation, missing-vendor and stale-
vendor apps. A second job calls the reusable workflow from the same candidate
commit on the committed positive CSS fixture. This smoke test does not substitute
for an application migration pilot or the dashboard runtime audit.

Before making the audit required, inspect an actual successful PR run and select
its exact observed check name. Preserve existing branch protections and rulesets.
Update workflow and auditor pins together, re-vendor assets, and re-run checks.
Do not create or replace a scheduler as part of installing this caller.
