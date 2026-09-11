import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';
import { Email, EmailInternals } from 'meteor/email';
import { installAdminMailTransport, installMailTransport } from '/server/lib/mailTransport';
import { ServiceConfiguration } from 'meteor/service-configuration';
import { WebApp } from 'meteor/webapp';
import { DDP } from 'meteor/ddp';
import Settings from '/models/settings';
import InvitationCodes from '/models/invitationCodes';
import EmailLocalization from '/server/lib/emailLocalization';
import { ensureIndex } from '/server/lib/mongoStartup';
import { Authentication } from '/server/authentication';
import { sendJsonResult } from '/server/apiMiddleware';
import RecoveryEvents from '/models/recoveryEvents';
import { recordRecoveryAudit } from '/server/lib/recoveryAudit';
const { buildOauthLogoutUrl } = require('/server/lib/oauthLogoutUrl');
const { parseCardsLoadingEnv, cardsLoadingLazyThreshold } = require('/models/lib/cardsLoading');
const {
  normalizeInviteEmail,
  isInvitationCodeSendable,
  buildReinviteModifier,
  shouldRemoveInvitationOnEmailFailure,
} = require('/models/lib/invitationCodeEmail');
const { substituteVars } = require('/models/lib/ruleVarsSubstitute');
const { resolveConfigValue, hasConfigValue } = require('/models/lib/configResolver');
// The Meteor accounts-* OAuth providers the Admin Panel can override
// (models/lib/oauthProviders.js). Required lazily so this file loads even
// while the catalog module is absent; the fallback carries the same keys.
const FALLBACK_OAUTH_PROVIDER_KEYS = [
  'google', 'github', 'facebook', 'twitter', 'meteor-developer', 'weibo', 'meetup',
];
function oauthProviderCatalog() {
  try {
    const { OAUTH_PROVIDERS } = require('/models/lib/oauthProviders');
    if (Array.isArray(OAUTH_PROVIDERS) && OAUTH_PROVIDERS.length) return OAUTH_PROVIDERS;
  } catch (e) {
    // fall through to the minimal catalog below
  }
  return FALLBACK_OAUTH_PROVIDER_KEYS.map(key => {
    const upper = key.toUpperCase().replace(/-/g, '_');
    const idVar = key === 'facebook' ? 'OAUTH_FACEBOOK_APP_ID'
      : key === 'twitter' ? 'OAUTH_TWITTER_CONSUMER_KEY'
      : `OAUTH_${upper}_CLIENT_ID`;
    return { key, envPrefix: `OAUTH_${upper}`, idVar, secretVar: `OAUTH_${upper}_SECRET` };
  });
}
// Re-read the Settings document and the OAUTH_* env vars into Meteor's
// ServiceConfiguration so an Admin Panel change takes effect without a server
// restart. Guarded: the reconfigure module is optional and a failure in it
// must never turn a successful save into an error.
function reconfigureOauthProvidersNow() {
  try {
    const mod = require('/server/lib/oauthProviders');
    if (typeof mod.reconfigureOauthProviders === 'function') {
      const p = mod.reconfigureOauthProviders();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    }
  } catch (e) {
    // the module is not present, or reconfiguring failed; the saved settings
    // still apply at the next startup.
  }
}

