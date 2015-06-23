var passwordField = AccountsTemplates.removeField('password');
var emailField = AccountsTemplates.removeField('email');
AccountsTemplates.addFields([{
  _id: 'username',
  type: 'text',
  displayName: 'username',
  required: true,
  minLength: 3
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
