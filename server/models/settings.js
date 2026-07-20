import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';
import { Email } from 'meteor/email';
import { ServiceConfiguration } from 'meteor/service-configuration';
import { WebApp } from 'meteor/webapp';
import Settings from '/models/settings';
import InvitationCodes from '/models/invitationCodes';
import EmailLocalization from '/server/lib/emailLocalization';
import { ensureIndex } from '/server/lib/mongoStartup';
import { Authentication } from '/server/authentication';
import { sendJsonResult } from '/server/apiMiddleware';
const { parseCardsLoadingEnv, cardsLoadingLazyThreshold } = require('/models/lib/cardsLoading');
const {
  normalizeInviteEmail,
  isInvitationCodeSendable,
  buildReinviteModifier,
  shouldRemoveInvitationOnEmailFailure,
} = require('/models/lib/invitationCodeEmail');

const getReactiveCache = () => require('/imports/reactiveCache').ReactiveCache;
const getTAPi18n = () => require('/imports/i18n').TAPi18n;
const { SimpleSchema } = require('/imports/simpleSchema');
const {
  normalizeAuthenticationMethod,
  resolveDefaultAuthenticationMethod,
} = require('/models/lib/authenticationMethod');

const isSandstorm =
  Meteor.settings && Meteor.settings.public && Meteor.settings.public.sandstorm;

// Security fix (reported by meifukun): invitation codes used to be a 6-digit
// Math.random() value — a ~900,000 keyspace from a NON-cryptographic RNG, with no
// effective throttling on the sign-up validation — so an attacker who knew a
// pending invitee's email could brute-force the code and take the invited account
// (and its private boards). Generate a cryptographically secure 128-bit code
// instead, which cannot be guessed regardless of retry rate. (A DDPRateLimiter
// rule is added in server/models/users.js as defence in depth.)
function generateInvitationCode() {
  const crypto = require('crypto');
  return crypto.randomBytes(16).toString('base64url');
}

function getEnvVar(name) {
  const value = process.env[name];
  if (value) {
    return value;
  }
  throw new Meteor.Error([
    'var-not-exist',
    `The environment variable ${name} does not exist`,
  ]);
}

function loadOidcConfig(service) {
  check(service, String);
  return ServiceConfiguration.configurations.findOneAsync({ service });
}

async function sendInvitationEmail(_id, { isNewInvitation = true } = {}) {
  const icode = await getReactiveCache().getInvitationCode(_id);
  // #4043: never send an invitation email without a code that will validate at
  // sign-up (the sign-up lookup requires { code: <string>, valid: true }).
  // Fail loudly instead of mailing a dead code.
  if (!isInvitationCodeSendable(icode)) {
    throw new Meteor.Error(
      'invitation-code-invalid',
      'Invitation email not sent: the invitation code is missing or no longer valid',
    );
  }
  const author = await getReactiveCache().getCurrentUser();
  try {
    const authorUser = await getReactiveCache().getUser(icode.authorId);
    const fullName = authorUser?.profile?.fullname || '';

    const params = {
      email: icode.email,
      inviter:
        fullName !== ''
          ? `${fullName} (${authorUser.username} )`
          : authorUser.username,
      user: icode.email.split('@')[0],
      icode: icode.code,
      // FlowRouter is client-only; on the server it has no routes and yields a
      // generic link. The sign-up route is the static path '/sign-up'.
      url: Meteor.absoluteUrl('sign-up'),
    };
    const lang = author.getLanguage();
    await EmailLocalization.sendEmail({
      to: icode.email,
      from: Accounts.emailTemplates.from,
      subject: 'email-invite-register-subject',
      text: 'email-invite-register-text',
      params,
      language: lang,
    });
  } catch (e) {
    // #4043: only roll back a code created by this very invite. A pre-existing
    // invitation was already delivered in an earlier email; deleting it here
    // would silently invalidate the code that email carries.
    if (shouldRemoveInvitationOnEmailFailure({ isNewInvitation })) {
      await InvitationCodes.removeAsync(_id);
    }
    throw new Meteor.Error('email-fail', e.message);
  }
}

