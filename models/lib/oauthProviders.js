'use strict';

// The catalog of the OAuth login providers that Meteor's own accounts packages
// offer (accounts-google, accounts-github, accounts-facebook, accounts-twitter,
// accounts-meteor-developer, accounts-weibo, accounts-meetup), and the pure
// decisions built on it: which environment variables configure each one, how a
// `<NAME>_FILE` secret is read, whether a provider is enabled, and whether a
// provider login may take over an existing account.
//
// This file is pure and dependency-free (no Meteor, no database) so it is unit
// tested with plain Node (tests/oauthProviders.test.cjs) and shared by:
//   - server/lib/oauthProviders.js, which writes ServiceConfiguration from it;
//   - server/models/settings.js, which reports the enabled providers to the
//     login form;
//   - the Admin Panel, which renders one override block per provider.
//
// SECURITY: nothing here returns a secret to a caller on its own. The secret is
// resolved by resolveProviderConfig() for the SERVER's ServiceConfiguration
// upsert only; the client-facing helpers (enabledProviderKeys and the
// Admin Panel status) go through isProviderEnabled(), which reports only
// whether a secret exists.

const OAUTH_PROVIDERS = [
  {
    key: 'google',
    service: 'google',
    envPrefix: 'OAUTH_GOOGLE',
    idVar: 'OAUTH_GOOGLE_CLIENT_ID',
    secretVar: 'OAUTH_GOOGLE_SECRET',
    idField: 'clientId',
    loginMethod: 'loginWithGoogle',
    icon: 'fa-google',
    labelKey: 'oauth-provider-google',
  },
  {
    key: 'github',
    service: 'github',
    envPrefix: 'OAUTH_GITHUB',
    idVar: 'OAUTH_GITHUB_CLIENT_ID',
    secretVar: 'OAUTH_GITHUB_SECRET',
    idField: 'clientId',
    loginMethod: 'loginWithGithub',
    icon: 'fa-github',
    labelKey: 'oauth-provider-github',
  },
  {
    key: 'facebook',
    service: 'facebook',
    envPrefix: 'OAUTH_FACEBOOK',
    idVar: 'OAUTH_FACEBOOK_APP_ID',
    secretVar: 'OAUTH_FACEBOOK_SECRET',
    idField: 'appId',
    loginMethod: 'loginWithFacebook',
    icon: 'fa-facebook',
    labelKey: 'oauth-provider-facebook',
  },
  {
    key: 'twitter',
    service: 'twitter',
    envPrefix: 'OAUTH_TWITTER',
    idVar: 'OAUTH_TWITTER_CONSUMER_KEY',
    secretVar: 'OAUTH_TWITTER_SECRET',
    idField: 'consumerKey',
    loginMethod: 'loginWithTwitter',
    icon: 'fa-twitter',
    labelKey: 'oauth-provider-twitter',
  },
  {
    key: 'meteor-developer',
    service: 'meteor-developer',
    envPrefix: 'OAUTH_METEOR_DEVELOPER',
    idVar: 'OAUTH_METEOR_DEVELOPER_CLIENT_ID',
    secretVar: 'OAUTH_METEOR_DEVELOPER_SECRET',
    idField: 'clientId',
    loginMethod: 'loginWithMeteorDeveloperAccount',
    icon: 'fa-rocket',
    labelKey: 'oauth-provider-meteor-developer',
  },
  {
    key: 'weibo',
    service: 'weibo',
    envPrefix: 'OAUTH_WEIBO',
    idVar: 'OAUTH_WEIBO_CLIENT_ID',
    secretVar: 'OAUTH_WEIBO_SECRET',
    idField: 'clientId',
    loginMethod: 'loginWithWeibo',
    icon: 'fa-weibo',
    labelKey: 'oauth-provider-weibo',
  },
  {
    key: 'meetup',
    service: 'meetup',
    envPrefix: 'OAUTH_MEETUP',
    idVar: 'OAUTH_MEETUP_CLIENT_ID',
    secretVar: 'OAUTH_MEETUP_SECRET',
    idField: 'clientId',
    loginMethod: 'loginWithMeetup',
    icon: 'fa-meetup',
    labelKey: 'oauth-provider-meetup',
  },
];

// The two settings shared by every provider, and the passwordless switch.
const OAUTH_PROVIDERS_LOGIN_STYLE_VAR = 'OAUTH_PROVIDERS_LOGIN_STYLE';
const OAUTH_PROVIDERS_MERGE_EXISTING_USERS_VAR = 'OAUTH_PROVIDERS_MERGE_EXISTING_USERS';
const PASSWORDLESS_ENABLED_VAR = 'PASSWORDLESS_ENABLED';

