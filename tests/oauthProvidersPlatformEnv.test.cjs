'use strict';

// The Meteor accounts login providers (Google, GitHub, Facebook, Twitter,
// Meteor Developer, Weibo, Meetup) and passwordless login are configured with
// OAUTH_<PROVIDER>_* / OAUTH_PROVIDERS_* / PASSWORDLESS_ENABLED environment
// variables. A setting that exists in the code but not in the place a user
// configures WeKan is invisible, so this pins that every one of those variables
// is documented - commented out or defaulted - on EVERY platform where the
// OAUTH2_* and SAML_* variables already are:
//
//   * docker-compose.yml and each FerretDB v1 backend variant (whose WeKan
//     service must stay identical - tests/dockerComposeBackends.test.cjs);
//   * the Dockerfile ENV block, with the *_ENABLED ones defaulting to false;
//   * start-wekan.sh and start-wekan.bat;
//   * the Snap's config (keys list + DESCRIPTION_/DEFAULT_/KEY_ triple, the KEY_
//     being the kebab-case `snap set` name) and its wekan-help;
//   * the Sandstorm package definition;
//
// and that the docs pages exist and are linked from the docs index.
//
// Run: node tests/oauthProvidersPlatformEnv.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const PROVIDERS = {
  GOOGLE: ['google', 'CLIENT_ID'],
  GITHUB: ['github', 'CLIENT_ID'],
  FACEBOOK: ['facebook', 'APP_ID'],
  TWITTER: ['twitter', 'CONSUMER_KEY'],
  METEOR_DEVELOPER: ['meteor-developer', 'CLIENT_ID'],
  WEIBO: ['weibo', 'CLIENT_ID'],
  MEETUP: ['meetup', 'CLIENT_ID'],
};

const VARS = [];
for (const [p, [, idVar]] of Object.entries(PROVIDERS)) {
  VARS.push(`OAUTH_${p}_ENABLED`, `OAUTH_${p}_${idVar}`, `OAUTH_${p}_SECRET`, `OAUTH_${p}_SECRET_FILE`);
}
VARS.push('OAUTH_PROVIDERS_LOGIN_STYLE', 'OAUTH_PROVIDERS_MERGE_EXISTING_USERS', 'PASSWORDLESS_ENABLED');
const ENABLED_VARS = VARS.filter(v => v.endsWith('_ENABLED'));

const COMPOSE_FILES = [
  'docker-compose.yml',
  'docker-compose-ferretdb-v1-postgresql.yml',
  'docker-compose-ferretdb-v1-mysql.yml',
  'docker-compose-ferretdb-v1-mariadb.yml',
  'docker-compose-ferretdb-v1-sap-hana.yml',
  'docker-compose-mongodb-v7.yml',
  'docker-compose-ferretdb-v2-postgresql.yml',
];

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

console.log('oauthProvidersPlatformEnv:');

test('every compose file lists every variable as a commented "#- VAR=" line', () => {
  for (const file of COMPOSE_FILES) {
    const src = read(file);
    for (const v of VARS) {
      assert.ok(new RegExp(`^\\s*#- ${esc(v)}=`, 'm').test(src), `${file}: missing #- ${v}=`);
    }
    // The comments say the callback URL and that the Admin Panel wins.
    for (const [, [service]] of Object.entries(PROVIDERS)) {
      assert.ok(src.includes(`<ROOT_URL>/_oauth/${service}`), `${file}: callback URL for ${service}`);
    }
    assert.ok(/Admin Panel \/ People \/ Login/.test(src), `${file}: must say the Admin Panel overrides these`);
  }
});

test('the Dockerfile ENV block defaults every variable, *_ENABLED to false', () => {
  for (const file of ['Dockerfile', '.devcontainer/Dockerfile']) {
    const src = read(file);
    for (const v of VARS) {
      assert.ok(new RegExp(`^\\s+${esc(v)}=`, 'm').test(src), `${file}: missing ENV ${v}`);
    }
    for (const v of ENABLED_VARS) {
      assert.ok(new RegExp(`^\\s+${esc(v)}=false \\\\$`, 'm').test(src), `${file}: ${v} must default to false`);
    }
    assert.ok(/^\s+OAUTH_PROVIDERS_LOGIN_STYLE="popup" \\$/m.test(src), `${file}: login style defaults to popup`);
    assert.ok(/^\s+OAUTH_PROVIDERS_MERGE_EXISTING_USERS=false \\$/m.test(src), `${file}: merge defaults to false`);
  }
});

