'use strict';

// Every way to log in that Meteor's accounts system offers: the seven
// accounts-* OAuth providers (Google, GitHub, Facebook, X/Twitter, Meteor
// Developer, Weibo, Meetup) and accounts-passwordless (e-mailed one-time code).
//
//  - the catalog (models/lib/oauthProviders.js) has the shape every consumer
//    builds against: server configuration, Admin Panel, login form;
//  - env resolution honours the Admin Panel override, the env var and the
//    `<NAME>_FILE` (Docker secret) variant, and a provider is enabled only
//    with the flag AND both credentials;
//  - the account-conflict decision is fail-closed: a provider login never
//    takes over an account made by another method unless merging is on AND
//    the provider verified the address;
//  - the server writes ServiceConfiguration for an enabled provider and
//    REMOVES it for a disabled one, records a refused takeover on the
//    'oauth.account-conflict' canary, and gates passwordless on the switch;
//  - the login form renders one button per enabled provider and the two-step
//    code form, with the .primary theme class;
//  - NEGATIVE: nothing the client can load carries a provider secret.
//
// Run: node tests/oauthProviders.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

const catalog = require('../models/lib/oauthProviders');
const {
  OAUTH_PROVIDERS,
  PROVIDER_KEYS,
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
} = catalog;

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// ------------------------------------------------------------ the catalog

test('the catalog lists exactly the seven Meteor accounts-* OAuth providers, in order', () => {
  assert.deepStrictEqual(PROVIDER_KEYS, [
    'google', 'github', 'facebook', 'twitter', 'meteor-developer', 'weibo', 'meetup',
  ]);
});

test('every provider carries the fields every consumer builds against', () => {
  const fields = ['key', 'service', 'envPrefix', 'idVar', 'secretVar', 'idField',
    'loginMethod', 'icon', 'labelKey'];
  OAUTH_PROVIDERS.forEach(p => {
    fields.forEach(f => assert.strictEqual(typeof p[f], 'string', `${p.key}.${f}`));
    assert.strictEqual(p.envPrefix, `OAUTH_${p.key.toUpperCase().replace(/-/g, '_')}`);
    assert.ok(p.idVar.startsWith(`${p.envPrefix}_`), `${p.key} idVar`);
    assert.strictEqual(p.secretVar, `${p.envPrefix}_SECRET`);
    assert.strictEqual(p.labelKey, `oauth-provider-${p.key}`);
    assert.match(p.icon, /^fa-/);
    assert.match(p.loginMethod, /^loginWith/);
  });
});

test('the provider-specific id names match what each Meteor package reads from ServiceConfiguration', () => {
  assert.strictEqual(providerByKey('facebook').idVar, 'OAUTH_FACEBOOK_APP_ID');
  assert.strictEqual(providerByKey('facebook').idField, 'appId');
  assert.strictEqual(providerByKey('twitter').idVar, 'OAUTH_TWITTER_CONSUMER_KEY');
  assert.strictEqual(providerByKey('twitter').idField, 'consumerKey');
  ['google', 'github', 'meteor-developer', 'weibo', 'meetup'].forEach(k => {
    assert.strictEqual(providerByKey(k).idField, 'clientId', k);
    assert.strictEqual(providerByKey(k).idVar, `${providerByKey(k).envPrefix}_CLIENT_ID`);
  });
  assert.strictEqual(providerByKey('meteor-developer').loginMethod, 'loginWithMeteorDeveloperAccount');
  assert.strictEqual(providerByKey('meteor-developer').service, 'meteor-developer');
  assert.strictEqual(providerByService('github').key, 'github');
  assert.strictEqual(providerByKey('nope'), undefined);
});

test('the eight accounts packages are in .meteor/packages', () => {
  const packages = read('.meteor/packages');
  ['accounts-google', 'accounts-github', 'accounts-facebook', 'accounts-twitter',
    'accounts-meteor-developer', 'accounts-weibo', 'accounts-meetup',
    'accounts-passwordless'].forEach(pkg => {
    assert.match(packages, new RegExp(`^${pkg}(@|\\s|$)`, 'm'), pkg);
  });
});

