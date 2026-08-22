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

test('the default image is one of the registries that publish it, publicly', () => {
  // WHAT CHANGED, and why this assertion did with it: for a day this said the
  // default must NOT be the GHCR one. That was right at the time - a GHCR package
  // is private until somebody makes it public, the wekan org had public packages
  // disabled so the setting was greyed out, and an anonymous pull answered 403.
  // Artifact Hub reported it as "image not found (package wekan:10.86.0)" and a
  // cluster would have met ImagePullBackOff. The org policy and the package were
  // then made public, so GHCR is the default again, beside ghcr.io/wekan/wekan.
  //
  // What is pinned is the rule that outlives either state: the default is one of
  // the three registries wekan/FerretDB actually pushes to, and the file says
  // which of them can be pulled - so a private package is a documented fact
  // rather than a surprise in somebody's cluster.
  const PUBLISHED = ['ghcr.io/wekan/ferretdb', 'quay.io/wekan/ferretdb', 'wekanteam/ferretdb'];
  const values = read('values.yaml');
  const at = values.indexOf('\nferretdb:');
  assert.notStrictEqual(at, -1, 'there is a ferretdb section');
  const section = values.slice(at, at + 3000);
  const repo = (/^    repository: (\S+)/m.exec(section) || [])[1];
  assert.ok(PUBLISHED.includes(repo),
    `the default is ${repo}, which is not one of the registries wekan/FerretDB pushes to`);
  assert.ok(/tag: latest/.test(section));
  const statefulset = read('templates/ferretdb-statefulset.yaml');
  for (const registry of PUBLISHED) {
    assert.ok(statefulset.includes(registry),
      `${registry} must be named - all three exist, and which of them a cluster can `
      + 'reach is exactly what a reader needs to know');
  }
  assert.ok(/private|ImagePullBackOff/i.test(statefulset),
    'and the comment has to keep the story of the private package: it is the first '
    + 'thing to check when a pull of the default fails');
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

test('every FerretDB-specific setting says what it would be on MongoDB', () => {
  // Somebody reading values.yaml is usually deciding between the two, or moving
  // from one to the other. The comparison belongs where they are editing, not
  // only in a README - and each pairing here is a real difference between
  // WeKan's own docker-compose.yml and docker-compose-mongodb-v7.yml.
  const values = read('values.yaml');
  const envBlock = values.slice(values.indexOf('\nenv:'), values.indexOf('## EVERY OTHER SETTING'));
  for (const [setting, mongoValue] of [
    ['METEOR_REACTIVITY_ORDER', 'changeStreams,oplog,polling'],
    ['DDP_TRANSPORT', 'uws'],
    ['MONGO_URL', 'mongodb://wekandb:27017/wekan'],
    ['MONGO_OPLOG_URL', 'replicaSet=rs0'],
  ]) {
    assert.ok(envBlock.includes(setting), `${setting} is not discussed at all`);
    assert.ok(envBlock.includes(mongoValue),
      `${setting} does not say what it is on MongoDB (expected to find ${mongoValue})`);
  }
  assert.ok(/ON MONGODB/.test(envBlock),
    'the MongoDB side has to be labelled, or the reader has to guess which value is which');
  assert.ok(/docker-compose-mongodb-v7\.yml/.test(values),
    'and the file those values come from must be named');
});

test('the MongoDB image the chart used to install is still named', () => {
  // For anyone reading an older values.yaml, or going back to it: the chart
  // installed Docker Hub's official mongo image, pinned to 7 because WeKan needs
  // 7. That is not obvious from a chart that no longer mentions MongoDB.
  const statefulset = read('templates/ferretdb-statefulset.yaml');
  const values = read('values.yaml');
  assert.ok(/docker\.io\/library\/mongo/.test(statefulset),
    'the registry it came from - beside the three FerretDB ones');
  assert.ok(/7\.0\.34|mongo:7/.test(statefulset), 'and the version that was pinned');
  assert.ok(/docker\.io\/library\/mongo/.test(values),
    'values.yaml names it too, next to the image that replaced it');
});

test('production deployment notes are linked where they are needed', () => {
  const link = 'docs/Platforms/FOSS/Container/Docker/Meteor3';
  for (const file of ['values.yaml', 'README.md', 'templates/_helpers.tpl']) {
    assert.ok(read(file).includes(link),
      `${file} does not point at the production notes`);
  }
  // The link has to be to something that exists.
  assert.ok(fs.existsSync(path.join(repoRoot, link)),
    'the linked directory must be in this repository');
  assert.ok(fs.existsSync(path.join(repoRoot, link, 'README.md')),
    'and have something to read at the top of it');
});

// ── the release path ────────────────────────────────────────────────────────
// These run whether or not the charts clone is present: they are about THIS
// repository's release scripts, which are what decide that the next WeKan
// release publishes the FerretDB chart rather than something else.
function releaseTest(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test('the chart declares what is new in it, and which images it runs', () => {
  // "A chart version with no changelog is a version nobody can tell apart from
  // the one before it" - and an images list the scanner has to INFER is what
  // produced "error scanning image ghcr.io/wekan/ferretdb:latest" for an image
  // the chart no longer uses. Both are written by the release, from release facts.
  const chart = read('Chart.yaml');
  assert.ok(/^annotations:/m.test(chart), 'Artifact Hub reads these from the chart');
  assert.ok(/artifacthub\.io\/changes:/.test(chart), 'what this version is');
  assert.ok(/artifacthub\.io\/images:/.test(chart), 'and what it runs');
  const version = (/^appVersion: "([^"]+)"/m.exec(chart) || [])[1];
  assert.ok(version, 'the chart states its WeKan version');
  assert.ok(chart.includes(`ghcr.io/wekan/wekan:v${version}`),
    'the declared WeKan image must be THIS version, not the one before it');
  assert.ok(chart.includes(`releases/tag/v${version}`),
    'and the changelog link must point at that release');
  // The declared database image has to be the one values.yaml actually uses.
  const values = read('values.yaml');
  const at = values.indexOf('\nferretdb:');
  const repo = (/^    repository: (\S+)/m.exec(values.slice(at, at + 2000)) || [])[1];
  const tag = (/^    tag: (\S+)/m.exec(values.slice(at, at + 2000)) || [])[1];
  assert.ok(chart.includes(`${repo}:${tag}`),
    `Chart.yaml declares a database image that values.yaml does not use (${repo}:${tag})`);
});

releaseTest('the release writes those annotations, so they cannot go stale', () => {
  const script = fs.readFileSync(path.join(repoRoot, 'releases/release-charts.sh'), 'utf8');
  assert.ok(/artifacthub\.io\/changes/.test(script) && /artifacthub\.io\/images/.test(script),
    'both are written at release time');
  assert.ok(/releases\/tag\/v\{version\}/.test(script),
    'the changelog link is built from the version being released');
  assert.ok(/CHART_VALUES/.test(script) && /repository: /.test(script),
    'the database image is READ from values.yaml, not repeated - a declaration '
    + 'that can drift from what is pulled is worse than none');
});

releaseTest('a release changes only the version numbers, so it ships whatever main has', () => {
  const script = fs.readFileSync(path.join(repoRoot, 'releases/release-charts.sh'), 'utf8');
  const seds = [...script.matchAll(/^sedi -E "([^"]+)"/gm)].map(m => m[1]);
  assert.strictEqual(seds.length, 3,
    'three substitutions: appVersion, the chart version, and the WeKan image tag. '
    + 'A fourth would be something else being rewritten at release time');
  assert.ok(seds.some(s => s.includes('^appVersion')));
  assert.ok(seds.some(s => s.includes('^version: [0-9]')),
    'anchored at column 0, so an indented dependency version is not touched');
  const tagSed = seds.find(s => s.includes('tag: v'));
  assert.ok(tagSed, 'the WeKan image tag is bumped');
  // The one that matters for FerretDB: `tag: latest` must not match this
  // pattern, or a WeKan version bump would rewrite the database image tag.
  assert.ok(!/tag: \(v\?\|latest\)|latest/.test(tagSed),
    'the tag pattern must not be able to match "tag: latest"');
  const pattern = new RegExp(tagSed.split('|')[1]);
  assert.ok(!pattern.test('    tag: latest'), 'and it does not, in fact, match it');
  assert.ok(pattern.test('  tag: v10.85'), 'while it does match the WeKan tag');
});

releaseTest('the chart is published only for a version whose image exists', () => {
  const script = fs.readFileSync(path.join(repoRoot, 'releases/release-charts.sh'), 'utf8');
  assert.ok(/image_exists/.test(script),
    'a chart is a pointer to an image; publishing one for a version with no image '
    + 'is an install that fails at the pull');
  assert.ok(/ghcr\.io\/wekan\/wekan/.test(script));
});

releaseTest('a package whose image is gone cannot come back into the index', () => {
  // An Artifact Hub scan report, 2026-08-11:
  //   error scanning image ghcr.io/wekan/wekan:v9.62: image not found (package wekan:9.62.0)
  // plus five more WeKan images and a Bitnami MongoDB subchart image Bitnami has
  // deleted. Those entries were taken out of the index by reindex-charts.py,
  // which asks the registry about every image a package pins - but the packages
  // stayed on the branch, and `helm repo index` indexes what it FINDS. One
  // backfill run would have put every one of them back.
  const backfill = fs.readFileSync(path.join(repoRoot, 'releases/backfill-charts.sh'), 'utf8');
  const code = backfill.split('\n').filter(l => !l.trim().startsWith('#')).join('\n');
  assert.ok(!/helm repo index/.test(code),
    'the index may not be rebuilt by a tool that cannot tell a live image from a '
    + 'deleted one - that is what mailed the repository owner every scan');
  assert.ok(/reindex-charts\.py"? --write/.test(code),
    'it is rebuilt by the one that checks, which is also what release-charts.sh uses');
  const reindex = fs.readFileSync(path.join(repoRoot, 'releases/reindex-charts.py'), 'utf8');
  assert.ok(/def check_images\(/.test(reindex) && /image not found/.test(reindex),
    'and that tool has to actually probe the registry');
  assert.ok(/treated as\s*"?\s*\n?\s*f?"?PRESENT, never as missing/.test(reindex)
    || /never as missing/.test(reindex),
    'a registry that cannot be reached must not be read as "image gone" - that '
    + 'would drop good entries on a network hiccup');
});

test('the official pod budget fits the container heap selected at startup', () => {
  // #6606: 1 GiB was the chart's own default, not a reporter's unusually low
  // choice. Node 24 derived a ~640 MiB heap from it and v10.96+ exhausted that
  // while loading. The image gives V8 60%, budgets 20% for Go, and retains 20% for native memory, so
  // a 2 GiB limit means a 1228 MiB heap rather than a crash-looping 640 MiB one.
  const values = read('values.yaml');
  const resources = values.slice(values.indexOf('\nresources:'), values.indexOf('\nreadinessProbe:'));
  assert.ok(/requests:\s*\n\s+memory: 512Mi/.test(resources),
    'the scheduler request must reflect that this is not a 128 MiB process');
  assert.ok(/limits:\s*\n\s+memory: 2Gi/.test(resources),
    'the default limit must leave room for a 1228 MiB V8 heap plus native memory');
});

releaseTest('backfilling old releases does not hand them today\'s FerretDB chart', () => {
  // release-all-missing.yml can fill holes in the index, and it packages the
  // CURRENT chart source with an old release's numbers on it. Today's source
  // installs FerretDB, which WeKan did not default to until v10.00 - so a chart
  // for v6.09 built this way would be an install nobody has ever run, published
  // under a version number that says it is that release's chart.
  const backfill = fs.readFileSync(path.join(repoRoot, 'releases/backfill-charts.sh'), 'utf8');
  assert.ok(/CHART_FERRETDB_FLOOR/.test(backfill), 'there is a floor, and it is overridable');
  assert.ok(/"10\.00"/.test(backfill), 'and it is the release FerretDB became the default in');
  assert.ok(/predates/.test(backfill), 'versions below it are reported, not silently dropped');
  assert.ok(/keep is never rebuilt|never rebuilt/.test(backfill),
    'and a version that already HAS a package keeps it - old entries are not '
    + 'touched by any of this');
});

console.log(`\nchartsFerretdb: ${passed} tests passed`
  + (skipped ? `, ${skipped} skipped (no .tools/charts clone)` : ''));
