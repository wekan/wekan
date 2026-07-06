import { TAPi18n } from '/imports/i18n';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

// Readiness-aware, reactive translation — mirrors the `{{_}}` Blaze helper
// (imports/i18n/blaze.js). A bare TAPi18n.__() returns the raw key on the initial
// (English) render because the language bundle loads asynchronously, and it never
// re-runs once ready. Depending on TAPi18n.current / TAPi18n.ready makes the
// account-form labels/placeholders re-render as soon as i18n is loaded and on every
// language change.
function tr(key) {
  TAPi18n.current.get();
  TAPi18n.ready.get();
  if (!TAPi18n.i18n || !TAPi18n.ready.get()) {
    return key;
  }
  return TAPi18n.__(key);
}

const passwordField = AccountsTemplates.removeField('password');
passwordField.autocomplete = 'current-password';
passwordField.template = 'passwordInput';
// Translate the field label/placeholder via WeKan i18n — see the note below the
// addFields() call. Set before re-adding the field so it is present when useraccounts
// registers it.
passwordField.displayName = () => tr('password');
const emailField = AccountsTemplates.removeField('email');

// Don't add current_password to global fields - it should only be used for change password
let disableRegistration = false;
let disableForgotPassword = false;
let passwordLoginEnabled = false;
let oidcRedirectionEnabled = false;
let oauthServerUrl = "home";
let oauthDashboardUrl = "";
let oauthLogoutUrl = "";

Meteor.call('isOidcRedirectionEnabled', (_, result) => {
  if(result)
  {
    oidcRedirectionEnabled = true;
  }
});

Meteor.call('getOauthLogoutUrl', (_, result) => {
  if (result) {
    oauthLogoutUrl = result;
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
    // Note: AccountsTemplates.configure() cannot be called here because
    // init() has already been triggered by the time this async callback fires.
    // The signup link is hidden via DOM in layouts.js instead.
  }
});

Meteor.call('isDisableForgotPassword', (_, result) => {
  if (result) {
    disableForgotPassword = true;
  }
});

AccountsTemplates.addFields([
  {
    _id: 'username',
    type: 'text',
    displayName: 'username',
    required: true,
    minLength: 2,
    autocomplete: 'username',
  },
  emailField,
  passwordField,
  {
    _id: 'password_again',
    type: 'password',
    displayName: () => tr('password-again'),
    required: true,
    minLength: 6,
    autocomplete: 'new-password',
    template: 'passwordInput',
  },
  {
    _id: 'invitationcode',
    type: 'text',
    displayName: 'Invitation Code',
    required: false,
    minLength: 6,
    template: 'invitationCode',
  },
]);

// The sign-in / register form field labels and placeholders were rendered through
// accounts-t9n (`T9n.get`), whose per-language coverage is incomplete, and
// useraccounts' `getPlaceholder()` never invokes a function placeholder (unlike
// `getDisplayName()`) — so several placeholders (Username, Email, Password
// (again)) and the Email / Password (again) labels showed untranslated English.
// Translate the account-form fields through WeKan's own i18n (TAPi18n) instead,
// which has complete data/<lang>.i18n.json coverage.
//
// Password fields (password, password_again) use WeKan's passwordInput template,
// which renders {{displayName}} for both its label and its placeholder. Their
// field-level displayName functions (set above / in addFields) are invoked both by
// getDisplayName() and by Blaze, so they translate regardless of when useraccounts
// wires up per-template helpers. Username / email use the atTextInput override below.
if (Meteor.isClient) {
  const { Template } = require('meteor/templating');
  const { T9n } = require('meteor/communitypackages:core');
  // Fields WeKan translates itself (complete data/<lang>.i18n.json coverage), keyed
  // by field id. Other account-form text inputs — notably the sign-in combined
  // "username_and_email" field and current_password — keep their built-in
  // accounts-t9n translation, because WeKan has no key for them and accounts-t9n
  // already ships one (e.g. "usernameOrEmail").
  const WEKAN_FIELD_KEY = { username: 'username', email: 'email' };
  function fieldText(field, original) {
    TAPi18n.current.get();
    TAPi18n.ready.get();
    const key = WEKAN_FIELD_KEY[field._id];
    if (key && TAPi18n.i18n && TAPi18n.ready.get()) {
      const translated = TAPi18n.__(key);
      if (translated !== key) {
        return translated;
      }
    }
    // Fall back to useraccounts' own accounts-t9n translation. The field's
    // displayName/placeholder is an accounts-t9n key (e.g. "usernameOrEmail").
    return T9n.get(original, false);
  }
  // The unstyled package registers these helpers on Template.atTextInput at load
  // time, so this app-startup override wins.
  Template.atTextInput.helpers({
    displayName() {
      return fieldText(this, this.getDisplayName());
    },
    placeholder() {
      if (!AccountsTemplates.options.showPlaceholders) {
        return undefined;
      }
      return fieldText(this, this.getPlaceholder());
    },
  });
}