// ------------------------------------------------------- env resolution

test('providerEnvValue reads the variable, then its _FILE variant, trimmed', () => {
  assert.strictEqual(providerEnvValue('X', { X: 'direct', X_FILE: '/f' }, () => 'file'), 'direct');
  assert.strictEqual(providerEnvValue('X', { X_FILE: '/run/secrets/x' }, f => {
    assert.strictEqual(f, '/run/secrets/x');
    return '  from-file\n';
  }), 'from-file');
  assert.strictEqual(providerEnvValue('X', { X: '', X_FILE: '/f' }, () => 's'), 's');
  assert.strictEqual(providerEnvValue('X', {}, () => 's'), undefined);
});

test('NEGATIVE: an unreadable or empty _FILE yields no value instead of throwing', () => {
  assert.strictEqual(providerEnvValue('X', { X_FILE: '/missing' }, () => { throw new Error('ENOENT'); }), undefined);
  assert.strictEqual(providerEnvValue('X', { X_FILE: '/empty' }, () => '   \n'), undefined);
});

test('a provider is enabled only with the flag AND an id AND a secret', () => {
  const google = providerByKey('google');
  const full = { OAUTH_GOOGLE_ENABLED: 'true', OAUTH_GOOGLE_CLIENT_ID: 'id', OAUTH_GOOGLE_SECRET: 's' };
  assert.strictEqual(isProviderEnabled(google, undefined, full), true);
  assert.strictEqual(isProviderEnabled(google, undefined, { ...full, OAUTH_GOOGLE_ENABLED: 'false' }), false);
  assert.strictEqual(isProviderEnabled(google, undefined, { ...full, OAUTH_GOOGLE_ENABLED: undefined }), false);
  assert.strictEqual(isProviderEnabled(google, undefined, { ...full, OAUTH_GOOGLE_CLIENT_ID: '' }), false);
  assert.strictEqual(isProviderEnabled(google, undefined, { ...full, OAUTH_GOOGLE_SECRET: undefined }), false);
  assert.strictEqual(isProviderEnabled(google, undefined, {}), false, 'default is off');
});

test('the _FILE variant works for the secret, the app id and the consumer key', () => {
  const files = { '/s': 'secret', '/id': 'app' };
  const readFile = f => files[f];
  const facebook = resolveProviderConfig(providerByKey('facebook'), undefined, {
    OAUTH_FACEBOOK_ENABLED: 'true', OAUTH_FACEBOOK_APP_ID_FILE: '/id', OAUTH_FACEBOOK_SECRET_FILE: '/s',
  }, readFile);
  assert.strictEqual(facebook.enabled, true);
  assert.strictEqual(facebook.id, 'app');
  assert.strictEqual(facebook.secret, 'secret');
  assert.strictEqual(facebook.idField, 'appId');
  const twitter = resolveProviderConfig(providerByKey('twitter'), undefined, {
    OAUTH_TWITTER_ENABLED: 'true', OAUTH_TWITTER_CONSUMER_KEY_FILE: '/id', OAUTH_TWITTER_SECRET_FILE: '/s',
  }, readFile);
  assert.strictEqual(twitter.enabled, true);
  assert.strictEqual(twitter.idField, 'consumerKey');
});

