
const passwordField = AccountsTemplates.removeField('password');
const emailField = AccountsTemplates.removeField('email');
AccountsTemplates.addFields([{
  _id: 'username',
  type: 'text',
  displayName: 'username',
  required: true,
  minLength: 2,
}, emailField, passwordField]);

AccountsTemplates.configure({
  defaultLayout: 'userFormsLayout',
  defaultContentRegion: 'content',
  confirmPassword: false,
  // i18n not finished the ui sentence
  // showResendVerificationEmailLink: true,
  enforceEmailVerification: false,
  sendVerificationEmail: true,
  enablePasswordChange: true,
  showForgotPasswordLink: true,
  onLogoutHook() {
    const homePage = 'home';
    FlowRouter.reload();
    // if (FlowRouter.getRouteName() === homePage) {
    //   FlowRouter.reload();
    // } else {
    //   FlowRouter.go(homePage);
    // }
  },
});

_.each(['signIn', 'signUp', 'resetPwd', 'forgotPwd', 'enrollAccount'],
  (routeName) => AccountsTemplates.configureRoute(routeName));

// We display the form to change the password in a popup window that already
// have a title, so we unset the title automatically displayed by useraccounts.
AccountsTemplates.configure({
  texts: {
    title: {
      changePwd: '',
    },
  },
});

AccountsTemplates.configureRoute('changePwd', {
  redirect() {
    // XXX We should emit a notification once we have a notification system.
    // Currently the user has no indication that his modification has been
    // applied.
    Popup.back();
  },
});

Accounts.onLogin(function() {
  var path = FlowRouter.current().path;
  // It seems that meteor has done this, we only do it if the user is in the login page
  // if(path === "/sign-in"){
  //   FlowRouter.go(Session.get("previousURL"));
  // }
});
// detect language at the startup time, invoid the apparent reloading of the UI
// the code is the same to i118n ?
Meteor.startup(() => {
  const currentUser = Meteor.user();
  let language;
  if (currentUser) {
    language = currentUser.profile && currentUser.profile.language;
  } 
  if (!language) {
    language =  window.navigator.userLanguage || window.navigator.language || 'zh-CN';    
  }

  if (language) {
    TAPi18n.setLanguage(language);

    // T9n need to change zh-CN to zh_cn
    T9n.setLanguage(language.replace(/-/,"_").toLowerCase());
  }
});
