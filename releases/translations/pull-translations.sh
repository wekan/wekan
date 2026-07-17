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
  # Human-readable report for the log (also flags files that are NOT auto-healed
  # because they carry other, non-revert changes from Transifex).
  node releases/translations/report-english-regressions.mjs || true

  # Auto-heal, but ONLY files whose changes are ENTIRELY reverts (the --files
  # mode already excludes any file that also has a real new/updated translation
  # from Transifex, which a whole-file checkout would throw away). For each such
  # file: restore the committed translations with `git checkout --`, then force
  # push them back to Transifex (force, or the push is skipped by the timestamp
  # guard) so they stop reverting on future pulls.
  reverted=$(node releases/translations/report-english-regressions.mjs --files 2>/dev/null)
  if [ -n "$reverted" ]; then
    echo "$reverted" | while IFS= read -r f; do
      [ -n "$f" ] || continue
      lang=$(basename "$f" .i18n.json)
      echo "[i18n] auto-heal: git checkout HEAD -- $f  &&  push $lang back to Transifex"
      # Restore from HEAD explicitly (the version the detector compared against),
      # not the index, so a staged change can't restore the wrong content.
      git checkout HEAD -- "$f"
      ../tx push -t -l "$lang" -f
    done
  fi
else
  echo "[i18n] node not found - skipping the English-regression report."
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
