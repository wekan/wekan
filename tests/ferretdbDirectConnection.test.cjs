'use strict';

// Guard for wekan/wekan#6582: a compose file that runs FerretDB as a replica set
// must connect to it with directConnection=true.
// Run: node tests/ferretdbDirectConnection.test.cjs
//
// The reported failure, on nothing but `docker compose up -d` with the default
// docker-compose.yml and no change beyond a port and ROOT_URL:
//
//   MongoServerSelectionError: connect ECONNREFUSED 0.0.0.0:27017
//   reason: TopologyDescription { type: 'ReplicaSetNoPrimary',
//           servers: Map(1) { '0.0.0.0:27017' => [ServerDescription] },
//           setName: 'rs0', ... }
//
// Note the address: 0.0.0.0, which is in NO compose file. It is FerretDB's
// LISTEN address, and the driver got it from the server.
//
// The ferretdb service runs with `--repl-set-name=rs0` (added for #6480/#6481 so
// Meteor can tail an OpLog instead of poll-and-diff). FerretDB then answers the
// hello handshake as a one-member replica set and fills `hosts`, `me` and
// `primary` with its own --listen-addr, which is the wildcard 0.0.0.0:27017.
// A MongoDB driver that is not in directConnection mode does replica-set
// DISCOVERY on that reply: it adopts the advertised member list and DROPS the
// seed it was given (the "me mismatch" rule - the server says it is called
// something other than what the client dialled). So `mongodb://ferretdb:27017`
// becomes `0.0.0.0:27017`, which inside the wekan container is the wekan
// container itself, where nothing listens. Verified against FerretDB v1.49.0 and
// the mongodb driver the bundle ships:
//
//   mongodb://localhost:27017/wekan                       -> servers: 0.0.0.0:27017  (seed discarded)
//   mongodb://localhost:27017/wekan?directConnection=true -> servers: localhost:27017
//
// directConnection=true keeps the driver on exactly the host it was given, and
// costs nothing else: the handshake still carries setName: 'rs0', which is the
// only thing Meteor's oplog tailing checks (packages/mongo/oplog_replica_set_error.js
// accepts the URL when `ismaster.setName` is set), so #6480/#6481 still work.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');

const composeFiles = fs.readdirSync(repoRoot)
  .filter(f => /^docker-compose.*\.ya?ml$/.test(f))
  .sort();

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test('the compose files are found', () => {
  assert.ok(composeFiles.length >= 5,
    `expected the docker-compose*.yml set, found ${composeFiles.length}`);
  assert.ok(composeFiles.includes('docker-compose.yml'), 'the default compose file must be there');
});

// A compose file "runs FerretDB as a replica set" when its ferretdb service is
// started with --repl-set-name. That flag is what makes the handshake advertise
// a replica set at all, and so it is what makes discovery kick in.
function declaresReplSet(text) {
  return /--repl-set-name[= ]/.test(text);
}

// Only URLs that point at THIS compose file's own ferretdb service matter. A
// MongoDB service (docker-compose-mongodb-v7.yml, the multitenancy example) has
// a real replica set with a real, resolvable member list, and must keep using it.
function ferretdbUrls(text) {
  const urls = [];
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*#?\s*-\s*(MONGO_URL|MONGO_OPLOG_URL)=(\S+)/);
    if (!m) continue;
    const [, name, url] = m;
    if (!/@?(wekan-)?ferretdb:/.test(url)) continue;
    urls.push({ name, url, commented: /^\s*#/.test(line) });
  }
  return urls;
}

for (const file of composeFiles) {
  const text = fs.readFileSync(path.join(repoRoot, file), 'utf8');
  if (!declaresReplSet(text)) continue;

  const urls = ferretdbUrls(text);

  test(`${file}: its ferretdb URLs are found`, () => {
    assert.ok(urls.length > 0,
      `${file} starts FerretDB with --repl-set-name but has no MONGO_URL pointing at it`);
    assert.ok(urls.some(u => u.name === 'MONGO_URL' && !u.commented),
      `${file} has no ACTIVE MONGO_URL for its ferretdb service`);
  });

  test(`${file}: every ferretdb URL carries directConnection=true`, () => {
    const missing = urls
      .filter(u => !/[?&]directConnection=true(&|$)/.test(u.url))
      .map(u => `${u.name}=${u.url}${u.commented ? '  (commented example)' : ''}`);
    assert.deepStrictEqual(missing, [],
      `${file} runs FerretDB with --repl-set-name, so a driver without ` +
      `directConnection=true throws away this host and dials the advertised ` +
      `0.0.0.0:27017 instead (#6582). Missing on:\n  ` + missing.join('\n  '));
  });
}

test('a compose file that does NOT run a replica-set FerretDB is left alone', () => {
  // FerretDB v2 is not started with --repl-set-name, so its handshake advertises
  // no replica set, no discovery happens, and directConnection is not needed.
  // Pinned so that adding --repl-set-name there is a decision, not an accident.
  const v2 = path.join(repoRoot, 'docker-compose-ferretdb-v2-postgresql.yml');
  if (!fs.existsSync(v2)) return;
  const text = fs.readFileSync(v2, 'utf8');
  if (declaresReplSet(text)) {
    const urls = ferretdbUrls(text).filter(u => !/directConnection=true/.test(u.url));
    assert.deepStrictEqual(urls.map(u => u.url), [],
      'FerretDB v2 gained --repl-set-name, so its URLs need directConnection=true too');
  }
});

// The MongoDB compose files must NOT be "fixed" the same way: those are real
// replica sets whose members are configured with resolvable names, and
// directConnection would pin Meteor to one node of them.
test('the MongoDB compose files keep replicaSet= and gain no directConnection', () => {
  for (const file of ['docker-compose-mongodb-v7.yml', 'docker-compose-multitenancy.yml']) {
    const p = path.join(repoRoot, file);
    if (!fs.existsSync(p)) continue;
    const text = fs.readFileSync(p, 'utf8');
    for (const line of text.split('\n')) {
      const m = line.match(/^\s*-\s*(MONGO_URL|MONGO_OPLOG_URL)=(\S+)/);
      if (!m) continue;
      if (/(wekan-)?ferretdb:/.test(m[2])) continue;
      assert.ok(!/directConnection=true/.test(m[2]),
        `${file}: ${m[1]} points at a real MongoDB replica set, whose members ARE ` +
        `reachable by the names it advertises; directConnection would pin Meteor to ` +
        `a single node of it. Line: ${line.trim()}`);
    }
  }
});

console.log(`\n${passed} passed`);
