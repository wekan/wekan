#cd ~/repos/wekan

# Pull all languages from Transifex. NOTE: -f (force) OVERWRITES the local
# imports/i18n/data/<lang>.i18n.json files with whatever Transifex currently has —
# and `tx pull` fills any string that is UNtranslated on Transifex with the ENGLISH
# source. So a partially-translated language (or one whose strings were only ever
# edited directly in git, never entered on Transifex) silently loses translations
# back to English on every pull.
../tx --config .tx/config pull -a -f

# After pulling, list the language files where a previously-translated string reverted
# to English (untranslated on Transifex), so you can (re)translate them on Transifex or
# revert the file instead of committing the regression. Read-only; needs node + git.
if command -v node >/dev/null 2>&1; then
  node releases/translations/report-english-regressions.mjs || true
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