AccountsTemplates.configure({
  defaultLayout: 'userFormsLayout',
  defaultContentRegion: 'content',
  confirmPassword: true,
  enablePasswordChange: true,
  sendVerificationEmail: true,
  showForgotPasswordLink: !disableForgotPassword,
  forbidClientAccountCreation: disableRegistration,
  homeRoutePath: '/',
  onSubmitHook(error, state) {
    if (!error && (state === 'signUp' || state === 'signIn')) {
      FlowRouter.go('/');
      return;
    }
    if (error) {
      // Display error to user
      const errorDiv = document.getElementById('login-error-message');
      if (errorDiv) {
        let errorMessage = error.reason || error.message || 'Registration failed. Please try again.';
        // If there are validation details, show them
        if (error.details && typeof error.details === 'object') {
          const detailMessages = [];
          for (let field in error.details) {
            const errorMsg = error.details[field];
            if (errorMsg) {
              const message = Array.isArray(errorMsg) ? errorMsg.join(', ') : errorMsg;
              detailMessages.push(`${field}: ${message}`);
            }
          }
          if (detailMessages.length > 0) {
            errorMessage += '<br>' + detailMessages.join('<br>');
          }
        }
        errorDiv.innerHTML = errorMessage;
      }
    }
  },
  onLogoutHook() {
    // here comeslogic for redirect
    if(oauthLogoutUrl)
    {
      // OIDC RP-initiated logout: terminate the identity provider session and
      // come back to Wekan via post_logout_redirect_uri. Without this, autologin
      // would silently sign the user back in, or the provider would land them on
      // its own home page (which errors for non-admin users). See issue #6158.
      window.location = oauthLogoutUrl;
    }
    else if(oidcRedirectionEnabled)
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
  // #5706: Internal Server Error (500) when attempting to reset a password.
  // The reset-password email-template builders and the email send must never let
  // an unhandled exception bubble up through Meteor's `forgotPassword` method (it
  // surfaces to the client as an opaque HTTP 500). The pure helpers below are
  // unit-tested in tests/unit/resetPasswordEmail.test.js.
  const {
    buildEmailTemplateField,
    wrapSendResetPasswordEmail,
  } = require('/server/lib/resetPasswordEmail');

  [
    'resetPassword-subject',
    'resetPassword-text',
    'verifyEmail-subject',
    'verifyEmail-text',
    'enrollAccount-subject',
    'enrollAccount-text',
  ].forEach(str => {
    const [templateName, field] = str.split('-');
    Accounts.emailTemplates[templateName][field] = (user, url) =>
      buildEmailTemplateField(
        str,
        (key, params, language) => TAPi18n.__(key, params, language),
        Accounts.emailTemplates.siteName,
        user,
        url,
      );
  });

  // #5706: When SMTP is not configured (no MAIL_URL / MAIL_FROM, or a bad mail
  // server), Meteor's `Email.sendAsync` throws. That exception otherwise propagates
  // out of the `forgotPassword` method as a raw HTTP 500 ("Internal Server Error").
  // Wrap the reset-password email send so the failure surfaces as a clean,
  // actionable `Meteor.Error('email-fail', ...)` instead, matching how the rest of
  // Wekan reports email failures (see server/models/users.js, settings.js).
  Accounts.sendResetPasswordEmail = wrapSendResetPasswordEmail(
    Accounts.sendResetPasswordEmail,
    (code, message) => new Meteor.Error(code, message),
  );

  // #5672: "Internal Server Error When Signing Up Despite Successful Account
  // Creation". useraccounts' ATCreateUserServer creates the account and then
  // calls Accounts.sendVerificationEmail(); when SMTP is not configured that
  // send throws AFTER the user is inserted, so the createUser method returns a
  // raw HTTP 500 even though the account exists and can sign in. The
  // verification email is best-effort at sign-up, so swallow + log a transport
  // failure (registration then completes and redirects to sign-in). An
  // "already verified" error is re-thrown so ATResendVerificationEmail still
  // reports it. Unit-tested in tests/verificationEmail.test.cjs.
  const { wrapSendVerificationEmail } = require('/server/lib/verificationEmail');
  Accounts.sendVerificationEmail = wrapSendVerificationEmail(
    Accounts.sendVerificationEmail,
    message => console.warn(message),
  );
}
