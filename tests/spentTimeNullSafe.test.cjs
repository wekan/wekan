// #6940: an imported card stored spentTime: null, and every $inc that logs
// time on it failed with "Cannot apply $inc to a value of non-numeric type".
// Pins the pure fix (models/lib/spentTime.js), that both collections run it
// before anything else reads the modifier, that no importer writes a null
// again, and that the fix stays an operator update FerretDB v1 accepts.
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');
const { nullSafeTimeIncrement, storedNumber } = require('../models/lib/spentTime');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// MongoDB's own rule, as the server applies it: $inc on a non-number throws.
function applyLikeMongo(doc, modifier) {
  const out = { ...doc };
  for (const [k, v] of Object.entries(modifier.$inc || {})) {
    if (k in out && typeof out[k] !== 'number') {
      throw new Error(`Cannot apply $inc to a value of non-numeric type. {_id: "${out._id}"} has the field '${k}' of non-numeric type null`);
    }
    out[k] = (out[k] || 0) + v;
  }
  Object.assign(out, modifier.$set || {});
  return out;
}

test('the reporter\'s failure: $inc on a stored null throws without the fix', () => {
  assert.throws(() => applyLikeMongo({ _id: 'c', spentTime: null }, { $inc: { spentTime: 1.5 } }), /non-numeric type null/);
});

test('a stored null plus 1.5 hours becomes $set 1.5, and the write no longer throws', () => {
  const doc = { _id: 'c', spentTime: null };
  const modifier = { $inc: { spentTime: 1.5 } };
  assert.deepStrictEqual(nullSafeTimeIncrement(doc, modifier), ['spentTime']);
  assert.deepStrictEqual(modifier, { $set: { spentTime: 1.5 } });
  assert.deepStrictEqual(applyLikeMongo(doc, modifier), { _id: 'c', spentTime: 1.5 });
});

test('removing a time entry from a null card subtracts from 0, and other $inc fields stay', () => {
  const modifier = { $inc: { spentTime: -2, flowInterruptions: 1 }, $set: { flowUserId: null } };
  nullSafeTimeIncrement({ spentTime: null, flowInterruptions: 0 }, modifier);
  assert.deepStrictEqual(modifier, { $inc: { flowInterruptions: 1 }, $set: { flowUserId: null, spentTime: -2 } });
});

test('a numeric string kept by an old version is added to, not thrown away', () => {
  const modifier = { $inc: { spentTime: 1 } };
  nullSafeTimeIncrement({ spentTime: '2.5' }, modifier);
  assert.deepStrictEqual(modifier, { $set: { spentTime: 3.5 } });
});

test('negative: a stored number keeps its $inc, so concurrent writes still add up', () => {
  const modifier = { $inc: { spentTime: 1 } };
  assert.deepStrictEqual(nullSafeTimeIncrement({ spentTime: 4 }, modifier), []);
  assert.deepStrictEqual(modifier, { $inc: { spentTime: 1 } });
});

test('negative: a missing field keeps its $inc, which starts it at the amount by itself', () => {
  const modifier = { $inc: { spentTime: 1 } };
  assert.deepStrictEqual(nullSafeTimeIncrement({ _id: 'c' }, modifier), []);
  assert.deepStrictEqual(modifier, { $inc: { spentTime: 1 } });
});

test('negative: updates without $inc, a non-numeric amount, or $set of the same field are not touched', () => {
  const set = { $set: { spentTime: 2 } };
  nullSafeTimeIncrement({ spentTime: null }, set);
  assert.deepStrictEqual(set, { $set: { spentTime: 2 } });
  const both = { $inc: { spentTime: 1 }, $set: { spentTime: 5 } };
  nullSafeTimeIncrement({ spentTime: null }, both);
  assert.deepStrictEqual(both, { $inc: { spentTime: 1 }, $set: { spentTime: 5 } });
  const bad = { $inc: { spentTime: 'x' } };
  nullSafeTimeIncrement({ spentTime: null }, bad);
  assert.deepStrictEqual(bad, { $inc: { spentTime: 'x' } });
  assert.deepStrictEqual(nullSafeTimeIncrement(undefined, { $inc: { spentTime: 1 } }), []);
  assert.deepStrictEqual(nullSafeTimeIncrement({ spentTime: null }, undefined), []);
});

test('storedNumber: what an import writes is always a finite Number', () => {
  for (const [input, want] of [[null, 0], [undefined, 0], ['', 0], ['abc', 0], [NaN, 0], [Infinity, 0], [true, 0], [0, 0], [3, 3], ['1.25', 1.25]]) {
    assert.strictEqual(storedNumber(input), want, `storedNumber(${String(input)})`);
  }
});

test('both collections run the fix, and on cards before every other before.update hook', () => {
  const cards = read('server/models/cards.js');
  const first = cards.indexOf('Cards.before.update(');
  assert.ok(first >= 0);
  assert.match(cards.slice(first, first + 120), /^Cards\.before\.update\(\(userId, doc, fieldNames, modifier\) => \{\n  nullSafeTimeIncrement\(doc, modifier\);/);
  assert.match(read('server/models/boards.js'), /Boards\.before\.update\(\(userId, doc, fieldNames, modifier\) => \{\n  nullSafeTimeIncrement\(doc, modifier\);/);
});

test('the importers write a Number, never null', () => {
  assert.match(read('models/wekanCreator.js'), /spentTime: storedNumber\(card\.spentTime\),/);
  assert.match(read('models/csvCreator.js'), /spentTime: storedNumber\(card\.spentTime\),/);
});

// Tree-wide negative: no code stores a null spentTime, and no spentTime write
// is an update pipeline, which FerretDB v1, Minimongo and allow/deny refuse.
test('negative: nothing in the app writes spentTime: null or a pipeline update of spentTime', () => {
  const offenders = [];
  const walk = dir => {
    for (const e of fs.readdirSync(path.join(repoRoot, dir), { withFileTypes: true })) {
      if (['node_modules', '.meteor', 'packages'].includes(e.name) || e.name.startsWith('_build') || e.name.startsWith('.')) continue;
      const rel = path.join(dir, e.name);
      if (e.isDirectory()) walk(rel);
      else if (rel.endsWith('.js')) {
        read(rel).split('\n').forEach((line, i) => {
          if (/^\s*(\/\/|\*)/.test(line)) return;
          // spentTime: null, or a value expression that falls back to null
          // (`|| null`, `? null`); an export turning it into text is not one.
          if (/\bspentTime:\s*(null\b|[^,}]*(\|\|\s*null|\?\s*null)\b)/.test(line)) offenders.push(`${rel}:${i + 1}: ${line.trim()}`);
          if (/\$ifNull[^\n]*\$spentTime|\$spentTime[^\n]*\$ifNull/.test(line)) offenders.push(`${rel}:${i + 1}: ${line.trim()}`);
        });
      }
    }
  };
  for (const dir of ['server', 'models', 'client', 'imports', 'config']) {
    if (fs.existsSync(path.join(repoRoot, dir))) walk(dir);
  }
  assert.deepStrictEqual(offenders, []);
});

test('existing data is repaired at startup by spenttime-null-repair', () => {
  const { steps } = require('../server/lib/schemaUpgradeSteps');
  assert.ok(steps.some(s => s.name === 'spenttime-null-repair'));
});

console.log(`spentTimeNullSafe: ${passed} tests passed`);
