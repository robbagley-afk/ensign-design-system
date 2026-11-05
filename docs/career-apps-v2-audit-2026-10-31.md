# Career apps ECC v2 audit, 2026-10-31

Design system main 5c740f3 (skill ui-ux-principles-cis v3.1.2). Latest CSS release is ad39d14: `css/` has not changed since, so an app vendored at ad39d14 is current. Rule 13 tokens (`--next-ready*`) are in `tokens/overrides.json` but not built into `css/ecc-tokens.css`, so apps carry literal fallbacks until a CSS release adds them.

Static audit: `scripts/ecc_audit_static.py` at 5c740f3 on each repo's main (shallow clone, 2026-10-31). Runtime: `scripts/ecc_audit_runtime.mjs` at 320/375/768/1440/1920 on the landing page served locally with no secrets. Runtime covers the first screen only unless noted. The static audit does not detect rule 13, header upload placement in every layout, or column caps on class names outside its list (interview-coach had an 800px `.dashboard-column` cap that passed).

Not found or not attachable: no repos under robbagley-dev appeared in the session's repo list (`ensign-career-fair-coach` and others now live under robbagley-afk). `mentor-career-explorer-coach-ai`, `ens-101-mentor-desk` and `resume-employer-signals` do not exist as separate repos in the list. ENS 101 Guide is `ENS-101-Guide`. Employer signals code lives inside resume-coach-ai.

## ENS-101-Guide

| Item | Result |
|---|---|
| Vendored CSS | ad39d14 (current) |
| Static FAIL | 0 |
| Static WARN | 0 |
| Runtime | 0 FAIL 0 WARN, five widths, --v2 |
| Resume or interview | no |
| Recommendation | Current. No action. |

## ai-agents-local-llm

FAILs by folder: BrewCoach for Linkedin 85, Resume Coach LOCAL LLM 53, Internship Expert LOCAL LLM 25, Resume Improver LOCAL LLM 17, Corey - Ensign Career Fair Coach 5, mentor-resume-tutor 5, root dashboard and beginner pages the rest. Main is behind the in-progress branch ecc/embedded-apps-v2 (e639307, 2026-10-24), which reports a runtime pass for four embedded apps.

| Item | Result |
|---|---|
| Vendored CSS | ad39d14 (current) |
| Static FAIL | 2 dark-theme, 20 ds-missing, 7 focus-removed, 1 response-format-mismatch, 241 text-below-floor, 8 tokens-not-linked, 5 width-cap |
| Static WARN | 10 emoji-markers, 14 field-unlabeled, 7 font-not-loaded, 7 gold-as-ui, 2 unbounded-scroller |
| Runtime | not run (suite, needs model servers; static FAILs first) |
| Resume or interview | yes (embedded Interview Coach, Resume Coach, Resume Improver, mentor-resume-tutor) |
| Recommendation | Blocked on ownership: Interview Coach sits in Antigravity Unit 2 branch ecc/embedded-apps-v2; Resume Coach copy has newer content than the standalone repo. Rob decides sync direction, then sync from standalone. |

## brewcoach-for-linkedin

| Item | Result |
|---|---|
| Vendored CSS | ad39d14 (current) |
| Static FAIL | 0 |
| Static WARN | 2 unbounded-scroller |
| Runtime | 0 FAIL 0 WARN, five widths (served with /static layout) |
| Resume or interview | no |
| Recommendation | Answer 2 unbounded-scroller WARNs (admin container, messages feed) or bound them. |

## brewcoach-local

| Item | Result |
|---|---|
| Vendored CSS | ad39d14 (current) |
| Static FAIL | 0 |
| Static WARN | 2 unbounded-scroller |
| Runtime | 0 FAIL 0 WARN, five widths (served with /static layout) |
| Resume or interview | no |
| Recommendation | Same 2 unbounded-scroller WARNs as brewcoach-for-linkedin. |

## career-services-tools

| Item | Result |
|---|---|
| Vendored CSS | ad39d14 (current) |
| Static FAIL | 0 |
| Static WARN | 0 |
| Runtime | 0 FAIL 0 WARN, five widths |
| Resume or interview | no |
| Recommendation | Current. No action. |

## ensign-academic-advisor

