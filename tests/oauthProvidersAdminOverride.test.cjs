'use strict';

// Admin Panel override of the OAUTH_<PROVIDER>_* / OAUTH_PROVIDERS_* /
// PASSWORDLESS_ENABLED environment variables for Meteor's own accounts-*
// login services (Google, GitHub, Facebook, X/Twitter, Meteor Developer,
// Weibo, Meetup, passwordless). Source checks that pin the contract this
// section shares with the LDAP override it mirrors:
//
//   1. the schema declares the fields, all optional (no forced defaults);
//   2. the `setting` publication carries enabled/id/loginStyle/secretSet per
//      provider and NEVER the secret;
//   3. saveOauthProviderSettings / savePasswordlessSettings are isAdmin-only,
//      validate providerKey against the catalog, keep a stored secret when the
//      submission's secret is empty, and reconfigure the providers in place so
//      no restart is needed;
//   4. the jade section shows a source badge beside every field and only a
//      "secret is set" status, never the secret.
//
// Run: node tests/oauthProvidersAdminOverride.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const PROVIDER_KEYS = ['google', 'github', 'facebook', 'twitter', 'meteor-developer', 'weibo', 'meetup'];

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

function methodBody(src, name) {
  const at = src.indexOf(`async ${name}(`);
  assert.ok(at !== -1, `${name} must exist`);
  const next = src.indexOf('\n  async ', at + 1);
  return src.slice(at, next === -1 ? src.length : next);
}

console.log('oauthProvidersAdminOverride:');

test('models/settings.js declares the fields, all optional', () => {
  const src = read('models/settings.js');
  for (const field of ['oauthProviders', 'oauthProvidersLoginStyle',
    'oauthProvidersMergeExistingUsers', 'passwordlessEnabled']) {
    const at = src.search(new RegExp(`^\\s*${field}: \\{`, 'm'));
    assert.ok(at !== -1, `${field} must be in the schema`);
    const block = src.slice(at, src.indexOf('}', at) + 1);
    assert.ok(/optional:\s*true/.test(block), `${field} must be optional`);
    assert.ok(!/defaultValue/.test(block), `${field} must not force a default on existing installs`);
  }
  const style = src.slice(src.indexOf('oauthProvidersLoginStyle: {'));
  assert.ok(/allowedValues:\s*\['popup',\s*'redirect'\]/.test(style.slice(0, style.indexOf('}'))),
    'the login style is popup or redirect');
});

test('the publication sends enabled/id/loginStyle/secretSet per provider, never the secret', () => {
  const pub = read('server/publications/settings.js');
  const block = pub.slice(pub.indexOf('const SETTING_FIELDS = {'), pub.indexOf('\n};', pub.indexOf('const SETTING_FIELDS = {')));
  for (const key of PROVIDER_KEYS) {
    for (const f of ['enabled', 'id', 'loginStyle', 'secretSet']) {
      assert.ok(block.includes(`'oauthProviders.${key}.${f}': 1,`), `oauthProviders.${key}.${f} must be published`);
    }
    assert.ok(!block.includes(`'oauthProviders.${key}.secret':`), `oauthProviders.${key}.secret must not be published`);
  }
  for (const f of ['oauthProvidersLoginStyle', 'oauthProvidersMergeExistingUsers', 'passwordlessEnabled']) {
    assert.ok(new RegExp(`^\\s*${f}: 1,`, 'm').test(block), `${f} must be published`);
  }
});

test('both save methods and the sources method are isAdmin-gated', () => {
  const src = read('server/models/settings.js');
  for (const name of ['saveOauthProviderSettings', 'savePasswordlessSettings', 'getOauthProviderConfigSources']) {
    const body = methodBody(src, name);
    const gate = body.indexOf("if (!user?.isAdmin) throw new Meteor.Error('error-notAuthorized')");
    assert.ok(gate !== -1, `${name} must refuse a non-admin`);
    const write = body.search(/updateAsync|findOneAsync/);
    assert.ok(write === -1 || gate < write, `${name}: the admin check must run before any database access`);
  }
});

