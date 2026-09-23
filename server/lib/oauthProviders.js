// The runtime half of models/lib/oauthProviders.js: writes Meteor's
// ServiceConfiguration for every OAuth provider that Meteor's own accounts
// packages offer (Google, GitHub, Facebook, Twitter/X, Meteor Developer,
// Weibo, Meetup), from the Admin Panel override first and the environment
// second, and REMOVES the configuration of a provider that is not enabled so
// that switching one off in the Admin Panel takes effect without a restart.
// It also gates accounts-passwordless (e-mailed one-time code) on
// PASSWORDLESS_ENABLED and turns a provider's first login into a WeKan user
// the way wekan-oidc does, with the same fail-closed account-linking rule.
//
// SECURITY: the resolved secrets exist only inside reconfigureOauthProviders(),
// where they go straight into ServiceConfiguration - the server-only
// collection Meteor's OAuth handshake reads. Nothing exported here returns a
// secret: enabledOauthProviders() is a list of keys, and the client learns
// which buttons to show through getAuthenticationsEnabled().
import { ReactiveCache } from '/imports/reactiveCache';
import Settings from '/models/settings';
import { tripCanary } from '/server/lib/canary';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { check, Match } from 'meteor/check';
const { guardPasswordlessPayload, recordPasswordlessLimitDenial } =
  require('/models/lib/passwordlessRequestGuard.cjs');

const {
  OAUTH_PROVIDERS,
  providerByService,
  resolveProviderConfig,
  enabledProviderKeys,
  isMergeExistingUsersAllowed,
  decideAccountConflict,
  isPasswordlessEnabled,
  deriveUsername,
} = require('/models/lib/oauthProviders');

// The Admin Panel sub-document, `{ [providerKey]: { enabled, id, secret,
// loginStyle, mergeExistingUsers } }`. Its schema belongs to models/settings.js;
// it is read defensively because an older Settings document has none.
// The two settings shared by every provider (`oauthProvidersLoginStyle`,
// `oauthProvidersMergeExistingUsers`) live beside the sub-document; they are
// folded into each provider's object so the pure resolver sees one shape.
async function adminProviders() {
  try {
    const setting = await Settings.findOneAsync({}) || {};
    const stored = setting.oauthProviders || {};
    const merged = {};
    for (const provider of OAUTH_PROVIDERS) {
      const own = stored[provider.key] || {};
      merged[provider.key] = {
        ...own,
        loginStyle: own.loginStyle || setting.oauthProvidersLoginStyle,
        mergeExistingUsers:
          own.mergeExistingUsers === undefined
            ? setting.oauthProvidersMergeExistingUsers
            : own.mergeExistingUsers,
      };
    }
    return merged;
  } catch (e) {
    return {};
  }
}

async function adminPasswordless() {
  try {
    return (await Settings.findOneAsync({}))?.passwordlessEnabled;
  } catch (e) {
    return undefined;
  }
}

/**
 * Write (or remove) ServiceConfiguration for every catalogued provider from
 * the current Admin Panel + environment values. Idempotent: called at startup
 * and again by the Admin Panel after a save.
 */
export async function reconfigureOauthProviders() {
  const admins = await adminProviders();
  const summary = { configured: [], removed: [] };
  for (const provider of OAUTH_PROVIDERS) {
    const config = resolveProviderConfig(provider, admins[provider.key], process.env);
    if (config.enabled) {
      // eslint-disable-next-line no-undef
      await ServiceConfiguration.configurations.upsertAsync(
        { service: provider.service },
        {
          $set: {
            loginStyle: config.loginStyle,
            [provider.idField]: config.id,
            secret: config.secret,
          },
        },
      );
      summary.configured.push(provider.key);
    } else {
      // eslint-disable-next-line no-undef
      await ServiceConfiguration.configurations.removeAsync({ service: provider.service });
      summary.removed.push(provider.key);
    }
  }
  return summary;
}

/**
 * The catalog keys of the providers currently enabled (flag on, id and secret
 * present). Safe to hand to the client: keys only, never credentials.
 */
