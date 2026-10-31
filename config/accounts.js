import { TAPi18n } from '/imports/i18n';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
const { loginRedirectTarget } = require('/imports/lib/loginRedirectTarget');
const {
  decideTwoFactorLoginStep,
  isTwoFactorLoginStep,
} = require('/imports/lib/twoFactorAuthLoginDecision');

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

// PASSWORD_MIN_LENGTH and PASSWORD_CHECK_PWNED (models/lib/passwordPolicy.js).
// useraccounts checks a NEW password's minLength in the browser - sign-up,
// Change Password, reset, enrolment; never sign-in - and reads it from the
// field at submit time, so the server's value applies once it has arrived.
// Unless the minimum is enforced (PASSWORD_MIN_LENGTH_ENFORCE, off by
// default) the fields keep their own 6.
// The breached-password check runs before useraccounts sees the submit.
if (Meteor.isClient) {
  const passwordPolicy = { minLength: 8, enforce: false, checkPwned: false };
  Meteor.call('getPasswordPolicy', (error, result) => {
    if (error || !result) return;
    Object.assign(passwordPolicy, result);
    if (!passwordPolicy.enforce) return;
    for (const id of ['password', 'password_again']) {
      const field = AccountsTemplates.getField(id);
      if (field) field.minLength = passwordPolicy.minLength;
    }
  });
  // Signing in is never refused for a short password: it is reported to
  // Admin Panel / Problems / Password length, and with the minimum enforced the
  // account is asked to change it (server/passwordChangeRequired.js). Only this
  // browser knows the length, so it is noted on the sign-in form - the length,
  // never the password - and compared with the minimum once the login worked.
  const { isNewPasswordForm } = require('/client/lib/newPasswordCheck');
  let signInPasswordLength = null;
  document.addEventListener('submit', event => {
    const form = event.target;
    const field = form && form.id === 'at-pwd-form' && form.querySelector('#at-field-password');
    if (field && !isNewPasswordForm(form)) signInPasswordLength = [...field.value].length;
  }, true);
  Accounts.onLogin(() => {
    const length = signInPasswordLength;
    signInPasswordLength = null;
    if (length === null) return;
    // Asked again: the minimum may have changed since the page loaded.
    Meteor.call('getPasswordPolicy', (error, result) => {
      if (error || !result || !(result.minLength > 0) || length >= result.minLength) return;
      Meteor.call('reportShortPasswordLogin', () => {
        const { checkPasswordChangeRequirement } = require('/client/components/users/passwordChangeRequired');
        checkPasswordChangeRequirement();
      });
    });
  });
  const { createNewPasswordSubmitHandler } = require('/client/lib/newPasswordCheck');
  document.addEventListener('submit', createNewPasswordSubmitHandler({
    policy: () => passwordPolicy,
    range: prefix => Meteor.callAsync('passwordPwnedRange', prefix),
    subtle: globalThis.crypto && globalThis.crypto.subtle,
    pwnedMessage: () => tr('password-pwned'),
    showError(message) {
      AccountsTemplates.setDisabled(false);
      AccountsTemplates.state.form.set('error', [message]);
    },
    replay: form => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
  }), true);
}

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
  // After a login that leaves the user on an auth page, restore a guarded URL
  // or go to All Boards. OAuth / OIDC
  // (the redirect login style) and resume-token logins do NOT go through onSubmitHook, so
  // after returning from the identity provider — e.g. "Login with Google" — the user stayed
  // on the sign-in route, which shows only the language selector ("Vaihda kieltä"), until a
  // manual page reload (#6512, the OAuth variant). Accounts.onLogin fires for EVERY login
  // method (password, OAuth, resume) after Meteor.userId() is set. A cookie
  // resume may have reached sign-in through a protected initial URL, whose
  // remembered path takes precedence over home.
  // Guarded to the auth routes so an auto-login on a deep-linked board URL is never
  // redirected away; password login also fires this, but by then onSubmitHook has already
  // navigated, so the route is no longer an auth route and this is a no-op.
  const AUTH_ROUTE_NAMES = new Set([
    'atSignIn', 'atSignUp', 'atForgotPwd', 'atResetPwd', 'atChangePwd',
    'atEnrollAccount', 'atVerifyEmail', 'atResendVerificationEmail',
  ]);
  if (Accounts && typeof Accounts.onLogin === 'function') {
    Accounts.onLogin(() => {
      if (AUTH_ROUTE_NAMES.has(FlowRouter.getRouteName())) {
        // getPrevPath already includes ROOT_URL's prefix; redirect accepts that
        // complete path, whereas go() would prepend the prefix a second time.
        FlowRouter.redirect(loginRedirectTarget(
          AccountsTemplates.redirectToPrevPath,
          AccountsTemplates.getPrevPath(),
        ));
      }
    });
  }

  // Clear only after success. Failed login/resume attempts must not rearm
  // automatic OIDC navigation (#6722); the login button allows manual retry.
  const { OidcAutoRedirect } = require('/client/lib/oidcAutoRedirect');
  if (Accounts && typeof Accounts.onLogin === 'function') {
    Accounts.onLogin(() => OidcAutoRedirect.clear());
  }

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

