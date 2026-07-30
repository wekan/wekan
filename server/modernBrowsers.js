// ============================================================================
// Yandex Browser is a modern browser, and must be served the modern bundle
// (#6557).
//
// Meteor decides between `web.browser` and `web.browser.legacy` per request:
// `webapp` identifies the browser with `useragent-ng` and camel-cases the family
// it reports, then `modern-browsers` looks that name up in the minimum versions
// its packages have declared. A name nobody declared a minimum for is NOT modern -
// `isModern()` returns false for an unknown name - so it gets the ES5 bundle.
//
// Yandex Browser reports family "Yandex Browser", which camel-cases to
// `yandexBrowser`. `modern-browsers` has no minimum for it and no alias mapping it
// onto chrome (its `browserAliases` covers chromeMobile, chromium, headlesschrome,
// ie, edgeMobile, firefoxMobile, mobileSafari and appleMail - not this), so every
// Yandex Browser user was served the legacy bundle. That is why #6534 / #6535 /
// #6556 / #6557 looked like a Yandex bug: the legacy bundle was the broken one
// (see /.swcrc and client/lib/swcHelpers.js), and Yandex users were the only ones
// getting it.
//
// Yandex Browser is Chromium, and its version number is a year: 18.x (2018) is
// already Chromium 64, comfortably past everything the modern bundle assumes -
// full ES2015 (Chromium 51) and dynamic `import()` (Chromium 63). Asking for 18
// keeps a genuinely ancient build on the legacy bundle while giving the modern one
// to every version anybody is actually running (the reports are 24.x).
//
// The maximum of all declared minimums wins, so this only ever ADDS a browser
// family; it cannot lower the bar for chrome, firefox, safari or any of the
// families Meteor's own packages speak for.
//
// NOT claimed here, deliberately: Samsung Internet, Vivaldi, Opera Mobile, Whale,
// MIUI Browser, UC Browser and QQ Browser Mobile are all reported under their own
// family names too, and so are all served the legacy bundle. They are modern
// Chromium in practice, but their version numbers do not map onto a Chromium
// version in any way that can be checked from here, so declaring a minimum for
// them would be a guess. The legacy bundle works again, so they lose speed rather
// than the app; add them one at a time, with the Chromium version each one's
// minimum corresponds to.
// ============================================================================
import { setMinimumBrowserVersions } from 'meteor/modern-browsers';

setMinimumBrowserVersions({ yandexBrowser: 18 }, 'WeKan');
