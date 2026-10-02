'use strict';

// Guard: PrototypeBleed (2026-10-02). The per-user layout methods keep maps
// keyed by ids the client sends - profile.collapsedLists[boardId][listId] and
// their siblings - and wrote them as
//   if (!map[boardId]) map[boardId] = {}; map[boardId][listId] = value;
// With boardId '__proto__', map[boardId] is Object.prototype, so any logged-in
// user could set a property on every object in the server process
// (`Meteor.call('setListCollapsedState', '__proto__', 'isAdmin', true)`) until
// a restart: role flags, MongoDB option keys, whatever the next code reads.
// Run: node tests/prototypeBleed.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const { isSafeMapKey, assertSafeMapKey } = require('../models/lib/safeMapKey');

test('a map key that reaches a prototype, or that MongoDB refuses, is not a key', () => {
  for (const key of ['__proto__', 'constructor', 'prototype', 'a.b', '$where', '', 'x'.repeat(257), null, undefined, 1, {}]) {
    assert.equal(isSafeMapKey(key), false, String(key));
    assert.throws(() => assertSafeMapKey('board', key), /invalid-map-key/);
  }
  for (const key of ['Abc123xyz', 'sync-0123abcdef', 'list_1', 'q7RBn3wkhLxQ9Zz2c']) assert.equal(isSafeMapKey(key), true, key);
});

// The real method body, run in its own context so a pollution would land on
// THAT context's Object.prototype and be observable without harming this one.
function runMethod(name, args, guarded) {
  const src = read('server/models/users.js');
  const start = src.indexOf(`  async ${name}(`);
  const end = src.indexOf('\n  },\n', start);
  const params = src.slice(src.indexOf('(', start) + 1, src.indexOf(')', start));
  let body = src.slice(src.indexOf('{', start) + 1, end);
  if (!guarded) body = body.replace(/^\s*assertSafeMapKey\([^)]*\);\n/m, '');
  const context = vm.createContext({});
  vm.runInContext(`
    var saved;
    var Users = {
      findOneAsync: async () => ({ _id: 'u', profile: { collapsedLists: {}, collapsedCards: {}, collapsedSwimlanes: {} } }),
      updateAsync: async (id, modifier) => { saved = modifier; return 1; },
    };
    var Meteor = { Error: class extends Error { constructor(e) { super(e); this.error = e; } } };
    var check = () => {};
    var assertSafeMapKey = ${assertSafeMapKey.toString().replace(/require\(/g, 'undefined && require(')};
    var isSafeMapKey = ${isSafeMapKey.toString()};
    var UNSAFE = new Set(['__proto__', 'constructor', 'prototype']);
    var require = undefined;
    async function method(${params}) { ${body} }
  `, context);
  context.self = { userId: 'u' };
  return vm.runInContext(`method.call(self, ...${JSON.stringify(args)}).then(() => 'ok', e => e.error || e.message)`, context)
    .then(result => ({ result, polluted: vm.runInContext('({}).isAdmin === true', context) }));
}

test('the reported attack, on the real method body: polluted before, refused now', async () => {
  for (const name of ['setListCollapsedState', 'setCardCollapsedState', 'setSwimlaneCollapsedState']) {
    const before = await runMethod(name, ['__proto__', 'isAdmin', true], false);
    assert.equal(before.polluted, true, `${name} without the guard polluted Object.prototype`);
    const after = await runMethod(name, ['__proto__', 'isAdmin', true], true);
    assert.deepEqual(after, { result: 'invalid-map-key', polluted: false }, name);
    // An ordinary call still works (negative).
    assert.deepEqual(await runMethod(name, ['board1', 'list1', true], true), { result: 'ok', polluted: false });
  }
});

test('negative: every function that writes an id-keyed map checks its keys first', () => {
  const IDS = ['boardId', 'listId', 'swimlaneId', 'cardId', 'workspaceId'];
  const sig = /^(\s*)(?:async\s+)?(?:[A-Za-z_][\w.]*\s*=\s*(?:async\s*)?\(([^)]*)\)\s*=>\s*\{|(?:async\s+)?[A-Za-z_]\w*\s*\(([^)]*)\)\s*\{)\s*$/;
  const offenders = [];
  for (const file of ['models/users.js', 'server/models/users.js']) {
    const lines = read(file).split('\n');
    lines.forEach((line, i) => {
      const m = sig.exec(line);
      if (!m) return;
      const params = (m[2] || m[3] || '').split(',').map(p => p.trim().split('=')[0].trim());
      let j = i + 1;
      while (j < lines.length && !new RegExp(`^${m[1]}\\}[;,)]*\\s*$`).test(lines[j])) j += 1;
      const body = lines.slice(i + 1, j).join('\n');
      const writes = params.filter(p => IDS.includes(p) && new RegExp(`\\w+\\[${p}\\](\\[\\w+\\])?\\s*=[^=]`).test(body));
      if (writes.length && !/assertSafeMapKey\(/.test(body)) offenders.push(`${file}:${i + 1}`);
    });
  }
  assert.deepEqual(offenders, []);
  assert.match(read('models/lib/securityCategories.js'), /'injection\.prototype':\s*\{[^}]*bleed: 'PrototypeBleed'/);
});
