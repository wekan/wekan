# Customize translations

In WeKan v7.08 and newer.

## What it is

WeKan has default translations from English to other languages at
https://explore.transifex.com/wekan/wekan/

With this feature, you can override some default translation string with custom
string, your modified new version of translation text, with GUI at Admin Panel,
and changes are immediately in use in WeKan.

## Read more

- [Internationalization and localization](https://en.wikipedia.org/wiki/Internationalization_and_localization)
  on Wikipedia.
- Source: [pull request 5085](https://github.com/wekan/wekan/pull/5085) and
  [issue 5065](https://github.com/wekan/wekan/issues/5065#issuecomment-1668259510).
- WeKan pages: [Admin Panel / Settings / Translation](../../Admin-Panel/Settings/Translation.md),
  [Translations](Translations.md).

## How to use it

**Admin Panel / Translation.**

1. Open Admin Panel / Settings / **Translation** and click **New**.
2. **Language**: the language tag, as in [languages.js](../../../../imports/i18n/languages.js)
   (for example `fi`).
3. **Text**: the source string to replace - its key in
   [en.i18n.json](../../../../imports/i18n/data/en.i18n.json) (for example
   `board`). The code looks a custom string up by that key.
4. **Translation text**: your new translation custom string.
5. Save. It is in use at once for everybody who uses that language.

<img src="https://wekan.fi/custom-translation-string.png" width="100%" alt="Translation Custom String" />

**To translators, about the word Custom.** Custom means something modified,
that is not the default. For example, WeKan has other feature
[Custom Fields](../../../API/Custom-Fields.md), where is added new custom
fields, that are not default.

## How the numbers are calculated

There are no numbers. A custom string wins over the built-in one for its
language and key; an empty one, or one equal to its key, is ignored so the
built-in translation stays visible.

## How it works in WeKan

- The strings are documents of the `translation` collection
  ([models/translation.js](../../../../models/translation.js)) with `language`
  (only tags listed in `languages.js` are allowed), `text` and
  `translationText`; the Admin Panel pages through them with
  [server/publications/translation.js](../../../../server/publications/translation.js)
  and [client/components/settings/translationBody.js](../../../../client/components/settings/translationBody.js).
- When a language loads, `TAPi18n` in [imports/i18n/tap.js](../../../../imports/i18n/tap.js)
  reads that language's custom strings and lays them over the catalog
  (`acc[text] = translationText`), after trimming both.
- Only a site admin may create, change or delete them (the MegaBleed /
  TenantBleed sibling fix).

## Commits

 - [Correct Tatar upload validation and custom translations](https://github.com/wekan/wekan/commit/e492230be383c0b9adeab29982d2c22ca45584e7)
 - [Custom translations are site-admin only](https://github.com/wekan/wekan/commit/c5eb9fc060cbc9d5893f732fdb32b090fd8a86ab)
 - [WhereBleed: Admin Panel handlers ran the caller's selector unchecked](https://github.com/wekan/wekan/commit/b4ebe48d7b62055bc5c9eca74600afd2658034b3)
 - [Admin Panel tables fit, every pane has a title](https://github.com/wekan/wekan/commit/d232194070314bbde9ab80f90cad037a215a90f9)
 - [Security fix: a non-admin could change a custom translation](https://github.com/wekan/wekan/commit/f244a43771f6ebf40218b83b9f46dba6b940d7de)
 - [Add custom translation strings in the Admin Panel](https://github.com/wekan/wekan/commit/b1525d422164fa3a8f9c7b490fbc7104a21e03f4)
