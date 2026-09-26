#!/bin/bash
# Persistent Microsoft Edge lanes for Claude's Rob's Coding Helper dispatcher on the iMac.
# Usage: launch-persistent-edge-helper.sh <n>   (n = 1..9)  -> lane edge<n>
# Port: 9229+n (edge1=9230, edge2=9231, ...).
# Profile: ~/CCowork-Local-Apps/claude-ensign-helper-edge<n>-profile (one profile per lane, never shared).
# Plist: com.robbagley.persistent-edge-helper<n> (RunAtLoad false, KeepAlive false).
# Owner: Claude only, through drive.mjs / dispatch.mjs with CDP_PORT set to the lane port.
#   Codex, Antigravity, Cowork and Rob's everyday browsers never attach to these profiles.
# Account expected: ecenter24@ensign.net (Copilot Studio maker). Rob signs in once per lane, in its window.
# Never ward, Guesty, personal Gmail, FERPA data or credentials in these lanes.
# Shutdown: graceful only. `node ~/Local-Infra/ensign-design-system/scripts/helper/lane_stop.mjs <port>` (DevTools
#   Browser.close, records exit_type Normal). SIGTERM with windows open records SessionEnded and Edge then shows
#   "Restore pages" on the next launch. Never kill -9, never delete Singleton* files while a process holds the profile.
# Launch flags: no AutomationControlled flag. Background-throttling flags keep occluded lanes generating.
# Sign-in: Edge profile icon > Sign in > Work or school account (ecenter24@ensign.net or robbagley@ensign.edu).
#   Choose "No, sign in to this app only". Then Sync is on > turn off Open tabs and History.
# Tabs: tidy.mjs trims the lane to one tab after launch. Dispatcher runs it on claim and after each job.
# Verify after first run: lane_stop.mjs, then Default/Preferences exit_type Normal (Edge writes no exited_cleanly key),
#   and a relaunch shows no restore prompt or unsupported-flag banner.

N="$1"
case "$N" in [1-9]) ;; *) echo "usage: $0 <1-9>" >&2; exit 2;; esac
PORT=$((9229 + N))
PROFILE_DIR="$HOME/CCowork-Local-Apps/claude-ensign-helper-edge$N-profile"
EDGE="/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"

mkdir -p "$PROFILE_DIR"

devtools_ok() { curl -fsS --max-time 3 "http://127.0.0.1:$PORT/json/version" >/dev/null 2>&1; }
holder_pid() { pgrep -f -- "--user-data-dir=$PROFILE_DIR" | head -1; }

if devtools_ok; then echo "$(date '+%F %T') edge$N already healthy on $PORT"; exit 0; fi

PID="$(holder_pid)"
if [ -n "$PID" ]; then
  echo "$(date '+%F %T') edge$N profile held by PID $PID but DevTools silent; SIGTERM"
  kill -TERM "$PID" 2>/dev/null
  for i in $(seq 1 20); do sleep 1; [ -z "$(holder_pid)" ] && break; done
  if [ -n "$(holder_pid)" ]; then
    echo "$(date '+%F %T') ERROR: PID $(holder_pid) still holds $PROFILE_DIR after 20s. Not forcing. Report to Rob." >&2
    exit 1
  fi
fi

# Locks are removed only when no process holds the profile.
if [ -z "$(holder_pid)" ]; then
  rm -f "$PROFILE_DIR/SingletonLock" "$PROFILE_DIR/SingletonCookie" "$PROFILE_DIR/SingletonSocket" "$PROFILE_DIR/DevToolsActivePort"
fi

echo "$(date '+%F %T') Starting edge$N on $PORT"
"$EDGE" \
  --remote-debugging-port=$PORT \
  --user-data-dir="$PROFILE_DIR" \
  --no-first-run \
  --no-default-browser-check \
  --hide-crash-restore-bubble \
  --disable-session-crashed-bubble \
  --disable-background-timer-throttling \
  --disable-renderer-backgrounding \
  --disable-backgrounding-occluded-windows \
  --test-type \
  --disable-infobars > /dev/null 2>&1 &

for i in $(seq 1 25); do
  sleep 1
  if devtools_ok; then
    echo "$(date '+%F %T') edge$N DevTools up on $PORT"
    # Sync and session restore add tabs a few seconds after launch. Trim to one tab twice.
    NODE="$(for c in /opt/homebrew/bin/node /usr/local/bin/node; do [ -x "$c" ] && echo "$c" && break; done)"
    for w in 6 15; do sleep $w; "$NODE" "$HOME/Local-Infra/ensign-design-system/scripts/helper/tidy.mjs" $PORT; done
    exit 0
  fi
done
echo "$(date '+%F %T') ERROR: edge$N DevTools did not come up on $PORT" >&2
exit 1
