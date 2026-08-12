'use strict';

// The WeKan Helm chart (wekan/charts), which lives beside this repo in
// .tools/charts and is cloned by build.sh.
// Run: node tests/chartsFerretdb.test.cjs
//
// charts#54 "wrong MONGO_URL": the chart built the database address out of names
// a DIFFERENT chart happened to use. `_helpers.tpl` assembled Bitnami's per-pod
// StatefulSet DNS -
//
//   mongodb://<release>-mongodb-0.<release>-mongodb-headless:27017/wekan
//
// - while the MongoDB chart it actually depended on (groundhog2k) creates
// `<release>-mongodb` and `<release>-mongodb-internal`. So WeKan dialled a host
// that does not exist:
//
//   MongoNetworkError: getaddrinfo ENOTFOUND wekan-mongodb-0.wekan-mongodb
//
// charts#55 "Helm chart based on FerretDB instead of MongoDB": WeKan itself has
// moved to FerretDB, and the chart had not.
//
// One change answers both. The database is FerretDB, defined BY the chart
// (templates/ferretdb-*.yaml), so the Service in MONGO_URL is the Service the
// chart creates - there is nothing left to guess about somebody else's naming.
//
// This suite is here rather than in the charts repository because that repository
// has no test runner, and because the settings being checked are WeKan's own: the
// URL parameter WeKan needs (#6582), and the environment WeKan's docker-compose.yml
// runs FerretDB with. It SKIPS when the clone is absent rather than passing
// quietly.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const CHART = path.join(repoRoot, '.tools/charts/wekan');
const present = fs.existsSync(path.join(CHART, 'Chart.yaml'));

let passed = 0;
let skipped = 0;
function test(name, fn) {
  if (!present) { skipped += 1; console.log('  -- skipped (no .tools/charts clone) -', name); return; }
  fn(); passed += 1; console.log('  ok -', name);
}
const read = rel => fs.readFileSync(path.join(CHART, rel), 'utf8');

console.log('chartsFerretdb:');

