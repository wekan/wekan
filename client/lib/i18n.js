// We save the user language preference in the user profile, and use that to set
// the language reactively. If the user is not connected we use the language
// information provided by the browser, and default to english.

Tracker.autorun(() => {
  const currentUser = Meteor.user();
  let language;
  if (currentUser) {
    language = currentUser.profile && currentUser.profile.language;
  } 
  if (!language) {
    language =  window.navigator.userLanguage || window.navigator.language || 'zh-CN';    
  }

  // safari mobile return zh-cn not zh-CN of window.navigator.language
  // but TAPi18n only recognize zh-CN
  if( language.indexOf('-') > 0 )
    language = language.substr(0,language.indexOf('-')+1) + language.substr(language.indexOf('-')+1).toUpperCase();
  
  if (language) {

    TAPi18n.setLanguage(language.toLowerCase());

    // T9n need to change zh-CN to zh_cn
    T9n.setLanguage(language.replace(/-/,"_").toLowerCase());
  }
});