test('the Admin Panel override wins over the env var, and says so in `sources`', () => {
  const github = providerByKey('github');
  const env = { OAUTH_GITHUB_ENABLED: 'true', OAUTH_GITHUB_CLIENT_ID: 'env-id', OAUTH_GITHUB_SECRET: 'env-secret' };
  const admin = { enabled: true, id: 'admin-id', secret: 'admin-secret', loginStyle: 'redirect' };
  const c = resolveProviderConfig(github, admin, env);
  assert.deepStrictEqual([c.id, c.secret, c.loginStyle], ['admin-id', 'admin-secret', 'redirect']);
  assert.deepStrictEqual(c.sources, { enabled: 'admin', id: 'admin', secret: 'admin', loginStyle: 'admin' });
  // An admin who switched it OFF overrides an env var that says on.
  assert.strictEqual(resolveProviderConfig(github, { enabled: false }, env).enabled, false);
  // An absent sub-document falls back to the env var.
  const e = resolveProviderConfig(github, undefined, env);
  assert.strictEqual(e.enabled, true);
  assert.deepStrictEqual(e.sources, { enabled: 'env', id: 'env', secret: 'env', loginStyle: 'default' });
});

test('OAUTH_PROVIDERS_LOGIN_STYLE is popup unless it says redirect', () => {
  assert.strictEqual(normalizeLoginStyle(undefined), 'popup');
  assert.strictEqual(normalizeLoginStyle('popup'), 'popup');
  assert.strictEqual(normalizeLoginStyle('Redirect'), 'redirect');
  assert.strictEqual(normalizeLoginStyle('something'), 'popup');
  const c = resolveProviderConfig(providerByKey('weibo'), undefined, {
    OAUTH_WEIBO_ENABLED: 'true', OAUTH_WEIBO_CLIENT_ID: 'i', OAUTH_WEIBO_SECRET: 's',
    OAUTH_PROVIDERS_LOGIN_STYLE: 'redirect',
  });
  assert.strictEqual(c.loginStyle, 'redirect');
});

test('enabledProviderKeys lists exactly the enabled ones, in catalog order', () => {
  const env = {
    OAUTH_MEETUP_ENABLED: 'true', OAUTH_MEETUP_CLIENT_ID: 'i', OAUTH_MEETUP_SECRET: 's',
    OAUTH_GOOGLE_ENABLED: 'true', OAUTH_GOOGLE_CLIENT_ID: 'i', OAUTH_GOOGLE_SECRET: 's',
    OAUTH_GITHUB_ENABLED: 'true', OAUTH_GITHUB_CLIENT_ID: 'i', // no secret
  };
  assert.deepStrictEqual(enabledProviderKeys(undefined, env), ['google', 'meetup']);
  assert.deepStrictEqual(enabledProviderKeys({ google: { enabled: false } }, env), ['meetup']);
  assert.deepStrictEqual(enabledProviderKeys(undefined, {}), []);
});

// ------------------------------------------------- the takeover decision

test('merging is OFF by default, on with the env var, and the Admin Panel overrides it', () => {
  assert.strictEqual(isMergeExistingUsersAllowed(undefined, {}), false);
  assert.strictEqual(isMergeExistingUsersAllowed(undefined, { OAUTH_PROVIDERS_MERGE_EXISTING_USERS: 'true' }), true);
  assert.strictEqual(isMergeExistingUsersAllowed({ mergeExistingUsers: false }, { OAUTH_PROVIDERS_MERGE_EXISTING_USERS: 'true' }), false);
  assert.strictEqual(isMergeExistingUsersAllowed({ mergeExistingUsers: true }, {}), true);
});

test('decideAccountConflict: no account -> create; own provider -> link', () => {
  assert.strictEqual(decideAccountConflict({ existingUser: undefined, providerKey: 'google', mergeAllowed: false, emailVerified: false }), 'create');
  assert.strictEqual(decideAccountConflict({
    existingUser: { services: { google: { id: '1' } } }, providerKey: 'google', mergeAllowed: false, emailVerified: false,
  }), 'link');
  assert.strictEqual(decideAccountConflict({
    existingUser: { authenticationMethod: 'meteor-developer' }, providerKey: 'meteor-developer', mergeAllowed: false, emailVerified: false,
  }), 'link');
});

