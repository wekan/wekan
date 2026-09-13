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
