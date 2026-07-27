'use strict';

// One WeKan, one set of settings, five FerretDB v1 backends.
//
// The default docker-compose.yml runs FerretDB v1 on its embedded SQLite. The
// same FerretDB can store into PostgreSQL, MySQL, MariaDB or SAP HANA instead, so
// there is a compose file for each - and the whole point is that they differ ONLY
// in the database: the same WeKan image, the same ~700 lines of environment
// (ROOT_URL, MAIL_URL, LDAP, OAuth2, S3, the OpLog notes …) and the same comments
// explaining them. A hand-maintained copy drifts on the first setting someone adds
// to one file, and then a user following the PostgreSQL file gets a WeKan that is
// configured differently from the one the SQLite file gives them.
//
// So this pins the four things that keep them usable:
//   * every backend has a file, and the file is valid, complete compose;
//   * their WeKan service is IDENTICAL to the default file's, line for line;
//   * each says at the top how to start it, naming its own file;
//   * every one of them - and every other docker-compose*.yml - can be started
//     from build.sh and from build.bat.
//
// Run: node tests/dockerComposeBackends.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const DEFAULT_FILE = 'docker-compose.yml';
// backend -> [compose file, the service that stores the data, its image prefix]
const BACKENDS = {
  postgresql: ['docker-compose-ferretdb-v1-postgresql.yml', 'postgres', 'postgres:'],
  mysql: ['docker-compose-ferretdb-v1-mysql.yml', 'mysql', 'mysql:'],
  mariadb: ['docker-compose-ferretdb-v1-mariadb.yml', 'mariadb', 'mariadb:'],
  hana: ['docker-compose-ferretdb-v1-sap-hana.yml', 'hana', 'saplabs/hanaexpress:'],
};

// The WeKan service of a compose file: from "  wekan:" to the end of the services
// block. Compared as text, because what must not drift is the comments as much as
// the values - they are what a user reads when they edit their settings.
function wekanService(file) {
  const src = read(file);
  const at = src.indexOf('\n  wekan:\n');
  assert.ok(at !== -1, `${file}: no wekan service`);
  const end = src.indexOf('\nvolumes:\n', at);
  assert.ok(end !== -1, `${file}: no volumes section after the wekan service`);
  return src.slice(at, end);
}

console.log('dockerComposeBackends:');

test('there is a compose file for every FerretDB v1 backend', () => {
  for (const [backend, [file]] of Object.entries(BACKENDS)) {
    assert.ok(fs.existsSync(path.join(ROOT, file)), `${backend}: ${file} must exist`);
  }
});

