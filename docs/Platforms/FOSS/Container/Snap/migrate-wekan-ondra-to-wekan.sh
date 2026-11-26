#!/usr/bin/env bash
# Move a WeKan server from the wekan-ondra snap to the official wekan snap:
# its settings (snap set), its data (/var/snap/wekan-ondra/common: the
# FerretDB SQLite or MongoDB database, attachments, avatars, the Caddyfile)
# and its service. wekan-ondra is stopped and disabled, NOT removed: its
# data stays where it is, so the move can be undone.
#
#   sudo bash migrate-wekan-ondra-to-wekan.sh            # asks before changing anything
#   sudo bash migrate-wekan-ondra-to-wekan.sh --yes      # no question
#   sudo bash migrate-wekan-ondra-to-wekan.sh --dry-run  # only shows what it would do
#   options: --channel latest/stable   the wekan channel to install from
#
# Undo, while wekan-ondra is still installed:
#   sudo snap stop --disable wekan
#   sudo snap start --enable wekan-ondra
#
# The two snaps use the same ports (WeKan 8080, MongoDB 27019, Caddy 3001), so
# only one of them runs at a time. wekan must be the same version as
# wekan-ondra or newer: the database moves forward, never back.
#
# SNAP_BIN and WEKAN_SNAP_ROOT replace the snap command and /var/snap, and
# WEKAN_MIGRATE_ALLOW_NONROOT=1 the root check, for tests/snapOndraMigrate.test.cjs.
set -euo pipefail

FROM=wekan-ondra
TO=wekan
SNAP_BIN="${SNAP_BIN:-snap}"
ROOT="${WEKAN_SNAP_ROOT:-/var/snap}"
YES=0
DRY=0
CHANNEL=""

usage() { sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'; }
while [ $# -gt 0 ]; do
  case "$1" in
    --yes|-y) YES=1 ;;
    --dry-run|-n) DRY=1 ;;
    --channel) shift; CHANNEL="${1:-}"; [ -n "$CHANNEL" ] || { echo "--channel needs a value" >&2; exit 2; } ;;
    --channel=*) CHANNEL="${1#--channel=}" ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
  shift
done

say() { printf '%s\n' "$*"; }
fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
# A command that changes something: shown, and run unless --dry-run.
run() {
  printf '+ %s\n' "$*"
  [ "$DRY" = 1 ] || "$@"
}

if [ "${WEKAN_MIGRATE_ALLOW_NONROOT:-0}" != 1 ] && [ "$(id -u)" != 0 ]; then
  fail "run it as root: sudo bash $0"
fi
command -v "$SNAP_BIN" >/dev/null 2>&1 || fail "the snap command ($SNAP_BIN) is not found"

# The installed version of a snap, '' when it is not installed.
version_of() { "$SNAP_BIN" list "$1" 2>/dev/null | awk -v n="$1" '$1 == n { print $2 }'; }
tracking_of() { "$SNAP_BIN" list "$1" 2>/dev/null | awk -v n="$1" '$1 == n { print $4 }'; }
# Whether version $1 is older than $2 (WeKan's versions are numbers: v8.10, 8.10...).
older() { [ "$1" != "$2" ] && [ "$(printf '%s\n%s\n' "${1#v}" "${2#v}" | sort -V | head -n1)" = "${1#v}" ]; }

FROM_VERSION="$(version_of "$FROM")"
[ -n "$FROM_VERSION" ] || fail "$FROM is not installed: there is nothing to move"
[ -d "$ROOT/$FROM/common" ] || fail "$ROOT/$FROM/common is not there: there is no data to move"
TO_VERSION="$(version_of "$TO")"
[ -n "$CHANNEL" ] || CHANNEL="$(tracking_of "$FROM")"
case "$CHANNEL" in ''|-) CHANNEL="latest/stable" ;; esac

# The settings, as JSON (snap get -d), each top-level option a line
# key<TAB>value. A path under /var/snap/wekan-ondra/ becomes wekan's.
settings_lines() {
  local json; json="$("$SNAP_BIN" get -d "$FROM" 2>/dev/null || echo '{}')"
  if command -v python3 >/dev/null 2>&1; then
    printf '%s' "$json" | python3 -c '
import json, sys
data = json.load(sys.stdin)
for key, value in data.items():
    if isinstance(value, (dict, list)) or value is None:
        continue
    if isinstance(value, bool):
        value = "true" if value else "false"
    value = str(value).replace("/var/snap/wekan-ondra/", "/var/snap/wekan/")
    if "\n" in value or "\t" in key or "\n" in key:
        continue
    print(key + "\t" + value)
'
  elif command -v jq >/dev/null 2>&1; then
    printf '%s' "$json" | jq -r 'to_entries[] | select(.value | type != "object" and type != "array" and . != null)
      | "\(.key)\t\(.value | tostring | gsub("/var/snap/wekan-ondra/"; "/var/snap/wekan/"))"'
  else
    fail "python3 or jq is needed to read the settings of $FROM (snap get -d $FROM)"
  fi
}

say "Moving WeKan from the $FROM snap ($FROM_VERSION) to the $TO snap."
if [ -n "$TO_VERSION" ]; then say "$TO is installed ($TO_VERSION)."; else say "$TO will be installed from $CHANNEL."; fi
say ""
say "What happens:"
say "  1. $TO is installed (or refreshed, when it is older than $FROM)."
say "  2. Every setting of $FROM is set on $TO."
say "  3. $FROM is stopped and disabled. It is not removed: its data stays in $ROOT/$FROM/common."
if [ -d "$ROOT/$TO/common" ] && [ -n "$(ls -A "$ROOT/$TO/common" 2>/dev/null)" ]; then
  say "  4. $TO's own data ($ROOT/$TO/common) is moved aside to $ROOT/$TO/common.before-$FROM-<time>,"
  say "     and $FROM's data is copied in its place."
else
  say "  4. $FROM's data is copied to $ROOT/$TO/common."
fi
say "  5. $TO is started."
say ""
if [ "$DRY" = 1 ]; then
  say "Dry run: nothing is changed."
elif [ "$YES" != 1 ]; then
  printf 'Continue? [y/N] '
  read -r answer || answer=""
  case "$answer" in y|Y|yes|YES) ;; *) say "Nothing was changed."; exit 1 ;; esac
