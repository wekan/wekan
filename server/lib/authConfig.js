import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import Settings from '/models/settings';

// Run-time resolution of every login setting in models/lib/authConfigCatalog.js:
// the Admin Panel override when one is stored, otherwise the environment
// variable. authEnv(name) is a drop-in for process.env[name] - it returns the
// same string-or-undefined shape - so a caller switches by changing one
// expression and keeps its own parsing.
//
// The Settings document is held in memory and kept current by an observer.
// It has to be: these values are read synchronously, inside login handlers and
// request middleware, and in Meteor 3 a server-side Settings.findOne() throws
// ("findOne is not available on the server"). The LDAP bridge used exactly that
// call, so its Admin Panel overrides never reached a login - the exception was
// caught and the environment used instead. Until the first read completes,
// authEnv answers from the environment alone, as before.
//
// Packages (wekan-ldap, wekan-oidc, wekan-accounts-cas) cannot import this
// file, so it is also installed as globalThis.__wekanAuthEnv; each package
// falls back to process.env when it is absent (plain-Node tests).

const {
  AUTH_CONFIG_SECTIONS,
  resolveAuthEnv,
  authConfigSources,
  cleanAuthConfigInput,
} = require('/models/lib/authConfigCatalog');

const FIELDS = {};
for (const { storage } of Object.values(AUTH_CONFIG_SECTIONS)) FIELDS[storage] = 1;

let current = null;
const listeners = {};
let markReady;
// Resolves once the stored overrides have been read. A setting that is applied
// only at startup (ACCOUNTS_COMMON_LOGIN_EXPIRATION_IN_DAYS) waits for it.
export const authConfigReady = new Promise(resolve => { markReady = resolve; });

export function authEnv(name) {
  return resolveAuthEnv(name, current, process.env);
}

// For code that takes a whole environment object (ldapPasswordLoginGuard,
// oauth2ClientSecretJwt): every property read goes through authEnv.
export const authEnvObject = new Proxy(process.env, {
  get(target, name) {
    return typeof name === 'string' ? authEnv(name) : undefined;
  },
});

globalThis.__wekanAuthEnv = authEnv;

// Called after a section's settings change, and once when the settings are
// first read, so a login method can reconfigure itself without a restart.
export function onAuthConfigChange(section, fn) {
  if (!AUTH_CONFIG_SECTIONS[section]) throw new Error(`Unknown login settings section: ${section}`);
  (listeners[section] = listeners[section] || []).push(fn);
}

async function notify(sections) {
  for (const section of sections) {
    for (const fn of listeners[section] || []) {
      try {
        await fn();
      } catch (error) {
        console.error(`Applying ${section} login settings failed:`, error);
      }
    }
  }
}

async function reload() {
  current = (await Settings.findOneAsync({}, { fields: FIELDS })) || null;
}

// For a writer outside saveAuthConfigSettings (a one-time migration) that
// needs authEnv to see its change at once rather than when the observer runs.
export const reloadAuthConfig = reload;

Meteor.startup(async () => {
  try {
    await reload();
  } finally {
    markReady();
  }
  await Settings.find({}, { fields: FIELDS }).observeAsync({
    added(doc) { current = doc; },
    changed(doc) { current = doc; },
    removed() { current = null; },
  });
  await notify(Object.keys(AUTH_CONFIG_SECTIONS));
});

async function requireSiteAdmin() {
  const user = await Meteor.userAsync();
  if (user?.isAdmin !== true || user.loginDisabled === true) {
    throw new Meteor.Error('error-notAuthorized');
  }
  return user;
}

Meteor.methods({
  // Admin Panel / People / <login method>: which value is in effect for each
  // setting and where it comes from. A secret is reported only as
  // { source, hasValue }; every other value has credentials in a URL masked
  // (authConfigSources) before it leaves the server.
  async getAuthConfigSources(section) {
    check(section, String);
    await requireSiteAdmin();
    if (!AUTH_CONFIG_SECTIONS[section]) throw new Meteor.Error('unknown-login-settings-section');
    const doc = await Settings.findOneAsync({}, { fields: FIELDS });
    return authConfigSources(section, doc, process.env);
  },

  async saveAuthConfigSettings(section, input) {
    check(section, String);
    check(input, Object);
    const user = await requireSiteAdmin();
    if (!AUTH_CONFIG_SECTIONS[section]) throw new Meteor.Error('unknown-login-settings-section');
    if (AUTH_CONFIG_SECTIONS[section].envOnly) {
      // The Admin Panel draws an environment-only section read-only, with no
      // Save button, so a save here was sent by hand: an attempt to switch on
      // header login without access to the host.
      try {
        require('/server/lib/securityLog').record({
          key: 'authn.header-login-env-only', action: 'blocked',
          source: `saveAuthConfigSettings:${section}`, userId: user._id,
          detail: `A site administrator tried to store ${section} settings, which only the environment sets.`,
        });
      } catch (e) { /* logging must never break the guard */ }
      throw new Meteor.Error('login-settings-env-only', section);
    }
    let clean;
    try {
      clean = cleanAuthConfigInput(section, input);
    } catch (error) {
      // Validation errors are TypeErrors, which Meteor would report only as
      // "Internal server error".
      if (error instanceof TypeError) throw new Meteor.Error('invalid-login-settings', error.message);
      throw error;
    }
    const setting = await Settings.findOneAsync({});
    if (!setting) throw new Meteor.Error('settings-not-found');
    const modifier = {};
    if (Object.keys(clean.set).length) modifier.$set = clean.set;
    if (Object.keys(clean.unset).length) modifier.$unset = clean.unset;
    if (Object.keys(modifier).length) {
      await Settings.updateAsync(setting._id, modifier);
    }
    await reload();
    await notify([section]);
    return true;
  },
});