const getReactiveCache = () => require('/imports/reactiveCache').ReactiveCache;
const getTAPi18n = () => require('/imports/i18n').TAPi18n;
const { SimpleSchema } = require('/imports/simpleSchema');
const { isSupportedMailService, mailServiceStorageKey } = require('/models/lib/mailServices');
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
    // #2022: an admin-customized invite template (Admin Panel -> Email
    // Templates) overrides the hardcoded i18n subject/text, using the same
    // {token} substitution the #3304 rule "send email" action uses
    // (substituteVars). Unset (the default on every existing install) falls
    // through to the exact i18n-driven content below, unchanged.
    const setting = await getReactiveCache().getCurrentSetting();
    const templateVars = {
      email: params.email,
      inviter: params.inviter,
      user: params.user,
      icode: params.icode,
      url: params.url,
    };
    if (setting && setting.inviteEmailSubjectTemplate) {
      // Sent directly (not through EmailLocalization.sendEmail) because the
      // subject/text here are already-substituted plain text, not i18n keys
      // - passing them through TAPi18n.__() would treat the custom text
      // itself as a translation key to look up.
      await Email.sendAsync({
        to: icode.email,
        from: Accounts.emailTemplates.from,
        subject: substituteVars(setting.inviteEmailSubjectTemplate, templateVars),
        text: substituteVars(setting.inviteEmailBodyTemplate || '', templateVars),
      });
    } else {
      await EmailLocalization.sendEmail({
        to: icode.email,
        from: Accounts.emailTemplates.from,
        subject: 'email-invite-register-subject',
        text: 'email-invite-register-text',
        params,
        language: lang,
      });
    }
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

