# Change language popup

## What it is

The Change Language popup is where a user picks the language WeKan is shown
in. Every registered language is listed by its own name, with its flag. When a
user has not chosen, WeKan uses the browser's preferred languages, and English
when none of them is supported.

## Read more

- [IETF language tag](https://en.wikipedia.org/wiki/IETF_language_tag) and
  [Regional indicator symbol](https://en.wikipedia.org/wiki/Regional_indicator_symbol)
  (flag emoji) on Wikipedia.
- [navigator.languages](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/languages)
  on MDN and [Unicode CLDR likely subtags](https://www.unicode.org/reports/tr35/tr35-78/tr35.html).
- WeKan pages: [Change Language](../../Member-Settings/Change-Language.md),
  [Translations](Translations.md), [RTL](../Editor/RTL/RTL.md).

## How to use it

1. Open the popup: the language selector on the login page, or Member Settings
   → **Change Language**.
2. Click a language. WeKan changes at once (and mirrors for a right-to-left
   language); a logged-in choice is saved in your profile.
3. A saved profile language always wins over the browser's preferences.

## How the numbers are calculated

- **245** registered locales, each listed once (`imports/i18n/languages.js`).
- **Browser fallback order:** every `navigator.languages` entry in order, then
  `navigator.language`, then the legacy `navigator.userLanguage`, then English.
- **Matching** ignores case and `-`/`_`, maps standard tags to legacy ones
  (`vep`, `vec`, `vls`, `war`, `es-419`, `be-BY`, `uz-Arab`/`uz-Latn`, `yue`,
  `wuu`, `zh-MO`), and drops trailing subtags one at a time
  ([imports/i18n/browserLanguage.js](../../../../imports/i18n/browserLanguage.js)).

## How it works in WeKan

Files: [imports/i18n/languages.js](../../../../imports/i18n/languages.js) (the
registry), [imports/i18n/browserLanguage.js](../../../../imports/i18n/browserLanguage.js)
(the browser fallback), `languageFlag()` in
[client/components/users/userHeader.js](../../../../client/components/users/userHeader.js)
(the flags). Tests: [tests/browserLanguageFallback.test.cjs](../../../../tests/browserLanguageFallback.test.cjs)
and [tests/playwright/specs/50-language-popup.e2e.js](../../../../tests/playwright/specs/50-language-popup.e2e.js).

All 245 registered locales are listed by their native language names. Each
translation file must be reachable through its registered loader or alias.

Single-part language tags show the language's existing flag. Regional labels
place the language flag beside the language name and the country flag inside
its parentheses: **🇺🇸 English (🇧🇷 Brazil)**. RTL interfaces reverse the visual
placement. Each flag remains isolated, and native names retain their text
direction. Constructed languages use 🌐. Script and encoding tags do not
identify countries; legacy Veps, Venetian, Flemish and Waray tags are handled
explicitly. Names without a regional descriptor are preserved in full, with
the regional flag in separate parentheses. Latin American Spanish uses 🌐
for its region.

The existing responsive popup lists languages in columns. Checks evaluate its
actual helpers against every registry entry and verify file/loader coverage.
The browser regression is `50-language-popup.e2e.js`; execution is pending.

When no supported language has been saved in the member profile, WeKan checks
all `navigator.languages` entries in preference order, followed by
`navigator.language` and legacy `navigator.userLanguage`. A supported saved
profile choice wins. Unknown choices fall through to browser preferences and
ultimately English. Detection does not save a language in the profile.

Matching ignores tag case and hyphen/underscore differences. Standard browser
tags map to existing legacy locales: `vep` → Veps, `vec` → Venetian,
`vls` → Flemish, `war` → Waray, `es-419` → Latin American Spanish,
`be-BY` → Belarusian Belarus, and `uz-Arab`/`uz-Latn` → Uzbek scripts.
Trailing subtags/extensions are removed progressively. Browser `languagechange`
updates the display while preserving a saved profile preference.

Browser language tags and their ordered preference list are documented by
[MDN](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/languages).

Bare `yue` and `wuu` resolve to the existing Cantonese and Wu variants.
`zh-MO` resolves to Traditional Chinese, consistent with Unicode CLDR's
[likely-subtag data](https://www.unicode.org/reports/tr35/tr35-78/tr35.html).
Actual startup checks cover delayed profiles and browser preference changes.

## Commits

 - [Single-line language popup labels](https://github.com/wekan/wekan/commit/3c5b6fe395e5182de6961a18d2a857e424024cba)
 - [Verify language flags through the shared picker helper](https://github.com/wekan/wekan/commit/0397fc89b4b1648d88b0fdd79659950f4d0caaa5)
 - [Regional language flags and RTL regression coverage](https://github.com/wekan/wekan/commit/f8007230e95fb524111db5941e3db9487280ab93)
 - [Cantonese, Wu and Macau browser language fallbacks](https://github.com/wekan/wekan/commit/37ae64fa8c88c69aa27062ed383122daf91f8f58)
 - [Browser startup verification](https://github.com/wekan/wekan/commit/f8c55e91b2da156902fd54b0ed1d05cc4eb5b6f4)
 - [Browser locale fallback documented](https://github.com/wekan/wekan/commit/8a666b646bbe6dae5002910d98e8b2396f95915d)
 - [Ordered browser languages when no profile language is saved](https://github.com/wekan/wekan/commit/1666a2012b1178b2b17faad0616df5dabaf18120)
 - [Language popup flags and upload repairs](https://github.com/wekan/wekan/commit/b1a4cd5059dc47a53be91f853070c8bbb92c2fb6)
