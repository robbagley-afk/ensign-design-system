#!/usr/bin/env bash
# Copy the design-system CSS into an app's web directories (every dir holding an index.html,
# e.g. public/ and static/) so they stay byte-identical. Never hand-edit the copies.
#
#   scripts/vendor_into_app.sh <app-repo> [web-dir ...]
#
# It does NOT edit the app's HTML. Add these links in <head>, in this order, before the app's own CSS:
#   <link rel="preconnect" href="https://fonts.googleapis.com">
#   <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
#   <link rel="stylesheet" href="ces-tokens.css">          (only while the app still has it)
#   <link rel="stylesheet" href="ecc-tokens.css">
#   <link rel="stylesheet" href="ecc-ces-compat.css">
#   <link rel="stylesheet" href="ecc-components.base.css">
#   <link rel="stylesheet" href="ecc-app.css">
set -euo pipefail
DS="$(cd "$(dirname "$0")/.." && pwd)"
APP="${1:?usage: vendor_into_app.sh <app-repo> [web-dir ...]}"; shift || true
python3 "$DS/scripts/build_tokens.py" --check >/dev/null || { echo "ecc-tokens.css is stale: run scripts/build_tokens.py in $DS first"; exit 1; }
if [ "$#" -gt 0 ]; then DIRS=("$@"); else
  DIRS=(); while IFS= read -r f; do DIRS+=("$(dirname "$f")"); done < <(git -C "$APP" ls-files '*index.html' | grep -Ev 'node_modules|/(dist|build)/')
fi
VER="$(git -C "$DS" rev-parse --short HEAD 2>/dev/null || echo local)"
for d in "${DIRS[@]}"; do
  for f in ecc-tokens.css ecc-ces-compat.css ecc-components.base.css ecc-app.css; do
    cp "$DS/css/$f" "$APP/$d/$f"
  done
  echo "ensign-design-system $VER" > "$APP/$d/ECC_VERSION"
  echo "vendored ECC $VER -> $d"
done