function isSamlEnabled() {
  return (
    process.env.SAML_ENABLED === 'true' || process.env.SAML_ENABLED === true
  );
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
    check(input, Object);
    const user = await Meteor.userAsync();
    if (!user?.isAdmin) throw new Meteor.Error('error-notAuthorized');

    const service = String(input.service || 'SMTP');
    if (!isSupportedMailService(service)) throw new Meteor.Error('mail-service-invalid');
    const storageKey = mailServiceStorageKey(service);
    const configuration = input.configuration || {};
    check(configuration, Object);
    const clean = {
      username: String(configuration.username || '').trim(),
      from: String(configuration.from || '').trim(),
    };
    if (service === 'SMTP') {
      clean.host = String(configuration.host || '').trim();
      clean.port = String(configuration.port || '').trim();
      clean.secure = configuration.secure === true;
      if (input.enabled && !clean.host) throw new Meteor.Error('mail-host-required');
    }
    if (input.enabled && !clean.from) throw new Meteor.Error('mail-from-required');

    const setting = await Settings.findOneAsync({});
    const set = {
      'mailServer.enabled': input.enabled === true,
      'mailServer.service': service,
      [`mailServer.configurations.${storageKey}`]: clean,
      'mailServer.from': clean.from,
    };
    const password = String(input.password || '');
    if (password) {
      set[`mailServer.passwords.${storageKey}`] = password;
      set[`mailServer.passwordSet.${storageKey}`] = true;
    }
    await Settings.updateAsync(setting._id, { $set: set });
    const updated = await Settings.findOneAsync(setting._id);
    Accounts.emailTemplates.from = updated.mailServer.enabled
      ? clean.from
      : process.env.MAIL_FROM;
    if (updated.mailServer.enabled) {
      installAdminMailTransport({ Email, EmailInternals, mailServer: updated.mailServer });
    } else {
      delete Email.customTransport;
      installMailTransport({ Email, EmailInternals });
    }
    return true;
  },
  // Admin Panel -> LDAP override (models/lib/configResolver.js). Saves the
  // non-secret LDAP_* overrides plainly, and the bind password ONLY when a new
  // one was actually typed (an empty submission leaves the currently-active
  // value/source - admin or env var - untouched, matching saveAdminMailSettings
  // above and the maintainer's "empty submission = no change" requirement).
  // The password is never returned to the caller; only 'ldap.bindPasswordSet'
  // is published (server/publications/settings.js), so the client can show
  // "a password is configured" without ever holding the password itself.
  async saveLdapSettings(input) {
    check(input, Object);
    const user = await Meteor.userAsync();
    if (!user?.isAdmin) throw new Meteor.Error('error-notAuthorized');

    const clean = {
      'ldap.enabled': input.enabled === true,
      'ldap.host': String(input.host || '').trim(),
      'ldap.port': String(input.port || '').trim(),
      'ldap.baseDN': String(input.baseDN || '').trim(),
      'ldap.authentificationUserDN': String(input.authentificationUserDN || '').trim(),
      'ldap.userSearchFilter': String(input.userSearchFilter || '').trim(),
      'ldap.userSearchField': String(input.userSearchField || '').trim(),
      'ldap.encryption': String(input.encryption || '').trim(),
    };

    const setting = await Settings.findOneAsync({});
    if (!setting) throw new Meteor.Error('settings-not-found');

    const set = { ...clean };
    const bindPassword = String(input.bindPassword || '');
    if (bindPassword) {
      set['ldap.bindPassword'] = bindPassword;
      set['ldap.bindPasswordSet'] = true;
    }
    await Settings.updateAsync(setting._id, { $set: set });
    return true;
  },
  // Admin-only. Tells the Admin Panel LDAP section WHICH source (env var /
  // admin panel / not configured) is currently active for each field - the
  // maintainer's "clearly visible, is in use environment variable or admin
  // panel setting" requirement - WITHOUT ever sending a secret's value. The
  // non-secret fields' resolved value is included too (host/port/DN/filter are
  // not secrets and are useful for debugging); the bind password is reported
  // ONLY as hasValue/source, from hasConfigValue(), never its actual value.
  // Nothing here reads a composite/connection-string-shaped env var (LDAP's
  // host and credentials are already separate fields, not a combined URL), so
  // there is no embedded-credential string to redact for this module - see
  // models/lib/configResolver.js's redactCredentialsInUrl() for the helper
  // that exists for the general case.
  async getLdapConfigSources() {
    const user = await Meteor.userAsync();
    if (!user?.isAdmin) throw new Meteor.Error('error-notAuthorized');

    const setting = await Settings.findOneAsync({});
    const ldap = setting?.ldap || {};

    const fieldMap = {
      enabled: 'LDAP_ENABLE',
      host: 'LDAP_HOST',
      port: 'LDAP_PORT',
      baseDN: 'LDAP_BASEDN',
      authentificationUserDN: 'LDAP_AUTHENTIFICATION_USERDN',
      userSearchFilter: 'LDAP_USER_SEARCH_FILTER',
      userSearchField: 'LDAP_USER_SEARCH_FIELD',
      encryption: 'LDAP_ENCRYPTION',
    };
    const result = {};
    Object.keys(fieldMap).forEach(field => {
      const resolved = resolveConfigValue(fieldMap[field], ldap[field]);
      result[field] = { source: resolved.source, value: resolved.value };
    });
    const passwordStatus = hasConfigValue(
      'LDAP_AUTHENTIFICATION_PASSWORD',
      ldap.bindPassword,
    );
    result.bindPassword = {
      source: passwordStatus.source,
      hasValue: passwordStatus.hasValue,
    };
    return result;
  },
  // Admin Panel -> OAuth login providers (Meteor's accounts-google/-github/
  // -facebook/-twitter/-meteor-developer/-weibo/-meetup; the catalog is
  // models/lib/oauthProviders.js). Same contract as saveLdapSettings above:
  // isAdmin only, the non-secret fields (`enabled`, `id`, `loginStyle`) are
  // saved plainly, the secret ONLY when a new one was actually typed - an
  // empty submission leaves the stored secret and its source untouched - and
  // the secret is never returned; only 'oauthProviders.<key>.secretSet' is
  // published (server/publications/settings.js). After saving, the provider
  // is reconfigured in place (server/lib/oauthProviders.js) so switching a
  // login method on or off needs no server restart.
  async saveOauthProviderSettings(providerKey, input) {
    check(providerKey, String);
    check(input, Object);
    const user = await Meteor.userAsync();
    if (!user?.isAdmin) throw new Meteor.Error('error-notAuthorized');

    const provider = oauthProviderCatalog().find(p => p.key === providerKey);
    if (!provider) throw new Meteor.Error('error-unknown-oauth-provider');

    const setting = await Settings.findOneAsync({});
    if (!setting) throw new Meteor.Error('settings-not-found');

    const prefix = `oauthProviders.${providerKey}`;
    const set = {
      [`${prefix}.enabled`]: input.enabled === true,
      [`${prefix}.id`]: String(input.id || '').trim(),
    };
    if (input.loginStyle !== undefined) {
      const loginStyle = String(input.loginStyle || '').trim();
      set[`${prefix}.loginStyle`] =
        loginStyle === 'popup' || loginStyle === 'redirect' ? loginStyle : '';
    }
    const secret = String(input.secret || '');
    if (secret) {
      set[`${prefix}.secret`] = secret;
      set[`${prefix}.secretSet`] = true;
    }
    // The two settings shared by every provider ride along with any save.
    if (input.globalLoginStyle !== undefined) {
      const style = String(input.globalLoginStyle || '').trim();
      set.oauthProvidersLoginStyle =
        style === 'popup' || style === 'redirect' ? style : '';
    }
    if (input.mergeExistingUsers !== undefined) {
      set.oauthProvidersMergeExistingUsers = input.mergeExistingUsers === true;
    }
    await Settings.updateAsync(setting._id, { $set: set });
    reconfigureOauthProvidersNow();
    return true;
  },
  // Admin Panel -> Passwordless login (Meteor accounts-passwordless, env var
  // PASSWORDLESS_ENABLED). isAdmin only; no secret involved.
  async savePasswordlessSettings(input) {
    check(input, Object);
    const user = await Meteor.userAsync();
    if (!user?.isAdmin) throw new Meteor.Error('error-notAuthorized');

    const setting = await Settings.findOneAsync({});
    if (!setting) throw new Meteor.Error('settings-not-found');
    await Settings.updateAsync(setting._id, {
      $set: { passwordlessEnabled: input.enabled === true },
    });
    reconfigureOauthProvidersNow();
    return true;
  },
  // Admin-only. Which source (env var / Admin Panel / unset) is active for
  // every OAuth provider field, the shared login style / merge setting and
  // passwordless - the LDAP getLdapConfigSources contract. The secret is
  // reported ONLY as hasValue/source from hasConfigValue(), never its value.
  async getOauthProviderConfigSources() {
    const user = await Meteor.userAsync();
    if (!user?.isAdmin) throw new Meteor.Error('error-notAuthorized');

    const setting = await Settings.findOneAsync({});
    const stored = setting?.oauthProviders || {};
    const result = { providers: {} };
    oauthProviderCatalog().forEach(provider => {
      const admin = stored[provider.key] || {};
      const enabled = resolveConfigValue(
        `${provider.envPrefix}_ENABLED`,
        admin.enabled,
      );
      const id = resolveConfigValue(provider.idVar, admin.id);
      const secret = hasConfigValue(provider.secretVar, admin.secret);
      result.providers[provider.key] = {
        enabled: { source: enabled.source, value: enabled.value },
        id: { source: id.source, value: id.value },
        secret: { source: secret.source, hasValue: secret.hasValue },
      };
    });
    const style = resolveConfigValue(
      'OAUTH_PROVIDERS_LOGIN_STYLE',
      setting?.oauthProvidersLoginStyle,
    );
    result.loginStyle = { source: style.source, value: style.value };
    const merge = resolveConfigValue(
      'OAUTH_PROVIDERS_MERGE_EXISTING_USERS',
      setting?.oauthProvidersMergeExistingUsers,
    );
    result.mergeExistingUsers = { source: merge.source, value: merge.value };
    const passwordless = resolveConfigValue(
      'PASSWORDLESS_ENABLED',
      setting?.passwordlessEnabled,
    );
    result.passwordless = { source: passwordless.source, value: passwordless.value };
    return result;
  },
  async setPermanentDeleteEnabled(enabled) {
    const user = await Meteor.userAsync();
    const username = user?.username || user?._id || 'unknown';
    try {
      check(enabled, Boolean);
      if (user?.isAdmin !== true) {
        throw new Meteor.Error('not-authorized');
      }

      const setting = await Settings.findOneAsync({});
      if (!setting) {
        throw new Meteor.Error('settings-not-found');
      }
      if ((setting.enablePermanentDelete === true) === enabled) return enabled;

      await Settings.updateAsync(setting._id, {
        $set: { enablePermanentDelete: enabled },
      });
      await recordRecoveryAudit({
        type: RecoveryEvents.types.PERMANENT_DELETE_SETTING_CHANGED,
        user,
        connection: this.connection,
        done: true,
        detail: `Global Admin ${username} (${user._id}) ${enabled ? 'enabled' : 'disabled'} permanent delete.`,
      });
      return enabled;
    } catch (error) {
      await recordRecoveryAudit({
        type: RecoveryEvents.types.PERMANENT_DELETE_SETTING_CHANGED,
        user,
        connection: this.connection,
        done: false,
        detail: `User ${username} (${user?._id || 'not logged in'}) failed to ${enabled ? 'enable' : 'disable'} permanent delete: ${error.reason || error.message || 'unknown error'}.`,
      });
      throw error;
    }
  },

  // Admin-level default of the 3-tier Notification Settings system (see
  // models/lib/notificationSettings.js). `service` is 'tray' or 'email';
  // `enabled` is the admin default for it. Board and member overrides are set
  // through their own methods (setBoardNotifyOverride in models/boards.js,
  // setMemberNotifyOverride in models/users.js) and win over this default.
  async setAdminNotifyDefault(service, enabled) {
    check(service, String);
    check(enabled, Boolean);
    const user = await Meteor.userAsync();
    if (user?.isAdmin !== true) {
      throw new Meteor.Error('not-authorized');
    }
    const field = service === 'email' ? 'notifyDefaultEmail'
      : service === 'tray' ? 'notifyDefaultTray'
      : null;
    if (!field) throw new Meteor.Error('invalid-service');

    const setting = await Settings.findOneAsync({});
    if (!setting) throw new Meteor.Error('settings-not-found');
    await Settings.updateAsync(setting._id, { $set: { [field]: enabled } });
    return enabled;
  },

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
    const enabled = {
      ldap: isLdapEnabled(),
      oauth2: isOauth2Enabled(),
      cas: isCasEnabled(),
      saml: isSamlEnabled(),
    };
    // Meteor's own accounts-* providers and accounts-passwordless
    // (server/lib/oauthProviders.js): one key per enabled provider, so the
    // login form shows a button for each. Keys only - never a credential.
    try {
      const oauth = require('/server/lib/oauthProviders');
      oauth.enabledOauthProviders().forEach(key => {
        enabled[key] = true;
      });
      enabled.passwordless = oauth.isPasswordlessLoginEnabled();
    } catch (e) {
      enabled.passwordless = false;
    }
    return enabled;
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
    return buildOauthLogoutUrl({
      endpoint: process.env.OAUTH2_LOGOUT_ENDPOINT,
      serverUrl: process.env.OAUTH2_SERVER_URL,
      clientId: process.env.OAUTH2_CLIENT_ID,
      redirectUri: Meteor.absoluteUrl(),
    });
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