async function isNonAdminAllowedToSendMail(currentUser) {
  const currSett = await getReactiveCache().getCurrentSetting();
  let isAllowed = false;
  if (
    currSett &&
    currSett.disableRegistration &&
    currSett.mailDomainName !== undefined &&
    currSett.mailDomainName !== ''
  ) {
    for (let i = 0; i < currentUser.emails.length; i++) {
      if (currentUser.emails[i].address.endsWith(currSett.mailDomainName)) {
        isAllowed = true;
        break;
      }
    }
  }
  return isAllowed;
}

function isLdapEnabled() {
  return process.env.LDAP_ENABLE === 'true' || process.env.LDAP_ENABLE === true;
}

function isOauth2Enabled() {
  return (
    process.env.OAUTH2_ENABLED === 'true' ||
    process.env.OAUTH2_ENABLED === true
  );
}

function isCasEnabled() {
  return process.env.CAS_ENABLED === 'true' || process.env.CAS_ENABLED === true;
}

function isApiEnabled() {
  return process.env.WITH_API === 'true' || process.env.WITH_API === true;
}

Meteor.startup(async () => {
  await ensureIndex(Settings, { modifiedAt: -1 });
  const setting = await getReactiveCache().getCurrentSetting();
  // #5879: honour the DEFAULT_AUTHENTICATION_METHOD env var. It used to be
  // ignored (settings only ever seeded 'password'), so operators configuring it
  // via Kubernetes/Helm saw no effect. When set it is authoritative, so the
  // default login method can be configured by env without the Admin Panel.
  const envDefaultAuthenticationMethod = normalizeAuthenticationMethod(
    process.env.DEFAULT_AUTHENTICATION_METHOD,
  );
  // CARDS_LOADING env: 'lazy' or 'all' (anything else / unset → undefined = leave
  // to the stored setting, defaulting to 'all'). Like DEFAULT_AUTHENTICATION_METHOD,
  // when the env var is set it is authoritative on every startup.
  const envCardsLoading = parseCardsLoadingEnv(process.env.CARDS_LOADING);
  if (!setting) {
    const now = new Date();
    const domain = process.env.ROOT_URL.match(/\/\/(?:www\.)?(.*)?(?:\/)?/)[1];
    const from = `Boards Support <support@${domain}>`;
    const defaultSetting = {
      disableRegistration: false,
      mailServer: {
        username: '',
        password: '',
        host: '',
        port: '',
        enableTLS: false,
        from,
      },
      createdAt: now,
      modifiedAt: now,
      displayAuthenticationMethod: true,
      defaultAuthenticationMethod:
        resolveDefaultAuthenticationMethod(envDefaultAuthenticationMethod, undefined),
    };
    await Settings.insertAsync(defaultSetting);
  } else if (
    envDefaultAuthenticationMethod &&
    setting.defaultAuthenticationMethod !== envDefaultAuthenticationMethod
  ) {
    // Existing install: keep the stored setting in sync with the env var so it
    // wins on every startup (the operator's env is the source of truth).
    await Settings.updateAsync(setting._id, {
      $set: { defaultAuthenticationMethod: envDefaultAuthenticationMethod },
    });
  }
  // Card loading is NOT an admin-configurable toggle: WeKan always adapts per board
  // ('auto' — big boards load lazily, small boards eagerly, #6480). Only the
  // CARDS_LOADING env var can force 'all'/'lazy'/'auto' for operators; there is no
  // stored setting. Mirror the effective mode + the lazy threshold onto
  // Meteor.settings.public so publications (server) and rendering (client) can read
  // them synchronously.
  {
    if (!Meteor.settings.public) Meteor.settings.public = {};
    Meteor.settings.public.cardsLoading = envCardsLoading || 'auto';
    Meteor.settings.public.cardsLoadingLazyThreshold =
      cardsLoadingLazyThreshold(process.env.CARDS_LOADING_LAZY_THRESHOLD);
  }
  if (isSandstorm) {
    const newSetting = await getReactiveCache().getCurrentSetting();
    if (!process.env.MAIL_URL && newSetting.mailUrl()) {
      process.env.MAIL_URL = newSetting.mailUrl();
    }
    Accounts.emailTemplates.from = process.env.MAIL_FROM
      ? process.env.MAIL_FROM
      : newSetting.mailServer.from;
  } else {
    Accounts.emailTemplates.from = process.env.MAIL_FROM;
  }
});

