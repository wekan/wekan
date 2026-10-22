'use strict';

// #6794: "Created the missing index "-modifiedAt" on lists" in Admin Panel /
// Problems at every start, from every process. The list sort options
// ('-modifiedAt', 'title', ...) were passed to ensureIndex as strings: the
// driver indexed fields literally named "-modifiedAt", "-title" and "-sort",
// and ensureIndex compared a string's JSON with an index key object's, which
// never matched, so all six were re-created and reported every time.
// Run: node tests/listSortIndexes.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const { indexKeyFromSortValue, listSortIndexKeys, straySortIndexNames } = require('../models/lib/indexKeys.cjs');

const pending = [];
let passed = 0;
function test(name, fn) {
  pending.push(Promise.resolve().then(fn).then(() => { passed += 1; console.log('  ok -', name); }));
}

// models/users.js's own list, read from the source.
const SORT_VALUES = [...vm.runInNewContext(read('models/users.js')
  .match(/allowedSortValues\s*=\s*(\[[^\]]*\])/)[1])];

// The index list the reporter's instance had (wekan.lists on v12.57).
const REPORTED = [
  { name: '_id_', key: { _id: 1 } },
  { name: 'modifiedAt_1', key: { modifiedAt: 1 } },
  { name: '-sort_1', key: { '-sort': 1 } },
  { name: 'boardId_1', key: { boardId: 1 } },
  { name: 'modifiedAt_-1', key: { modifiedAt: -1 } },
  { name: '-modifiedAt_1', key: { '-modifiedAt': 1 } },
  { name: 'title_1', key: { title: 1 } },
  { name: 'sort_1', key: { sort: 1 } },
  { name: '-title_1', key: { '-title': 1 } },
  { name: 'boardId_1_swimlaneId_1_title_1', key: { boardId: 1, swimlaneId: 1, title: 1 } },
];

test('a sort value becomes the key object it means, and nonsense becomes nothing', () => {
  assert.deepStrictEqual(indexKeyFromSortValue('-modifiedAt'), { modifiedAt: -1 });
  assert.deepStrictEqual(indexKeyFromSortValue('title'), { title: 1 });
  assert.deepStrictEqual(indexKeyFromSortValue({ boardId: 1 }), { boardId: 1 });
  for (const bad of ['', '  ', '-', '--x', '$where', null, undefined, 3, ['title']]) {
    assert.strictEqual(indexKeyFromSortValue(bad), null, JSON.stringify(bad));
  }
});

test('the six sort options need three single-field indexes, on real fields', () => {
  assert.deepStrictEqual(SORT_VALUES, ['-modifiedAt', 'modifiedAt', '-title', 'title', '-sort', 'sort']);
  assert.deepStrictEqual(listSortIndexKeys(SORT_VALUES), [{ modifiedAt: 1 }, { title: 1 }, { sort: 1 }]);
  // ...which the reporter's instance already has: nothing to create.
  const have = new Set(REPORTED.map(i => JSON.stringify(i.key)));
  for (const key of listSortIndexKeys(SORT_VALUES)) assert.ok(have.has(JSON.stringify(key)));
});

test('the stray indexes are found on the reported instance, and nothing else (negative)', () => {
  assert.deepStrictEqual(straySortIndexNames(REPORTED, SORT_VALUES).sort(), ['-modifiedAt_1', '-sort_1', '-title_1']);
  assert.deepStrictEqual(straySortIndexNames([{ name: 'x', key: { '-sort': 1, boardId: 1 } }], SORT_VALUES), [],
    'a compound index that contains such a field is somebody\'s own');
  assert.deepStrictEqual(straySortIndexNames(REPORTED.filter(i => !i.name.startsWith('-')), SORT_VALUES), []);
});

