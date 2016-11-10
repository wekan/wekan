// We save the user language preference in the user profile, and use that to set
// the language reactively. If the user is not connected we use the language
// information provided by the browser, and default to english.

Tracker.autorun(() => {
  const currentUser = Meteor.user();
  let language;
  if (currentUser) {
    language = currentUser.profile && currentUser.profile.language;
  } else {
    language = navigator.language || navigator.userLanguage;
  }

  if (language) {
    TAPi18n.setLanguage(language);

    // For languages such as Finnish (Suomi) that are not supported by meteor-accounts-t9n,
    // the following may throw an exception. On the initial run of this `autorun()` callback,
    // such an exception could cause the entire app to fail to load. Therefore, we catch
    // the exception and log it as an error.
    try {
      T9n.setLanguage(language);
    } catch (e) {
      console.error(e);
    }
  }
});
