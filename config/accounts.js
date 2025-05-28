import { TAPi18n } from '/imports/i18n';

const passwordField = AccountsTemplates.removeField('password');
const emailField = AccountsTemplates.removeField('email');
let disableRegistration = false;
let disableForgotPassword = false;
let passwordLoginEnabled = false;
let oidcRedirectionEnabled = false;
let oauthServerUrl = "home";
let oauthDashboardUrl = "";

Meteor.call('isOidcRedirectionEnabled', (_, result) => {
  if(result)
  {
    oidcRedirectionEnabled = true;
  }
});

Meteor.call('isPasswordLoginEnabled', (_, result) => {
  if (result) {
    passwordLoginEnabled = true;
  }
});

Meteor.call('getOauthServerUrl', (_, result) => {
  if (result) {
    oauthServerUrl = result;
  }
});

Meteor.call('getOauthDashboardUrl', (_, result) => {
  if (result) {
    oauthDashboardUrl = result;
  }
});

Meteor.call('isDisableRegistration', (_, result) => {
  if (result) {
    disableRegistration = true;
    //console.log('disableRegistration');
    //console.log(result);
  }
});

Meteor.call('isDisableForgotPassword', (_, result) => {
  if (result) {
    disableForgotPassword = true;
    //console.log('disableForgotPassword');
    //console.log(result);
  }
});

AccountsTemplates.addFields([
  {
    _id: 'username',
    type: 'text',
    displayName: 'username',
    required: true,
    minLength: 2,
  },
  emailField,
  passwordField,
  {
    _id: 'invitationcode',
    type: 'text',
    displayName: 'Invitation Code',
    required: false,
    minLength: 6,
    template: 'invitationCode',
  },
]);

AccountsTemplates.configure({
  defaultLayout: 'userFormsLayout',
  defaultContentRegion: 'content',
  confirmPassword: true,
  enablePasswordChange: true,
  sendVerificationEmail: true,
  showForgotPasswordLink: !disableForgotPassword,
  forbidClientAccountCreation: disableRegistration,
  onLogoutHook() {
    // here comeslogic for redirect
    if(oidcRedirectionEnabled)
    {
      window.location = oauthServerUrl + oauthDashboardUrl;
    }
    else
    {
      const homePage = 'home';
      if (FlowRouter.getRouteName() === homePage) {
        FlowRouter.reload();
      } else {
        FlowRouter.go(homePage);
      }
    }
  },
});

if (!disableForgotPassword) {
  [
    'forgotPwd',
    'resetPwd',
  ].forEach(routeName => AccountsTemplates.configureRoute(routeName));
}

if (!disableRegistration) {
  [
    'signUp',
  ].forEach(routeName => AccountsTemplates.configureRoute(routeName));
}

[
  'signIn',
  'enrollAccount',
].forEach(routeName => AccountsTemplates.configureRoute(routeName));

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
    // We should go back with the popup but we don't since user feedback about the change is within the popup only.
    // Once we have a global feedback popup mechanism we can use that here and close with the following:
    // Popup.back();
  },
});

if (Meteor.isServer) {
  [
    'resetPassword-subject',
    'resetPassword-text',
    'verifyEmail-subject',
    'verifyEmail-text',
    'enrollAccount-subject',
    'enrollAccount-text',
  ].forEach(str => {
    const [templateName, field] = str.split('-');
    Accounts.emailTemplates[templateName][field] = (user, url) => {
      return TAPi18n.__(
        `email-${str}`,
        {
          url,
          user: user.getName(),
          siteName: Accounts.emailTemplates.siteName,
        },
        user.getLanguage(),
      );
    };
  });
}
// minor update for PR
