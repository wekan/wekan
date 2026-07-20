# Right-to-Left (RTL) UI

WeKan has a full right-to-left user interface on **every page** when an RTL language
is selected.

## How it works

- When you choose an RTL language, the whole UI mirrors at once.
- The RTL languages are those flagged `rtl: true` in
  [`imports/i18n/languages.js`](../../../../imports/i18n/languages.js):
  Arabic and its variants, Persian/Farsi, Hebrew, Uyghur, Uzbek-Arabic and Yiddish.
- The root `<html>` element gets a reactive `dir="rtl"` / `dir="ltr"` attribute that
  follows the chosen language, so the direction (and screen-reader pronunciation)
  switches instantly.
- Component CSS uses CSS **logical properties** (for example `margin-inline-start`
  instead of `margin-left`, `inset-inline-start` instead of `left`, `text-align:
  start` instead of `text-align: left`, `float: inline-start` instead of `float:
  left`), so layouts flip automatically with `dir`.

## Changing the language

Use the language selector on the login page, or your member settings, to switch
languages. See [Change Language](../../../Translations/Change-Language.md).

## Related

- [Accessibility](../../Accessibility/Accessibility.md)
- [Translations](../../../Translations/Translations.md)
- RTL tests: `tests/rtl.test.js` (fast, server-less) and the Playwright
  `tests/playwright/specs/18-rtl-layout.e2e.js`.
