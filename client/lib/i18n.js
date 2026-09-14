import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Template } from 'meteor/templating';
import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
const { preferredLanguage } = require('/imports/i18n/browserLanguage');
const { ruleTriggerCopula, ruleNameBeforeSubject } = require('/imports/i18n/ruleGrammar');

Template.registerHelper('ruleTriggerCopula', () => ruleTriggerCopula(
  TAPi18n.getLanguage(), TAPi18n.__('r-is'),
));
Template.registerHelper('ruleNameBeforeSubject', () => ruleNameBeforeSubject(TAPi18n.getLanguage()));


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
  const applyPreferredLanguage = () => {
    const currentUser = ReactiveCache.getCurrentUser();
    const language = preferredLanguage(currentUser?.profile?.language, navigator,
      candidate => TAPi18n.resolveTag(candidate));
    Promise.resolve(TAPi18n.setLanguage(language)).catch(error => {
      console.error(`Could not load language ${language}:`, error);
    });
  };
  Tracker.autorun(applyPreferredLanguage);
  // Browsers can change their ordered preferences without a page reload.
  window.addEventListener('languagechange', applyPreferredLanguage);
});