export async function enabledOauthProviders() {
  return enabledProviderKeys(await adminProviders(), process.env);
}

/** Whether e-mailed one-time-code login (accounts-passwordless) is on. */
export async function isPasswordlessLoginEnabled() {
  return isPasswordlessEnabled(await adminPasswordless(), process.env);
}

/** The provider (catalog entry) that a freshly created user document came from. */
export function providerOfUser(user) {
  const services = user?.services || {};
  for (const provider of OAUTH_PROVIDERS) {
    if (services[provider.service]) return provider;
  }
  return undefined;
}

function serviceEmail(service, data) {
  if (typeof data.email === 'string' && data.email) return data.email;
  if (Array.isArray(data.emails) && data.emails.length) {
    const primary = data.emails.find(e => e && e.primary) || data.emails[0];
    if (primary && typeof primary.address === 'string') return primary.address;
  }
  return '';
}

// Whether the provider vouched for the address. Google and the Meteor
// Developer service say so explicitly; GitHub and Facebook only hand out an
// address they have verified. Twitter/X, Weibo and Meetup usually send none,
// and an unverified address can never take over an existing account.
function serviceEmailVerified(service, data, email) {
  if (!email) return false;
  if (service === 'google') return data.verified_email === true;
  if (service === 'meteor-developer') {
    const match = (data.emails || []).find(e => e && e.address === email);
    return !!(match && match.verified === true);
  }
  return service === 'github' || service === 'facebook';
}

/**
 * Called from Accounts.onCreateUser (server/models/users.js) when the new user
 * document carries one of the catalogued services. Fills username, emails,
 * profile and authenticationMethod like the OIDC path does, and applies the
 * fail-closed linking rule:
 *   - no existing account with that verified email -> the new user is returned
 *     (caller continues with its ordinary registration checks);
 *   - an existing account owned by the same provider -> that account;
 *   - an existing account of ANOTHER login method -> merged only when
 *     OAUTH_PROVIDERS_MERGE_EXISTING_USERS (or the provider's Admin Panel
 *     override) allows it AND the provider verified the address; otherwise the
 *     login is refused and the attempt is recorded for Admin Panel → Problems.
 *
 * @returns {{ user: object, existing: boolean }}
 */
export async function onCreateProviderUser(options, user, provider) {
  const data = user.services[provider.service] || {};
  const email = serviceEmail(provider.service, data).toLowerCase();
  const displayName =
    data.name ||
    (options && options.profile && options.profile.name) ||
    data.username ||
    data.screenName ||
    '';
  const username =
    deriveUsername({
      username: data.username,
      screenName: data.screenName,
      login: data.login,
      email,
      name: displayName,
      id: data.id,
    }) || Random.id();

  if (username.includes('/') || email.includes('/')) {
    throw new Meteor.Error('oauth-invalid-identity', 'Invalid username or email from the provider');
  }

  user.username = username;
  user.emails = email ? [{ address: email, verified: true }] : [];
  const fullname = displayName || username;
  const initials = fullname
    .split(/\s+/)
    .reduce((memo, word) => memo + (word[0] || ''), '')
    .toUpperCase();
  user.profile = {
    ...(user.profile || {}),
    initials,
    fullname,
    boardView: 'board-view-swimlanes',
  };
  user.authenticationMethod = provider.key;

  const existingUser = email
    ? await ReactiveCache.getUser({ 'emails.address': email })
    : undefined;
  const mergeAllowed = isMergeExistingUsersAllowed(
    (await adminProviders())[provider.key],
    process.env,
  );
  const decision = decideAccountConflict({
    existingUser,
    providerKey: provider.key,
    mergeAllowed,
    emailVerified: serviceEmailVerified(provider.service, data, email),
  });

  if (decision === 'create') {
    return { user, existing: false };
  }

  if (decision === 'conflict') {
    try {
      tripCanary('oauth.account-conflict', {
        username: existingUser.username,
        provider: provider.key,
      });
    } catch (e) {
      /* logging must never break the guard */
    }
    throw new Meteor.Error(
      'oauth-account-conflict',
      'An account with this email already exists and was not created with this login method.',
    );
  }

  // 'link' and 'merge': attach the provider's service data to the existing
  // account. Like the OIDC path (#4560), the profile is merged, not replaced,
  // so avatar, templates and preferences survive.
  existingUser.services = existingUser.services || {};
  existingUser.services[provider.service] = user.services[provider.service];
  if (email && !(existingUser.emails || []).some(e => e.address === email)) {
    existingUser.emails = (existingUser.emails || []).concat(user.emails);
  }
  existingUser.profile = {
    ...user.profile,
    ...(existingUser.profile || {}),
  };
  if (displayName) {
    existingUser.profile.fullname = fullname;
    existingUser.profile.initials = initials;
  }
  if (decision === 'merge') {
    existingUser.authenticationMethod = provider.key;
  }
  await Meteor.users.removeAsync({ _id: user._id });
  await Meteor.users.removeAsync({ _id: existingUser._id });
  return { user: existingUser, existing: true };
}

