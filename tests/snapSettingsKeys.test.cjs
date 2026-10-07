'use strict';

// wekan/wekan#6746: every WeKan snap service log began with
//   error: snapctl: get which option?
// four times. snap-src/bin/config lists the settings in $keys and maps each one
// to its `snap set` name in KEY_<name>; four SAML settings (SAML_IDP_PROFILE,
// SAML_WANT_RESPONSE_SIGNED, SAML_WANT_ASSERTIONS_SIGNED, SAML_LOGIN_FLOW) were
// added to $keys without a KEY_, so wekan-read-settings ran a bare
// `snapctl get` for them - an error in every log, and settings that
// `snap set wekan saml-login-flow=redirect` could never reach.
//
// Run: node tests/snapSettingsKeys.test.cjs

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const bin = path.join(root, 'snap-src', 'bin');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

function readConfig(configPath) {
  // The path goes in through the environment, never into the script text
  // (CodeQL js/shell-command-injection-from-environment).
  const r = spawnSync('bash', ['-c', `
    source "$SNAP_CONFIG_PATH"
    for k in $keys; do
      kv="KEY_$k"; dv="DEFAULT_$k"; sv="DESCRIPTION_$k"
      printf '%s\\t%s\\t%s\\t%s\\n' "$k" "\${!kv}" "\${!dv+set}" "\${!sv+set}"
    done`], { encoding: 'utf8', env: { ...process.env, SNAP_CONFIG_PATH: configPath } });
  assert.strictEqual(r.status, 0, r.stderr);
  return r.stdout.trim().split('\n').map((line) => {
    const [name, key, hasDefault, hasDescription] = line.split('\t');
    return { name, key, hasDefault, hasDescription };
  });
}

test('every listed setting has a snap key, a default and a description', () => {
  const rows = readConfig(path.join(bin, 'config'));
  assert.ok(rows.length > 200, 'the settings list must have been read');
  const missing = rows.filter((r) => !r.key).map((r) => `KEY_${r.name}`)
    .concat(rows.filter((r) => !r.hasDefault).map((r) => `DEFAULT_${r.name}`))
    .concat(rows.filter((r) => !r.hasDescription).map((r) => `DESCRIPTION_${r.name}`));
  assert.deepStrictEqual(missing, []);
});

test('the SAML settings from #6746 are reachable with snap set', () => {
  const byName = Object.fromEntries(readConfig(path.join(bin, 'config')).map((r) => [r.name, r.key]));
  assert.strictEqual(byName.SAML_IDP_PROFILE, 'saml-idp-profile');
  assert.strictEqual(byName.SAML_WANT_RESPONSE_SIGNED, 'saml-want-response-signed');
  assert.strictEqual(byName.SAML_WANT_ASSERTIONS_SIGNED, 'saml-want-assertions-signed');
  assert.strictEqual(byName.SAML_LOGIN_FLOW, 'saml-login-flow');
});

test('negative: no two settings share a snap key', () => {
  const seen = new Map();
  for (const { name, key } of readConfig(path.join(bin, 'config'))) {
    assert.ok(!seen.has(key), `${name} and ${seen.get(key)} both use ${key}`);
    seen.set(key, name);
  }
});

// Run the real wekan-read-settings against a stand-in snapctl that fails the
// way the real one does when called without a name.
function readSettings(configText) {
  const dir = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'wekan-settings-'));
  try {
    const snap = path.join(dir, 'snap');
    const hostBin = path.join(dir, 'host-bin');
    fs.mkdirSync(path.join(snap, 'bin'), { recursive: true });
    fs.mkdirSync(hostBin);
    fs.copyFileSync(path.join(bin, 'wekan-read-settings'), path.join(snap, 'bin', 'wekan-read-settings'));
    fs.writeFileSync(path.join(snap, 'bin', 'config'), configText);
    fs.writeFileSync(path.join(hostBin, 'snapctl'),
      '#!/bin/bash\n' +
      'if [ "$1" = get ] && [ -z "$2" ]; then echo "error: snapctl: get which option?" >&2; exit 1; fi\n' +
      'if [ "$1" = get ] && [ "$2" = saml-login-flow ]; then echo redirect; fi\n',
      { mode: 0o755 });
    return spawnSync('bash', ['-c', `source "$SNAP/bin/wekan-read-settings"; echo "RESULT=$SAML_LOGIN_FLOW|$UNMAPPED"`], {
      encoding: 'utf8',
      env: { ...process.env, SNAP: snap, SNAP_INSTANCE_NAME: 'wekan', PATH: `${hostBin}:${process.env.PATH}` },
    });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('the real config reads without a single snapctl error, and a set value wins', () => {
  const r = readSettings(fs.readFileSync(path.join(bin, 'config'), 'utf8'));
  assert.strictEqual(r.status, 0, r.stderr);
  assert.doesNotMatch(r.stderr, /get which option/);
  assert.match(r.stdout, /^SAML_LOGIN_FLOW=redirect$/m);
  assert.match(r.stdout, /RESULT=redirect\|$/m);
});

test('negative: a setting listed without a KEY_ falls back to its default, silently', () => {
  const r = readSettings(
    'keys="SAML_LOGIN_FLOW UNMAPPED"\n' +
    'DEFAULT_SAML_LOGIN_FLOW=""\nKEY_SAML_LOGIN_FLOW="saml-login-flow"\nDESCRIPTION_SAML_LOGIN_FLOW="x"\n' +
    'DEFAULT_UNMAPPED="fallback"\nDESCRIPTION_UNMAPPED="x"\n',
  );
  assert.strictEqual(r.status, 0, r.stderr);
  assert.doesNotMatch(r.stderr, /get which option/);
  assert.match(r.stdout, /^UNMAPPED=fallback \(default value\)$/m);
  assert.match(r.stdout, /RESULT=redirect\|fallback$/m);
});

console.log(`\nsnapSettingsKeys: all ${passed} tests passed`);
