import { TAPi18n } from '../../i18n/i18n';

// We save the user language preference in the user profile, and use that to set
// the language reactively. If the user is not connected we use the language
// information provided by the browser, and default to english.

Meteor.startup(() => {
  //TAPi18n.conf.i18n_files_route = Meteor._relativeToSiteRootUrl('/tap-i18n');
  const currentUser = Meteor.user();
  let language;
  if (currentUser) {
    language = currentUser.profile && currentUser.profile.language;
  }

  if (!language) {
    if (navigator.languages) {
      language = navigator.languages[0];
    } else {
      language = navigator.language || navigator.userLanguage;
    }
  }

  if (language) {
    TAPi18n.setLanguage(language);
    // eslint-disable-next-line no-console
    // console.log('language set!');
    // T9n.setLanguage(language);
  }

  global.TAPi18n = TAPi18n // patch for deprecated global calls
});
