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
  enablePasswordChange: true,
  sendVerificationEmail: true,
  showForgotPasswordLink: true,
  onLogoutHook() {
    const homePage = 'home';
    if (FlowRouter.getRouteName() === homePage) {
      FlowRouter.reload();
    } else {
      FlowRouter.go(homePage);
    }
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

// Accounts.onLogin(function() {
//  var currentUser = Meteor.user();
//   if (currentUser) {
//     language = currentUser.profile && currentUser.profile.language;
//   } 
//   if (!language) {
//     language =  window.navigator.userLanguage || window.navigator.language || 'en';  
//     Users.update(Meteor.userId(), {
//       $set: {
//         'profile.language': language
//       }
//     });  
//   }
// });
