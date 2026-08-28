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

for (const rel of ferretPaths) {
  test(`${rel} is standalone polling-only`, () => {
    const source = read(rel);
    assert.doesNotMatch(source, /--repl-set-name|MONGO_OPLOG_URL=.*mongodb:|WEKAN_FERRETDB_OPLOG|WEKAN_FERRETDB_REPL_SET/);
    assert.match(source, /METEOR_REACTIVITY_ORDER[=:]"?polling/);
    assert.doesNotMatch(source, /METEOR_REACTIVITY_ORDER[=:][^\n]*oplog/);
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
