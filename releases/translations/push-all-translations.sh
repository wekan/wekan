#!/bin/sh
# Force-push the English source AND every language's translations to Transifex.
#
# Unlike releases/translations/push-translation.sh (one language) this uploads
# every language at once, in a single run.
#
# WHY THIS USED TO PUSH ONLY SOME OF THEM
#
# `tx push -t` uploads translations for the languages the PROJECT has as
# targets. A language that exists only here — every language added to
# imports/i18n/data/ since the project was last reconciled — is not a target
# there, so the CLI skips its file without saying so and the run reports a
# number smaller than the repository holds. WeKan ships 245 translated
# languages; the project had 146, so ninety-nine of them were pushed nowhere and
# nothing in the output said which.
#
# So the languages are reconciled with the project FIRST, and the count is
# printed at both ends of the run. A language Transifex refuses is named, not
# swallowed — that is a code to map in .tx/config's lang_map (the way `vec:
# ve-CC` already is) or to create on Transifex, and until then that language
# still ships in WeKan and simply does not round-trip.
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
# other scripts in releases/translations/. The reconcile step needs the token as
# TX_TOKEN or in ~/.transifexrc, which is the file the tx CLI itself writes.
#
# Usage:
#   releases/translations/push-all-translations.sh
#   releases/translations/push-all-translations.sh --skip-sync   # push only
set -e

# Move to the repo root regardless of where this is invoked from, so ../tx and
# the imports/ paths resolve the same way as the other translation scripts.
# This script lives in releases/translations/, so the repo root is two levels up.
cd "$(dirname "$0")/../.."

if [ ! -x ../tx ]; then
  echo "[i18n] ../tx (Transifex CLI) not found next to the repo. Aborting."
  exit 1
fi

LOCAL_COUNT=$(node releases/translations/sync-transifex-languages.mjs --list | wc -l | tr -d ' ')
echo "[i18n] $LOCAL_COUNT language(s) to push (English is the source, not a target)."

# 1) Make the project know every language this repo has, or `tx push -t` below
#    will skip the ones it has never heard of. Skippable for a push that is
#    known to add no new language, and for a machine with no API token.
if [ "$1" = "--skip-sync" ]; then
  echo "[i18n] --skip-sync: not reconciling the project's languages."
else
  echo "[i18n] reconciling the project's target languages with $LOCAL_COUNT local file(s)..."
  if ! node releases/translations/sync-transifex-languages.mjs; then
    echo "[i18n] Could not reconcile the languages (see above)."
    echo "[i18n] Pushing anyway would skip every language the project does not have,"
    echo "[i18n] which is the bug this step exists to stop. Fix the token, or re-run"
    echo "[i18n] with --skip-sync if you accept a partial push."
    exit 1
  fi
fi

# 2) Push the English source, so any new keys exist on Transifex before the
#    per-language translations that reference them are uploaded.
echo "[i18n] pushing English source (-s)..."
../tx push -s

# 3) Force-push every language's translations (no -l = all languages in config).
echo "[i18n] force-pushing all translations (-t -f, all languages)..."
../tx push -t -f

echo "[i18n] done. $LOCAL_COUNT language(s) force-pushed to Transifex."
echo "[i18n] If the CLI above reported fewer, run"
echo "[i18n]   node releases/translations/sync-transifex-languages.mjs --dry-run"
echo "[i18n] to see which languages the project is still missing and why."
