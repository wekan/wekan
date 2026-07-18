#!/bin/sh
# Force-push the English source AND every language's translations to Transifex.
#
# Unlike releases/translations/push-translation.sh (one language) this uploads
# every language at once, in a single run.
#
# -f (force) is REQUIRED here, or the Go tx CLI skips any language whose local
# file is not newer than the server copy (internal/txlib/push.go shouldSkipPush),
# so a freshly reverted/edited file would silently upload nothing and the next
# `tx pull` would revert it back to English again.
#
# WARNING: this OVERWRITES whatever is currently on Transifex for every language
# with the local imports/i18n/data/<lang>.i18n.json files — INCLUDING any newer
# community translations entered on Transifex since your last pull. If you want
# to keep those, run releases/translations/pull-translations.sh FIRST, then this.
#
# Needs the sibling ../tx binary and a valid Transifex token, the same as the
# other scripts in releases/translations/.
set -e

# Move to the repo root regardless of where this is invoked from, so ../tx and
# the imports/ paths resolve the same way as the other translation scripts.
# This script lives in releases/translations/, so the repo root is two levels up.
cd "$(dirname "$0")/../.."

if [ ! -x ../tx ]; then
  echo "[i18n] ../tx (Transifex CLI) not found next to the repo. Aborting."
  exit 1
fi

# 1) Push the English source first, so any new keys exist on Transifex before
#    the per-language translations that reference them are uploaded.
echo "[i18n] pushing English source (-s)..."
../tx push -s

# 2) Force-push every language's translations (no -l = all languages in config).
echo "[i18n] force-pushing all translations (-t -f, all languages)..."
../tx push -t -f

echo "[i18n] done. All languages force-pushed to Transifex."
