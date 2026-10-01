#!/bin/bash
# Persistent Microsoft Edge lanes for Claude's Rob's Coding Helper dispatcher.
# Usage: launch-persistent-edge-helper.sh <n> <profile-directory> (n = 1..9).
# Installation must pin the verified machine-local profile: iMac edge1 "Profile 2",
# MacBook edge1 "Default". No hostname or last_used fallback. Existing plists
# need the explicit second argument before deploying this template.
# Port: 9229+n (edge1=9230, edge2=9231, ...).
# Profile: ~/CCowork-Local-Apps/claude-ensign-helper-edge<n>-profile (one profile per lane, never shared).
# Plist: com.robbagley.persistent-edge-helper<n> (RunAtLoad false, KeepAlive false, AbandonProcessGroup true).
#   AbandonProcessGroup is required: this script starts Edge in the background and exits, and launchd kills the
#   job's process group when the script exits, so without the key Edge dies seconds after launch (MacBook Pro, 2026-09-30).
# Owner: Claude only, through drive.mjs / dispatch.mjs with CDP_PORT set to the lane port.
#   Codex, Antigravity, Cowork and Rob's everyday browsers never attach to these profiles.
# Account expected: robbagley@ensign.edu on every lane, including helper chat lanes (Rob 2026-09-30).
#   ecenter24@ensign.net only on a lane kept for Copilot Studio maker work. Rob signs in once per lane, in its window.
# Never ward, Guesty, personal Gmail, FERPA data or credentials in these lanes.
# Shutdown: graceful only. `node ~/Local-Infra/ensign-design-system/scripts/helper/lane_stop.mjs <port>` (DevTools
#   Browser.close, records exit_type Normal). SIGTERM with windows open records SessionEnded and Edge then shows
#   "Restore pages" on the next launch. Never kill -9, never delete Singleton* files while a process holds the profile.
# Launch flags: no AutomationControlled flag. Background-throttling flags keep occluded lanes generating.
# Sign-in: Edge profile icon > Sign in > Work or school account > robbagley@ensign.edu (ecenter24 on the maker lane).
#   Choose "No, sign in to this app only". Then Sync is on > turn off Open tabs and History.
# Tabs: tidy.mjs trims the lane to one tab after launch. Dispatcher runs it on claim and after each job.
#   Sessions also run tidy.mjs <port> at start and before close (required, rob-coding-helper section 1).
# Verify after first run: lane_stop.mjs, then Default/Preferences exit_type Normal (Edge writes no exited_cleanly key),
#   and a relaunch shows no restore prompt or unsupported-flag banner. Signing out and back in moves the profile from
#   Default to Profile 1 (edge1 on 2026-09-26): read Local State profile.last_used before checking Preferences.

select_helper_profile() {
  local lane="${1:-}" explicit_profile="${2:-}" profile_root="${3:-}"
  case "$lane" in [1-9]) ;; *) echo "ERROR: lane must be 1..9" >&2; return 2;; esac
  case "$explicit_profile" in
    "Default"|"Profile 2") ;;
    *) echo 'ERROR: pass an explicit verified profile: Default or Profile 2' >&2; return 2;;
  esac
  if [ -z "$profile_root" ] || [ ! -d "$profile_root/$explicit_profile" ]; then
    echo "ERROR: selected profile directory does not exist; refusing to start" >&2
    return 2
  fi
  printf '%s\n' "$explicit_profile"
}

N="$1"
case "$N" in [1-9]) ;; *) echo "usage: $0 <1-9> <profile-directory>" >&2; exit 2;; esac
PORT=$((9229 + N))
PROFILE_DIR="$HOME/CCowork-Local-Apps/claude-ensign-helper-edge$N-profile"
# Pinned sign-in per lane (Rob 2026-09-28): robbagley@ensign.edu for general CIS work, ecenter24@ensign.net for Copilot Studio.
# Never a personal account. Without a pin Edge reopens last_used, which on edge1 was robbagley@gmail.com (Profile 3).
PROFILE_NAME="$(select_helper_profile "$N" "${2:-}" "$PROFILE_DIR")" || exit 2
EDGE="/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"

devtools_ok() { curl -fsS --max-time 3 "http://127.0.0.1:$PORT/json/version" >/dev/null 2>&1; }
holder_pid() { pgrep -f -- "--user-data-dir=$PROFILE_DIR" | head -1; }

if devtools_ok; then echo "$(date '+%F %T') edge$N already healthy on $PORT"; exit 0; fi

PID="$(holder_pid)"
if [ -n "$PID" ]; then
  echo "ERROR: edge$N profile held by PID $PID but DevTools silent; refusing to start. Close through its owning tool." >&2
  exit 1
fi

# Chromium locks belong to its owning browser. Even dangling symlinks require
# investigation, not automatic deletion or a second browser against the profile.
for lock in SingletonLock SingletonCookie SingletonSocket DevToolsActivePort; do
  if [ -e "$PROFILE_DIR/$lock" ] || [ -L "$PROFILE_DIR/$lock" ]; then
    echo "ERROR: profile ownership artifact $lock exists; refusing to start. Report to Rob." >&2
    exit 1
  fi
done

echo "$(date '+%F %T') Starting edge$N on $PORT"
"$EDGE" \
  --remote-debugging-port=$PORT \
  --user-data-dir="$PROFILE_DIR" \
  --profile-directory="$PROFILE_NAME" \
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