if (isSandstorm) {
  Settings.after.update((userId, doc, fieldNames) => {
    if (fieldNames.includes('mailServer') && doc.mailServer.host) {
      const protocol = doc.mailServer.enableTLS ? 'smtps://' : 'smtp://';
      if (!doc.mailServer.username && !doc.mailServer.password) {
        process.env.MAIL_URL = `${protocol}${doc.mailServer.host}:${doc.mailServer.port}/`;
      } else {
        process.env.MAIL_URL = `${protocol}${doc.mailServer.username}:${encodeURIComponent(
          doc.mailServer.password,
        )}@${doc.mailServer.host}:${doc.mailServer.port}/`;
      }
      Accounts.emailTemplates.from = doc.mailServer.from;
    }
  });
}

Meteor.methods({
  async sendInvitation(emails, boards) {
    let rc = 0;
    check(emails, [String]);
    check(boards, [String]);

    const user = await getReactiveCache().getCurrentUser();
    if (!user.isAdmin && !(await isNonAdminAllowedToSendMail(user))) {
      rc = -1;
      throw new Meteor.Error('not-allowed');
    }

    for (const rawEmail of emails) {
      // #4043: store the invitee address lowercase — the sign-up form
      // lowercases the typed address and MongoDB string matching is case
      // sensitive, so a mixed-case invitation document never matches at
      // registration ("The invitation code doesn't exist").
      const email = normalizeInviteEmail(rawEmail);
      if (email && SimpleSchema.RegEx.Email.test(email)) {
        const userExist = await getReactiveCache().getUser({ email });
        if (userExist) {
          rc = -1;
          throw new Meteor.Error(
            'user-exist',
            `The user with the email ${email} has already an account.`,
          );
        }

        const invitation = await getReactiveCache().getInvitationCode({ email });
        if (invitation) {
          // #4043: a re-invite must never re-send a stale code. When the
          // stored invitation is no longer valid (or has no usable code), a
          // fresh code overwrites it with valid restored to true, so the
          // emailed code always passes the sign-up lookup
          // { code, email, valid: true }.
          const modifier = buildReinviteModifier(invitation, boards, () =>
            generateInvitationCode(),
          );
          const updated = await InvitationCodes.updateAsync(
            invitation._id,
            modifier,
          );
          if (!updated) {
            rc = -1;
            throw new Meteor.Error(
              'invitation-generated-fail',
              'Failed to update invitation code',
            );
          }
          await sendInvitationEmail(invitation._id, { isNewInvitation: false });
        } else {
          // String(...) so the stored code always matches the (string) code
          // typed into the sign-up form, without relying on schema autoConvert.
          const code = generateInvitationCode();
          const _id = await InvitationCodes.insertAsync({
            code,
            email,
            boardsToBeInvited: boards,
            createdAt: new Date(),
            authorId: this.userId,
          });
          if (_id) {
            await sendInvitationEmail(_id);
          } else {
            rc = -1;
            throw new Meteor.Error(
              'invitation-generated-fail',
              'Failed to create invitation code',
            );
          }
        }
      }
    }
    return rc;
  },

  async sendSMTPTestEmail() {
    if (!this.userId) {
      throw new Meteor.Error('invalid-user');
    }
    const user = await getReactiveCache().getCurrentUser();
    // Sending an SMTP test (and surfacing the server's SMTP error messages) is
    // an admin-only diagnostic, matching the client gating (`unless currentUser.isAdmin`).
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('error-notAuthorized');
    }
    if (!user.emails || !user.emails[0] || !user.emails[0].address) {
      throw new Meteor.Error('email-invalid');
    }
    this.unblock();
    const lang = user.getLanguage();
    try {
      await Email.sendAsync({
        to: user.emails[0].address,
        from: Accounts.emailTemplates.from,
        subject: getTAPi18n().__('email-smtp-test-subject', { lng: lang }),
        text: getTAPi18n().__('email-smtp-test-text', { lng: lang }),
      });
    } catch ({ message }) {
      throw new Meteor.Error(
        'email-fail',
        `${getTAPi18n().__('email-fail-text', { lng: lang })}: ${message}`,
        message,
      );
    }
    return {
      message: 'email-sent',
      email: user.emails[0].address,
    };
  },

  async getCustomUI() {
    const setting = await getReactiveCache().getCurrentSetting();
    if (!setting.productName) {
      return {
        productName: '',
      };
    }
    return {
      productName: `${setting.productName}`,
    };
  },

  async isDisableRegistration() {
    const setting = await getReactiveCache().getCurrentSetting();
    return setting.disableRegistration === true;
  },

  async isDisableForgotPassword() {
    const setting = await getReactiveCache().getCurrentSetting();
    return setting.disableForgotPassword === true;
  },

  getMatomoConf() {
    return {
      address: getEnvVar('MATOMO_ADDRESS'),
      siteId: getEnvVar('MATOMO_SITE_ID'),
      doNotTrack: process.env.MATOMO_DO_NOT_TRACK || false,
      withUserName: process.env.MATOMO_WITH_USERNAME || false,
    };
  },

  _isLdapEnabled() {
    return isLdapEnabled();
  },

  _isOauth2Enabled() {
    return isOauth2Enabled();
  },

  _isCasEnabled() {
    return isCasEnabled();
  },

  _isApiEnabled() {
    return isApiEnabled();
  },

  getAuthenticationsEnabled() {
    return {
      ldap: isLdapEnabled(),
      oauth2: isOauth2Enabled(),
      cas: isCasEnabled(),
    };
  },

  getOauthServerUrl() {
    return process.env.OAUTH2_SERVER_URL;
  },

  getOauthDashboardUrl() {
    return process.env.DASHBOARD_URL;
  },

  // OIDC RP-initiated logout (https://openid.net/specs/openid-connect-rpinitiated-1_0.html).
  // When OAUTH2_LOGOUT_ENDPOINT is set (e.g. Keycloak's
  // /realms/<realm>/protocol/openid-connect/logout), build the end_session URL so
  // logout terminates the identity provider session and returns the user to Wekan
  // via post_logout_redirect_uri, instead of dumping them on the provider's home
  // page (which errors for non-admin users). See issue #6158.
  getOauthLogoutUrl() {
    const endpoint = process.env.OAUTH2_LOGOUT_ENDPOINT;
    if (!endpoint) return '';
    const serverUrl = (process.env.OAUTH2_SERVER_URL || '').replace(/\/$/, '');
    const base = /^https?:\/\//.test(endpoint) ? endpoint : serverUrl + endpoint;
    const params = [
      'post_logout_redirect_uri=' + encodeURIComponent(Meteor.absoluteUrl()),
    ];
    if (process.env.OAUTH2_CLIENT_ID) {
      params.push('client_id=' + encodeURIComponent(process.env.OAUTH2_CLIENT_ID));
    }
    return base + (base.includes('?') ? '&' : '?') + params.join('&');
  },

  getDefaultAuthenticationMethod() {
    return process.env.DEFAULT_AUTHENTICATION_METHOD;
  },

  isPasswordLoginEnabled() {
    return !(process.env.PASSWORD_LOGIN_ENABLED === 'false');
  },

  // #5695: loadOidcConfig() returns a Promise since the Meteor 3 async
  // migration (findOneAsync). Object.keys(<Promise>) is always [], so this
  // method returned false even with OIDC_REDIRECTION_ENABLED=true and a
  // configured oidc service, silently disabling the auto-redirect login.
  // Await the config before inspecting it.
  async isOidcRedirectionEnabled() {
    if (process.env.OIDC_REDIRECTION_ENABLED !== 'true') return false;
    const config = await loadOidcConfig('oidc');
    return !!config && Object.keys(config).length > 0;
  },

  async getServiceConfiguration(service) {
    const config = await loadOidcConfig(service);
    if (!config) return null;
    // Never expose the client secret to the caller
    const { secret, ...publicConfig } = config;
    return publicConfig;
  },
});