const PROVIDER_KEYS = OAUTH_PROVIDERS.map(p => p.key);

function providerByKey(key) {
  return OAUTH_PROVIDERS.find(p => p.key === key);
}

function providerByService(service) {
  return OAUTH_PROVIDERS.find(p => p.service === service);
}

function isTrue(value) {
  return value === true || value === 'true';
}

function isEmpty(value) {
  return value === undefined || value === null || value === '';
}

/**
 * Read one environment variable, honouring its `<NAME>_FILE` variant the way
 * OAUTH2_SECRET_FILE / MONGO_PASSWORD_FILE are documented: when `<NAME>` is
 * empty and `<NAME>_FILE` names a readable file, the trimmed file content is
 * the value (Docker/Kubernetes secrets mounted as files). `env` and `readFile`
 * are injectable so the decision is testable without touching the real
 * environment or disk.
 *
 * @param {string} name
 * @param {object} [env=process.env]
 * @param {function(string): string} [readFile] - returns the file's content or throws
 * @returns {string|undefined}
 */
function providerEnvValue(name, env = process.env, readFile) {
  const direct = env[name];
  if (!isEmpty(direct)) return String(direct);
  const file = env[`${name}_FILE`];
  if (isEmpty(file)) return undefined;
  const reader = readFile || defaultReadFile;
  try {
    const content = reader(String(file));
    if (isEmpty(content)) return undefined;
    return String(content).trim() || undefined;
  } catch (e) {
    return undefined;
  }
}

function defaultReadFile(file) {
  // Required lazily so a browser bundle that pulls in the catalog never sees
  // `fs`; only the server ever reaches this line.
  // eslint-disable-next-line global-require
  return require('fs').readFileSync(file, 'utf8');
}

/**
 * Admin-panel override first, environment second, like
 * models/lib/configResolver.js resolveConfigValue(). Kept inline so this file
 * stays dependency-free for the unit test.
 */
function pick(adminValue, envValue) {
  if (!isEmpty(adminValue)) return { value: adminValue, source: 'admin' };
  if (!isEmpty(envValue)) return { value: envValue, source: 'env' };
  return { value: undefined, source: 'default' };
}

/**
 * Resolve the full configuration of one provider. `admin` is the provider's
 * Admin Panel sub-document ({ enabled, id, secret, loginStyle,
 * mergeExistingUsers }, all optional, possibly absent), `env` the environment.
 *
 * The result CONTAINS THE SECRET. It is for the server-side
 * ServiceConfiguration upsert only; never hand it to a method result or a
 * publication. Use isProviderEnabled() for anything client-facing.
 *
 * @returns {{ key, service, enabled: boolean, id, idField, secret, loginStyle,
 *   sources: { enabled, id, secret, loginStyle } }}
 */
function resolveProviderConfig(provider, admin, env = process.env, readFile) {
  const a = admin || {};
  const enabledPick = pick(
    a.enabled === undefined ? undefined : a.enabled,
    providerEnvValue(`${provider.envPrefix}_ENABLED`, env, readFile),
  );
  const idPick = pick(a.id, providerEnvValue(provider.idVar, env, readFile));
  const secretPick = pick(a.secret, providerEnvValue(provider.secretVar, env, readFile));
  const stylePick = pick(
    a.loginStyle,
    providerEnvValue(OAUTH_PROVIDERS_LOGIN_STYLE_VAR, env, readFile),
  );
  const enabledFlag = isTrue(enabledPick.value);
  const enabled = enabledFlag && !isEmpty(idPick.value) && !isEmpty(secretPick.value);
  return {
    key: provider.key,
    service: provider.service,
    idField: provider.idField,
    enabled,
    enabledFlag,
    id: isEmpty(idPick.value) ? undefined : String(idPick.value),
    secret: isEmpty(secretPick.value) ? undefined : String(secretPick.value),
    loginStyle: normalizeLoginStyle(stylePick.value),
    sources: {
      enabled: enabledPick.source,
      id: idPick.source,
      secret: secretPick.source,
      loginStyle: stylePick.source,
    },
  };
}

// popup is the default, like OAUTH2_LOGIN_STYLE (#5695).
function normalizeLoginStyle(value) {
  return String(value || '').trim().toLowerCase() === 'redirect' ? 'redirect' : 'popup';
}

