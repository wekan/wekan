import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';

// Jalor's own default language, used when neither the user nor the browser
// names one Jalor has. Exported so tests/jalorFrenchDefault.test.cjs can hold
// the whole chain - this file, models/users.js and the <html lang> - to one
// value instead of three copies of the string.
export const JALOR_DEFAULT_LANGUAGE = 'fr';

// We save the user language preference in the user profile, and use that to set
// the language reactively. If the user is not connected we use the language
// information provided by the browser.
//
// Jalor: the last resort is FRENCH, not English. The order is unchanged - the
// user's own choice, then what the browser asks for - so somebody whose browser
// is in German still gets German; what changes is the answer when nothing
// matches, which for a French public-service tool is French. English remains
// the fallback for a MISSING STRING (imports/i18n/tap.js), which is a different
// question and stays as it is: a key with no translation must still render
// words, and English is the language every file is keyed from.

// Keep the root <html> element's `dir` and `lang` attributes in sync with the
// current language. This is the single global switch that makes every page
// render right-to-left for RTL languages (Arabic, Persian, Hebrew, Uyghur,
// Uzbek-Arabic, Yiddish — see imports/i18n/languages.js). Component CSS uses
// logical properties (margin-inline-start, inset-inline-start, text-align:start,
// …), so flipping `dir` mirrors the whole UI without per-page handling.
Meteor.startup(() => {
  if (typeof document !== 'undefined' && document.documentElement) {
    if (!document.documentElement.getAttribute('lang')) {
      document.documentElement.lang = JALOR_DEFAULT_LANGUAGE;
    }
    if (!document.documentElement.getAttribute('dir')) {
      document.documentElement.dir = 'ltr';
    }
  }

  Tracker.autorun(() => {
    const lang = TAPi18n.getLanguage();
    const dir = TAPi18n.getLanguageDirection();
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.dir = dir;
      document.documentElement.lang = lang;
    }
  });
});

Meteor.startup(async () => {
  let currentUser = ReactiveCache.getCurrentUser();
  // If we're still logging in, wait (#4967)
  if (!currentUser && Meteor.loggingIn()) {
    await new Promise((resolve) => {
      Tracker.autorun(() => {
        if (!Meteor.loggingIn()) {
          resolve();
        }
      });
    });
    currentUser = ReactiveCache.getCurrentUser();
  }
  // Select first available language
  const [language] = [
    // User profile
    currentUser?.profile?.language,
    // Browser locale
    navigator.languages?.at(0),
    navigator.language,
    navigator.userLanguage,
  ].filter(Boolean);
  if (language) {
    // Match the browser tag, then progressively strip trailing subtags until a supported
    // language is found: e.g. 'zh-Hans-CN' -> 'zh-Hans', 'zh-Hant-TW' -> 'zh-Hant',
    // 'ja-JP' -> 'ja-JP', bare 'zh' -> 'zh-Hans' (via alias). isLanguageSupported is
    // case-insensitive, so 'zh-hant' / 'JA-JP' etc. also match.
    let candidate = language;
    while (candidate) {
      if (TAPi18n.isLanguageSupported(candidate)) {
        TAPi18n.setLanguage(candidate);
        return;
      }
      const cut = candidate.lastIndexOf('-');
      candidate = cut > 0 ? candidate.slice(0, cut) : '';
    }
  }
  // Nothing the user asked for is a language Jalor has - or the browser asked
  // for nothing at all. French, not the English the interface would otherwise
  // fall back to: see the note at the top of this file.
  if (TAPi18n.isLanguageSupported(JALOR_DEFAULT_LANGUAGE)) {
    TAPi18n.setLanguage(JALOR_DEFAULT_LANGUAGE);
  }
});