// GlobalAdmin REST API for the Admin Panel global settings.
//
// The fields a global admin may read and write over REST. Deliberately excludes
// `mailServer` (it holds SMTP credentials) so the REST API never exposes or
// overwrites secrets; SMTP stays admin-panel / env only.
const REST_SETTINGS_FIELDS = [
  'disableRegistration',
  'disableForgotPassword',
  'productName',
  'displayAuthenticationMethod',
  'defaultAuthenticationMethod',
  'spinnerName',
  'hideLogo',
  'hideCardCounterList',
  'hideBoardMemberList',
  'customLoginLogoImageUrl',
  'customLoginLogoLinkUrl',
  'customHelpLinkUrl',
  'textBelowCustomLoginLogo',
  'automaticLinkedUrlSchemes',
  'customTopLeftCornerLogoImageUrl',
  'customTopLeftCornerLogoLinkUrl',
  'customTopLeftCornerLogoHeight',
  'oidcBtnText',
  'mailDomainName',
  'legalNotice',
  'customHeadEnabled',
  'customHeadMetaTags',
  'customHeadLinkTags',
  'customManifestEnabled',
  'customManifestContent',
  'customAssetLinksEnabled',
  'customAssetLinksContent',
  'accessibilityPageEnabled',
  'accessibilityTitle',
  'accessibilityContent',
  'supportPopupText',
  'supportPageEnabled',
  'supportPagePublic',
  'supportTitle',
  'supportPageText',
];

