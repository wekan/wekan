#cd ~/repos/wekan

# Pull all languages from Transifex. NOTE: -f (force) OVERWRITES the local
# imports/i18n/data/<lang>.i18n.json files with whatever Transifex currently has —
# and `tx pull` fills any string that is UNtranslated on Transifex with the ENGLISH
# source. So a partially-translated language (or one whose strings were only ever
# edited directly in git, never entered on Transifex) silently loses translations
# back to English on every pull.
../tx --config .tx/config pull -a -f

# After pulling, find the language files where a previously-translated string
# reverted to English (untranslated on Transifex). Needs node + git.
if command -v node >/dev/null 2>&1; then
  # Human-readable report for the log (which strings reverted to English on the pull).
  node releases/translations/report-english-regressions.mjs || true

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
  # The script prints each restored language code; push those back to Transifex (force,
  # or the timestamp guard skips it) so they stop reverting on future pulls.
  restored_langs=$(node releases/translations/merge-translations.mjs)
  if [ -n "$restored_langs" ]; then
    echo "$restored_langs" | while IFS= read -r lang; do
      [ -n "$lang" ] || continue
      echo "[i18n] push restored $lang back to Transifex (so it stops reverting)"
      ../tx push -t -l "$lang" -f
    done
  fi
else
  echo "[i18n] node not found - skipping the merge + English-regression report."
fi

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
