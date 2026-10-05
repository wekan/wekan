'use strict';
// Every login environment variable can be overridden in Admin Panel / People,
// in its login method's own section (#6744 follow-up). models/lib/
// authConfigCatalog.js lists them; server/lib/authConfig.js resolves them
// (Admin Panel value first, then the environment) for the app and, through
// globalThis.__wekanAuthEnv, for the wekan-ldap, wekan-oidc and
// wekan-accounts-cas packages.
//
// The guarantees pinned here:
//   1. resolution: an override wins, an empty one does not, the result has
//      process.env's string shape, and an environment-only install behaves as
//      before (older variable spellings still win where the code read them);
//   2. secrets: a password or client secret never leaves the server - not as a
//      value, not from the Admin Panel, not from the environment - and a
//      password written inside a URL is masked on the server;
//   3. input: nothing outside the catalog can be written, values are typed,
//      and a URL may not carry credentials;
//   4. negative, whole tree: no code reads a login variable the catalog does
//      not list, none reads a catalog variable straight from process.env (it
//      would ignore the Admin Panel), and no server code calls the synchronous
//      Settings.findOne() that Meteor 3 refuses - the reason the first LDAP
//      overrides never applied;
//   5. platforms: every catalog variable is listed where release-all.yml's
//      platforms take their settings from (Dockerfile, snap, docker-compose,
//      start-wekan.sh / .bat).
//
// Run: node --test tests/authConfigCatalog.test.cjs
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const catalog = require('../models/lib/authConfigCatalog');
const {AUTH_CONFIG_SECTIONS, resolveAuthEnv, authConfigSources, cleanAuthConfigInput, authConfigEnvVars, authConfigField} = catalog;
const VARS = authConfigEnvVars();

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(path.join(ROOT, dir), {withFileTypes: true})) {
    if (['_build', '.build', 'node_modules', '.tools', '.meteor', '.npm', 'tests'].includes(entry.name)) continue;
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) walk(rel, out);
    else if (/\.(js|cjs|mjs)$/.test(entry.name)) out.push(rel);
  }
  return out;
}
const stripComments = src => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/([^:'"`])\/\/[^\n'"`]*$/gm, '$1');

test('the catalog is well formed: one field per variable, known types, two secrets', () => {
  assert.equal(new Set(VARS).size, VARS.length, 'a variable is listed twice');
  const secrets = [];
  for (const [section, {storage, fields}] of Object.entries(AUTH_CONFIG_SECTIONS)) {
    assert.match(storage, /^[a-zA-Z]+$/);
    const keys = new Set();
    for (const field of fields) {
      assert.ok(['boolean', 'text', 'textarea', 'number', 'choice', 'secret', 'url', 'path'].includes(field.type), field.envVar);
      assert.ok(!keys.has(field.key), `${section}.${field.key} twice`);
      keys.add(field.key);
      if (field.type === 'choice') assert.ok(field.choices.length > 1, field.envVar);
      if (field.secret) secrets.push(field.envVar);
    }
  }
  assert.deepEqual(secrets.sort(), ['LDAP_AUTHENTIFICATION_PASSWORD', 'OAUTH2_SECRET']);
  // LDAP keeps the field names its first overrides were stored under.
  for (const [envVar, key] of [['LDAP_ENABLE', 'enabled'], ['LDAP_HOST', 'host'], ['LDAP_PORT', 'port'],
    ['LDAP_BASEDN', 'baseDN'], ['LDAP_AUTHENTIFICATION_USERDN', 'authentificationUserDN'],
    ['LDAP_USER_SEARCH_FILTER', 'userSearchFilter'], ['LDAP_USER_SEARCH_FIELD', 'userSearchField'],
    ['LDAP_ENCRYPTION', 'encryption'], ['LDAP_AUTHENTIFICATION_PASSWORD', 'bindPassword']]) {
    assert.equal(authConfigField(envVar).key, key);
    assert.equal(authConfigField(envVar).storage, 'ldap');
  }
});

test('resolution: an Admin Panel value wins and has process.env string shape', () => {
  const env = {LDAP_HOST: 'env.example', LDAP_ENABLE: 'false', LDAP_PORT: '389'};
  const doc = {ldap: {host: 'admin.example', enabled: true, port: 636}};
  assert.equal(resolveAuthEnv('LDAP_HOST', doc, env), 'admin.example');
  assert.equal(resolveAuthEnv('LDAP_ENABLE', doc, env), 'true');
  assert.equal(resolveAuthEnv('LDAP_PORT', doc, env), '636');
  assert.equal(resolveAuthEnv('LDAP_ENABLE', {ldap: {enabled: false}}, {LDAP_ENABLE: 'true'}), 'false',
    'an explicit "No" in the Admin Panel turns off what the environment turned on');
});

test('resolution: no override, an empty one or a missing document means the environment', () => {
  const env = {OAUTH2_CLIENT_ID: 'from-env'};
  for (const doc of [null, undefined, {}, {oidc: {}}, {oidc: {clientId: ''}}, {oidc: {clientId: null}}, {oidc: 'junk'}]) {
    assert.equal(resolveAuthEnv('OAUTH2_CLIENT_ID', doc, env), 'from-env');
  }
  assert.equal(resolveAuthEnv('OAUTH2_CLIENT_ID', {}, {}), undefined);
  // A name outside the catalog is plain environment, never an override.
  assert.equal(resolveAuthEnv('ROOT_URL', {oidc: {ROOT_URL: 'x'}}, {ROOT_URL: 'http://wekan'}), 'http://wekan');
});

test('resolution: older spellings still win where the code used to read them first', () => {
  assert.equal(resolveAuthEnv('HEADER_LOGIN_TRUSTED_IPS', {}, {HEADER_LOGIN_TRUSTED_IP: '10.0.0.1', HEADER_LOGIN_TRUSTED_IPS: '10.0.0.2'}), '10.0.0.1');
  assert.equal(resolveAuthEnv('HEADER_LOGIN_TRUSTED_IPS', {}, {HEADER_LOGIN_TRUSTED_IPS: '10.0.0.2'}), '10.0.0.2');
  assert.equal(resolveAuthEnv('CAS_VALIDATE_URL', {}, {CASE_VALIDATE_URL: 'https://old'}), 'https://old');
  assert.equal(resolveAuthEnv('CAS_VALIDATE_URL', {}, {CAS_VALIDATE_URL: 'https://new'}), 'https://new');
  assert.equal(resolveAuthEnv('HEADER_LOGIN_TRUSTED_IPS', {headerLogin: {trustedIps: '10.9.9.9'}}, {HEADER_LOGIN_TRUSTED_IP: '10.0.0.1'}), '10.9.9.9',
    'and the Admin Panel still wins over both');
});

test('secrets never leave the server, from either source', () => {
  for (const [section, envVar, key, storage] of [['ldap', 'LDAP_AUTHENTIFICATION_PASSWORD', 'bindPassword', 'ldap'], ['oidc', 'OAUTH2_SECRET', 'secret', 'oidc']]) {
    for (const [doc, env, source] of [
      [{[storage]: {[key]: 'admin-s3cret', [`${key}Set`]: true}}, {}, 'admin'],
      [{}, {[envVar]: 'env-s3cret'}, 'env'],
      [{}, {}, 'default'],
    ]) {
      const result = authConfigSources(section, doc, env);
      assert.deepEqual(result.sources[key], {source, hasValue: source !== 'default'});
      assert.ok(!(key in result.overrides), `${section}: the stored secret is not an override the browser gets`);
      const json = JSON.stringify(result);
      assert.ok(!json.includes('s3cret'), `${section} from ${source} leaked: ${json}`);
    }
  }
});

test('a password written inside a URL is masked on the server, stored or from the environment', () => {
  const env = {OAUTH2_SERVER_URL: 'https://client:hunter2@idp.example', LDAP_HOST: 'ldap://cn:hunter2@ldap.example'};
  const oidc = authConfigSources('oidc', {}, env);
  assert.equal(oidc.sources.serverUrl.value, 'https://client:***@idp.example');
  const ldap = authConfigSources('ldap', {ldap: {host: 'ldaps://admin:hunter2@ldap.example'}}, env);
  assert.equal(ldap.overrides.host, 'ldaps://admin:***@ldap.example');
  assert.ok(!JSON.stringify([oidc, ldap]).includes('hunter2'));
});

test('input: typed values, empty means "use the environment", unknown keys refused', () => {
  const {set, unset} = cleanAuthConfigInput('ldap', {
    enabled: 'true', port: '636', userSearchScope: 'one', host: '  ldap.example ', baseDN: '', groupFilterNested: false,
  });
  assert.deepEqual(set, {'ldap.enabled': true, 'ldap.port': 636, 'ldap.userSearchScope': 'one', 'ldap.host': 'ldap.example', 'ldap.groupFilterNested': false});
  assert.deepEqual(unset, {'ldap.baseDN': ''});
  for (const bad of [{enabled: 'yes'}, {port: '-1'}, {port: 'x'}, {userSearchScope: 'all'}, {host: 42}, {notInCatalog: 'x'},
    {__proto__: null, 'ldap.host': 'x'}, {clearSecrets: ['host']}, {clearSecrets: 'bindPassword'}]) {
    assert.throws(() => cleanAuthConfigInput('ldap', bad), TypeError, JSON.stringify(bad));
  }
  assert.throws(() => cleanAuthConfigInput('nope', {}), TypeError);
  assert.throws(() => cleanAuthConfigInput('ldap', []), TypeError);
});

test('input: a secret left empty is kept, a new one replaces it, clearSecrets removes it', () => {
  assert.deepEqual(cleanAuthConfigInput('ldap', {bindPassword: ''}), {set: {}, unset: {}});
  assert.deepEqual(cleanAuthConfigInput('ldap', {bindPassword: 'new'}), {set: {'ldap.bindPassword': 'new', 'ldap.bindPasswordSet': true}, unset: {}});
  assert.deepEqual(cleanAuthConfigInput('oidc', {clearSecrets: ['secret']}), {set: {'oidc.secretSet': false}, unset: {'oidc.secret': ''}});
  assert.throws(() => cleanAuthConfigInput('oidc', {secret: 'x', clearSecrets: ['secret']}), TypeError);
});

test('input: URLs carry no credentials and server-read paths are absolute', () => {
  assert.throws(() => cleanAuthConfigInput('oidc', {serverUrl: 'https://u:p@idp.example'}), TypeError);
  assert.throws(() => cleanAuthConfigInput('cas', {baseUrl: 'javascript:alert(1)'}), TypeError);
  assert.equal(cleanAuthConfigInput('cas', {baseUrl: 'https://cas.example/cas'}).set['cas.baseUrl'], 'https://cas.example/cas');
  for (const bad of ['relative/key.p8', '/etc/../etc/shadow', '']) {
    if (bad === '') continue;
    assert.throws(() => cleanAuthConfigInput('oidc', {secretJwtKeyPath: bad}), TypeError, bad);
  }
  assert.equal(cleanAuthConfigInput('oidc', {caCert: '/etc/ssl/ca.pem'}).set['oidc.caCert'], '/etc/ssl/ca.pem');
});

// Login variables that are deliberately NOT in this catalog, each with where
// it IS overridable or why it is not a setting.
const ELSEWHERE = [
  [/^SAML_/, 'models/lib/samlConfig.js (Admin Panel / People / SAML)'],
  [/^OAUTH_(GOOGLE|GITHUB|FACEBOOK|TWITTER|METEOR_DEVELOPER|WEIBO|MEETUP|PROVIDERS)/, 'models/lib/oauthProviders.js (People / OAuth login providers)'],
  [/^PASSWORDLESS_ENABLED$/, 'People / Passwordless login'],
  [/^ACCOUNTS_LOCKOUT_/, 'People / Locked Users (lockoutSettings)'],
  [/^INTERNAL_LOG_LEVEL$/, 'deprecated, has no effect'],
];
const LOGIN_NAME = /^(LDAP|OAUTH2|OIDC|CAS|CASE|HEADER_LOGIN|ORACLE_OIM|PASSWORD_LOGIN|PROPAGATE_OIDC|ACCOUNTS_COMMON)_[A-Z0-9_]+$/;

function readsIn(src) {
  const names = new Set();
  for (const re of [/process\.env\.([A-Z][A-Z0-9_]+)/g, /process\.env\[['"]([A-Z][A-Z0-9_]+)['"]\]/g,
    /settings_get\(\s*['"]([A-Z][A-Z0-9_]+)['"]/g, /authEnv\(\s*['"]([A-Z][A-Z0-9_]+)['"]/g,
    /resolve\(\s*['"]([A-Z][A-Z0-9_]+)['"]\)/g, /\benv(?:ironment)?\.([A-Z][A-Z0-9_]+)/g]) {
    for (const m of src.matchAll(re)) names.add(m[1]);
  }
  return names;
}
const SOURCES = [...walk('server'), ...walk('models'), ...walk('packages'), ...walk('imports'), ...walk('config')]
  .filter(file => !/\/tests?\//.test(file));

test('negative, whole tree: every login variable the code reads is in a catalog', () => {
  const unknown = [];
  for (const file of SOURCES) {
    for (const name of readsIn(stripComments(read(file)))) {
      if (!LOGIN_NAME.test(name) || authConfigField(name)) continue;
      if (ELSEWHERE.some(([re]) => re.test(name))) continue;
      unknown.push(`${file}: ${name}`);
    }
  }
  assert.deepEqual(unknown, [], 'add these to models/lib/authConfigCatalog.js so the Admin Panel can override them');
});

test('negative, whole tree: no catalog variable is read straight from process.env', () => {
  // Only the resolver itself and the packages' fallback for when it is not
  // installed (plain-Node tests) may - both on a line that also asks the
  // resolver. Anything else would ignore an Admin Panel override.
  const offenders = [];
  for (const file of SOURCES) {
    if (file === 'models/lib/authConfigCatalog.js' || file === 'server/lib/authConfig.js') continue;
    const lines = stripComments(read(file)).split('\n');
    lines.forEach((line, i) => {
      for (const m of line.matchAll(/process\.env(?:\.([A-Z][A-Z0-9_]+)|\[['"]([A-Z][A-Z0-9_]+)['"]\])/g)) {
        const name = m[1] || m[2];
        if (!authConfigField(name)) continue;
        const context = `${lines[i - 1] || ''}\n${line}`;
        if (/__wekanAuthEnv|typeof resolve === 'function'/.test(context)) continue;
        offenders.push(`${file}:${i + 1}: ${name}`);
      }
    });
  }
  assert.deepEqual(offenders, []);
});

test('negative, whole tree: server code never calls the synchronous Settings.findOne()', () => {
  const serverFiles = SOURCES.filter(file => file.startsWith('server/') || /^packages\/[^/]+\/server\//.test(file)
    || /_server\.js$/.test(file));
  const offenders = serverFiles.filter(file => /\bSettings\.findOne\(/.test(stripComments(read(file))));
  assert.deepEqual(offenders, [], 'Meteor 3 throws on the server; use the authConfig cache or findOneAsync');
});

test('the packages read every setting through the app resolver', () => {
  const ldap = read('packages/wekan-ldap/server/ldap.js');
  assert.match(ldap, /globalThis\.__wekanAuthEnv/);
  assert.match(read('server/ldapAdminSettingsBridge.js'), /setLdapSettingsAccessor\(authEnv\)/);
  assert.match(read('server/lib/authConfig.js'), /globalThis\.__wekanAuthEnv = authEnv/);
  for (const file of ['packages/wekan-oidc/oidc_server.js', 'packages/wekan-oidc/loginHandler.js',
    'packages/wekan-accounts-cas/cas_server.js', 'packages/wekan-ldap/server/logger.js']) {
    assert.match(read(file), /globalThis\.__wekanAuthEnv/, file);
  }
  // OIDC and CAS are reconfigured when their settings change, not only at start.
  const auth = read('server/authentication.js');
  assert.match(auth, /onAuthConfigChange\('oidc', reconfigureOidc\)/);
  assert.match(auth, /onAuthConfigChange\('cas', reconfigureCas\)/);
  assert.match(read('server/header-login.js'), /if \(!authEnv\('HEADER_LOGIN_ID'\)\)/);
});

test('the server methods are site-admin only and the sections are never published', () => {
  const src = read('server/lib/authConfig.js');
  for (const method of ['getAuthConfigSources', 'saveAuthConfigSettings']) {
    const body = src.slice(src.indexOf(`async ${method}(`));
    const guard = body.indexOf('await requireSiteAdmin()');
    assert.ok(guard !== -1 && guard < body.indexOf('Settings.'), `${method} checks the admin before touching Settings`);
  }
  assert.match(src, /user\?\.isAdmin !== true \|\| user\.loginDisabled === true/);
  const pub = read('server/publications/settings.js');
  for (const storage of ['oidc', 'cas', 'headerLogin', 'loginOptions']) {
    assert.ok(!new RegExp(`['"]?${storage}(\\.[\\w.-]+)?['"]?\\s*:\\s*1`).test(pub), `${storage} must not be published`);
  }
  assert.ok(!/^\s*ldap\s*:\s*1/m.test(pub), 'a bare ldap: 1 would publish the bind password');
});

test('platforms: every catalog variable is listed where release-all.yml platforms read settings', () => {
  const config = read('snap-src/bin/config');
  const keys = new Set(config.split('\n')[5].replace(/^keys="|"$/g, '').split(' '));
  const help = read('snap-src/bin/wekan-help');
  const files = ['Dockerfile', 'start-wekan.sh', 'start-wekan.bat',
    ...fs.readdirSync(ROOT).filter(f => /^docker-compose.*\.yml$/.test(f) && read(f).includes('LDAP_ENABLE'))];
  const missing = [];
  for (const v of VARS) {
    for (const file of files) if (!new RegExp(`\\b${v}\\b`).test(read(file))) missing.push(`${file}: ${v}`);
    if (!keys.has(v)) missing.push(`snap keys: ${v}`);
    const key = (config.match(new RegExp(`^KEY_${v}="([^"]+)"$`, 'm')) || [])[1];
    if (!key || !new RegExp(`^DESCRIPTION_${v}=`, 'm').test(config) || !new RegExp(`^DEFAULT_${v}=`, 'm').test(config)) {
      missing.push(`snap config block: ${v}`);
    } else if (!help.includes(`$SNAP_INSTANCE_NAME ${key}=`)) {
      missing.push(`snap help: ${v} (${key})`);
    }
  }
  assert.deepEqual(missing, []);
});

test('snap help shows the keys snap config really has', () => {
  // The help printed ldap-group-filter-group-id-attribute and two more names
  // `snap set` does not know; the keys are the KEY_ values in snap config.
  const config = read('snap-src/bin/config');
  const known = new Set([...config.matchAll(/^KEY_[A-Z0-9_]+="([^"]+)"$/gm)].map(m => m[1]));
  const shown = [...read('snap-src/bin/wekan-help').matchAll(/\$SNAP_INSTANCE_NAME (ldap-group-filter-[a-z-]+)=/g)].map(m => m[1]);
  assert.ok(shown.length >= 7);
  assert.deepEqual(shown.filter(k => !known.has(k)), []);
});

test('wekan-ldap: every LDAP_* setting follows the resolver, the password stays a string', () => {
  // Runs the real ldap.js (as tests/helpers/ldapAuthHarness.cjs does) with the
  // app's resolver installed - the path that used to read a server-side
  // Settings.findOne() Meteor 3 refuses, so no Admin Panel value applied.
  const vm = require('node:vm');
  const dir = path.join(ROOT, 'packages/wekan-ldap/server');
  const strip = src => src.replace(/^import[\s\S]*?;\n/gm, '');
  const doc = {ldap: {host: 'admin.example', groupFilterNested: true, bindPassword: '0123', searchPageSize: 50}};
  const env = {LDAP_HOST: 'env.example', LDAP_BASEDN: 'dc=env', LDAP_GROUP_FILTER_NESTED: 'false'};
  const context = vm.createContext({process: {env}, Buffer, console,
    Log: {info() {}, warn() {}, error() {}, debug() {}}, log_debug() {}, log_info() {},
    normalizeLdapEncryption: () => ({mode: 'off'}),
    ...require(path.join(dir, 'groupFilterConfig')), ...require(path.join(dir, 'userCredentials'))});
  context.__wekanAuthEnv = name => resolveAuthEnv(name, doc, env);
  vm.runInContext(strip(read('packages/wekan-ldap/server/ldap.js'))
    .replace(/export function /g, 'function ').replace('export default class LDAP', 'class LDAP')
    + '\nglobalThis.LDAP=LDAP;globalThis.setAccessor=setLdapSettingsAccessor;', context);
  const options = new context.LDAP().options;
  assert.equal(options.host, 'admin.example', 'an Admin Panel value reaches the connection');
  assert.equal(options.BaseDN, 'dc=env', 'a field without one keeps the environment');
  assert.equal(options.group_filter_nested, true, 'and every variable is covered, not the first eight');
  assert.equal(options.Search_Page_Size, 50, 'numbers are numbers, as from the environment');
  assert.equal(options.Authentication_Password, '0123', 'a numeric password is not turned into a number');
  // Without the resolver (a plain-Node test, very early boot): the environment.
  context.__wekanAuthEnv = undefined;
  assert.equal(new context.LDAP().options.host, 'env.example');
  // A failing accessor falls back to the environment instead of breaking login.
  context.setAccessor(() => { throw new Error('not ready'); });
  assert.equal(new context.LDAP().options.host, 'env.example');
});

test('LDAP Test connection exists on the server and checks the admin asynchronously', () => {
  // testConnection.js was never imported, so the Admin Panel button only ever
  // got "Method 'ldap_test_connection' not found"; and its Meteor.user() is
  // refused on a Meteor 3 server.
  assert.match(read('packages/wekan-ldap/server/index.js'), /^import '\.\/testConnection';$/m);
  assert.match(read('packages/wekan-ldap/server/testConnection.js'), /const user = await Meteor\.userAsync\(\);/);
});

test('negative, whole tree: no server code calls the synchronous Meteor.user()', () => {
  const serverFiles = SOURCES.filter(file => file.startsWith('server/') || /^packages\/[^/]+\/server\//.test(file)
    || /_server\.js$/.test(file));
  const offenders = serverFiles.filter(file => /\bMeteor\.user\(\)/.test(stripComments(read(file))));
  assert.deepEqual(offenders, [], 'Meteor 3 refuses it on the server; use await Meteor.userAsync()');
});

test('secrets: <NAME>_FILE gives the secret without it ever being an environment variable', () => {
  const files = {'/run/secrets/ldap': 'from-file\n', '/run/secrets/crlf': 'p@ss word \r\n', '/run/secrets/empty': '\n'};
  const readFile = file => { if (!(file in files)) throw Object.assign(new Error('nope'), {code: 'ENOENT'}); return files[file]; };
  const resolve = (doc, env) => resolveAuthEnv('LDAP_AUTHENTIFICATION_PASSWORD', doc, env, {readFile});
  assert.equal(resolve({}, {LDAP_AUTHENTIFICATION_PASSWORD_FILE: '/run/secrets/ldap'}), 'from-file',
    'the trailing line break of a secret file is not part of the password');
  assert.equal(resolve({}, {LDAP_AUTHENTIFICATION_PASSWORD_FILE: '/run/secrets/crlf'}), 'p@ss word ',
    'but every other character is, spaces included');
  assert.equal(resolve({}, {LDAP_AUTHENTIFICATION_PASSWORD: 'direct', LDAP_AUTHENTIFICATION_PASSWORD_FILE: '/run/secrets/ldap'}), 'direct',
    'the variable itself wins over its file, as in the OAuth providers');
  assert.equal(resolve({ldap: {bindPassword: 'admin'}}, {LDAP_AUTHENTIFICATION_PASSWORD_FILE: '/run/secrets/ldap'}), 'admin',
    'and the Admin Panel over both');
  for (const file of ['/run/secrets/missing', '/run/secrets/empty']) {
    assert.equal(resolve({}, {LDAP_AUTHENTIFICATION_PASSWORD_FILE: file}), undefined, `${file}: no password, never the path`);
  }
  assert.equal(resolveAuthEnv('OAUTH2_SECRET', {}, {OAUTH2_SECRET_FILE: '/run/secrets/ldap'}, {readFile}), 'from-file');
});

test('secrets: the Admin Panel learns that a file is used or unreadable - never its path or content', () => {
  const readFile = file => { if (file === '/s/ok') return 'TOPSECRET\n'; throw Object.assign(new Error('EACCES /s/denied'), {code: 'EACCES'}); };
  const ok = authConfigSources('oidc', {}, {OAUTH2_SECRET_FILE: '/s/ok'}, {readFile});
  assert.deepEqual(ok.sources.secret, {source: 'file', hasValue: true});
  const bad = authConfigSources('ldap', {}, {LDAP_AUTHENTIFICATION_PASSWORD_FILE: '/s/denied'}, {readFile});
  assert.deepEqual(bad.sources.bindPassword, {source: 'file-error', hasValue: false});
  const json = JSON.stringify([ok, bad]);
  assert.ok(!json.includes('TOPSECRET') && !json.includes('/s/'), json);
});

test('secrets: a real file on disk is read at each call, so a rotated secret applies', () => {
  const dir = fs.mkdtempSync(path.join(ROOT, '.tools', 'tmp', 'authsecret-'));
  try {
    const file = path.join(dir, 'ldap_auth_password');
    fs.writeFileSync(file, 'first\n', {mode: 0o600});
    const env = {LDAP_AUTHENTIFICATION_PASSWORD_FILE: file};
    assert.equal(resolveAuthEnv('LDAP_AUTHENTIFICATION_PASSWORD', {}, env), 'first');
    fs.writeFileSync(file, 'second\n');
    assert.equal(resolveAuthEnv('LDAP_AUTHENTIFICATION_PASSWORD', {}, env), 'second');
  } finally {
    fs.rmSync(dir, {recursive: true, force: true});
  }
});

test('negative: a <NAME>_FILE path cannot be set from the Admin Panel', () => {
  // Settable there together with the LDAP host or the OAuth2 token endpoint, a
  // path would make the server read any file and send it to that server as the
  // password. It is an environment variable only.
  for (const {fields} of Object.values(AUTH_CONFIG_SECTIONS)) {
    for (const field of fields) assert.ok(!/_FILE$/.test(field.envVar), `${field.envVar} must not be an Admin Panel field`);
  }
  for (const [section, key] of [['ldap', 'bindPasswordFile'], ['oidc', 'secretFile'], ['ldap', 'LDAP_AUTHENTIFICATION_PASSWORD_FILE']]) {
    assert.throws(() => cleanAuthConfigInput(section, {[key]: '/etc/shadow'}), TypeError);
  }
  assert.deepEqual(VARS.filter(v => /_FILE$/.test(v)).sort(), ['LDAP_AUTHENTIFICATION_PASSWORD_FILE', 'OAUTH2_SECRET_FILE'],
    'and the platforms list the file variables of both login secrets');
});

test('DEFAULT_AUTHENTICATION_METHOD: an Admin Panel choice overrides the variable, Default leaves it', () => {
  const {resolveDefaultAuthenticationMethod} = loadAuthenticationMethod();
  // As server/models/settings.js applyDefaultAuthenticationMethod computes it.
  const effective = (doc, env) => resolveDefaultAuthenticationMethod(
    resolveAuthEnv('DEFAULT_AUTHENTICATION_METHOD', doc, env), undefined);
  assert.equal(effective({loginOptions: {defaultAuthenticationMethod: 'ldap'}}, {DEFAULT_AUTHENTICATION_METHOD: 'oauth2'}), 'ldap');
  assert.equal(effective({}, {DEFAULT_AUTHENTICATION_METHOD: 'OAUTH2'}), 'oauth2', 'Default: the variable, as before');
  // Choosing Default again really gives the variable - or 'password' - back.
  // It used to fall back to the stored value, which is the override just
  // removed, so Default changed nothing.
  assert.equal(effective({loginOptions: {defaultAuthenticationMethod: ''}}, {}), 'password');
  assert.equal(effective({}, {}), 'password');
  assert.match(read('server/models/settings.js'),
    /resolveDefaultAuthenticationMethod\(authEnv\('DEFAULT_AUTHENTICATION_METHOD'\), undefined\)/,
    'the published value is computed without the stored one');
  for (const bad of ['', 'LDAP', 'root', 42]) {
    if (bad === '') { assert.deepEqual(cleanAuthConfigInput('login', {defaultAuthenticationMethod: bad}).unset, {'loginOptions.defaultAuthenticationMethod': ''}); continue; }
    assert.throws(() => cleanAuthConfigInput('login', {defaultAuthenticationMethod: bad}), TypeError, String(bad));
  }
  // The published value follows the effective one at start and on every save,
  // instead of the variable rewriting it at every start.
  const settings = read('server/models/settings.js');
  assert.match(settings, /onAuthConfigChange\('login', applyDefaultAuthenticationMethod\)/);
  const startup = settings.slice(settings.indexOf("Meteor.startup(async () => {\n  await ensureIndex(Settings"));
  assert.ok(!/defaultAuthenticationMethod: envDefaultAuthenticationMethod/.test(startup),
    'the start no longer writes the variable over an Admin Panel choice');
  assert.ok(!/selectAuthenticationMethod/.test(read('client/components/settings/settingBody.jade')),
    'one control for it - the login settings form - not a second dropdown that the start overwrote');
});

function loadAuthenticationMethod() {
  // An ES module with `export {}`; evaluated as CommonJS for the test.
  const src = read('models/lib/authenticationMethod.js').replace(/export \{[\s\S]*?\};?\s*$/, '');
  const m = {exports: {}};
  new Function('module', 'exports', `${src}\nmodule.exports = { normalizeAuthenticationMethod, resolveDefaultAuthenticationMethod, migratedDefaultAuthenticationMethod };`)(m, m.exports);
  return m.exports;
}

test('upgrade: a method chosen with the old dropdown becomes the override, once', () => {
  const {migratedDefaultAuthenticationMethod: migrate} = loadAuthenticationMethod();
  assert.equal(migrate({stored: 'ldap'}), 'ldap', 'an administrator\'s choice is kept');
  assert.equal(migrate({stored: 'CAS '}), 'cas');
  // Negative: nothing is invented.
  assert.equal(migrate({stored: 'password'}), undefined, 'the seeded default is not a choice');
  assert.equal(migrate({stored: undefined}), undefined);
  assert.equal(migrate({stored: 'ldap', environment: 'oauth2'}), undefined,
    'with the variable set, the stored value was the variable\'s - the start wrote it');
  assert.equal(migrate({stored: 'ldap', override: 'saml'}), undefined, 'an override already made stays');
  // Once: the flag is set whatever the outcome, so clearing the override later
  // is not undone by the next start.
  const settings = read('server/models/settings.js');
  const body = settings.slice(settings.indexOf('export async function applyDefaultAuthenticationMethod'));
  assert.match(body, /defaultAuthenticationMethodMigrated !== true/);
  assert.match(body, /const set = \{ 'loginOptions\.defaultAuthenticationMethodMigrated': true \}/);
});

test('wekan-ldap binds with the password from LDAP_AUTHENTIFICATION_PASSWORD_FILE', () => {
  const vm = require('node:vm');
  const dir = fs.mkdtempSync(path.join(ROOT, '.tools', 'tmp', 'ldapsecret-'));
  try {
    const file = path.join(dir, 'ldap_auth_password');
    fs.writeFileSync(file, 's3cr3t-from-docker-secret\n', {mode: 0o600});
    const env = {LDAP_HOST: 'ldap.example', LDAP_AUTHENTIFICATION: 'true', LDAP_AUTHENTIFICATION_PASSWORD_FILE: file};
    const ldapDir = path.join(ROOT, 'packages/wekan-ldap/server');
    const context = vm.createContext({process: {env}, Buffer, console,
      Log: {info() {}, warn() {}, error() {}, debug() {}}, log_debug() {}, log_info() {},
      normalizeLdapEncryption: () => ({mode: 'off'}),
      ...require(path.join(ldapDir, 'groupFilterConfig')), ...require(path.join(ldapDir, 'userCredentials'))});
    context.__wekanAuthEnv = name => resolveAuthEnv(name, {}, env);
    vm.runInContext(read('packages/wekan-ldap/server/ldap.js').replace(/^import[\s\S]*?;\n/gm, '')
      .replace(/export function /g, 'function ').replace('export default class LDAP', 'class LDAP')
      + '\nglobalThis.LDAP=LDAP;', context);
    const options = new context.LDAP().options;
    assert.equal(options.Authentication_Password, 's3cr3t-from-docker-secret');
    assert.ok(!Object.values(env).includes('s3cr3t-from-docker-secret'), 'and the password was never put in the environment');
  } finally {
    fs.rmSync(dir, {recursive: true, force: true});
  }
});