| Item | Result |
|---|---|
| Vendored CSS | ad39d14 (current) |
| Static FAIL | 0 |
| Static WARN | 0 |
| Runtime | 0 FAIL 0 WARN, five widths |
| Resume or interview | no |
| Recommendation | Current. No action. |

## ensign-career-fair-coach

| Item | Result |
|---|---|
| Vendored CSS | ad39d14 (current) |
| Static FAIL | 0 |
| Static WARN | 0 |
| Runtime | 0 FAIL 0 WARN, five widths |
| Resume or interview | no |
| Recommendation | Current. No action. |

## ensign-connect-navigator

| Item | Result |
|---|---|
| Vendored CSS | ad39d14 (current) |
| Static FAIL | 0 |
| Static WARN | 0 |
| Runtime | 0 FAIL 0 WARN, five widths |
| Resume or interview | no |
| Recommendation | Current. No action. |

## ensign-student-readiness-hub

| Item | Result |
|---|---|
| Vendored CSS | ad39d14 (current) |
| Static FAIL | 0 |
| Static WARN | 0 |
| Runtime | 0 FAIL 0 WARN, five widths |
| Resume or interview | no |
| Recommendation | Current. No action. |

## gemini-coaching-agent-starter

| Item | Result |
|---|---|
| Vendored CSS | ad39d14 (current) |
| Static FAIL | 0 |
| Static WARN | 0 |
| Runtime | 0 FAIL 0 WARN, five widths |
| Resume or interview | no |
| Recommendation | Current. No action. |

## internship-expert-coach-ai

| Item | Result |
|---|---|
| Vendored CSS | ad39d14 (current) |
| Static FAIL | 0 |
| Static WARN | 0 |
| Runtime | 0 FAIL 0 WARN, five widths |
| Resume or interview | no |
| Recommendation | Current. No action. |

## interview-coach-local-llm

| Item | Result |
|---|---|
| Vendored CSS | ad39d14 (current) |
| Static FAIL | 0 |
| Static WARN | 0 |
| Runtime | 0 FAIL default. --v2: 1 WARN v2-body-copy |
| Resume or interview | yes |
| Recommendation | Migrated in PR 5. |

## linkedin-networking-tutor-coach-ensign

| Item | Result |
|---|---|
| Vendored CSS | none (no web UI) |
| Static FAIL | 0 |
| Static WARN | 0 |
| Runtime | n/a, no web UI |
| Resume or interview | no |
| Recommendation | ChatGPT plugin source, no web UI. Out of scope. |

## major-career-explorer-coach-ai

| Item | Result |
|---|---|
| Vendored CSS | fbf1f15 (ECC_VERSION label; CSS passes ds-stale) |
| Static FAIL | 0 |
| Static WARN | 0 |
| Runtime | 0 FAIL 0 WARN, five widths |
| Resume or interview | no |
| Recommendation | Rewrite ECC_VERSION to the full ad39d14 SHA so the label matches the CSS. |

## resume-ai-tutor-coach

| Item | Result |
|---|---|
| Vendored CSS | none (placeholder repo, CES files only) |
| Static FAIL | 0 |
| Static WARN | 0 |
| Runtime | n/a, placeholder |
| Resume or interview | yes (placeholder) |
| Recommendation | Placeholder pointing at resume-coach-ai. Archive or keep as pointer. |

## resume-coach-ai

| Item | Result |
|---|---|
| Vendored CSS | ad39d14 (current) |
| Static FAIL | 0 |
| Static WARN | 0 |
| Runtime | 0 FAIL default. --v2 before PR: 2 FAIL codes (v2-control-height, v2-focus-ring) |
| Resume or interview | yes |
| Recommendation | Migrated in PR 51. |

## resume-coach-llm

| Item | Result |
|---|---|
| Vendored CSS | ad39d14 (current) |
| Static FAIL | 0 |
| Static WARN | 0 |
| Runtime | 0 FAIL default. --v2: 1 WARN v2-body-copy |
| Resume or interview | yes |
| Recommendation | Migrated in PR 5. |

## Phase 2 PRs

- resume-coach-ai: https://github.com/robbagley-afk/resume-coach-ai/pull/51
- resume-coach-llm: https://github.com/robbagley-afk/resume-coach-llm/pull/5
- interview-coach-local-llm: https://github.com/robbagley-afk/interview-coach-local-llm/pull/5
- ai-agents-local-llm: none, see recommendation above.