function pickSettingsFields(doc) {
  const out = { _id: doc && doc._id };
  if (doc) {
    REST_SETTINGS_FIELDS.forEach(field => {
      if (doc[field] !== undefined) {
        out[field] = doc[field];
      }
    });
  }
  return out;
}

/**
 * @operation get_global_settings
 * @tag Settings
 *
 * @summary Get the global Admin Panel settings
 *
 * @description Only the global admin can call this. SMTP/mail-server
 * credentials are never returned.
 *
 * @return_type Settings
 */
WebApp.handlers.get('/api/settings', async function(req, res) {
  try {
    await Authentication.checkUserId(req.userId);
    const setting = await Settings.findOneAsync({});
    sendJsonResult(res, { code: 200, data: pickSettingsFields(setting) });
  } catch (error) {
    sendJsonResult(res, { code: 200, data: error });
  }
});

/**
 * @operation update_global_settings
 * @tag Settings
 *
 * @summary Update the global Admin Panel settings
 *
 * @description Only the global admin can call this. The request body is an
 * object whose keys are settings fields to update (see get_global_settings for
 * the list). Unknown keys and `mailServer` are ignored.
 *
 * @param {Object} settings the settings fields to set
 * @return_type Settings
 */
WebApp.handlers.put('/api/settings', async function(req, res) {
  try {
    await Authentication.checkUserId(req.userId);
    const setting = await Settings.findOneAsync({});
    if (!setting) {
      sendJsonResult(res, { code: 404, data: { error: 'Settings not found' } });
      return;
    }
    const body = req.body || {};
    const $set = {};
    REST_SETTINGS_FIELDS.forEach(field => {
      if (body[field] !== undefined) {
        $set[field] = body[field];
      }
    });
    if (Object.keys($set).length > 0) {
      await Settings.updateAsync(setting._id, { $set });
    }
    const updated = await Settings.findOneAsync({});
    sendJsonResult(res, { code: 200, data: pickSettingsFields(updated) });
  } catch (error) {
    sendJsonResult(res, { code: 200, data: error });
  }
});