test('each stores into its own database, through the right FerretDB handler', () => {
  // The handler name is what FerretDB is actually run with, so a file that says
  // "MySQL" in its name and starts the sqlite handler would be a lie.
  const handlers = { postgresql: 'postgresql', mysql: 'mysql', mariadb: 'mysql', hana: 'hana' };
  for (const [backend, [file, service, image]] of Object.entries(BACKENDS)) {
    const src = read(file);
    assert.ok(new RegExp(`--handler=${handlers[backend]}\\b`).test(src),
      `${file}: must run FerretDB with --handler=${handlers[backend]}`);
    assert.ok(new RegExp(`^  ${service}:$`, 'm').test(src),
      `${file}: must define the ${service} service`);
    assert.ok(new RegExp(`image: ${image.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(src),
      `${file}: the ${service} service must use the ${image} image`);
    // WeKan always talks to FerretDB, never to the database directly.
    assert.ok(/- MONGO_URL=mongodb:\/\/ferretdb:27017\/wekan/.test(src),
      `${file}: WeKan connects to FerretDB, whatever is behind it`);
  }
  // And the default file is still the SQLite one.
  assert.ok(/--handler=sqlite\b/.test(read(DEFAULT_FILE)));
});

test('the WeKan service is the same in every one of them', () => {
  // Not "similar": identical. Every setting a user may edit, and every comment
  // explaining it, must read the same whichever backend they picked.
  const reference = wekanService(DEFAULT_FILE);
  for (const [, [file]] of Object.entries(BACKENDS)) {
    const mine = wekanService(file);
    if (mine !== reference) {
      // Show the first differing line rather than 700 lines of diff.
      const a = reference.split('\n');
      const b = mine.split('\n');
      const i = a.findIndex((l, n) => l !== b[n]);
      assert.fail(`${file}: the wekan service differs from ${DEFAULT_FILE} at line ` +
        `${i + 1} of the service:\n  ${DEFAULT_FILE}: ${a[i]}\n  ${file}: ${b[i]}`);
    }
  }
});

test('each says at the top how to start THAT file', () => {
  for (const [, [file]] of Object.entries(BACKENDS)) {
    const header = read(file).split('\nservices:')[0];
    assert.ok(header.startsWith('# WeKan with FerretDB v1 + '),
      `${file}: the first line must say which database this file is for`);
    for (const cmd of ['up -d', 'logs -f', 'down']) {
      assert.ok(header.includes(`docker compose -f ${file} ${cmd}`),
        `${file}: the header must show "docker compose -f ${file} ${cmd}"`);
    }
    // And it must point at the others, so a reader can find the one they want.
    for (const [, [other]] of Object.entries(BACKENDS)) {
      assert.ok(header.includes(other), `${file}: the header must list ${other}`);
    }
  }
  // The default file needs no -f, and says so.
  const header = read(DEFAULT_FILE).split('\nservices:')[0];
  assert.ok(/no -f is needed/.test(header) && /docker compose up -d/.test(header));
  for (const [, [other]] of Object.entries(BACKENDS)) {
    assert.ok(header.includes(other), `${DEFAULT_FILE}: the header must list ${other}`);
  }
});

test('every compose file in the repo can be started from build.sh and build.bat', () => {
  const files = fs.readdirSync(ROOT)
    .filter(f => /^docker-compose.*\.yml$/.test(f))
    .sort();
  assert.ok(files.length >= 8, `expected every backend to have a file, got ${files.length}`);
  const sh = read('build.sh');
  const bat = read('build.bat');
  // To the function that reads it - the first ")" is inside "(default)".
  const menu = sh.slice(sh.indexOf('DOCKER_DBS=('), sh.indexOf('docker_menu() {'));
  for (const file of files) {
    assert.ok(menu.includes(`|${file}"`), `build.sh's Docker menu must offer ${file}`);
    assert.ok(bat.includes(`set "CF=${file}"`), `build.bat's Docker menu must offer ${file}`);
  }
  // Every menu entry is a file that exists (the other direction).
  for (const m of menu.matchAll(/\|(docker-compose[^"]*\.yml)"/g)) {
    assert.ok(files.includes(m[1]), `build.sh offers ${m[1]}, which does not exist`);
  }
  for (const m of bat.matchAll(/set "CF=(docker-compose[^"]*\.yml)"/g)) {
    assert.ok(files.includes(m[1]), `build.bat offers ${m[1]}, which does not exist`);
  }
});

test('the SAP HANA handler is actually built into the released binaries', () => {
  // `hana` is behind the ferretdb_hana build tag: without it the released binary
  // answers --handler=hana with "unknown handler", which is exactly what the SAP
  // HANA compose file would hit. The fork's build.sh must pass the tag.
  const buildSh = path.join(ROOT, 'FerretDB', 'build.sh');
  if (!fs.existsSync(buildSh)) {
    console.log('     (FerretDB checkout not present - skipping the build-tag check)');
    return;
  }
  const src = fs.readFileSync(buildSh, 'utf8');
  const release = src.slice(src.indexOf('build_ferretdb_target()'));
  assert.ok(/go build [^\n]*-tags ferretdb_hana/.test(release),
    'the per-arch release build must pass -tags ferretdb_hana');
});

console.log(`\n${passed} tests passed`);