/**
 * Whether the provider is enabled AND has both credentials - the same
 * decision resolveProviderConfig() makes, without returning the secret. Safe
 * for client-facing callers.
 */
function isProviderEnabled(provider, admin, env = process.env, readFile) {
  return resolveProviderConfig(provider, admin, env, readFile).enabled;
}

/**
 * The keys of every provider currently enabled. `adminProviders` is the
 * Settings document's `oauthProviders` sub-document ({ [key]: {...} }), which
 * may be absent.
 */
function enabledProviderKeys(adminProviders, env = process.env, readFile) {
  const admins = adminProviders || {};
  return OAUTH_PROVIDERS.filter(p => isProviderEnabled(p, admins[p.key], env, readFile)).map(
    p => p.key,
  );
}

/**
 * Whether a provider login whose email matches an existing account may take
 * that account over. OFF by default, like OAUTH2_MERGE_EXISTING_USERS,
 * SAML_MERGE_EXISTING_USERS and CAS_MERGE_EXISTING_USERS; the Admin Panel's
 * per-provider `mergeExistingUsers` overrides the shared env var.
 */
function isMergeExistingUsersAllowed(admin, env = process.env) {
  const a = admin || {};
  const picked = pick(
    a.mergeExistingUsers === undefined ? undefined : a.mergeExistingUsers,
    env[OAUTH_PROVIDERS_MERGE_EXISTING_USERS_VAR],
  );
  return isTrue(picked.value);
}

/**
 * The pure account-conflict decision, made when a provider login arrives:
 *   - no existing account with that email -> create a new one ('create');
 *   - the existing account was made by the SAME provider -> it is that user's
 *     own account, log them in ('link');
 *   - otherwise the account belongs to another login method. Merge only when
 *     allowed AND the provider asserts the email is verified; else 'conflict'.
 *
 * @param {object} args
 * @param {object|undefined} args.existingUser - { services?, authenticationMethod? }
 * @param {string} args.providerKey - catalog key ('google', ...)
 * @param {boolean} args.mergeAllowed
 * @param {boolean} args.emailVerified
 * @returns {'create'|'link'|'merge'|'conflict'}
 */
function decideAccountConflict({ existingUser, providerKey, mergeAllowed, emailVerified }) {
  if (!existingUser) return 'create';
  const provider = providerByKey(providerKey);
  const service = provider ? provider.service : providerKey;
  const ownedByProvider =
    (existingUser.services && existingUser.services[service]) ||
    existingUser.authenticationMethod === providerKey;
  if (ownedByProvider) return 'link';
  if (mergeAllowed && emailVerified === true) return 'merge';
  return 'conflict';
}

/**
 * Passwordless (accounts-passwordless, e-mailed one-time code) is a login
 * method of its own, switched by PASSWORDLESS_ENABLED or the Admin Panel.
 */
function isPasswordlessEnabled(adminValue, env = process.env) {
  const picked = pick(
    adminValue === undefined ? undefined : adminValue,
    env[PASSWORDLESS_ENABLED_VAR],
  );
  return isTrue(picked.value);
}

/**
 * Derive a username the way wekan-oidc does: the provider's username, else
 * the local part of the email, else the display name compacted, else the
 * provider's id.
 */
function deriveUsername(profile) {
  const p = profile || {};
  const candidates = [
    p.username,
    p.screenName,
    p.login,
    typeof p.email === 'string' ? p.email.split('@')[0] : undefined,
    typeof p.name === 'string' ? p.name.replace(/\s+/g, '').toLowerCase() : undefined,
    p.id !== undefined && p.id !== null ? String(p.id) : undefined,
  ];
  const found = candidates.find(c => typeof c === 'string' && c.trim().length > 0);
  return found ? found.trim() : undefined;
}

module.exports = {
  OAUTH_PROVIDERS,
  PROVIDER_KEYS,
  OAUTH_PROVIDERS_LOGIN_STYLE_VAR,
  OAUTH_PROVIDERS_MERGE_EXISTING_USERS_VAR,
  PASSWORDLESS_ENABLED_VAR,
  providerByKey,
  providerByService,
  providerEnvValue,
  resolveProviderConfig,
  normalizeLoginStyle,
  isProviderEnabled,
  enabledProviderKeys,
  isMergeExistingUsersAllowed,
  decideAccountConflict,
  isPasswordlessEnabled,
  deriveUsername,
};
