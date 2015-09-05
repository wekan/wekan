// We save the user language preference in the user profile, and use that to set
// the language reactively. If the user is not connected we use the language
// information provided by the browser, and default to english.

Tracker.autorun(function() {
  var language;
  var currentUser = Meteor.user();
  if (currentUser) {
    language = currentUser.profile && currentUser.profile.language;
  } 
  if (!language) {
    language =  window.navigator.userLanguage || window.navigator.language || 'zh-CN';    
  }

  if (language) {
    //language = language.toLowerCase();
    TAPi18n.setLanguage(language);

    // XXX
    //var shortLanguage = language.split
    T9n.setLanguage(language.toLowerCase());
  }
});