test('NEGATIVE: another method\'s account is a conflict unless merge is allowed AND the email verified', () => {
  const password = { services: { password: { bcrypt: 'x' } }, authenticationMethod: 'password' };
  assert.strictEqual(decideAccountConflict({ existingUser: password, providerKey: 'github', mergeAllowed: false, emailVerified: true }), 'conflict');
  assert.strictEqual(decideAccountConflict({ existingUser: password, providerKey: 'github', mergeAllowed: true, emailVerified: false }), 'conflict');
  assert.strictEqual(decideAccountConflict({ existingUser: password, providerKey: 'github', mergeAllowed: true, emailVerified: 'yes' }), 'conflict', 'only boolean true verifies');
  assert.strictEqual(decideAccountConflict({ existingUser: password, providerKey: 'github', mergeAllowed: true, emailVerified: true }), 'merge');
  // An LDAP or OIDC account is "another method" too.
  assert.strictEqual(decideAccountConflict({ existingUser: { authenticationMethod: 'ldap' }, providerKey: 'google', mergeAllowed: false, emailVerified: true }), 'conflict');
  assert.strictEqual(decideAccountConflict({ existingUser: { services: { oidc: {} } }, providerKey: 'google', mergeAllowed: false, emailVerified: true }), 'conflict');
});

test('passwordless is off by default, on with PASSWORDLESS_ENABLED, Admin Panel overrides', () => {
  assert.strictEqual(isPasswordlessEnabled(undefined, {}), false);
  assert.strictEqual(isPasswordlessEnabled(undefined, { PASSWORDLESS_ENABLED: 'true' }), true);
  assert.strictEqual(isPasswordlessEnabled(false, { PASSWORDLESS_ENABLED: 'true' }), false);
  assert.strictEqual(isPasswordlessEnabled(true, {}), true);
});

test('deriveUsername prefers the provider username, then the email local part, then the name, then the id', () => {
  assert.strictEqual(deriveUsername({ username: 'octo', email: 'a@b.c' }), 'octo');
  assert.strictEqual(deriveUsername({ screenName: 'tw', email: 'a@b.c' }), 'tw');
  assert.strictEqual(deriveUsername({ email: 'jane.doe@example.com', name: 'Jane Doe' }), 'jane.doe');
  assert.strictEqual(deriveUsername({ name: 'Jane Doe', id: '42' }), 'janedoe');
  assert.strictEqual(deriveUsername({ id: 42 }), '42');
  assert.strictEqual(deriveUsername({}), undefined);
});

// ----------------------------------------------------- the server module

const server = read('server/lib/oauthProviders.js');
const users = read('server/models/users.js');
const settings = read('server/models/settings.js');

