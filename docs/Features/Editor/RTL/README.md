# Right-to-Left (RTL) UI

## What it is

WeKan has a full right-to-left user interface on **every page** when an RTL
language is selected: menus, lists, cards and popups are mirrored, so Arabic,
Persian, Hebrew and the other right-to-left languages read naturally.

## Read more

- [Right-to-left script](https://en.wikipedia.org/wiki/Right-to-left_script) on
  Wikipedia.
- The HTML [`dir` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/dir)
  and [CSS logical properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values)
  on MDN.
- WeKan pages: [Change Language](../../Member-Settings/Change-Language.md),
  [Accessibility](../../Accessibility/README.md),
  [Translations](../../Translations/README.md).

## How to use it

1. Use the language selector on the login page, or your member settings, to
   switch languages. See [Change Language](../../Member-Settings/Change-Language.md).
2. Choose an RTL language. The whole UI mirrors at once, with no reload.
3. Choose a left-to-right language to switch back.

## How the numbers are calculated

There are no numbers. A language is RTL when its entry in
[`imports/i18n/languages.js`](../../../../imports/i18n/languages.js) has the
`rtl` flag `true`; there are 16 such entries: Arabic (`ar`, `ar-DZ`, `ar-EG`),
Moroccan Arabic (`ary`), Central Kurdish (`ckb`), Persian/Farsi (`fa`, `fa-IR`),
Hebrew (`he`, `he-IL`), Kashmiri (`ks`), Pashto (`ps`), Sindhi (`sd`), Uyghur
(`ug`), Urdu (`ur`), Uzbek-Arabic (`uz-AR`) and Yiddish (`yi`). An older version
of this page listed only Arabic, Persian, Hebrew, Uyghur, Uzbek-Arabic and
Yiddish.

## How it works in WeKan

- `TAPi18n.isRTL()` and `getLanguageDirection()` in
  [imports/i18n/tap.js](../../../../imports/i18n/tap.js) read that flag.
- The root `<html>` element gets a reactive `dir="rtl"` / `dir="ltr"` attribute
  (and `lang`) that follows the chosen language
  ([client/lib/i18n.js](../../../../client/lib/i18n.js)), so the direction
  (and screen-reader pronunciation) switches instantly.
- Component CSS uses CSS **logical properties** (for example
  `margin-inline-start` instead of `margin-left`, `inset-inline-start` instead
  of `left`, `text-align: start` instead of `text-align: left`, `float:
  inline-start` instead of `float: left`), so layouts flip automatically with
  `dir`. A check mark's border is the one physical side the tests allow.
- RTL tests: [tests/rtl.test.js](../../../../tests/rtl.test.js) (fast,
  server-less) and the Playwright
  [tests/playwright/specs/18-rtl-layout.e2e.js](../../../../tests/playwright/specs/18-rtl-layout.e2e.js).

## Commits

 - [A checked checkbox sits on its own square in RTL languages too](https://github.com/wekan/wekan/commit/6bb926af1954ebce176b33d21914648e3c6f9a5c)
 - [The rtl test allows a check mark's physical border](https://github.com/wekan/wekan/commit/f1b183ac2ab9c9d4c1fc7759111e726e44a2cb4d)
 - [A checked checkbox is a check mark in RTL languages too](https://github.com/wekan/wekan/commit/b4bcded4924141f4756bacf593a824da6687f165)
 - [Urdu strings and wider RTL browser coverage](https://github.com/wekan/wekan/commit/762bb1df85f553e015a2c4834c1a24cd1c605cd2)
 - [Compact the language registry](https://github.com/wekan/wekan/commit/a3bc8155d27728f470a39765dd1eb65d666c3588)
 - [Removed Azeri from the RTL list](https://github.com/wekan/wekan/commit/627d1830150391073601595a68fd2c273951e68c)
 - [RTL information about languages](https://github.com/wekan/wekan/commit/cf7c0512422178be23d287cce269a7b854a2bc21)
 - [Fixed RTL issue 884](https://github.com/wekan/wekan/commit/1bdc1017d6c5396bd6354d5497e20d1c273e62e9)
