#!/usr/bin/env bash
#
# fetch-mongo-tools.sh - put the MongoDB Database Tools for one platform into a
# bundle, as ONE program and eight small launchers.
#
#   Usage: fetch-mongo-tools.sh <bundle dir> <platform>
#          fetch-mongo-tools.sh --shims <bundle dir> <unix|windows>
#
#   <platform> is the suffix wekan/mongo-tools-patches names its assets with:
#   amd64, arm64, s390x, mac-arm64, mac-x64, win64, win-arm64, win32, ...
#   A platform starting with "win" gets .exe binaries and .cmd launchers.
#
#   Exit 0  the tools are in the bundle
#        1  wekan/mongo-tools-patches publishes no mongo-tools-<platform>; the
#           bundle has none (never the previous platform's - see below)
#        2  a download did not match its published SHA256, or failed outright
#
# WHY ONE PROGRAM. The eight tools are eight Go programs, and each carried its
# own copy of the Go runtime, the MongoDB driver and the tools' shared packages:
# about 105 MB per bundle, image and snap. wekan/mongo-tools-patches publishes
# only mongo-tools-<platform>, all eight as one program of about 15 MB (its
# releases/multicall.sh). Run as `mongo-tools mongodump ...` it is mongodump,
# with mongodump's own options, --help and --version.
#
# WHY LAUNCHERS AND NOT SYMLINKS. The program is also each tool when it is RUN
# under the tool's name, so a symlink would do on Linux and macOS - but a
# symlink has to survive `zip -r` (which stores the target eight times unless
# given -y), Docker COPY, snapcraft's organize, the .app packaging and every
# unzip a user runs. A three-line shell script survives all of them. On Windows
# there is no symlink to rely on at all, and a .cmd runs from cmd.exe and
# PowerShell alike. So `mongodump` keeps working everywhere it did, from
# $SNAP/bin, the bundle directory and PATH.
#
# NO PER-TOOL FALLBACK. The eight separate <tool>-<platform> binaries are not
# fetched even where an older release still carries them: one program per
# platform is the only shape WeKan ships, so every bundle, image and snap runs
# the same build of the tools. A platform without mongo-tools-<platform> ships
# without tools and says so.
#
# Whatever was in the bundle before is removed first. Every non-amd64 Linux
# bundle starts as a copy of the amd64 one, and an amd64 mongodump left in an
# s390x bundle is worse than none: it fails with "Exec format error" when an
# administrator needs a backup.

set -uo pipefail

TOOLS="bsondump mongodump mongoexport mongofiles mongoimport mongorestore mongostat mongotop"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE="${MONGO_TOOLS_BASE:-https://github.com/wekan/mongo-tools-patches/releases/latest/download}"

write_shims() {
  local dir="$1" kind="$2" t
  for t in $TOOLS; do
    if [ "$kind" = windows ]; then
      printf '@"%%~dp0mongo-tools.exe" %s %%*\r\n' "$t" > "$dir/$t.cmd"
    else
      cat > "$dir/$t" <<EOF
#!/bin/sh
# $t is one of the MongoDB Database Tools, which are all the one program
# mongo-tools beside this file (wekan/mongo-tools-patches).
self="\$0"; [ -L "\$self" ] && self="\$(readlink -f "\$self" 2>/dev/null || printf '%s' "\$self")"
exec "\$(dirname "\$self")/mongo-tools" $t "\$@"
EOF
      chmod +x "$dir/$t"
    fi
  done
}

if [ "${1:-}" = "--shims" ]; then
  dir="${2:?usage: fetch-mongo-tools.sh --shims <bundle dir> <unix|windows>}"
  kind="${3:?usage: fetch-mongo-tools.sh --shims <bundle dir> <unix|windows>}"
  case "$kind" in unix|windows) ;; *) echo "fetch-mongo-tools: --shims takes unix or windows, not $kind" >&2; exit 2 ;; esac
  write_shims "$dir" "$kind"
  exit 0
fi

dir="${1:?usage: fetch-mongo-tools.sh <bundle dir> <platform>}"
platform="${2:?usage: fetch-mongo-tools.sh <bundle dir> <platform>}"
[ -d "$dir" ] || { echo "fetch-mongo-tools: $dir is not a directory" >&2; exit 2; }
case "$platform" in win*) exe=.exe; kind=windows ;; *) exe=""; kind=unix ;; esac

for t in $TOOLS mongo-tools; do rm -f "$dir/$t" "$dir/$t.exe" "$dir/$t.cmd"; done

# fetch <url> <dest>: 0 verified (or no checksum published), 1 not published, 2 bad.
fetch() {
  local url="$1" dest="$2" sum want got
  bash "$HERE/fetch.sh" --optional -o "$dest" "$url" || { rm -f "$dest"; return 1; }
  sum="$dest.sha256sum.part"
  if bash "$HERE/fetch.sh" --optional -o "$sum" "$url.sha256sum"; then
    want="$(awk '{print $1; exit}' "$sum")"
    got="$( (sha256sum "$dest" 2>/dev/null || shasum -a 256 "$dest") | awk '{print $1}')"
    rm -f "$sum"
    if [ "$want" != "$got" ]; then
      echo "::error::fetch-mongo-tools: ${url##*/} does not match its published SHA256 (published $want, got $got)." >&2
      rm -f "$dest"
      return 2
    fi
  else
    rm -f "$sum"
    echo "::warning::wekan/mongo-tools-patches publishes no checksum for ${url##*/}, so it is unverified."
  fi
  chmod +x "$dest"
  return 0
}

fetch "$BASE/mongo-tools-$platform$exe" "$dir/mongo-tools$exe"
case $? in
  0)
    write_shims "$dir" "$kind"
    echo "fetch-mongo-tools: mongo-tools-$platform$exe, run as: $TOOLS"
    exit 0
    ;;
  2) exit 2 ;;
esac

echo "fetch-mongo-tools: wekan/mongo-tools-patches publishes no mongo-tools-$platform$exe; the bundle ships without the MongoDB Database Tools." >&2
exit 1
