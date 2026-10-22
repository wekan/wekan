'use strict';

// #6799: a MongoDB pod restarting in Kubernetes takes its DNS name with it for a
// few seconds, and the driver throws "getaddrinfo ENOTFOUND wekan-mongodb-0...".
// No rule in models/lib/databaseErrors.js knew it, so it was not transient, and
// server/lib/uptimeWatch.js recorded every unhandled rejection as a critical
// CrashBleed although server/00processErrors.js kept WeKan running: nine
// "crashes" while WeKan reconnected by itself.
// Run: node tests/databaseDnsRestart.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const { classifyDatabaseError: classify, databaseHostsOf, unresolvedHostIsDatabase } = require('../models/lib/databaseErrors.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const POD = 'wekan-mongodb-0.wekan-mongodb-internal.wekan.svc.cluster.local';
const URL = `mongodb://wekan:secret@${POD}:27017,wekan-mongodb-1.wekan-mongodb-internal.wekan.svc.cluster.local:27017/wekan?replicaSet=rs0`;
const hosts = databaseHostsOf(URL);

// Both guards' decision, from their own source.
const guards = ['server/00startupResilience.js', 'server/00processErrors.js'].map(file => {
  const src = read(file);
  const set = src.match(/const TRANSIENT = new Set\(\[[\s\S]*?\]\);/)[0];
  const fn = src.match(/export function isTransientDatabaseError\(error\) \{[\s\S]*?\n\}/)[0].replace('export function', 'function');
  return { file, isTransient: vm.runInNewContext(`${set}\n${fn}\nisTransientDatabaseError`, {
    classifyDatabaseError: (error, options) => classify(error, { ...options, databaseHosts: hosts }),
  }) };
});

test('the hosts of a connection string, with credentials, ports, replica sets and SRV', () => {
  assert.deepStrictEqual(hosts, [POD, 'wekan-mongodb-1.wekan-mongodb-internal.wekan.svc.cluster.local']);
  assert.deepStrictEqual(databaseHostsOf('mongodb+srv://u:p@cluster0.example.net/wekan'), ['cluster0.example.net']);
  assert.deepStrictEqual(databaseHostsOf('mongodb://127.0.0.1:3001/meteor'), ['127.0.0.1']);
  assert.deepStrictEqual(databaseHostsOf(''), []);
  assert.deepStrictEqual(databaseHostsOf('https://example.com'), []);
});

test('the database\'s name not resolving is a lost connection, and transient for both guards', () => {
  for (const message of [`getaddrinfo ENOTFOUND ${POD}`, `getaddrinfo EAI_AGAIN ${POD}`,
    `MongoServerSelectionError: getaddrinfo ENOTFOUND ${POD}`]) {
    assert.strictEqual(classify(message, { databaseHosts: hosts }).id, 'connection-lost', message);
    for (const { file, isTransient } of guards) assert.strictEqual(isTransient(new Error(message)), true, `${file}: ${message}`);
  }
});

test('negative: another host not resolving - a webhook, a mail server - is not a database problem', () => {
  for (const message of ['getaddrinfo ENOTFOUND hooks.example.com',
    'request to https://hooks.example.com/x failed, reason: getaddrinfo ENOTFOUND hooks.example.com',
    'getaddrinfo EAI_AGAIN smtp.example.com']) {
    assert.notStrictEqual(classify(message, { databaseHosts: hosts }).id, 'connection-lost', message);
    assert.strictEqual(unresolvedHostIsDatabase(message, { databaseHosts: hosts }), false);
    for (const { file, isTransient } of guards) assert.strictEqual(isTransient(new Error(message)), false, file);
  }
  // A host that only CONTAINS the database's name is another host.
  assert.strictEqual(unresolvedHostIsDatabase(`getaddrinfo ENOTFOUND x${POD}`, { databaseHosts: hosts }), false);
});

test('MONGO_URL and MONGO_OPLOG_URL are where the hosts come from when the caller does not say', () => {
  const saved = { url: process.env.MONGO_URL, oplog: process.env.MONGO_OPLOG_URL };
  try {
    process.env.MONGO_URL = 'mongodb://db.internal:27017/wekan';
    process.env.MONGO_OPLOG_URL = 'mongodb://oplog.internal:27017/local';
    assert.strictEqual(classify('getaddrinfo ENOTFOUND db.internal').id, 'connection-lost');
    assert.strictEqual(classify('getaddrinfo ENOTFOUND oplog.internal').id, 'connection-lost');
    assert.notStrictEqual(classify('getaddrinfo ENOTFOUND elsewhere.internal').id, 'connection-lost');
  } finally {
    if (saved.url === undefined) delete process.env.MONGO_URL; else process.env.MONGO_URL = saved.url;
    if (saved.oplog === undefined) delete process.env.MONGO_OPLOG_URL; else process.env.MONGO_OPLOG_URL = saved.oplog;
  }
});

test('the crash recorder records a real crash, and not a database that is coming back (negative)', () => {
  const src = read('server/lib/uptimeWatch.js');
  const listeners = {};
  const recorded = [];
  const start = src.indexOf("process.on('uncaughtException'");
  const last = src.indexOf("process.on('unhandledRejection'");
  const block = src.slice(start, src.indexOf('\n    });', last) + '\n    });'.length);
  vm.runInNewContext(block, {
    process: { on: (name, fn) => { listeners[name] = fn; } },
    record: evt => recorded.push(evt.source),
    isTransientDatabaseError: error => guards[1].isTransient(error),
  });
  listeners.unhandledRejection(new Error(`getaddrinfo ENOTFOUND ${POD}`));
  listeners.uncaughtException(new Error(`MongoNetworkError: getaddrinfo EAI_AGAIN ${POD}`));
  assert.deepStrictEqual(recorded, []);
  listeners.unhandledRejection(new TypeError('Cannot read properties of undefined'));
  listeners.uncaughtException(new Error('getaddrinfo ENOTFOUND hooks.example.com'));
  assert.deepStrictEqual(recorded, ['unhandledRejection', 'uncaughtException']);
  assert.match(src, /import \{ isTransientDatabaseError \} from '\/server\/00processErrors';/);
});

console.log(`\n${passed} passed`);
