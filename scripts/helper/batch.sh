#!/bin/bash
# batch.sh <conv> <blocks.json> <from> <to> <css-file>...  : prompt -> send -> wait -> read -> apply (quiet)
# One batch in an existing conversation, on the lane in $CDP_PORT (default 9226, Rob's Chrome). For many batches use
# dispatch.mjs. Paths resolve from the caller's cwd. Prompt and reply files go to $SCR (never into this repo).
DIR="$(cd "$(dirname "$0")" && pwd)"; SCR="${SCR:-$HOME/Local-Infra/ui-audit/_helper/scratch}"; mkdir -p "$SCR"
C=$1; B=$2; LO=$3; HI=$4; shift 4; PT=${CDP_PORT:-9226}; P="$SCR/.p_${PT}_$LO.txt"; R="$SCR/.r_${PT}_$LO"
python3 "$DIR/blocks.py" prompt "$B" $LO $HI "$P" >/dev/null
node "$DIR/drive.mjs" send $C "$P" | grep -q '"sent"' || { echo "send failed"; exit 1; }
node "$DIR/drive.mjs" wait $C 900 | grep -oE '"secs": [0-9]+|timeout|repeated failures'
rm -f "$R.raw" "$R.txt"  # never reuse a reply from an earlier run on the same port and range
node "$DIR/drive.mjs" read $C "$R.raw" >/dev/null || { echo "read failed"; exit 1; }
[ -s "$R.raw" ] || { echo "read produced no reply"; exit 1; }
python3 - "$LO" "$R" <<'PY' || exit 1
import sys; lo, r = sys.argv[1:3]; t = open(r + '.raw').read(); i = t.find(f'/*#{lo}')
j = min([k for k in (t.find('Show less', i), t.find('Message Rob', i)) if k > 0] or [len(t)])
open(r + '.txt', 'w').write(t[i:j]); print('markers', t[i:j].count('/*#') if i >= 0 else 'NONE')
if i < 0: sys.exit('no marker found in reply')
PY
for f in "$@"; do python3 "$DIR/blocks.py" apply "$f" "$B" "$R.txt" | grep -v '^SKIP'; done
