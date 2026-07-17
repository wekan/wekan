#!/bin/sh
# Populate British English (en-GB) on Transifex with the English source verbatim.
#
# British English differs from the en source for only a handful of strings; the
# rest are legitimately identical. This copies imports/i18n/data/en.i18n.json to
# imports/i18n/data/en-GB.i18n.json (same content) and force-pushes it as the
# en_GB TRANSLATION, so every en-GB string shows as translated on Transifex
# (100%) instead of coming back as the English source on the next `tx pull`.
#
# lang_map in .tx/config maps `en_GB: en-GB`, so the Transifex language en_GB is
# stored locally as imports/i18n/data/en-GB.i18n.json. `-l en_GB` selects it (the
# Go CLI matches either the remote or the local code in getFilesToPush).
#
# -f is REQUIRED: without it the Go tx CLI skips the language whenever the local
# file is not newer than the server copy (internal/txlib/push.go shouldSkipPush),
# so the push would silently upload nothing.
#
# Needs the sibling ../tx binary and a valid Transifex token, same as the other
# scripts here.

set -e

# Move to the repo root regardless of where this is invoked from, so ../tx and
# the imports/ paths resolve the same way as the other translation scripts.
cd "$(dirname "$0")/../.."

en="imports/i18n/data/en.i18n.json"
engb="imports/i18n/data/en-GB.i18n.json"

if [ ! -f "$en" ]; then
  echo "[i18n] $en not found - are you in the wekan repo?"
  exit 1
fi

# en-GB is a verbatim copy of the English source.
cp "$en" "$engb"
echo "[i18n] copied $en -> $engb"

# Force-push the en-GB translation so the identical-to-source strings are stored
# as real translations (100% translated) and survive future pulls.
../tx push -t -l en_GB -f
