'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const ferretPaths = [
  'releases/ferretdb/start-wekan.sh',
  'releases/ferretdb/start-wekan.bat',
  'releases/ferretdb/wekan-entrypoint.sh',
  'docker-compose.yml',
  'docker-compose-ferretdb-v1-postgresql.yml',
  'docker-compose-ferretdb-v1-mysql.yml',
  'docker-compose-ferretdb-v1-mariadb.yml',
  'docker-compose-ferretdb-v1-sap-hana.yml',
];

test('activity pages stay bounded while polling', () => {
  const source = read('client/components/activities/activities.js');
  const match = source.match(/const activitiesPerPage = (\d+);/);
  assert.ok(match);
  assert.ok(Number(match[1]) <= 50);
});

// WeKan polls FerretDB everywhere: no OpLog URL, no OpLog reactivity.
for (const rel of ferretPaths) {
  test(`${rel} keeps WeKan on polling`, () => {
    const source = read(rel);
    assert.doesNotMatch(source, /MONGO_OPLOG_URL=.*mongodb:|WEKAN_FERRETDB_OPLOG|WEKAN_FERRETDB_REPL_SET/);
    assert.match(source, /METEOR_REACTIVITY_ORDER[=:]"?polling/);
    assert.doesNotMatch(source, /METEOR_REACTIVITY_ORDER[=:][^\n]*oplog/);
  });
}

// The launchers that run FerretDB beside WeKan stay standalone: continuous
// backup reads their SQLite file directly (the sqlite engine).
for (const rel of ferretPaths.slice(0, 3)) {
  test(`${rel} starts FerretDB standalone`, () => {
    assert.doesNotMatch(read(rel), /--repl-set-name/);
  });
}

// The Compose files run FerretDB in its own container, where WeKan cannot see
// the SQLite file, so FerretDB keeps an OpLog for continuous backup's oplog
// engine (maintainer decision of 2026-10-03, reversing ecfbd0bf66 for Compose
// only, and only for recording). WeKan connects to that one host directly
// (tests/ferretdbDirectConnection.test.cjs) and still polls.
for (const rel of ferretPaths.slice(3)) {
  test(`${rel} keeps an OpLog for continuous backup, with a direct connection`, () => {
    const source = read(rel);
    assert.match(source, /--listen-addr=0\.0\.0\.0:27017 \\\n\s+--repl-set-name=rs0 \\/);
    assert.match(source, /- MONGO_URL=mongodb:\/\/ferretdb:27017\/wekan\?directConnection=true\n/);
    assert.doesNotMatch(source, /- MONGO_URL=[^\n]*replicaSet=/);
  });
}

test('MongoDB v7 initializes and waits for replica set rs0', () => {
  const source = read('docker-compose-mongodb-v7.yml');
  assert.match(source, /--replSet rs0/);
  assert.match(source, /rs\.initiate\(/);
  assert.match(source, /isWritablePrimary/);
  assert.match(source, /MONGO_URL=mongodb:\/\/wekandb:27017\/wekan\?replicaSet=rs0/);
  assert.match(source, /MONGO_OPLOG_URL=mongodb:\/\/wekandb:27017\/local\?replicaSet=rs0/);
  assert.match(source, /METEOR_REACTIVITY_ORDER=changeStreams,oplog,polling/);
});

test('Meteor 3 multitenancy initializes rs0 and grants scoped OpLog read access', () => {
  const init = read('docs/Platforms/FOSS/Container/Docker/Meteor3/mongo/init-replica-set.sh');
  const create = read('docs/Platforms/FOSS/Container/Docker/Meteor3/1createdb.sh');
  const config = read('docs/Platforms/FOSS/Container/Docker/Meteor3/mongo/mongod.conf');
  assert.match(config, /replSetName: rs0/);
  assert.match(init, /rs\.initiate\(/);
  assert.match(init, /isWritablePrimary/);
  assert.match(create, /resource:\s*\{ db: 'local', collection: 'oplog\.rs' \}/);
  assert.match(create, /OPLOG_URL=.*replicaSet=rs0/);
  assert.doesNotMatch(create, /already protected.*admin\.txt is missing/);
});

test('negative: standalone FerretDB does not create or reset a simulated OpLog', () => {
  for (const rel of ferretPaths.slice(0, 3)) {
    const source = read(rel);
    assert.doesNotMatch(source, /local\.sqlite|WEKAN_FERRETDB_RESET_OPLOG/);
  }
});