fi

# 1. wekan, the same version as wekan-ondra or newer.
if [ -z "$TO_VERSION" ]; then
  run "$SNAP_BIN" install "$TO" --channel="$CHANNEL"
elif older "$TO_VERSION" "$FROM_VERSION"; then
  run "$SNAP_BIN" refresh "$TO"
fi
if [ "$DRY" != 1 ]; then
  TO_VERSION="$(version_of "$TO")"
  [ -n "$TO_VERSION" ] || fail "$TO did not install"
  if older "$TO_VERSION" "$FROM_VERSION"; then
    fail "$TO ($TO_VERSION) is older than $FROM ($FROM_VERSION); the data would move back. Install a newer $TO first: snap refresh $TO --channel=<channel>"
  fi
fi

# 2. The settings.
lines="$(settings_lines)"
count=0
if [ -n "$lines" ]; then
  while IFS=$'\t' read -r key value; do
    [ -n "$key" ] || continue
    run "$SNAP_BIN" set "$TO" "$key=$value"
    count=$((count + 1))
  done <<< "$lines"
fi
say "$count settings moved."

# 3. Only one of them runs: the same ports.
run "$SNAP_BIN" stop --disable "$FROM"
run "$SNAP_BIN" stop "$TO"

# 4. The data.
stamp="$(date +%Y%m%d-%H%M%S)"
if [ -d "$ROOT/$TO/common" ] && [ -n "$(ls -A "$ROOT/$TO/common" 2>/dev/null)" ]; then
  run mv "$ROOT/$TO/common" "$ROOT/$TO/common.before-$FROM-$stamp"
fi
run mkdir -p "$ROOT/$TO/common"
run cp -a "$ROOT/$FROM/common/." "$ROOT/$TO/common/"
# The Caddyfile may name wekan-ondra's paths (its certificates).
if [ -f "$ROOT/$TO/common/Caddyfile" ] || [ "$DRY" = 1 ]; then
  run sed -i "s#/var/snap/$FROM/#/var/snap/$TO/#g" "$ROOT/$TO/common/Caddyfile"
fi
# A MongoDB pid or lock file of the stopped wekan-ondra is not wekan's.
for stale in mongodb.pid mongod.lock; do
  if [ -f "$ROOT/$TO/common/$stale" ]; then run rm -f "$ROOT/$TO/common/$stale"; fi
done

# 5. wekan.
run "$SNAP_BIN" start --enable "$TO"

say ""
if [ "$DRY" = 1 ]; then
  say "Dry run done: nothing was changed."
else
  say "Done: WeKan runs from the $TO snap, with $FROM's settings and data."
  say "Check it in the browser, then remove the old snap:  sudo snap remove $FROM"
  say "Undo, before removing it:  sudo snap stop --disable $TO && sudo snap start --enable $FROM"
fi
