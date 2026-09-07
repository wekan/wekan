import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';
import { Email, EmailInternals } from 'meteor/email';
import { installAdminMailTransport, installMailTransport } from '/server/lib/mailTransport';
import { ServiceConfiguration } from 'meteor/service-configuration';
import { WebApp } from 'meteor/webapp';
import Settings from '/models/settings';
import Boards from '/models/boards';
import InvitationCodes from '/models/invitationCodes';
import EmailLocalization from '/server/lib/emailLocalization';
import { ensureIndex } from '/server/lib/mongoStartup';
import { Authentication } from '/server/authentication';
import { sendJsonResult } from '/server/apiMiddleware';
import { setPermanentDeleteEnabledForAdmin } from '/server/lib/permanentDeleteSetting';
import { enabledLoginAuthenticationMethods } from '/server/lib/adminLoginSettings';
import {
  saveMailTransportForAdmin,
  sendSmtpTestForAdmin,
} from '/server/lib/adminEmailSettings';
import securityLog from '/server/lib/securityLog';
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
const { mailServiceStorageKey } = require('/models/lib/mailServices');
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
    const lang = authorUser.getLanguage();
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

// Shared by the Meteor method and the cookieless HTML4 Login pane. The actor is
// explicit, so an HTTP request cannot inherit or spoof a DDP invocation.
async function invitationActor(userId, context = {}) {
  const user = await getReactiveCache().getUser(userId);
  if (!user || (!user.isAdmin && !(await isNonAdminAllowedToSendMail(user)))) {
    securityLog.record({ category: 'authz', bleed: 'InvitationBleed', severity: 'high',
      action: 'blocked', source: 'memberInvitation', userId,
      username: user?.username, req: context.req, connection: context.connection,
      detail: 'refused invitation access without instance permission' });
    throw new Meteor.Error('not-allowed');
  }
  return user;
}

function invitationBoardSelector(user) {
  return { archived: false, members: { $elemMatch: {
    userId: user._id, isActive: true, isAdmin: true,
  } } };
}

export async function invitationChoicesForUser(userId, context = {}) {
  const user = await invitationActor(userId, context);
  const boards = await Boards.find(invitationBoardSelector(user), {
    fields: { title: 1 }, sort: { sort: 1, title: 1 }, limit: 500,
  }).fetchAsync();
  return boards.map(board => ({ _id: board._id, title: board.title || '' }));
}

