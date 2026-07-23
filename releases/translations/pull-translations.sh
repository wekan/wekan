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
  node releases/translations/fill-translations.mjs --missing || true
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