test('the chart installs FerretDB, and no longer depends on a MongoDB chart', () => {
  const chart = read('Chart.yaml');
  assert.ok(!/repository: https:\/\/groundhog2k/.test(chart),
    'the dependency whose naming the URL was guessed from must be gone');
  assert.ok(!/^dependencies:/m.test(chart.replace(/^#.*$/gm, '')),
    'and no other chart may take its place without this test being reconsidered');
  assert.ok(fs.existsSync(path.join(CHART, 'templates/ferretdb-statefulset.yaml')),
    'FerretDB is defined by this chart');
  assert.ok(fs.existsSync(path.join(CHART, 'templates/ferretdb-service.yaml')),
    'including the Service its URL names');
});

test('the image is the WeKan FerretDB, from a registry that publishes it', () => {
  const values = read('values.yaml');
  const at = values.indexOf('\nferretdb:');
  assert.notStrictEqual(at, -1, 'there is a ferretdb section');
  const section = values.slice(at, at + 800);
  assert.ok(/repository: ghcr\.io\/wekan\/ferretdb/.test(section),
    'the default is the GHCR image');
  assert.ok(/tag: latest/.test(section));
  const statefulset = read('templates/ferretdb-statefulset.yaml');
  for (const registry of ['ghcr.io/wekan/ferretdb', 'quay.io/wekan/ferretdb', 'wekanteam/ferretdb']) {
    assert.ok(statefulset.includes(registry),
      `${registry} must be named as an alternative - wekan/FerretDB pushes to all three, `
      + 'so a cluster that cannot reach one is not stuck');
  }
});

test('the URL names the Service this chart creates - charts#54', () => {
  const helpers = read('templates/_helpers.tpl');
  const code = helpers.replace(/\{\{\/\*[\s\S]*?\*\/\}\}/g, '');   // comments out
  assert.ok(!/-mongodb-headless|mongodb-\{\{|\$release\}\}-mongodb-/.test(code),
    'no per-pod StatefulSet DNS may be assembled here again');
  assert.ok(/define "wekan\.ferretdb\.fullname"/.test(code),
    'the Service name comes from a helper this chart owns');
  assert.ok(/printf "%s-ferretdb" \.Release\.Name/.test(code),
    'and it is the name templates/ferretdb-service.yaml uses');
  const service = read('templates/ferretdb-service.yaml');
  assert.ok(/name: \{\{ template "wekan\.ferretdb\.fullname" \. \}\}/.test(service),
    'the two must be the same name, which is the whole fix');
});

test('directConnection=true is in the URL - wekan/wekan#6582', () => {
  // Without it the driver does replica-set discovery, drops the host in the URL
  // and dials the address FerretDB advertises: 0.0.0.0:27017, which inside the
  // WeKan pod is the WeKan pod.
  const helpers = read('templates/_helpers.tpl');
  const code = helpers.replace(/\{\{\/\*[\s\S]*?\*\/\}\}/g, '');
  assert.ok(/directConnection=true/.test(code), 'the computed URL sets it');
  assert.ok(/contains "directConnection" \$external/.test(code),
    'an external URL that already sets it is left alone');
  assert.ok(/contains "\?" \$external/.test(code),
    'and one with other parameters gets & rather than a second ?');
});

test('the WeKan environment matches what docker-compose.yml runs FerretDB with', () => {
  // The chart used to ship the MongoDB settings - oplog reactivity and a
  // MONGO_OPLOG_URL - which are wrong for FerretDB: it has no change streams, and
  // its v1 OpLog on SQLite pins the CPU (wekan/wekan#6503, #6480, #6481).
  const values = read('values.yaml');
  const envBlock = values.slice(values.indexOf('\nenv:'), values.indexOf('## EVERY OTHER SETTING'));
  const active = [...envBlock.matchAll(/^  - name: "([A-Z_0-9]+)"\n    value: "([^"]*)"/gm)]
    .map(m => [m[1], m[2]]);
  const byName = Object.fromEntries(active);
  assert.strictEqual(byName.METEOR_REACTIVITY_ORDER, 'polling',
    'FerretDB has no MongoDB change streams');
  assert.strictEqual(byName.DEFAULT_METEOR_REACTIVITY_ORDER, 'polling');
  assert.strictEqual(byName.DDP_TRANSPORT, 'sockjs', 'uws does not work on s390x');
  assert.strictEqual(byName.WRITABLE_PATH, '/data', 'attachments and avatars');
  assert.strictEqual(byName.WITH_API, 'true', 'Export Board needs it');
  assert.ok(!('MONGO_OPLOG_URL' in byName),
    'setting it makes Meteor tail an OpLog whatever the reactivity order says');
  assert.ok(!('MONGO_URL' in byName),
    'the chart computes MONGO_URL; a second one here is the duplicate-env bug of '
    + 'charts#47 and it would also bypass charts#54\'s fix');
});

test('every setting docker-compose.yml documents is in values.yaml', () => {
  // "All remaining settings" means all of them: values.yaml carries the whole
  // reference, commented, so nobody has to read a compose file to find out what
  // WeKan takes.
  const compose = fs.readFileSync(path.join(repoRoot, 'docker-compose.yml'), 'utf8');
  const values = read('values.yaml');
  const inCompose = new Set(
    [...compose.matchAll(/^\s*#?\s*-\s+([A-Z][A-Z_0-9]{2,})=/gm)].map(m => m[1]));
  assert.ok(inCompose.size > 100, `only found ${inCompose.size} settings in docker-compose.yml`);
  const missing = [...inCompose].filter(name => !values.includes(`"${name}"`));
  assert.deepStrictEqual(missing, [],
    'these settings are documented for Docker users and not for Helm users');
});

test('one FerretDB replica, and the reason is written down', () => {
  const statefulset = read('templates/ferretdb-statefulset.yaml');
  assert.ok(/replicas: 1/.test(statefulset));
  assert.ok(/single writer|corruption/i.test(statefulset),
    'a reader who wants two replicas has to find out here why there is one: '
    + 'FerretDB v1 on SQLite is one writer over one data directory');
});

test('the database keeps its data across restarts (negative)', () => {
  const statefulset = read('templates/ferretdb-statefulset.yaml');
  assert.ok(/volumeClaimTemplates|persistentVolumeClaim/.test(statefulset),
    'an emptyDir here would lose every board on a pod restart');
  assert.ok(/existingClaim/.test(statefulset),
    'and an admin must be able to bring their own PVC');
  const values = read('values.yaml');
  assert.ok(/accessMode: ReadWriteOnce/.test(values));
});

test('upgrading from the MongoDB chart does not lose the old database', () => {
  const values = read('values.yaml');
  assert.ok(/externalDatabase/.test(values),
    'an existing MongoDB has to be usable, or upgrading is a data-loss event');
  assert.ok(/mongodb:\n\s+enabled: false\n\s+url: ""/.test(values),
    'the old mongodb.url must still be readable, so an existing values.yaml keeps working');
  const helpers = read('templates/_helpers.tpl');
  assert.ok(/index \.Values "mongodb" "url"/.test(helpers),
    'and the helper has to actually read it');
  const readme = read('README.md');
  assert.ok(/mongodump/.test(readme) && /<release>-mongodb:27017/.test(readme),
    'the README has to say both ways out: keep the MongoDB, or move the data');
});

console.log(`\nchartsFerretdb: ${passed} tests passed`
  + (skipped ? `, ${skipped} skipped (no .tools/charts clone)` : ''));
