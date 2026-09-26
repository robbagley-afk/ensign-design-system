#!/bin/bash
# batch.sh <conv> <blocks.json> <from> <to> <css-file>...  : prompt -> send -> wait -> read -> apply (quiet)
DIR="$(cd "$(dirname "$0")" && pwd)"; cd "${WORK:-.}"
C=$1; B=$2; LO=$3; HI=$4; shift 4
python3 "$DIR/blocks.py" prompt $B $LO $HI .p_$LO.txt >/dev/null
node "$DIR/drive.mjs" send $C .p_$LO.txt | grep -q '"sent"' || { echo "send failed"; exit 1; }
node "$DIR/drive.mjs" wait $C 900 | grep -oE '"secs": [0-9]+|timeout|repeated failures'
node "$DIR/drive.mjs" read $C .r_$LO.raw >/dev/null
python3 - "$LO" <<'PY'
import sys; lo=sys.argv[1]; t=open(f'.r_{lo}.raw').read(); i=t.find(f'/*#{lo}*/'); 
j=min([k for k in (t.find('Show less',i),t.find('Message Rob',i)) if k>0] or [len(t)])
open(f'.r_{lo}.txt','w').write(t[i:j]); print('markers',t[i:j].count('/*#') if i>=0 else 'NONE')
PY
for f in "$@"; do python3 "$DIR/blocks.py" apply "$f" $B .r_$LO.txt | grep -v '^SKIP'; done
