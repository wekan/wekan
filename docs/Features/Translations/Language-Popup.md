# Change language popup

All 245 registered locales are listed by their native language names. Each
translation file must be reachable through its registered loader or alias.

Single-part language tags show the language's existing flag. Two-part locales
show the country flag on the left and the language flag on the right, for
example Colombian Spanish: 🇨🇴 🇪🇸. Flag order remains left-to-right in RTL
interfaces. Constructed languages use 🌐. Script and encoding tags do not
identify countries; legacy Veps, Venetian, Flemish and Waray tags are handled
explicitly. Latin American Spanish has no single country and uses 🌐 on the left.

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