test('start-wekan.sh and start-wekan.bat carry a commented line per variable', () => {
  for (const file of ['start-wekan.sh', 'releases/virtualbox/start-wekan.sh']) {
    const src = read(file);
    for (const v of VARS) {
      assert.ok(new RegExp(`^\\s*#export ${esc(v)}=`, 'm').test(src), `${file}: missing #export ${v}=`);
    }
  }
  const bat = read('start-wekan.bat');
  for (const v of VARS) {
    assert.ok(new RegExp(`^REM SET ${esc(v)}=`, 'm').test(bat), `start-wekan.bat: missing REM SET ${v}=`);
  }
});

test('the Snap config lists every variable with a DESCRIPTION_/DEFAULT_/KEY_ triple', () => {
  const src = read('snap-src/bin/config');
  const keysLine = src.match(/^keys="([^"]*)"/m);
  assert.ok(keysLine, 'snap-src/bin/config: keys="..." list');
  const keys = new Set(keysLine[1].split(/\s+/));
  for (const v of VARS) {
    assert.ok(keys.has(v), `snap config keys list: missing ${v}`);
    const kebab = v.toLowerCase().replace(/_/g, '-');
    assert.ok(new RegExp(`^DESCRIPTION_${esc(v)}=".+"$`, 'm').test(src), `snap config: DESCRIPTION_${v}`);
    assert.ok(new RegExp(`^DEFAULT_${esc(v)}="[^"]*"$`, 'm').test(src), `snap config: DEFAULT_${v}`);
    assert.ok(new RegExp(`^KEY_${esc(v)}="${esc(kebab)}"$`, 'm').test(src), `snap config: KEY_${v}="${kebab}"`);
  }
  for (const v of ENABLED_VARS) {
    assert.ok(new RegExp(`^DEFAULT_${esc(v)}="false"$`, 'm').test(src), `snap config: ${v} defaults to false`);
  }
  assert.ok(/^DEFAULT_OAUTH_PROVIDERS_LOGIN_STYLE="popup"$/m.test(src));
  // The help text names every snap set key.
  const help = read('snap-src/bin/wekan-help');
  for (const v of VARS) {
    const kebab = v.toLowerCase().replace(/_/g, '-');
    assert.ok(help.includes(`snap set $SNAP_INSTANCE_NAME ${kebab}=`), `wekan-help: ${kebab}`);
  }
});

test('the Sandstorm package definition defaults every variable', () => {
  const src = read('sandstorm-pkgdef.capnp');
  for (const v of VARS) {
    assert.ok(new RegExp(`\\(key = "${esc(v)}", value="[^"]*"\\)`).test(src), `sandstorm-pkgdef.capnp: ${v}`);
  }
  for (const v of ENABLED_VARS) {
    assert.ok(src.includes(`(key = "${v}", value="false")`), `sandstorm-pkgdef.capnp: ${v} defaults to false`);
  }
});

test('the Docker secrets scaffolding knows the per-provider secret files', () => {
  const boot = read('stacksmith/user-scripts/boot.sh');
  for (const [p, [service]] of Object.entries(PROVIDERS)) {
    const file = `oauth_${service.replace(/-/g, '_')}_secret`;
    assert.ok(boot.includes(`export OAUTH_${p}_SECRET=$(cat /run/secrets/${file})`), `boot.sh: ${file}`);
  }
  assert.ok(read('secrets/README.md').includes('OAUTH_<PROVIDER>_SECRET_FILE'));
});

test('the docs pages exist, say what each provider needs, and are linked from the index', () => {
  const oauth = read('docs/Features/Login/OAuth-Providers.md');
  for (const [p, [service, idVar]] of Object.entries(PROVIDERS)) {
    assert.ok(oauth.includes(`\`${service}\``), `OAuth-Providers.md: service ${service}`);
    assert.ok(oauth.includes(`OAUTH_${p}_${idVar}`), `OAuth-Providers.md: OAUTH_${p}_${idVar}`);
  }
  assert.ok(oauth.includes('<ROOT_URL>/_oauth/<service>'), 'OAuth-Providers.md: the callback URL');
  for (const v of ['OAUTH_PROVIDERS_LOGIN_STYLE', 'OAUTH_PROVIDERS_MERGE_EXISTING_USERS', 'PASSWORDLESS_ENABLED']) {
    assert.ok(oauth.includes(v), `OAuth-Providers.md: ${v}`);
  }
  assert.ok(/Admin Panel/.test(oauth), 'OAuth-Providers.md: the Admin Panel overrides');
  const pwless = read('docs/Features/Login/Passwordless.md');
  assert.ok(pwless.includes('PASSWORDLESS_ENABLED') && pwless.includes('MAIL_URL'));
  const index = read('docs/README.md');
  assert.ok(index.includes('(./Features/Login/OAuth-Providers.md)'), 'docs/README.md links OAuth-Providers.md');
  assert.ok(index.includes('(./Features/Login/Passwordless.md)'), 'docs/README.md links Passwordless.md');
});

console.log(`\n${passed} passed`);
