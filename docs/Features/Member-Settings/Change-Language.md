# Member Settings / Change Language

## What it is

**Change Language** chooses the language of the WeKan interface for you. WeKan
offers 245 languages and regional variants; the choice is saved to
your profile, so it follows you to every browser. Until you choose one, WeKan
follows the languages your browser asks for, and falls back to English. A site
administrator can also set the language of all users at once in the database,
as shown below.

## Read more

- [Language localisation](https://en.wikipedia.org/wiki/Language_localisation)
  and [IETF language tag](https://en.wikipedia.org/wiki/IETF_language_tag) on
  Wikipedia.
- [Accept-Language](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Language)
  on MDN - the browser's language list that WeKan follows when you have not
  chosen one.
- [Language browser settings](https://github.com/wekan/wekan/issues/4518#issuecomment-1133763518) -
  issue comment on how browser language settings affect WeKan.
- [MongoDB Shell](https://www.mongodb.com/docs/mongodb-shell/), used in the
  script below.
- [Member Settings / Date](Date/README.md) - the date format is chosen there, not
  by the language.

## How to use it

**Choose your own language**

1. Click your username or avatar at the top right, then **Change Language**.
2. The popup lists every language by its own name, with a flag, the region on
   a second line for regional variants, and *(RTL)* for languages written right
   to left. The current one has a check mark.
3. Click a language. The interface switches at once and the choice is saved.

**Change language for all users**

Using MongoDB Shell with WeKan Snap Candidate, to change English date format to
`DD/MM/YY` by setting every user's language to `en-GB`. (Today the date format
can also be chosen directly in [Member Settings / Date](Date/README.md), by the
board and by the site, without changing the language.)

MongoDB Shell Download: https://www.mongodb.com/try/download/shell

language.sh:
```
mongosh --quiet \
--host 127.0.0.1 \
--port 27019 \
--eval 'use wekan' \
--eval 'db.users.updateMany({}, { $set: {"profile.language": "en-GB" }});'
```
Set script as executeable:
```
chmod +x language.sh
```
Running script, when 5 new users of total 20 users did not have language set correctly yet:
```
$ ./language.sh 
{
  acknowledged: true,
  insertedId: null,
  matchedCount: 20,
  modifiedCount: 5,
  upsertedCount: 0
}
```

**Language browser settings**

https://github.com/wekan/wekan/issues/4518#issuecomment-1133763518

## How the numbers are calculated

- **245 languages:** the entries of `languageMetadata` in
  [imports/i18n/languages.js](../../../imports/i18n/languages.js); each loads
  its own `imports/i18n/data/<tag>.i18n.json` only when it is chosen.
- **Columns:** the popup fills the whole window and lays the languages out in
  as many columns as fit, each at least 280px wide (or the full width on a
  narrow screen): `repeat(auto-fill, minmax(min(100%, 280px), 1fr))` in
  [client/components/main/popup.css](../../../client/components/main/popup.css).
- In the script output above, `matchedCount` is how many user documents the
  filter `{}` found (all 20) and `modifiedCount` how many actually changed (the
  5 that did not have `en-GB` yet).

## How it works in WeKan

- **Popup:** `changeLanguagePopup` in
  [client/components/users/userHeader.jade](../../../client/components/users/userHeader.jade);
  clicking a language (`click .js-set-language` in
  [userHeader.js](../../../client/components/users/userHeader.js)) calls the
  method `setLanguage` and switches the page with `TAPi18n.setLanguage()`.
- **Method:** `setLanguage(language)` in
  [server/models/users.js](../../../server/models/users.js) refuses a caller who
  is not signed in and a language `TAPi18n.isLanguageSupported()` does not know,
  then saves `profile.language`.
- **Browser fallback:** with no saved language, the browser's ordered
  languages are matched against the registry, with `_` and `@` treated as `-`
  (`normalizeLanguageTag()` in
  [imports/i18n/browserLanguage.js](../../../imports/i18n/browserLanguage.js)),
  so for example `ca@valencia` resolves to Valencian.
- **Tests:** [tests/browserLanguageFallback.test.cjs](../../../tests/browserLanguageFallback.test.cjs),
  [tests/changeLanguageColumns.test.cjs](../../../tests/changeLanguageColumns.test.cjs),
  [tests/newLanguageWiring.test.cjs](../../../tests/newLanguageWiring.test.cjs)
  and [tests/i18nLazyLoading.test.cjs](../../../tests/i18nLazyLoading.test.cjs).

## Commits

 - [a saved language with @ resolves, so ca@valencia shows Valencian](https://github.com/wekan/wekan/commit/6a37160bc89c74d80a5f77ba1b228ede4e6593f6)
 - [language and country flags stay together on one row](https://github.com/wekan/wekan/commit/86b9354ca2f627c5e0b3c4b2e6e99f64292c1dbe)
 - [the RTL marker stays on the first line of the picker](https://github.com/wekan/wekan/commit/bdf511a2b833b719f527f1c10760fff0c72c73c0)
 - [full-width language picker with separate language and region lines](https://github.com/wekan/wekan/commit/c3ce54fa21acd848d7205a6e09c35bcadeb78df7)
 - [regional flags inside the language labels, and RTL layout reversed](https://github.com/wekan/wekan/commit/c8d17877e4534f62dc15c36a8abd573791c3cc9c)
 - [country and language flags for every regional locale](https://github.com/wekan/wekan/commit/8549b6c4c6c4915036cad2a670ab1f70e83d41c7)
 - [the browser's ordered languages are used when no language is saved](https://github.com/wekan/wekan/commit/1666a2012b1178b2b17faad0616df5dabaf18120)
 - [languages in several columns when there is width](https://github.com/wekan/wekan/commit/fc0649a756d0f6e6caf2feef659786a9908397b1)
