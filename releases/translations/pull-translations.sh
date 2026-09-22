#!/bin/sh
set -eu

translation_repo_dir=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
cd "$translation_repo_dir"
mkdir -p .tools/tmp
export TMPDIR="$translation_repo_dir/.tools/tmp"
translation_node=${NODE_BIN:-node}
if ! command -v "$translation_node" >/dev/null 2>&1; then
  echo "[i18n] $translation_node is required before pulling; refusing to overwrite local human translations without the merge." >&2
  exit 1
fi

# Pull all languages from Transifex. NOTE: -f (force) OVERWRITES the local
# imports/i18n/data/<lang>.i18n.json files with whatever Transifex currently has —
# and `tx pull` fills any string that is UNtranslated on Transifex with the ENGLISH
# source. So a partially-translated language (or one whose strings were only ever
# edited directly in git, never entered on Transifex) silently loses translations
# back to English on every pull.
# Preserve every local value, including uncommitted direct fills, before tx
# overwrites the files. The merge uses this snapshot only as a fallback for
# keys Transifex still returns as English.
before_dir=$(mktemp -d "$TMPDIR/wekan-i18n-before-pull.XXXXXX")
pull_complete=0
cleanup_pull() {
  pull_status=$?
  if [ "$pull_complete" -ne 1 ]; then
    # tx or a repair step may fail after overwriting some locale files. Restore
    # the exact pre-pull snapshot so local human translations survive the error.
    cp -a "$before_dir/." imports/i18n/data/ ||
      echo "[i18n] could not restore all local translations from $before_dir" >&2
    echo '[i18n] pull failed; restored pre-pull locale files' >&2
  fi
  rm -rf "$before_dir"
  exit "$pull_status"
}
trap cleanup_pull 0
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM
cp -a imports/i18n/data/. "$before_dir/"

../tx --config .tx/config pull -a -f

# Transifex offers both Kannada (kn) and Kannada (India) (kn_IN). WeKan uses
# the translated kn locale; an untranslated kn_IN pull is an exact copy of the
# English source and is not a registered app language. Drop only that exact
# duplicate, leaving a future real kn_IN translation available for review.
if [ -f imports/i18n/data/kn_IN.i18n.json ] &&
   cmp -s imports/i18n/data/kn_IN.i18n.json imports/i18n/data/en.i18n.json; then
  rm imports/i18n/data/kn_IN.i18n.json
  echo '[i18n] removed untranslated kn_IN duplicate; translated kn remains active'
fi

# After pulling, find the language files where a previously-translated string
# reverted to English (untranslated on Transifex). Needs node + git.
if command -v "$translation_node" >/dev/null 2>&1; then
  # Human-readable report for the log (which strings reverted to English on the pull).
  "$translation_node" releases/translations/report-english-regressions.mjs --before-dir "$before_dir" || true

  # Per-KEY merge — the policy: never overwrite a human translation with a machine
  # (English) one, but always keep the newest Transifex translations. For every
  # language file and every string key:
  #   - Transifex has a real translation        -> keep it (newest human translation);
  #   - the pull reverted it to English but a    -> restore the committed translation
  #     human translation was committed             (works even in files that ALSO got
  #                                                  real new Transifex translations,
  #                                                  which the old whole-file restore
  #                                                  had to skip and thus lost);
  #   - no translation anywhere (untranslated    -> leave the English placeholder, the
  #     on Transifex AND never committed)            ONLY case a machine translation is
  #                                                  used, so a separate machine-
  #                                                  translation step can fill just those
  #                                                  and can never clobber a human one.
  # This is deliberately ONE-WAY. A pulled non-English Transifex value wins;
  # when Transifex has only English, the pre-pull local value is restored.
  # Never push here: the fallback may be a direct machine/LLM fill, and without
  # provenance metadata it must not be uploaded as if it were human.
  "$translation_node" releases/translations/merge-translations.mjs --before-dir "$before_dir"
  # Reapply reviewed corrections only when the exact audited bad value recurs.
  # Newer target-language wording never matches these old fingerprints.
  "$translation_node" releases/translations/repair-audited-translations.mjs --apply
  # Transifex can return its protected-token markers (for example @PH0@)
  # literally. Restore the corresponding source code/HTML tokens while keeping
  # the surrounding human translation.
  "$translation_node" releases/translations/repair-machine-placeholders.mjs --apply
  # Some known bad Transifex values can only be recognized after @PH markers
  # become their real tokens. Restore the reviewed pre-fill human values last,
  # while leaving every newer valid human translation untouched.
  "$translation_node" releases/translations/restore-pre-machine-humans.mjs --apply

  # After the merge, the ONLY English-valued strings left are placeholders untranslated
  # everywhere (incl. every string of a language that has no translation at all). Those are
  # translated WITHOUT any external service, API or password: the maintainer/assistant (an
  # LLM) translates them directly into each language file, using that language's existing
  # translations and general kanban terminology as the reference, and applies them with
  #   node releases/translations/fill-translations.mjs --list <lang>   # what still needs it
  #   node releases/translations/fill-translations.mjs --apply <lang> translated.json
  # --apply writes ONLY into placeholder keys, so it can NEVER overwrite a human
  # translation, and these filled strings stay LOCAL — they are NOT pushed to Transifex, so
  # they can never masquerade as human there. List what remains across all languages with:
  echo "[i18n] remaining untranslated strings per language (translate + fill-translations.mjs, no service):"
  "$translation_node" releases/translations/fill-translations.mjs --missing || true
fi
pull_complete=1

# https://developers.transifex.com/docs/cli
# New Go-based transifex client.
# 1. Migrated: tx migrate
# 2. Pushed all: tx push -a -l
# 3. Pulled all: tx pull -a -l
# Although now all show as translated, maybe I did something wrong.
#
# Each language must map to its OWN imports/i18n/data/<lang>.i18n.json file - see the
# lang_map in .tx/config. In particular Japanese has three separate files/entries:
#   ja      -> ja.i18n.json,  ja_JP -> ja-JP.i18n.json,  ja-Hira -> ja-HI.i18n.json
# (a previous lang_map had `ja_JP: ja`, which wrote Transifex's ja_JP INTO ja.i18n.json
# and clobbered the real Japanese with English on every pull).