Meteor.startup(async () => {
  try {
    await reconfigureOauthProviders();
  } catch (e) {
    console.error('OAuth provider configuration failed:', e);
  }

  // Meteor's default Accounts rule limits requests per connection. Add a
  // source-address window as well, so opening fresh DDP connections cannot
  // turn passwordless email into a mail flood. Report denials alongside the
  // existing account-recovery rate-limit events in Problems / Security Report.
  DDPRateLimiter.addRule(
    { type: 'method', name: 'requestLoginTokenForUser', clientAddress() { return true; } },
    5,
    60 * 1000,
    (result, input) => recordPasswordlessLimitDenial(result, input, event =>
      require('/server/lib/securityLog').record(event)),
  );

  // A provider whose configuration was removed cannot complete Meteor's OAuth
  // handshake anyway; this keeps a stale browser tab from logging in through
  // a provider that was switched off between the popup and the callback, and
  // refuses one-time-code logins while passwordless is off.
  Accounts.validateLoginAttempt(async options => {
    if (options.type === 'passwordless' && !await isPasswordlessLoginEnabled()) {
      throw new Meteor.Error('passwordless-disabled', 'Sign-in code login is not enabled');
    }
    if (options.type === 'passwordless' && options.allowed && !options.error) {
      const { consumePasswordlessToken } = require('/server/lib/passwordlessTokenConsumption.cjs');
      const consumed = await consumePasswordlessToken(
        options.user, options.methodArguments?.[0]?.selector, Meteor.users.rawCollection(),
      );
      if (!consumed) throw new Meteor.Error('passwordless-code-consumed', 'Sign-in code is no longer valid');
    }
    const provider = providerByService(options.type);
    if (provider && !(await enabledOauthProviders()).includes(provider.key)) {
      throw new Meteor.Error('oauth-provider-disabled', 'This login method is not enabled');
    }
    return true;
  });

  // accounts-passwordless registers requestLoginTokenForUser unconditionally,
  // and it creates an account and sends an e-mail on every call. While the
  // feature is off it must do neither.
  const handlers = Meteor.server && Meteor.server.method_handlers;
  const original = handlers && handlers.requestLoginTokenForUser;
  if (typeof original === 'function') {
    handlers.requestLoginTokenForUser = async function guardedRequestLoginTokenForUser(payload) {
      // audit-argument-checks audits the outer DDP handler. The original
      // method still performs the strict payload validation below this guard.
      check(payload, Match.Any);
      if (!await isPasswordlessLoginEnabled()) {
        throw new Meteor.Error('passwordless-disabled', 'Sign-in code login is not enabled');
      }
      // An admin who closed registration still lets existing users request a
      // code. New accounts must not be created by this method, even through a
      // custom DDP caller that passes userCreationDisabled: false.
      const registrationClosed = (await Settings.findOneAsync({}))?.disableRegistration === true;
      return original.call(this, guardPasswordlessPayload(payload, registrationClosed));
    };
  }
});