test('saveOauthProviderSettings validates providerKey against the catalog (negative)', () => {
  const src = read('server/models/settings.js');
  const body = methodBody(src, 'saveOauthProviderSettings');
  assert.ok(/oauthProviderCatalog\(\)\.find\(p => p\.key === providerKey\)/.test(body),
    'the key is looked up in the catalog');
  assert.ok(/if \(!provider\) throw new Meteor\.Error\('error-unknown-oauth-provider'\)/.test(body),
    'an unknown key is refused, so a client cannot write an arbitrary sub-document');
  const lookup = body.indexOf('oauthProviderCatalog().find');
  const write = body.indexOf('updateAsync');
  assert.ok(lookup < write, 'and refused before anything is written');
  // The fallback catalog (used while models/lib/oauthProviders.js is absent)
  // carries exactly the fixed-interface keys.
  const fallback = src.slice(src.indexOf('const FALLBACK_OAUTH_PROVIDER_KEYS = ['), src.indexOf('];', src.indexOf('const FALLBACK_OAUTH_PROVIDER_KEYS = [')));
  for (const key of PROVIDER_KEYS) assert.ok(fallback.includes(`'${key}'`), `${key} in the fallback catalog`);
  assert.ok(/'OAUTH_FACEBOOK_APP_ID'/.test(src) && /'OAUTH_TWITTER_CONSUMER_KEY'/.test(src),
    'Facebook and Twitter use their own id variable names');
});

test('an empty secret submission leaves the stored secret untouched (LDAP rule)', () => {
  const src = read('server/models/settings.js');
  const body = methodBody(src, 'saveOauthProviderSettings');
  assert.ok(/const secret = String\(input\.secret \|\| ''\);\s*if \(secret\) \{\s*set\[`\$\{prefix\}\.secret`\] = secret;\s*set\[`\$\{prefix\}\.secretSet`\] = true;\s*\}/.test(body),
    'the secret and secretSet are written only inside `if (secret)`');
  assert.ok(!/\$unset/.test(body), 'nothing unsets the secret');
  assert.ok(!/return\s+\{[^}]*secret/.test(body), 'the secret is never returned to the caller');
});

test('a save reconfigures the providers in place, guarded, so no restart is needed', () => {
  const src = read('server/models/settings.js');
  for (const name of ['saveOauthProviderSettings', 'savePasswordlessSettings']) {
    const body = methodBody(src, name);
    assert.ok(body.indexOf('reconfigureOauthProvidersNow()') > body.indexOf('updateAsync'),
      `${name} reconfigures after the write`);
  }
  const fn = src.slice(src.indexOf('function reconfigureOauthProvidersNow()'), src.indexOf('\n}\n', src.indexOf('function reconfigureOauthProvidersNow()')));
  assert.ok(/try \{[\s\S]*require\('\/server\/lib\/oauthProviders'\)[\s\S]*reconfigureOauthProviders\(\)[\s\S]*\} catch/.test(fn),
    'the module is required lazily inside try/catch so a missing or failing reconfigure never breaks the save');
});