// After a successful login/register, navigate to All Boards — but only once
// Meteor.userId() is actually set. The home route's sign-in guard
// (config/router.js renderBoardList) checks Meteor.userId() NON-reactively and
// bounces to the sign-in page when it is still null. Right after login the client
// userId can lag the onSubmitHook callback by a tick, so navigating immediately
// landed the user back on the login page — which then showed only the language
// selector until a manual reload (the WeKan 10.30 "after login it shows language
// selection, requires reload" regression). Wait reactively for userId, with a
// timeout fallback so a login that never lands userId still navigates (and the
// guard then correctly shows the sign-in page).
function goHomeWhenSignedIn() {
  if (Meteor.userId()) {
    FlowRouter.go('/');
    return;
  }
  let done = false;
  let comp;
  const finish = () => {
    if (done) return;
    done = true;
    if (comp) comp.stop();
    FlowRouter.go('/');
  };
  comp = Tracker.autorun(() => {
    if (Meteor.userId()) finish();
  });
  Meteor.setTimeout(finish, 5000);
}

// Issue #3058: native TOTP two-factor authentication for username/password
// login, via Meteor's official accounts-2fa package
// (https://docs.meteor.com/packages/accounts-2fa.html). accounts-2fa handles
// TOTP secret generation and verification entirely server-side; WeKan's job
// here is only to show the second "enter your 6-digit code" step when a
// password login comes back with the documented 'no-2fa-code' /
// 'invalid-2fa-code' error, and to resubmit via
// Meteor.loginWithPasswordAnd2faCode - the package's own login method for
// this case. See imports/lib/twoFactorAuthLoginDecision.js for the pure
// decision logic (unit-tested in tests/twoFactorLoginState.test.cjs) and
// client/components/main/layouts.jade for the #two-factor-code-container
// markup this manipulates.
let pendingTwoFactorSelector = null;
let pendingTwoFactorPassword = null;

function showTwoFactorPrompt(step) {
  if (!Meteor.isClient) return;
  const container = document.getElementById('two-factor-code-container');
  if (!container) return;
  container.hidden = false;
  container.classList.remove('hide');
  const errorDiv = document.getElementById('two-factor-code-error');
  if (errorDiv) {
    if (step === 'retry-code') {
      errorDiv.textContent = tr('twoFactorCode-invalid');
      errorDiv.classList.remove('hide');
    } else {
      errorDiv.textContent = '';
      errorDiv.classList.add('hide');
    }
  }
  const input = document.getElementById('two-factor-code-input');
  if (input) {
    input.value = '';
    input.focus();
  }
}

function hideTwoFactorPrompt() {
  if (!Meteor.isClient) return;
  const container = document.getElementById('two-factor-code-container');
  if (container) {
    container.hidden = true;
    container.classList.add('hide');
  }
  const errorDiv = document.getElementById('two-factor-code-error');
  if (errorDiv) {
    errorDiv.classList.add('hide');
    errorDiv.textContent = '';
  }
  pendingTwoFactorSelector = null;
  pendingTwoFactorPassword = null;
}