// server/lib/mongoStartup.js's own ensureIndex, run against a fake collection.
const mongoStartup = read('server/lib/mongoStartup.js');
function ensureIndexWith(collection, reported) {
  const start = mongoStartup.indexOf('export async function ensureIndex(collection, keys, options = {}) {');
  let depth = 0; let end = start;
  for (let i = mongoStartup.indexOf(') {', start) + 2; i < mongoStartup.length; i += 1) {
    if (mongoStartup[i] === '{') depth += 1;
    else if (mongoStartup[i] === '}' && --depth === 0) { end = i + 1; break; }
  }
  const body = mongoStartup.slice(start, end).replace('export async function', 'async function');
  const warnings = [];
  const fn = vm.runInNewContext(`(${body})`, {
    getRawCollection: c => c,
    console: { warn: m => warnings.push(m), error: m => warnings.push(m), log() {} },
    require: name => {
      if (name === '/models/lib/indexKeys.cjs') return require('../models/lib/indexKeys.cjs');
      if (name === '/models/lib/databaseHealth') return { indexCreatedRemediation: (c, k, n) => ({ c, k, n }) };
      if (name === '/server/lib/databaseProblems') return { recordDatabaseHealth: r => reported.push(r) };
      throw new Error(`unexpected require ${name}`);
    },
    JSON,
  });
  return { ensureIndex: fn, warnings };
}
function fakeCollection(indexes) {
  const created = [];
  return {
    collectionName: 'lists', created,
    indexes: async () => indexes.map(i => ({ ...i })),
    createIndex: async key => { created.push(key); indexes.push({ name: Object.keys(key).join('_'), key }); },
    estimatedDocumentCount: async () => 115184,
  };
}

test('ensureIndex creates a missing object key once, and reports it once', async () => {
  const reported = [];
  const lists = fakeCollection([{ name: '_id_', key: { _id: 1 } }]);
  const { ensureIndex } = ensureIndexWith(lists, reported);
  assert.strictEqual(await ensureIndex(lists, { modifiedAt: 1 }), true);
  assert.strictEqual(await ensureIndex(lists, { modifiedAt: 1 }), false, 'the second start finds it');
  assert.deepStrictEqual(lists.created, [{ modifiedAt: 1 }]);
  assert.strictEqual(reported.length, 1);
});

test('a string key is the key it means, never an index on a field named "-modifiedAt" (negative)', async () => {
  const reported = [];
  const lists = fakeCollection(REPORTED.map(i => ({ ...i })));
  const { ensureIndex, warnings } = ensureIndexWith(lists, reported);
  for (const value of SORT_VALUES) await ensureIndex(lists, value);
  assert.ok(!lists.created.some(key => Object.keys(key).some(f => f.startsWith('-'))), JSON.stringify(lists.created));
  // modifiedAt -1 and 1, title 1, sort 1 already exist; only the descending
  // title and sort the strings asked for are new, and only the first time.
  assert.deepStrictEqual(lists.created, [{ title: -1 }, { sort: -1 }]);
  for (const value of SORT_VALUES) await ensureIndex(lists, value);
  assert.strictEqual(lists.created.length, 2, 'nothing is created, or reported, twice');
  assert.ok(warnings.some(w => /given as the string "-modifiedAt"/.test(w)));
  assert.strictEqual(await ensureIndex(lists, '-'), false);
});

test('startup ensures the key objects and drops the strays', () => {
  const src = read('server/models/users.js');
  assert.match(src, /for \(const key of listSortIndexKeys\(allowedSortValues\)\) \{\s*await ensureIndex\(Lists, key\);/);
  assert.match(src, /straySortIndexNames\(await raw\.indexes\(\), allowedSortValues\)/);
  assert.match(src, /await raw\.dropIndex\(name\)/);
});

test('negative: no ensureIndex call anywhere passes something that is not an index key object', () => {
  // The shape of the fault: a key that is a string, or a loop variable over a
  // list of strings. Allowed: an object literal, or a name that is one.
  const offenders = [];
  const walk = dir => {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      if (['node_modules', '.npm', '_build', '.build', 'tests'].includes(e.name)) continue;
      const rel = path.join(dir, e.name);
      if (e.isDirectory()) { walk(rel); continue; }
      if (!/\.(c?m?js)$/.test(e.name)) continue;
      const text = read(rel);
      for (const m of text.matchAll(/\bensureIndex\(\s*[\w.]+\s*,\s*([^\s,)]+)/g)) {
        const arg = m[1];
        if (arg.startsWith('{')) continue;
        if (/^['"`]/.test(arg)) { offenders.push(`${rel}: ${m[0]}`); continue; }
        if (arg === 'keys' && rel.endsWith('mongoStartup.js')) continue;
        const bound = new RegExp(`\\b(?:const|let|var)\\s+${arg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*=\\s*\\{`).test(text)
          || new RegExp(`for \\(const ${arg} of listSortIndexKeys\\(`).test(text)
          || new RegExp(`export const ${arg}\\s*=\\s*\\{`).test(text);
        if (!bound) offenders.push(`${rel}: ${m[0]}`);
      }
    }
  };
  ['server', 'models', 'imports', 'packages'].forEach(walk);
  assert.deepStrictEqual(offenders, []);
});

Promise.all(pending).then(() => console.log(`\n${passed} passed`), (error) => {
  console.error(error);
  process.exit(1);
});
