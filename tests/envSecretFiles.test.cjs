'use strict';
// #5724, maintainer decision of 2026-10-08: MAIL_SERVICE_PASSWORD_FILE,
// MONGO_PASSWORD_FILE and S3_SECRET_FILE were offered on every platform and
// read by nothing. They are replaced by files WeKan does read:
//   - MAIL_URL_FILE and S3_SECRET_KEY_FILE, by the server at start
//     (models/lib/envSecretFiles.js, called first in server/main.js);
//   - MONGO_URL_FILE, by every launcher, because Meteor connects with MONGO_URL
//     before any application code runs.
//
// Run: node tests/envSecretFiles.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const { applySecretFiles, retiredSecretFiles, RETIRED } = require('../models/lib/envSecretFiles');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('envSecretFiles:');

const TMP = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'wekan-secret-files-'));
const file = (name, content) => { const p = path.join(TMP, name); fs.writeFileSync(p, content); return p; };

test('a file fills its variable, one trailing line break dropped', () => {
  const env = {
    MAIL_URL_FILE: file('mail', 'smtps://u:p%40ss@mail.example:465/\n'),
    S3_SECRET_KEY_FILE: file('s3', 'abc DEF/123\r\n'),
  };
  assert.deepEqual(applySecretFiles(env), { MAIL_URL: 'file', S3_SECRET_KEY: 'file' });
  assert.equal(env.MAIL_URL, 'smtps://u:p%40ss@mail.example:465/');
  assert.equal(env.S3_SECRET_KEY, 'abc DEF/123', 'inner spaces are part of the secret');
});

test('the variable wins over its file, and an unset pair stays unset', () => {
  const env = { MAIL_URL: 'smtp://env/', MAIL_URL_FILE: file('mail2', 'smtp://file/') };
  assert.deepEqual(applySecretFiles(env), { MAIL_URL: 'env', S3_SECRET_KEY: 'unset' });
  assert.equal(env.MAIL_URL, 'smtp://env/');
  assert.equal(env.S3_SECRET_KEY, undefined);
});

test('negative: a missing or empty file leaves the variable unset and says why, never the content', () => {
  const env = { MAIL_URL_FILE: path.join(TMP, 'nope'), S3_SECRET_KEY_FILE: file('empty', '\n') };
  const report = applySecretFiles(env);
  assert.deepEqual(report, { MAIL_URL: 'file-error:ENOENT', S3_SECRET_KEY: 'file-error:empty' });
  assert.equal(env.MAIL_URL, undefined);
  assert.equal(env.S3_SECRET_KEY, undefined);
  const secret = { S3_SECRET_KEY_FILE: file('s3b', 'TOPSECRET') };
  assert.ok(!JSON.stringify(applySecretFiles(secret)).includes('TOPSECRET'));
});

test('a retired name still set is reported with its replacement', () => {
  assert.deepEqual(retiredSecretFiles({ MONGO_PASSWORD_FILE: '/run/secrets/mongo_password', S3_SECRET_FILE: '' }),
    [{ name: 'MONGO_PASSWORD_FILE', replacement: 'MONGO_URL_FILE' }]);
  assert.deepEqual(retiredSecretFiles({}), []);
});

test('the server applies the files before any application code', () => {
  const main = read('server/main.js');
  const at = main.indexOf('applySecretFiles(process.env)');
  assert.ok(at !== -1 && at < main.indexOf("require('/server/imports')"));
  assert.ok(at < main.indexOf("require('/imports/collectionHelpers')"));
  assert.doesNotMatch(main, /console\.\w+\([^)]*process\.env\.(MAIL_URL|S3_SECRET_KEY)\b/, 'never logs a value');
});

// The launchers. The Docker entrypoint's block is run for real; the others
// must carry the same rule.
const LAUNCHERS = ['releases/ferretdb/wekan-entrypoint.sh', 'snap-src/bin/wekan-control', 'start-wekan.sh'];
test('every launcher reads MONGO_URL_FILE before starting WeKan', () => {
  for (const rel of LAUNCHERS) {
    const src = read(rel);
    assert.match(src, /if \[ -z "\$\{MONGO_URL:-\}" \] && \[ -n "\$\{MONGO_URL_FILE:-\}" \]; then/, rel);
    assert.match(src, /MONGO_URL="\$\(cat "\$MONGO_URL_FILE"\)"/, rel);
  }
  const bat = read('start-wekan.bat');
  const block = bat.indexOf('if not defined MONGO_URL if defined MONGO_URL_FILE');
  assert.ok(block !== -1 && block < bat.indexOf('\nnode main.js'));
  assert.match(bat, /set \/p MONGO_URL=<"%MONGO_URL_FILE%"/);
  const entry = read('releases/ferretdb/wekan-entrypoint.sh');
  assert.ok(entry.indexOf('MONGO_URL_FILE (#5724)') < entry.indexOf('want_ferret=false'),
    'before the backend choice, which looks at MONGO_URL');
  const start = read('start-wekan.sh');
  assert.ok(start.indexOf('MONGO_URL="$(cat "$MONGO_URL_FILE")"') < start.indexOf('exec node main.js"'));
});