if (Meteor.isClient) {
  $(document).on('submit', '#two-factor-code-container', function (e) {
    e.preventDefault();
    const codeInput = document.getElementById('two-factor-code-input');
    const code = codeInput ? codeInput.value.trim() : '';
    if (!pendingTwoFactorSelector || !code) {
      return;
    }
    Meteor.loginWithPasswordAnd2faCode(
      pendingTwoFactorSelector,
      pendingTwoFactorPassword,
      code,
      err => {
        if (err) {
          const step = decideTwoFactorLoginStep(err, 'signIn');
          if (isTwoFactorLoginStep(step)) {
            showTwoFactorPrompt(step);
            return;
          }
          hideTwoFactorPrompt();
          const errorDiv = document.getElementById('login-error-message');
          if (errorDiv) {
            errorDiv.innerHTML = err.reason || err.message || tr('twoFactorCode-invalid');
          }
          return;
        }
        hideTwoFactorPrompt();
        goHomeWhenSignedIn();
      },
    );
  });

  $(document).on('click', '.js-two-factor-code-cancel', function (e) {
    e.preventDefault();
    hideTwoFactorPrompt();
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
    if (!error && state === 'changePwd') {
      // The server has signed every session of the account out, this one too
      // (server/passwordChangeRequired.js): sign in with the new password.
      Meteor.logout(() => FlowRouter.go('atSignIn'));
      return;
    }
    if (!error && (state === 'signUp' || state === 'signIn')) {
      hideTwoFactorPrompt();
      goHomeWhenSignedIn();
      return;
    }
    if (error) {
      const step = decideTwoFactorLoginStep(error, state);
      if (isTwoFactorLoginStep(step)) {
        if (step === 'need-code' && Meteor.isClient) {
          // Capture the credentials just submitted so the code-entry retry
          // can resubmit them - accounts-2fa's login method takes the same
          // selector/password plus the code (see the docs link above).
          const usernameField = document.getElementById('at-field-username_and_email');
          const passwordField = document.getElementById('at-field-password');
          if (usernameField) pendingTwoFactorSelector = usernameField.value;
          if (passwordField) pendingTwoFactorPassword = passwordField.value;
        }
        showTwoFactorPrompt(step);
        return;
      }
      hideTwoFactorPrompt();
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
  // #1426: configuring the sender is not enough. communitypackages:flow-routing
  // installs `/verify-email/:token`, rewrites Accounts.urls.verifyEmail and calls
  // Accounts.verifyEmail only when this route is configured. Without it, every
  // emailed link fell through to WeKan's protected catch-all and said "Must be
  // Logged in" without consuming the token.
  'verifyEmail',
  // Keep the companion route available so an unverified user can request a new
  // token rather than requiring an administrator to edit the database.
  'resendVerificationEmail',
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

if (Meteor.isServer && !Package['accounts-password']) {
  // The Sandstorm .spk is built without accounts-password and every other login
  // package (releases/sandstorm-slim.mjs): Sandstorm signs users in. useraccounts'
  // server _init() then refuses to start - "You must add at least one account
  // service!" - and everything else it does is checking the password form's
  // fields and hooking password login attempts, which do not exist here. So it
  // is marked as done. docs/Platforms/FOSS/Container/Sandstorm/Smaller-wekan-spk.md
  AccountsTemplates._initialized = true;
}

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

  // #4434: the same e-mails in the clear HTML layout, built from the same
  // localized text, which stays the plain-text part (models/lib/accountEmailHtml.js).
  const { renderAccountEmailHtml } = require('/models/lib/accountEmailHtml');
  ['resetPassword', 'verifyEmail', 'enrollAccount'].forEach(templateName => {
    Accounts.emailTemplates[templateName].html = (user, url) => {
      try {
        return renderAccountEmailHtml({
          text: Accounts.emailTemplates[templateName].text(user, url),
          siteName: Accounts.emailTemplates.siteName,
        });
      } catch (e) {
        return undefined; // the text part alone, as before - never a 500 (#5706)
      }
    };
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
