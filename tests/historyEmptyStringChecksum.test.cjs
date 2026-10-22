'use strict';

// #6797: Admin Panel / Problems / Security showed HistoryIntegrity (critical)
// 81,833 times - every list move whose list is bound to no one swimlane
// (swimlaneId '') failed its own checksum. The legacy history append hashed
// the row with '' and inserted it through collection2's default clean, which
// removes empty strings, after which the schema's defaultValue stored null. The
// stored-chain path already inserted with { removeEmptyStrings: false,
// trimStrings: false }; the legacy one did not.
// Run: node tests/historyEmptyStringChecksum.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const { hashHistoryRow, rowHashIsValid, verifyHistoryRows } = require('../models/lib/changeHistoryIntegrity.js');
const { appendLegacyHistoryRow, HISTORY_INSERT_OPTIONS } = require('../models/lib/historyLegacyAppend.js');

const pending = [];
let passed = 0;
function test(name, fn) {
  pending.push(Promise.resolve().then(fn).then(() => { passed += 1; console.log('  ok -', name); }));
}

// A collection that cleans an insert the way collection2 does by default: an
// empty string is removed, a string is trimmed, then defaultValue null fills
// the schema's optional id fields - unless the insert says not to.
const DEFAULT_NULL = ['boardId', 'swimlaneId', 'listId', 'cardId', 'group', 'batchId', 'restoredFromId', 'restoredByUserId'];
function collection2Like() {
  const rows = [];
  return {
    rows,
    async findOneAsync() { return null; },
    async insertAsync(doc, options = {}) {
      const stored = { ...doc };
      for (const key of Object.keys(stored)) {
        if (typeof stored[key] !== 'string') continue;
        if (options.trimStrings !== false) stored[key] = stored[key].trim();
        if (options.removeEmptyStrings !== false && stored[key] === '') delete stored[key];
      }
      for (const key of DEFAULT_NULL) if (!(key in stored)) stored[key] = null;
      rows.push(stored);
      return stored._id;
    },
  };
}

const LIST_MOVE = {
  _id: 'h1', boardId: 'b1', swimlaneId: '', listId: 'l1', cardId: null, entityType: 'list', entityId: 'l1',
  group: null, changeType: 'moved', previousContent: { sort: 1 }, newContent: { sort: 2 }, userId: 'u1',
  createdAt: new Date('2026-10-22T08:00:00Z'), batchId: null, restoredFromId: null, restoredByUserId: null,
};

test('a list move with swimlaneId "" is stored as it was hashed, and verifies', async () => {
  const history = collection2Like();
  await appendLegacyHistoryRow({ history, boardId: 'b1', document: LIST_MOVE, hash: hashHistoryRow });
  const [stored] = history.rows;
  assert.strictEqual(stored.swimlaneId, '', 'not cleaned to null');
  assert.strictEqual(rowHashIsValid(stored), true);
  assert.deepStrictEqual({ ...HISTORY_INSERT_OPTIONS }, { removeEmptyStrings: false, trimStrings: false });
});

test('a row already stored with null where "" was hashed verifies (no more false tampering reports)', () => {
  const hashed = { ...LIST_MOVE, previousHash: null };
  hashed.integrityHash = hashHistoryRow(hashed);
  const cleaned = { ...hashed, swimlaneId: null };
  assert.notStrictEqual(hashHistoryRow(cleaned), cleaned.integrityHash, 'the reported mismatch');
  assert.strictEqual(rowHashIsValid(cleaned), true);
  // Two cleaned fields at once, and a field missing altogether.
  const two = { ...LIST_MOVE, group: '', previousHash: null };
  two.integrityHash = hashHistoryRow(two);
  assert.strictEqual(rowHashIsValid({ ...two, swimlaneId: null, group: null }), true);
  const { swimlaneId, ...missing } = hashed;
  assert.strictEqual(rowHashIsValid(missing), true);
  assert.strictEqual(verifyHistoryRows([cleaned]).ok !== false, true);
});

test('negative: any real change still fails the checksum', () => {
  const hashed = { ...LIST_MOVE, swimlaneId: 'lane-a', previousHash: null };
  hashed.integrityHash = hashHistoryRow(hashed);
  assert.strictEqual(rowHashIsValid(hashed), true);
  // A value replaced by null is a change, not a cleaned empty string.
  assert.strictEqual(rowHashIsValid({ ...hashed, swimlaneId: null }), false);
  // '' hashed, another value stored.
  const empty = { ...LIST_MOVE, previousHash: null };
  empty.integrityHash = hashHistoryRow(empty);
  assert.strictEqual(rowHashIsValid({ ...empty, swimlaneId: 'lane-b' }), false);
  // The content, the user, the entity: no null/'' leniency there.
  assert.strictEqual(rowHashIsValid({ ...empty, swimlaneId: null, newContent: { sort: 3 } }), false);
  assert.strictEqual(rowHashIsValid({ ...empty, swimlaneId: null, userId: 'u2' }), false);
  assert.strictEqual(rowHashIsValid({ ...empty, swimlaneId: null, entityId: 'l2' }), false);
});

test('negative: every ChangeHistory insert in the tree keeps empty strings and does not trim', () => {
  const offenders = [];
  const walk = dir => {
    for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      if (['node_modules', '.npm', '_build', '.build', 'tests'].includes(e.name)) continue;
      const rel = path.join(dir, e.name);
      if (e.isDirectory()) { walk(rel); continue; }
      if (!/\.(c?m?js)$/.test(e.name)) continue;
      const src = read(rel);
      for (const m of src.matchAll(/\b(ChangeHistory|history)\.insertAsync\(([^;]*?)\)\s*[;)]/g)) {
        if (!/removeEmptyStrings: false|HISTORY_INSERT_OPTIONS/.test(m[2]) || /trimStrings: true/.test(m[2])) {
          offenders.push(`${rel}: ${m[0].slice(0, 90)}`);
        }
      }
    }
  };
  ['server', 'models', 'imports'].forEach(walk);
  assert.deepStrictEqual(offenders, []);
});

Promise.all(pending).then(() => console.log(`\n${passed} passed`), (error) => {
  console.error(error);
  process.exit(1);
});
