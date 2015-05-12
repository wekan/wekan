// We save the user language preference in the user profile, and use that to set
// the language reactively. If the user is not connected we use the language
// information provided by the browser, and default to english.

Tracker.autorun(function() {
  var language;
  var currentUser = Meteor.user();
  if (currentUser) {
    language = currentUser.profile && currentUser.profile.language;
  } else {
    language = navigator.language || navigator.userLanguage;
  }

  if (language) {

    TAPi18n.setLanguage(language);

    // XXX
    var shortLanguage = language.split('-')[0];
    T9n.setLanguage(shortLanguage);
  }
});
