#!/usr/bin/env bash
# Re-vendor an app to one reviewed design-system release and move its CI pin to the same release.
#
#   scripts/v2_revendor.sh <app-repo> <full-40-char-sha> [web-dir ...]
#
# Release invariant: CI passes only when both refs in .github/workflows/ecc-audit.yml (the `uses: ...@<sha>`
# and `design-system-ref`) and all four vendored CSS files match the same release. This script keeps them together:
#   1. refuses an abbreviated SHA or one that is not on origin/main (the reusable workflow refuses short SHAs too)
#   2. extracts css/, scripts/ and tokens/ at that SHA into a clean temp dir (never this working tree)
#   3. copies the four files into every web dir that already vendors ECC (or the dirs you name)
#   4. checks all four sha256 hashes against the release, moves both workflow refs, keeps audit-path
#   5. runs the static audit from the release copy, so ds-stale is judged against the same release
# It does not commit. Exit 0 = audit 0 FAIL, 1 = audit FAIL, 2 = usage or invariant error.
set -euo pipefail
DS="$(cd "$(dirname "$0")/.." && pwd)"
APP="${1:-}"; SHA="${2:-}"
[ -n "$APP" ] && [ -n "$SHA" ] || { echo "usage: v2_revendor.sh <app-repo> <full-40-char-sha> [web-dir ...]" >&2; exit 2; }
shift 2
APP="$(cd "$APP" && pwd)"
[[ "$SHA" =~ ^[0-9a-f]{40}$ ]] || { echo "need the full 40-character release SHA, got '$SHA'" >&2; exit 2; }
git -C "$DS" fetch -q origin main
git -C "$DS" merge-base --is-ancestor "$SHA" origin/main 2>/dev/null || { echo "$SHA is not on origin/main: only a merged, reviewed release can be pinned" >&2; exit 2; }

REL="$(mktemp -d)"; trap 'rm -rf "$REL"' EXIT
git -C "$DS" archive "$SHA" css scripts tokens | tar -x -C "$REL"
FILES=(ecc-tokens.css ecc-ces-compat.css ecc-components.base.css ecc-app.css)

# Web dirs: the ones named, else every dir that already tracks a vendored ecc-app.css, else every index.html dir
if [ "$#" -gt 0 ]; then DIRS=("$@"); else
  DIRS=(); while IFS= read -r f; do DIRS+=("$(dirname "$f")"); done < <(git -C "$APP" ls-files '*ecc-app.css')
  if [ "${#DIRS[@]}" -eq 0 ]; then
    while IFS= read -r f; do DIRS+=("$(dirname "$f")"); done < <(git -C "$APP" ls-files '*index.html' | grep -Ev 'node_modules|/(dist|build)/')
  fi
fi
[ "${#DIRS[@]}" -gt 0 ] || { echo "no web dirs found in $APP; name them" >&2; exit 2; }

for d in "${DIRS[@]}"; do
  for f in "${FILES[@]}"; do
    cp "$REL/css/$f" "$APP/$d/$f"
    [ "$(shasum -a 256 < "$APP/$d/$f")" = "$(shasum -a 256 < "$REL/css/$f")" ] || { echo "hash mismatch after copy: $d/$f" >&2; exit 2; }
  done
  echo "ensign-design-system $SHA" > "$APP/$d/ECC_VERSION"
  echo "vendored $SHA -> ${d}"
done

WF="$APP/.github/workflows/ecc-audit.yml"
if [ -f "$WF" ]; then
  n_uses=$(grep -cE 'ecc-audit-reusable\.yml@[0-9a-f]{40}' "$WF" || true)
  n_ref=$(grep -cE 'design-system-ref: *[0-9a-f]{40}' "$WF" || true)
  [ "$n_uses" = 1 ] && [ "$n_ref" = 1 ] || { echo "$WF: expected one uses@<sha> and one design-system-ref, found $n_uses and $n_ref" >&2; exit 2; }
  sed -i.bak -E "s/(ecc-audit-reusable\.yml@)[0-9a-f]{40}/\1$SHA/; s/(design-system-ref: *)[0-9a-f]{40}/\1$SHA/" "$WF" && rm -f "$WF.bak"
  echo "pinned CI to $SHA"
else
  echo "WARN: no $WF; add the caller from docs/ci.md pinned to $SHA" >&2
fi

# The static audit reads tracked files only: stage what this script touched so the audit sees it
git -C "$APP" add -- "${DIRS[@]/%//ECC_VERSION}" "${DIRS[@]}" ${WF:+"$WF"} 2>/dev/null || true
python3 "$REL/scripts/ecc_audit_static.py" "$APP"
