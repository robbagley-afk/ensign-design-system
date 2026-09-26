# ensign-design-system

The Ensign Career Coach design system, mirrored from Claude Design so every agent working on Rob's apps reads the same rules. Claude, Codex, Antigravity, and Rob's Coding Helper (through GitHub) all read it from here.

**Canonical source:** Claude Design artifact [Ensign Career Coach](https://claude.ai/artifact/2Nz7EPn8vjHGM5cwrXpy4v), the organization's default design system. Only Claude can read it, so Claude syncs it into this repo (see "Sync" below).

## What is here

| Path | What it is | Edit it? |
|---|---|---|
| `tokens/tokens.json` | Byte-exact copy of the artifact's `project/tokens.json` | Never by hand. Sync only |
| `tokens/overrides.json` | Local additions and deviations, each with a reason and status | Yes, with a reason |
| `css/ecc-tokens.css` | CSS custom properties generated from the two files above | Never. Run `scripts/build_tokens.py` |
| `css/ecc-ces-compat.css` | Maps the old `--ces-*` variables every app vendors onto ECC values | Yes |
| `css/ecc-components.base.css` | The five components from the artifact (Button, StatusPill, Card, Chip, NavItem) | Sync only |
| `css/ecc-app.css` | App patterns: shell, sidebar, feed, messages, composer, text fields, chip rail, breakpoints | Yes |
| `docs/design-system-README.md` | The artifact's README: audience, voice, color, type, radius, elevation | Sync only |
| `docs/components.md` | The five component notes | Sync only |
| `skill/ui-ux-principles/` | Canonical copy of the skill every agent installs | Yes, then reinstall |
| `scripts/` | `build_tokens.py`, `vendor_into_app.sh`, `ecc_audit_static.py`, `ecc_audit_runtime.mjs` | Yes |
| `ROLLOUT.md` | Shared board: which agent owns which app, branch, status, PR | Every agent, every step |

## Using it in an app

```sh
scripts/vendor_into_app.sh ~/Local-Infra/ui-audit/<app>        # copies the four CSS files into every web dir
python3 scripts/ecc_audit_static.py ~/Local-Infra/ui-audit/<app> # 0 FAIL required
node scripts/ecc_audit_runtime.mjs http://127.0.0.1:<port>/     # 0 FAIL at 320/375/768/1440/1920 required
```

The runtime audit needs `npm i --include=dev` in this repo (installs `playwright`; the flag matters because this Mac has npm `omit=dev` set globally) and uses the installed Google Chrome, so no browser download is needed.

Load order in each page's `<head>`: Montserrat from Google Fonts, `ces-tokens.css` (while the app still has it), `ecc-tokens.css`, `ecc-ces-compat.css`, `ecc-components.base.css`, `ecc-app.css`, then the app's own CSS.

## How the agents split the work

See `skill/ui-ux-principles/SKILL.md` ("Who does what") and `skill/ui-ux-principles/references/handoffs.md` for ready-to-paste prompts. In short: Rob's Coding Helper writes the patches, Claude supervises (applies, audits, verifies, signs off), Codex is the fallback implementer, Antigravity runs bulk mechanical sweeps, and Rob merges.

## Sync from Claude Design

Claude only:

1. Read `project/tokens.json`, `project/README.md` and `project/components/bundle.css` from the artifact.
2. If a sha256 differs, replace the local copy byte for byte, run `python3 scripts/build_tokens.py`, add a CHANGELOG entry, and open a PR.
3. Drop any `overrides.json` entry the new tokens now cover.

`python3 scripts/build_tokens.py --check` fails if `ecc-tokens.css` is stale. The static audit fails an app whose vendored files do not match this repo (`ds-stale`).

## Installing the skill

```sh
for d in ~/.claude/skills ~/.codex/skills ~/.gemini/config/skills; do
  rsync -a --delete skill/ui-ux-principles/ "$d/ui-ux-principles/"
done
```

For the claude.ai account (Cowork on other machines), install the packaged `ui-ux-principles.skill` from the release or from Rob's outputs.