/**
 * @operation get_oauth_provider_settings
 * @tag Settings
 *
 * @summary Get the OAuth login provider and passwordless settings
 *
 * @description The Admin Panel / People / Login section for Meteor's own
 * accounts-* login services (Google, GitHub, Facebook, X/Twitter, Meteor
 * Developer, Weibo, Meetup) and passwordless email codes. For every provider
 * field, the shared login style, the merge switch and passwordless it reports
 * which source is in effect - `env` (the `OAUTH_*` / `PASSWORDLESS_ENABLED`
 * environment variable), `admin` (a value saved in the Admin Panel) or
 * `unset` - and the resolved value. A provider's secret is reported ONLY as
 * `{ source, hasValue }`; its value is never returned. Only the global admin
 * can call this.
 *
 * @return_type {providers: object, loginStyle: {source: string, value: string}, mergeExistingUsers: {source: string, value: string}, passwordless: {source: string, value: string}}
 */
WebApp.handlers.get('/api/admin/oauth-providers', async function(req, res) {
  try {
    await Authentication.checkUserId(req.userId);
    const sources = await DDP._CurrentMethodInvocation.withValue(
      { userId: req.userId },
      async () => Meteor.callAsync('getOauthProviderConfigSources'),
    );
    sendJsonResult(res, { code: 200, data: sources });
  } catch (error) {
    sendJsonResult(res, { code: error.statusCode || 500, data: { error: error.reason || error.message } });
  }
});

