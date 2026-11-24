# Admin Panel / Settings / Translation

## What it is

Custom translation strings: a language, the string to replace, and what it
should say instead. They override the built-in translations for this instance,
for example to use your organization's own word for "board" or to correct a
string before the fix arrives from Transifex.

A string is stored per language, so the same string can be overridden
differently in each. WeKan's own translations are not edited here — they come
from [Transifex](https://explore.transifex.com/wekan/wekan/).

## Read more

- [Internationalization and localization](https://en.wikipedia.org/wiki/Internationalization_and_localization)
  on Wikipedia.
- [WeKan on Transifex](https://explore.transifex.com/wekan/wekan/) - where the
  built-in translations are made.
- [Table page](../../Table.md) - the shared table this pane is drawn
  with.

## How to use it

**Add a string**

1. Open **Admin Panel / Settings / Translation**
   (`/admin/settings/translation`).
2. Press **New**, the header of the first column.
3. **Language** - the language tag, `en` by default; it must be one of the
   languages WeKan has (as listed in
   [imports/i18n/languages.js](../../../../imports/i18n/languages.js)).
4. **Text** - the **key** of the string to replace, as it is in
   [imports/i18n/data/en.i18n.json](../../../../imports/i18n/data/en.i18n.json),
   for example `add-board`. It is not the English sentence.
5. **Translation text** - what it should say instead.
6. Press **Save**. If that language already has an override for that key, the
   popup says **Edit custom translation string** with the key and language, and
   nothing is saved.

**Change or delete a string**

1. Press **Edit** on its row: only **Translation text** can be changed
   (Language and Text are read-only). Press **Save**.
2. Or press **⋯** on its row, then **Delete**. *Are you sure you want to delete
   this custom translation string? There is no undo.*

**Find a string**

1. Type in the search box and press Enter. It matches the language, the text
   and the translation text.
2. Use prev/next to move between pages.

## How the numbers are calculated

- **Rows per page**: 10 (`TABLE_PAGE_ROWS_PER_PAGE` in
  [models/lib/tablePage.js](../../../../models/lib/tablePage.js)). One page is
  fetched at a time, server-side, newest-modified first.
- **The total** (*The number of custom translation strings is:*) is the number of
  strings that match the search, counted on the server by
  `getTranslationsCollectionCount`. It is counted when the pane opens and when
  the search changes, not on prev/next.
- **page X / N**: `N = max(1, ceil(total / 10))`; the page is clamped to
  `1 ... N`, so deleting the last row of the last page lands on a real page
  (`pageInfo()` in the same file).
- **Search** is a case-insensitive substring match; the characters of a regular
  expression are escaped, so what you type is matched literally.

## How it works in WeKan

- **Collection** `translation`
  ([models/translation.js](../../../../models/translation.js)): `language`
  (allowed values: the tags in `languages.js`), `text`, `translationText`,
  `createdAt`, `modifiedAt`.
- **Methods** in [server/models/translation.js](../../../../server/models/translation.js),
  each site-admin only: `setCreateTranslation` (refuses a second override of
  the same language and key with `text-already-taken`), `setTranslationText`,
  `deleteTranslation` and `getTranslationsCollectionCount`.
- **Permission**: client-side insert, update and remove are site-admin only
  ([server/permissions/translation.js](../../../../server/permissions/translation.js)),
  because several strings render as HTML.
- **Publication** `translation`
  ([server/publications/translation.js](../../../../server/publications/translation.js))
  returns one page, and only to a site administrator; a selector carrying an
  execution operator such as `$where` is refused (`safeSelector`).
- **Where the overrides are applied**: `loadLanguage()` in
  [imports/i18n/tap.js](../../../../imports/i18n/tap.js) reads the overrides of
  that language and lays them over the built-in file. A value that is empty,
  only spaces or equal to the key is ignored, so the built-in text stays
  visible. On the server (emails and other server-made text) every override
  applies. In the browser the overrides come through the same `translation`
  publication, which sends rows only to site administrators, so in the current
  code a user who is not a site administrator sees the built-in text.
- **The pane**: [client/components/settings/translationBody.jade](../../../../client/components/settings/translationBody.jade)
  and [translationBody.js](../../../../client/components/settings/translationBody.js),
  through the shared table page.
- **Tests**: [tests/translationPane.test.cjs](../../../../tests/translationPane.test.cjs)
  and [tests/tablePage.test.cjs](../../../../tests/tablePage.test.cjs).

## Commits

 - [Custom translations are site-admin only, closing a MegaBleed/TenantBleed sibling](https://github.com/wekan/wekan/commit/c5eb9fc060cbc9d5893f732fdb32b090fd8a86ab)
 - [The selector of the publication and the count is checked (WhereBleed)](https://github.com/wekan/wekan/commit/b4ebe48d7b62055bc5c9eca74600afd2658034b3)
 - [The table fits the pane](https://github.com/wekan/wekan/commit/d232194070314bbde9ab80f90cad037a215a90f9)
 - [The table lists its rows again](https://github.com/wekan/wekan/commit/73cd930a442faef277224be8bec560df5b142538)
 - [Translation becomes a Settings pane, below Accessibility](https://github.com/wekan/wekan/commit/a6af54161edb756e36752c1716cfe786d3aa9a1d)
 - [The pane gets the shared left menu](https://github.com/wekan/wekan/commit/f8225cd744719447881acfcdbc63df3c316c72ee)
 - [The pane stops loading every custom string at once](https://github.com/wekan/wekan/commit/19870ad52dbf509ed5ca9defbb7d517989be647c)
 - [Some translations were not visible; the New link moves to the left](https://github.com/wekan/wekan/commit/0e410b6d7afd40d24a69104e824a5569cba7d458)
 - [Only a site administrator may create a custom translation](https://github.com/wekan/wekan/commit/f244a43771f6ebf40218b83b9f46dba6b940d7de)
 - [A translation text may be set to an empty string](https://github.com/wekan/wekan/commit/021db14a436e89a294947abe69a0362d6462dbb9)
 - [Custom translation strings in the Admin Panel](https://github.com/wekan/wekan/commit/b1525d422164fa3a8f9c7b490fbc7104a21e03f4)