const bashBlock = () => {
  const src = read('releases/ferretdb/wekan-entrypoint.sh');
  return src.slice(src.indexOf('# MONGO_URL_FILE (#5724)'), src.indexOf('FERRETDB_BIN="/build/ferretdb"'));
};
const runBlock = env => spawnSync('bash', ['-c', `set -euo pipefail\n${bashBlock()}\nprintf '%s' "$MONGO_URL"`],
  { env: { PATH: process.env.PATH, ...env }, encoding: 'utf8' });

test('Docker entrypoint, for real: the file gives MONGO_URL, the variable still wins', () => {
  const url = 'mongodb://wekan:p@ss@db:27017/wekan';
  const fromFile = runBlock({ MONGO_URL_FILE: file('mongo', `${url}\n`) });
  assert.equal(fromFile.status, 0, fromFile.stderr);
  assert.equal(fromFile.stdout.split('\n').pop(), url);
  assert.doesNotMatch(fromFile.stdout.split('\n')[0], /p@ss/, 'the log line does not print it');
  const fromEnv = runBlock({ MONGO_URL: 'mongodb://env/wekan', MONGO_URL_FILE: file('mongo2', 'mongodb://file/x') });
  assert.equal(fromEnv.stdout, 'mongodb://env/wekan');
});

test('negative, for real: an unreadable or empty MONGO_URL_FILE stops the start instead of using a default', () => {
  for (const env of [{ MONGO_URL_FILE: path.join(TMP, 'missing') }, { MONGO_URL_FILE: file('blank', '\n') }]) {
    const result = runBlock(env);
    assert.equal(result.status, 1, JSON.stringify(env));
    assert.match(result.stderr, /^ERROR: MONGO_URL_FILE=/);
  }
});

test('the snap log masks a password in MONGO_URL', () => {
  const line = read('snap-src/bin/wekan-control').split('\n').find(l => l.startsWith('echo -e "MONGO_URL='));
  assert.ok(line, 'the MONGO_URL log line');
  const out = execFileSync('bash', ['-c', line], { env: { PATH: process.env.PATH, MONGO_URL: 'mongodb://wekan:hunter2@db:27017/wekan' }, encoding: 'utf8' });
  assert.equal(out.trim(), 'MONGO_URL=mongodb://wekan:***@db:27017/wekan');
});

// Negative, whole tree: the retired names are gone from every platform and
// doc; only the module that warns about them, and the README sentence saying
// they were never read, may name them.
test('negative: no platform or doc offers a retired name any more', () => {
  const tracked = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' }).split('\n')
    .filter(f => f && !f.startsWith('old-CHANGELOG/') && !f.startsWith('imports/i18n/') && !f.startsWith('stacksmith/')
      && !['CHANGELOG.md', 'models/lib/envSecretFiles.js', 'tests/envSecretFiles.test.cjs'].includes(f)
      && /\.(js|cjs|mjs|sh|bat|yml|yaml|md|json)$|^Dockerfile|snap-src\/bin\//.test(f));
  const names = [...Object.keys(RETIRED), 'mongo-password-file', 's3-secret-file', 'mail-service-password-file'];
  for (const rel of tracked) {
    if (!fs.existsSync(path.join(ROOT, rel))) continue;
    const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    for (const name of names) {
      if (!src.includes(name)) continue;
      assert.ok(rel === 'secrets/README.md' && /were never read/.test(src), `${rel} still offers ${name}`);
    }
  }
  for (const [platform, src] of [['Dockerfile', read('Dockerfile')], ['snap', read('snap-src/bin/config')], ['compose', read('docker-compose.yml')]]) {
    for (const name of ['MONGO_URL_FILE', 'MAIL_URL_FILE', 'S3_SECRET_KEY_FILE']) {
      assert.ok(src.includes(name), `${platform} offers ${name}`);
    }
  }
});

fs.rmSync(TMP, { recursive: true, force: true });
console.log(`\nenvSecretFiles: ${passed} tests passed`);
