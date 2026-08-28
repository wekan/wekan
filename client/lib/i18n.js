import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';

// We save the user language preference in the user profile, and use that to set
// the language reactively. If the user is not connected we use the language
// information provided by the browser, and default to english.

// Keep the root <html> element's `dir` and `lang` attributes in sync with the
// current language. This is the single global switch that makes every page
// render right-to-left for RTL languages (Arabic, Persian, Hebrew, Uyghur,
// Uzbek-Arabic, Yiddish — see imports/i18n/languages.js). Component CSS uses
// logical properties (margin-inline-start, inset-inline-start, text-align:start,
// …), so flipping `dir` mirrors the whole UI without per-page handling.
Meteor.startup(() => {
  if (typeof document !== 'undefined' && document.documentElement) {
    if (!document.documentElement.getAttribute('lang')) {
      document.documentElement.lang = 'en';
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

Meteor.startup(() => {
  // A stored login token can begin resuming after startup has run. Keep this
  // reactive so the persisted profile language wins when that user arrives,
  // rather than leaving a resumed session in the browser's language.
  Tracker.autorun(() => {
    const currentUser = ReactiveCache.getCurrentUser();
    const [language] = [
      currentUser?.profile?.language,
      navigator.languages?.at(0),
      navigator.language,
      navigator.userLanguage,
    ].filter(Boolean);
    if (!language) return;

    // Match the browser tag, then progressively strip trailing subtags until a supported
    // language is found: e.g. 'zh-Hans-CN' -> 'zh-Hans', 'zh-Hant-TW' -> 'zh-Hant',
    // 'ja-JP' -> 'ja-JP', bare 'zh' -> 'zh-Hans' (via alias). isLanguageSupported is
    // case-insensitive, so 'zh-hant' / 'JA-JP' etc. also match.
    let candidate = language;
    while (candidate) {
      if (TAPi18n.isLanguageSupported(candidate)) {
        Promise.resolve(TAPi18n.setLanguage(candidate)).catch(error => {
          console.error(`Could not load language ${candidate}:`, error);
        });
        break;
      }
      const cut = candidate.lastIndexOf('-');
      candidate = cut > 0 ? candidate.slice(0, cut) : '';
    }
  });
});