test('getOauthProviderConfigSources reports the secret only as hasValue/source', () => {
  const src = read('server/models/settings.js');
  const body = methodBody(src, 'getOauthProviderConfigSources');
  assert.ok(/hasConfigValue\(provider\.secretVar, admin\.secret\)/.test(body), 'the secret goes through hasConfigValue');
  assert.ok(/secret: \{ source: secret\.source, hasValue: secret\.hasValue \}/.test(body), 'and only hasValue/source is returned');
  assert.ok(!/resolveConfigValue\(provider\.secretVar/.test(body), 'never through resolveConfigValue (negative)');
  for (const envVar of ['OAUTH_PROVIDERS_LOGIN_STYLE', 'OAUTH_PROVIDERS_MERGE_EXISTING_USERS', 'PASSWORDLESS_ENABLED']) {
    assert.ok(body.includes(`'${envVar}'`), `${envVar} is resolved`);
  }
});

test('the resolver gives the Admin Panel precedence over the env var, and reports Unset', () => {
  const { resolveConfigValue, hasConfigValue } = require('../models/lib/configResolver.js');
  const env = { OAUTH_GOOGLE_CLIENT_ID: 'from-env', OAUTH_GOOGLE_SECRET: 's' };
  const readEnv = n => env[n];
  assert.deepStrictEqual(resolveConfigValue('OAUTH_GOOGLE_CLIENT_ID', 'from-admin', { readEnv }), { value: 'from-admin', source: 'admin' });
  assert.deepStrictEqual(resolveConfigValue('OAUTH_GOOGLE_CLIENT_ID', '', { readEnv }), { value: 'from-env', source: 'env' });
  assert.deepStrictEqual(resolveConfigValue('OAUTH_GITHUB_CLIENT_ID', undefined, { readEnv }), { value: undefined, source: 'default' });
  // a saved `enabled: false` is an Admin Panel decision, as for LDAP_ENABLE
  assert.strictEqual(resolveConfigValue('OAUTH_GOOGLE_ENABLED', false, { readEnv: () => 'true' }).source, 'admin');
  assert.deepStrictEqual(hasConfigValue('OAUTH_GOOGLE_SECRET', '', { readEnv }), { hasValue: true, source: 'env' });
  assert.deepStrictEqual(hasConfigValue('OAUTH_GITHUB_SECRET', '', { readEnv }), { hasValue: false, source: 'default' });
});

test('the jade section shows a source badge beside every field and only a secret status', () => {
  const jade = read('client/components/settings/settingBody.jade');
  const at = jade.indexOf("{{_ 'oauth-providers-title'}}");
  assert.ok(at !== -1, 'the section exists');
  const section = jade.slice(at, jade.indexOf("template(name='email')", at));
  assert.ok(/if currentUser\.isAdmin/.test(jade.slice(at - 400, at)), 'rendered for admins only');
  assert.ok(/each oauthProviderList/.test(section), 'one block per catalog provider');
  assert.ok(/ldap-source-badge\s+\(\{\{oauthProviderSourceLabel key 'enabled'\}\}\)/.test(section), 'badge on enabled');
  assert.ok(/ldap-source-badge\s+\(\{\{oauthProviderSourceLabel key 'id'\}\}\)/.test(section), 'badge on the id');
  assert.ok(/\{\{oauthProviderSecretStatusText key\}\}/.test(section), 'secret shown as a status only');
  assert.ok(/class="js-oauth-provider-secret"[^\n]*value=""[^\n]*autocomplete="new-password"/.test(section),
    'the secret input is always empty (negative: never prefilled)');
  assert.ok(!/oauthProviders\.[\w-]+\.secret\b/.test(section), 'no template reads a secret');
  for (const f of ['loginStyle', 'mergeExistingUsers', 'passwordless']) {
    assert.ok(section.includes(`{{oauthSharedSourceLabel '${f}'}}`), `badge on ${f}`);
  }
  for (const key of ['oauth-providers-hint', 'oauth-provider-client-id', 'oauth-provider-secret',
    'oauth-providers-login-style', 'oauth-providers-merge-existing-users',
    'passwordless-title', 'passwordless-enabled', 'passwordless-hint']) {
    assert.ok(section.includes(`{{_ '${key}'}}`), `i18n key ${key} used`);
  }
});

test('the client helpers label the source as Admin Panel / env var name / Unset', () => {
  const js = read('client/components/settings/settingBody.js');
  const fn = js.slice(js.indexOf('function sourceBadge('), js.indexOf('\n}\n', js.indexOf('function sourceBadge(')));
  assert.ok(/source === 'admin'\) return TAPi18n\.__\('admin-panel'\)/.test(fn));
  assert.ok(/source === 'env'\) return envVar/.test(fn));
  assert.ok(/return TAPi18n\.__\('unset-color'\)/.test(fn));
  assert.ok(/\$\{TAPi18n\.__\('oauth-provider-secret-set'\)\} \(\$\{from\}\)/.test(js),
    'the secret status reads "A secret is set (<source>)"');
  assert.ok(/Meteor\.call\('saveOauthProviderSettings', key, input/.test(js));
  assert.ok(/Meteor\.call\('savePasswordlessSettings', \{ enabled \}/.test(js));
  assert.ok(/\$secret\.val\(''\);/.test(js), 'the secret field is cleared after a save');
});

console.log(`\n${passed} tests passed`);
