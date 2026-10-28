#!/bin/bash
#
# tools-env.sh - keep every file WeKan's scripts write inside .tools/.
#
#   Usage (source it):  . "$(dirname "${BASH_SOURCE[0]}")/tools-env.sh"
#
# .tools/ is ignored by .gitignore and .meteorignore, so nothing written there
# can reach a commit or trigger a Meteor rebuild. The scripts used to write
# all over the machine instead: downloads and release zips to ~/Downloads or
# ~/Lataukset, temporary files to /tmp (or macOS's /var/folders), Meteor to
# ~/.meteor, nvm and Node.js to ~/.nvm, the npm cache to ~/.npm, Volta to
# ~/.volta, the Sandstorm toolchain to ~/projects, and PATH lines into
# ~/.zshrc and ~/.bashrc. Each now lives under .tools/, on Linux, macOS and
# Windows (Git Bash, WSL) alike:
#
#   .tools/tmp         TMPDIR, TMP, TEMP - temporary files, downloads, release zips
#   .tools/.meteor     Meteor (METEOR_WAREHOUSE_DIR once installed there; on PATH)
#   .tools/nvm         nvm and the Node.js it installs (NVM_DIR), macOS
#   .tools/n           the Node.js n installs (N_PREFIX), Linux
#   .tools/npm-cache   npm's cache (npm_config_cache)
#   .tools/volta       Volta (VOLTA_HOME)
#   .tools/projects/meteor-spk  the Sandstorm packaging toolchain (as projects.7z unpacks)
#   .tools/gopath, gocache, gomodcache  Go, for FerretDB builds
#   .tools/ms-playwright  the Playwright browsers
#
# HOME itself is NOT moved: git reads ~/.gitconfig (the commit author) and
# ~/.ssh from it, and gh its login. Only what WeKan's scripts write is moved.
# Sourcing twice is harmless.

WEKAN_DIR="${WEKAN_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
WEKAN_TOOLS_DIR="${WEKAN_TOOLS_DIR:-$WEKAN_DIR/.tools}"
# Only a WeKan source tree gets a .tools/: scripts mounted into a build container
# without one (/releases) must not make a /.tools/tmp in the container's layer.
# A copy of the tree without .git is one too - the snap variants' project dir
# (/root/project) is, and without a .tools/tmp there every fetch.sh in their
# snapcraft.yaml stopped at "TMPDIR: unbound variable" (v12.66).
if [ -e "$WEKAN_DIR/.git" ] || [ -d "$WEKAN_TOOLS_DIR" ] \
  || { [ -f "$WEKAN_DIR/package.json" ] && [ -f "$WEKAN_DIR/releases/tools-env.sh" ]; }; then
  mkdir -p "$WEKAN_TOOLS_DIR/tmp" 2>/dev/null || true
fi

# Not "if unset": macOS always sets TMPDIR (to /var/folders/...), and a CI
# runner sets its own - and those are exactly what is being replaced. Inside a
# build container, where the scripts are mounted without the checkout, the
# caller mounts .tools/tmp as the container's /tmp and sets TMPDIR to it
# (repack-bundle-for-arch.sh): a container's own /tmp is too small to use.
# macOS's mktemp ignores TMPDIR when it is given no template, so every script
# names one: mktemp "$TMPDIR/name.XXXXXX".
case "${TMPDIR:-}/" in
  */.tools/*) ;;   # already inside a .tools/ - a test's own directory there is kept
  *) if [ -w "$WEKAN_TOOLS_DIR/tmp" ]; then TMPDIR="$WEKAN_TOOLS_DIR/tmp"; fi ;;
esac
if [ -z "${TMPDIR:-}" ] || [ ! -w "$TMPDIR" ]; then
  echo "tools-env.sh: $WEKAN_TOOLS_DIR/tmp cannot be written and no writable TMPDIR is set" >&2
  return 1 2>/dev/null || exit 1
fi
TMP="$TMPDIR"
TEMP="$TMPDIR"
WEKAN_DOWNLOADS="$TMPDIR"
# Meteor reads its packages from METEOR_WAREHOUSE_DIR (default ~/.meteor). It
# is pointed at .tools/.meteor only once Meteor is installed there - build.sh's
# install-dependencies option does that - so a Meteor still in ~/.meteor keeps
# working until then instead of finding an empty warehouse.
if [ -x "$WEKAN_TOOLS_DIR/.meteor/meteor" ]; then
  METEOR_WAREHOUSE_DIR="$WEKAN_TOOLS_DIR/.meteor"
  export METEOR_WAREHOUSE_DIR
fi
NVM_DIR="$WEKAN_TOOLS_DIR/nvm"
npm_config_cache="$WEKAN_TOOLS_DIR/npm-cache"
VOLTA_HOME="$WEKAN_TOOLS_DIR/volta"
WEKAN_METEOR_SPK_DIR="$WEKAN_TOOLS_DIR/projects/meteor-spk"
# Go, for FerretDB builds, keeps its module and build caches here too.
GOPATH="$WEKAN_TOOLS_DIR/gopath"
GOCACHE="$WEKAN_TOOLS_DIR/gocache"
GOMODCACHE="$WEKAN_TOOLS_DIR/gomodcache"
PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-$WEKAN_TOOLS_DIR/ms-playwright}"
export WEKAN_DIR WEKAN_TOOLS_DIR TMPDIR TMP TEMP WEKAN_DOWNLOADS \
  NVM_DIR npm_config_cache VOLTA_HOME WEKAN_METEOR_SPK_DIR \
  GOPATH GOCACHE GOMODCACHE PLAYWRIGHT_BROWSERS_PATH

# The tools installed there come first on PATH, so no shell rc file has to be
# edited for a new shell to find them: Meteor, n's Node.js, the newest nvm put in
# .tools/nvm, Volta's, the Sandstorm meteor-spk, and .tools/bin.
_wekan_env_path="$WEKAN_TOOLS_DIR/bin:$WEKAN_TOOLS_DIR/.meteor:$WEKAN_TOOLS_DIR/n/bin:$VOLTA_HOME/bin"
if [ -d "$NVM_DIR/versions/node" ]; then
  _wekan_env_node="$(ls -d "$NVM_DIR"/versions/node/v*/bin 2>/dev/null | sort -V | tail -n 1 || true)"
  if [ -n "$_wekan_env_node" ]; then _wekan_env_path="$_wekan_env_path:$_wekan_env_node"; fi
fi
# Written to never fail under a caller's `set -euo pipefail`: ls of a missing
# directory fails, and pipefail makes that the substitution's status.
_wekan_env_spk="$(ls -d "$WEKAN_METEOR_SPK_DIR"/meteor-spk-* 2>/dev/null | sort -V | tail -n 1 || true)"
if [ -n "$_wekan_env_spk" ]; then _wekan_env_path="$_wekan_env_path:$_wekan_env_spk"; fi
case ":$PATH:" in
  *":$WEKAN_TOOLS_DIR/bin:$WEKAN_TOOLS_DIR/.meteor:"*) ;;
  *) PATH="$_wekan_env_path:$PATH" ;;
esac
export PATH
unset _wekan_env_path _wekan_env_node _wekan_env_spk