/**
 * @operation update_oauth_provider_settings
 * @tag Settings
 *
 * @summary Update one OAuth login provider's Admin Panel settings
 *
 * @description The same save the Admin Panel makes: `enabled` and `id` are
 * stored as given, `secret` only when non-empty (an empty or missing secret
 * leaves the stored one untouched), and `loginStyle` must be `popup` or
 * `redirect` (anything else clears the per-provider override). The two
 * settings shared by every provider, `globalLoginStyle` and
 * `mergeExistingUsers`, may ride along. A value saved here wins over the
 * environment variable, and the provider is reconfigured at once, without a
 * restart. The response is the same source report as
 * get_oauth_provider_settings and never contains a secret. Only the global
 * admin can call this.
 *
 * @param {string} providerKey one of google, github, facebook, twitter, meteor-developer, weibo, meetup
 * @param {boolean} [enabled] whether the provider's login button is offered
 * @param {string} [id] the client id / app id / consumer key issued by the provider
 * @param {string} [secret] the client secret; omitted or empty keeps the stored one
 * @param {string} [loginStyle] popup or redirect, for this provider
 * @param {string} [globalLoginStyle] popup or redirect, the default for every provider
 * @param {boolean} [mergeExistingUsers] link a first provider login to an existing account with the same verified email
 * @return_type {providers: object, loginStyle: {source: string, value: string}, mergeExistingUsers: {source: string, value: string}, passwordless: {source: string, value: string}}
 */
