import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';

// We save the user language preference in the user profile, and use that to set
// the language reactively. If the user is not connected we use the language
// information provided by the browser, and default to english.

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
    // Try with potentially complex language tag
    if (TAPi18n.isLanguageSupported(language)) {
      TAPi18n.setLanguage(language);
    } else if (language.includes('-')) {
      // Fallback to a general language
      const [general] = language.split('-');
      if (TAPi18n.isLanguageSupported(general)) {
        TAPi18n.setLanguage(general);
      }
    }
  }
});