test('the server upserts ServiceConfiguration for an enabled provider and removes it for a disabled one', () => {
  assert.match(server, /export async function reconfigureOauthProviders\(\)/);
  assert.match(server, /ServiceConfiguration\.configurations\.upsertAsync\(\s*\{ service: provider\.service \}/);
  assert.match(server, /\[provider\.idField\]: config\.id/);
  assert.match(server, /secret: config\.secret/);
  assert.match(server, /loginStyle: config\.loginStyle/);
  assert.match(server, /ServiceConfiguration\.configurations\.removeAsync\(\{ service: provider\.service \}\)/);
  assert.match(server, /Meteor\.startup\(async \(\) => \{\s*\n\s*try \{\s*\n\s*await reconfigureOauthProviders\(\)/);
});

test('the server exports the names the Admin Panel and the settings method call', () => {
  ['reconfigureOauthProviders', 'enabledOauthProviders', 'isPasswordlessLoginEnabled',
    'providerOfUser', 'onCreateProviderUser'].forEach(name => {
    assert.ok(new RegExp(`export (async )?function ${name}\\(`).test(server), name);
  });
  assert.match(server, /import Settings from '\/models\/settings'/);
  assert.match(server, /oauthProviders \|\| \{\}/);
  assert.match(server, /passwordlessEnabled/);
  assert.match(read('server/imports.js'), /import '\/server\/lib\/oauthProviders';/);
});

test('a refused takeover is recorded on the oauth.account-conflict canary and refused with oauth-account-conflict', () => {
  const block = server.slice(server.indexOf("if (decision === 'conflict')"));
  assert.match(block, /tripCanary\('oauth\.account-conflict'/);
  assert.match(block, /catch \(e\) \{\s*\n\s*\/\* logging must never break the guard \*\//);
  assert.match(block, /throw new Meteor\.Error\(\s*\n?\s*'oauth-account-conflict'/);
  const { canaryFor } = require('../models/lib/canaryTokens');
  assert.strictEqual(canaryFor('oauth.account-conflict').known, true);
  const { CATALOG } = require('../models/lib/securityCategories');
  assert.ok(CATALOG['authn.oauth-link'], 'the canary key exists in the security catalog');
});

test('onCreateUser hands a provider login to onCreateProviderUser before the OIDC path, and marks passwordless', () => {
  assert.match(users, /import \{ providerOfUser, onCreateProviderUser \} from '\/server\/lib\/oauthProviders'/);
  const idx = users.indexOf('const oauthProvider = providerOfUser(user);');
  assert.ok(idx > 0);
  assert.ok(idx < users.indexOf('if (user.services?.oidc) {'), 'runs before the OIDC normalisation');
  assert.match(users, /if \(created\.existing\) return created\.user;/);
  assert.match(users, /user\.authenticationMethod = 'passwordless';/);
  assert.match(server, /user\.authenticationMethod = provider\.key;/);
});

test('getAuthenticationsEnabled reports every enabled provider key and passwordless', () => {
  const fn = settings.slice(settings.indexOf('getAuthenticationsEnabled()'));
  assert.match(fn, /oauth\.enabledOauthProviders\(\)\.forEach\(key => \{\s*\n\s*enabled\[key\] = true;/);
  assert.match(fn, /enabled\.passwordless = oauth\.isPasswordlessLoginEnabled\(\);/);
});

test('passwordless is gated server-side: the token request method and the login attempt both refuse while off', () => {
  assert.match(server, /handlers\.requestLoginTokenForUser = async function guardedRequestLoginTokenForUser/);
  assert.match(server, /if \(!isPasswordlessLoginEnabled\(\)\) \{\s*\n\s*throw new Meteor\.Error\('passwordless-disabled'/);
  assert.match(server, /options\.type === 'passwordless' && !isPasswordlessLoginEnabled\(\)/);
  assert.match(server, /provider && !enabledOauthProviders\(\)\.includes\(provider\.key\)/);
});

// --------------------------------------------------------- the login form

const jade = read('client/components/main/layouts.jade');
const js = read('client/components/main/layouts.js');

test('the login form renders one .primary button per enabled provider with its icon and label', () => {
  assert.match(jade, /each oauthProviders\n\s*button\.primary\.js-oauth-provider\(type="button" data-provider=key\)\n\s*i\.fa\(class=icon\)\n\s*\| \{\{_ 'sign-in-with' label\}\}/);
  assert.match(js, /oauthProviders\(\) \{[\s\S]*?label: TAPi18n\.__\(p\.labelKey\)/);
  assert.match(js, /'click \.js-oauth-provider'\(event\)/);
  assert.match(js, /Meteor\[provider\.loginMethod\]\(\{\}, \(err\) => \{/);
  assert.match(js, /enabledAuthenticationMethods\.indexOf\(p\.key\) !== -1/);
});

test('the passwordless flow asks for the email, then the code, and logs in with Meteor.passwordlessLoginWithToken', () => {
  assert.match(jade, /if passwordlessEnabled/);
  assert.match(jade, /form#passwordless-email-form\.js-passwordless-request/);
  assert.match(jade, /button\.primary\.js-passwordless-send\(type="submit"\)/);
  assert.match(jade, /form#passwordless-code-form\.js-passwordless-login/);
  assert.match(jade, /input\.primary\(type="submit" value="\{\{_ 'passwordless-sign-in'\}\}"\)/);
  ['passwordless-login', 'passwordless-code-sent', 'passwordless-enter-code', 'passwordless-sign-in',
    'passwordless-email'].forEach(key => assert.ok(jade.includes(`{{_ '${key}'}}`), key));
  assert.match(js, /Accounts\.requestLoginTokenForUser\(\s*\n?\s*\{ selector: email, userData: \{ email, passwordless: true \} \}/);
  assert.match(js, /Meteor\.passwordlessLoginWithToken\(email, code, \(err\) => \{/);
  assert.match(js, /templateInstance\.passwordlessStep\.set\('code'\)/);
});

test('errors go to the same #login-error-message region as the password form, translated for the conflict', () => {
  assert.match(js, /document\.getElementById\('login-error-message'\)/);
  assert.match(js, /err\.error === 'oauth-account-conflict'\s*\n?\s*\? TAPi18n\.__\('oauth-account-conflict'\)/);
  assert.match(js, /errorDiv\.textContent =/, 'text, never innerHTML, for a provider-supplied message');
});

test('the i18n keys the form and the catalog use exist in English', () => {
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  const keys = OAUTH_PROVIDERS.map(p => p.labelKey).concat([
    'sign-in-with', 'passwordless-login', 'passwordless-code-sent', 'passwordless-enter-code',
    'passwordless-sign-in', 'passwordless-email', 'oauth-account-conflict', 'cancel',
  ]);
  keys.forEach(k => assert.strictEqual(typeof en[k], 'string', k));
  assert.ok(en['sign-in-with'].includes('%s'));
});

// ----------------------------------------------- NEGATIVE: no secret leaks

test('NEGATIVE: nothing the client loads reads or forwards a provider secret', () => {
  // The catalog is shared with the browser: it must name the secret's env var
  // (so the server can read it) but never read process.env on its own except
  // through the injectable helpers, and never a file outside the server.
  const pure = read('models/lib/oauthProviders.js');
  assert.ok(!/process\.env\.OAUTH/.test(pure), 'the catalog never hard-reads an OAUTH_* env var');
  assert.match(pure, /function defaultReadFile\(file\) \{[\s\S]*?require\('fs'\)/, 'fs is required lazily, server-only');
  // The login form: keys, icons, labels - no secret, id, token or config.
  [jade, js].forEach(src => {
    const code = src.replace(/\/\/.*$/gm, ''); // comments do not cross the wire
    assert.ok(!/secret/i.test(code), 'the login form never mentions a secret');
    assert.ok(!/ServiceConfiguration/.test(code), 'the login form never reads ServiceConfiguration');
  });
  // The server hands out keys only.
  const enabledFn = server.slice(server.indexOf('export function enabledOauthProviders'), server.indexOf('export function isPasswordlessLoginEnabled'));
  assert.ok(!/secret/.test(enabledFn), 'enabledOauthProviders() returns keys, not credentials');
  const authFn = settings.slice(settings.indexOf('getAuthenticationsEnabled()'), settings.indexOf('getOauthServerUrl()'));
  assert.ok(!/secret|clientId|appId|consumerKey/.test(authFn), 'getAuthenticationsEnabled carries no credential');
});

test('NEGATIVE: the resolved secret never leaves reconfigureOauthProviders', () => {
  // resolveProviderConfig (which returns the secret) is called from exactly
  // one place in the server module: the ServiceConfiguration upsert.
  const code = server.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const calls = code.match(/resolveProviderConfig\b/g) || [];
  assert.strictEqual(calls.length, 2, 'one import, one call');
  const fn = server.slice(server.indexOf('export async function reconfigureOauthProviders'), server.indexOf('export function enabledOauthProviders'));
  assert.match(fn, /resolveProviderConfig\(provider, admins\[provider\.key\], process\.env\)/);
  assert.ok(!/return config/.test(fn), 'the config with its secret is not returned');
});

console.log(`\n${passed} tests passed`);