WebApp.handlers.put('/api/admin/oauth-providers/:providerKey', async function(req, res) {
  try {
    await Authentication.checkUserId(req.userId);
    const providerKey = String(req.params.providerKey || '');
    if (!oauthProviderCatalog().some(p => p.key === providerKey)) {
      sendJsonResult(res, { code: 404, data: { error: 'Unknown OAuth provider' } });
      return;
    }
    const body = req.body || {};
    const input = {};
    ['enabled', 'id', 'secret', 'loginStyle', 'globalLoginStyle', 'mergeExistingUsers'].forEach(key => {
      if (body[key] !== undefined) input[key] = body[key];
    });
    const sources = await DDP._CurrentMethodInvocation.withValue(
      { userId: req.userId },
      async () => {
        await Meteor.callAsync('saveOauthProviderSettings', providerKey, input);
        return Meteor.callAsync('getOauthProviderConfigSources');
      },
    );
    sendJsonResult(res, { code: 200, data: sources });
  } catch (error) {
    sendJsonResult(res, { code: error.statusCode || 500, data: { error: error.reason || error.message } });
  }
});

/**
 * @operation update_passwordless_settings
 * @tag Settings
 *
 * @summary Turn passwordless (email sign-in code) login on or off
 *
 * @description The Admin Panel override of `PASSWORDLESS_ENABLED`. While it
 * is off, the sign-in-code form is not shown and the token request and the
 * login attempt are both refused, so the package can neither create accounts
 * nor send codes. Takes effect at once, without a restart. Only the global
 * admin can call this.
 *
 * @param {boolean} enabled whether passwordless login is offered
 * @return_type {passwordless: {source: string, value: string}}
 */
WebApp.handlers.put('/api/admin/passwordless', async function(req, res) {
  try {
    await Authentication.checkUserId(req.userId);
    const body = req.body || {};
    const sources = await DDP._CurrentMethodInvocation.withValue(
      { userId: req.userId },
      async () => {
        await Meteor.callAsync('savePasswordlessSettings', { enabled: body.enabled === true });
        return Meteor.callAsync('getOauthProviderConfigSources');
      },
    );
    sendJsonResult(res, { code: 200, data: { passwordless: sources.passwordless } });
  } catch (error) {
    sendJsonResult(res, { code: error.statusCode || 500, data: { error: error.reason || error.message } });
  }
});
