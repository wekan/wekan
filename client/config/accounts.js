var passwordField = AccountsTemplates.removeField('password');
var emailField = AccountsTemplates.removeField('email');
AccountsTemplates.addFields([{
  _id: 'username',
  type: 'text',
  displayName: 'username',
  required: true,
  minLength: 5
}, emailField, passwordField]);

AccountsTemplates.configure({
  confirmPassword: false,
  enablePasswordChange: true,
  sendVerificationEmail: true,
  showForgotPasswordLink: true,
  onLogoutHook: function() {
    Router.go('Home');
  }
});

_.each(['signIn', 'signUp', 'resetPwd', 'forgotPwd', 'enrollAccount'],
  function(routeName) {
  AccountsTemplates.configureRoute(routeName, {
    layoutTemplate: 'userFormsLayout'
  });
});

// We display the form to change the password in a popup window that already
// have a title, so we unset the title automatically displayed by useraccounts.
AccountsTemplates.configure({
  texts: {
    title: {
      changePwd: ''
    }
  }
});

AccountsTemplates.configureRoute('changePwd', {
  redirect: function() {
    // XXX We should emit a notification once we have a notification system.
    // Currently the user has no indication that his modification has been
    // applied.
    Popup.back();
  }
});