export async function sendInvitationsForUser(userId, emails, boards, context = {}) {
  check(emails, [String]);
  check(boards, [String]);
  const user = await invitationActor(userId, context);
  if (!emails.length || emails.length > 100 || boards.length > 500) {
    securityLog.record({ category: 'validation', bleed: 'InvitationBleed', severity: 'high',
      action: 'blocked', source: 'memberInvitation', userId, username: user.username,
      req: context.req, connection: context.connection,
      detail: `refused invitation list sizes emails=${emails.length} boards=${boards.length}` });
    throw new Meteor.Error('invalid-invitation');
  }
  const normalizedEmails = [...new Set(emails.map(normalizeInviteEmail))];
  if (normalizedEmails.some(email => !email || !SimpleSchema.RegEx.Email.test(email))) {
    securityLog.record({ category: 'validation', bleed: 'InvitationBleed', severity: 'high',
      action: 'blocked', source: 'memberInvitation', userId, username: user.username,
      req: context.req, connection: context.connection,
      detail: 'refused malformed invitation email address' });
    throw new Meteor.Error('invalid-email');
  }
  const uniqueBoards = [...new Set(boards)];
  const allowedBoards = uniqueBoards.length ? await Boards.find({
    ...invitationBoardSelector(user), _id: { $in: uniqueBoards },
  }, { fields: { _id: 1 }, limit: 500 }).fetchAsync() : [];
  if (allowedBoards.length !== uniqueBoards.length) {
    securityLog.record({ category: 'authz', bleed: 'InvitationBleed', severity: 'high',
      action: 'blocked', source: 'memberInvitation', userId, username: user.username,
      req: context.req, connection: context.connection,
      detail: 'refused archived, missing or out-of-scope invitation board' });
    throw new Meteor.Error('not-allowed');
  }
  for (const email of normalizedEmails) {
    const userExist = await getReactiveCache().getUser({ email });
    if (userExist) throw new Meteor.Error('user-exist',
      `The user with the email ${email} has already an account.`);
    const invitation = await getReactiveCache().getInvitationCode({ email });
    if (invitation) {
      const modifier = buildReinviteModifier(invitation, uniqueBoards, generateInvitationCode);
      if (!(await InvitationCodes.updateAsync(invitation._id, modifier))) {
        throw new Meteor.Error('invitation-generated-fail',
          'Failed to update invitation code');
      }
      await sendInvitationEmail(invitation._id, { isNewInvitation: false });
    } else {
      const _id = await InvitationCodes.insertAsync({
        code: generateInvitationCode(), email, boardsToBeInvited: uniqueBoards,
        createdAt: new Date(), authorId: userId,
      });
      if (!_id) throw new Meteor.Error('invitation-generated-fail',
        'Failed to create invitation code');
      await sendInvitationEmail(_id);
    }
  }
  return 0;
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
        enabled: false,
        service: 'SMTP',
        configurations: { SMTP: {} },
        passwords: {},
        passwordSet: {},
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
  // #6116 split: the single "same Organization OR Team" restriction became one
  // setting per kind, shown in Admin Panel / People / Organizations and / Teams. An
  // install that has the old field and neither new one is migrated to BOTH - which
  // is the same rule it had - so nobody's board-member restriction changes by
  // upgrading. Ticking only one of the two afterwards is the new, narrower choice.
  {
    const current = await getReactiveCache().getCurrentSetting();
    if (
      current &&
      current.boardMembersFromSameOrgOrTeamOnly &&
      current.boardMembersFromSameOrgOnly === undefined &&
      current.boardMembersFromSameTeamOnly === undefined
    ) {
      await Settings.updateAsync(current._id, {
        $set: {
          boardMembersFromSameOrgOnly: true,
          boardMembersFromSameTeamOnly: true,
        },
      });
    }
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

  // #6551: a mail server whose certificate does not match the name it is reached
  // by ("Hostname/IP doesn't match certificate's altnames") could not be used at
  // all. MAIL_TLS_CA_CERT says which certificate to trust and MAIL_TLS_SERVERNAME
  // which name to verify against - verification stays on either way.
  const currentMailSetting = await getReactiveCache().getCurrentSetting();
  if (currentMailSetting?.mailServer?.enabled) {
    const service = currentMailSetting.mailServer.service || 'SMTP';
    const key = mailServiceStorageKey(service);
    Accounts.emailTemplates.from =
      currentMailSetting.mailServer.configurations?.[key]?.from ||
      currentMailSetting.mailServer.from;
  }
  const mailTransport = currentMailSetting?.mailServer?.enabled
    ? installAdminMailTransport({ Email, EmailInternals, mailServer: currentMailSetting.mailServer })
    : installMailTransport({ Email, EmailInternals });
  if (mailTransport === 'custom-tls') {
    console.info(
      'Mail TLS: using MAIL_TLS_CA_CERT / MAIL_TLS_SERVERNAME. The certificate is ' +
      'still verified - against the certificate you supplied, or the name you named.',
    );
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
  async saveAdminMailSettings(input) {
    // Mark the complete method argument as checked before any authorization
    // branch can return. Otherwise audit-argument-checks replaces the useful
    // authorization error with an unrelated generic 500 for non-admins.
    check(input, Object);
    const actor = this.userId && await Meteor.users.findOneAsync(this.userId, {
      fields: { isAdmin: 1, username: 1 },
    });
    if (!actor?.isAdmin) {
      securityLog.record({ severity: 'high', category: 'authz',
        bleed: 'MailSettingsBleed', action: 'blocked',
        source: 'saveAdminMailSettings', userId: this.userId,
        username: actor?.username,
        detail: 'refused direct method attempt to change instance email settings' });
      throw new Meteor.Error('error-notAuthorized', 'Not authorized');
    }
    try {
      return await saveMailTransportForAdmin(this.userId, input);
    } catch (error) {
      securityLog.record({ severity: 'high', category: 'validation',
        bleed: 'MailSettingsBleed', action: 'blocked',
        source: 'saveAdminMailSettings', userId: this.userId,
        username: actor.username,
        detail: `mail settings method failed: ${error?.message || error}` });
      throw error;
    }
  },
  async setPermanentDeleteEnabled(enabled) {
    return setPermanentDeleteEnabledForAdmin(this.userId, enabled, this.connection);
  },

  async sendInvitation(emails, boards) {
    return sendInvitationsForUser(this.userId, emails, boards, { connection: this.connection });
  },

  async sendSMTPTestEmail() {
    this.unblock();
    try {
      return await sendSmtpTestForAdmin(this.userId);
    } catch (error) {
      throw new Meteor.Error(error?.error || 'email-fail',
        error?.reason || error?.message || 'Email test failed');
    }
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
    const enabled = enabledLoginAuthenticationMethods();
    return { ldap: enabled.includes('ldap'), oauth2: enabled.includes('oauth2'),
      cas: enabled.includes('cas') };
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
    check(service, String);
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
  'customLoginLogoLinkUrl',
  'customHelpLinkUrl',
  'textBelowCustomLoginLogo',
  'automaticLinkedUrlSchemes',
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
