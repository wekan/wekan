'use strict';

// #3626: a card may be a subtask of several parents (models/lib/cardParents.js).
// Run: node tests/cardParents.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const p = require('../models/lib/cardParents.js');

const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

async function main() {
  // Parents: primary first, each once; a legacy card has only parentId.
  assert.deepEqual(p.cardParentIds({ parentId: 'b' }), ['b']);
  assert.deepEqual(p.cardParentIds({ parentId: 'b', parentIds: ['b', 'c', 'c', '', null] }), ['b', 'c']);
  assert.deepEqual(p.cardParentIds({ parentId: '' }), []);
  assert.deepEqual(p.cardParentIds(null), []);
  assert.deepEqual(p.parentFields([]), { parentId: '', parentIds: [] });
  assert.deepEqual(p.withParentAdded({ parentId: 'b' }, 'c'), { parentId: 'b', parentIds: ['b', 'c'] });
  assert.deepEqual(p.withParentAdded({ parentId: 'b', parentIds: ['b', 'c'] }, 'c'), { parentId: 'b', parentIds: ['b', 'c'] }, 'once');
  assert.deepEqual(p.withParentRemoved({ parentId: 'b', parentIds: ['b', 'c'] }, 'b'), { parentId: 'c', parentIds: ['c'] }, 'next becomes primary');
  assert.deepEqual(p.withParentRemoved({ parentId: 'b' }, 'b'), { parentId: '', parentIds: [] });
  console.log('  ok - parentId stays the first of parentIds whatever is added or removed');

  // Selectors: children under any parent; cascades only for the one parent.
  assert.deepEqual(p.childrenSelector('c'), { $or: [{ parentId: 'c' }, { parentIds: 'c' }] });
  assert.deepEqual(p.onlyChildrenSelector('c'), { parentId: 'c', 'parentIds.1': { $exists: false } });
  assert.deepEqual(p.sharedChildrenSelector('c'), { $or: [{ parentId: 'c' }, { parentIds: 'c' }], 'parentIds.1': { $exists: true } });

  // Ancestors through every parent, each once, even with a loop in old data.
  const cards = { a: { parentIds: ['b', 'c'], parentId: 'b' }, b: { parentId: 'x' }, c: { parentIds: ['y', 'b'], parentId: 'y' },
    x: {}, y: { parentId: 'z' }, z: { parentId: 'y' } };
  const sync = p.collectAllAncestorIdsSync(['a'], id => cards[id]).sort();
  assert.deepEqual(sync, ['a', 'b', 'c', 'x', 'y', 'z']);
  const asyncIds = (await p.collectAllAncestorIds(['b', 'c'], ids => ids.map(id => cards[id]).filter(Boolean))).sort();
  assert.deepEqual(asyncIds, ['b', 'c', 'x', 'y', 'z']);
  // The cycle guard: making a card the subtask of its own descendant, through any parent.
  assert.ok(p.wouldCreateParentCycle('x', 'a', p.collectAllAncestorIdsSync(['a'], id => cards[id])), 'x is above a through b');
  assert.ok(p.wouldCreateParentCycle('z', 'c', p.collectAllAncestorIdsSync(['c'], id => cards[id])), 'z is above c through its OTHER parent y');
  assert.ok(p.wouldCreateParentCycle('a', 'a', []));
  assert.ok(!p.wouldCreateParentCycle('c', 'b', p.collectAllAncestorIdsSync(['b'], id => cards[id])), 'siblings are fine');
  console.log('  ok - ancestors and the loop guard follow every parent');

  // Negative, tree-wide: no code looks up a card's children by parentId alone,
  // which would leave out the cards whose OTHER parent it is. Deliberate
  // exceptions keep a reason.
  const ALLOWED = {
    'models/lib/cardParents.js': 'the selectors themselves',
    'server/lib/syncRuleArchiveCommand.js': 'validates a tree read through onlyChildrenSelector',
  };
  // git grep exits 1 when nothing matches, which is the passing case.
  const grep = args => {
    try { return execFileSync('git', args, { cwd: path.join(__dirname, '..') }).toString(); }
    catch (error) { if (error.status === 1) return ''; throw error; }
  };
  const hits = grep(['grep', '-nE', "getCards\\(\\{ ?parentId|find\\(\\{ ?parentId|removeAsync\\(\\{ ?parentId", '--', 'models', 'server', 'client', 'imports', ':!**/tests/**'])
    .trim().split('\n').filter(Boolean)
    .filter(line => !ALLOWED[line.split(':')[0]]);
  assert.deepEqual(hits, [], 'children found by parentId alone');
  // The pattern catches the lookups this replaced.
  const pattern = /getCards\(\{ ?parentId|find\(\{ ?parentId|removeAsync\(\{ ?parentId/;
  for (const old of ['await ReactiveCache.getCards({ parentId: this._id });', 'await Cards.removeAsync({ parentId: doc._id });',
    "Cards.find({ parentId }, { transform: null, limit: 1001 })"]) assert.match(old, pattern, old);
  console.log('  ok - every children lookup includes the other parents');

  // Wiring.
  const model = read('models/cards.js');
  assert.match(model, /parentIds: \{[\s\S]*?type: Array,\s*optional: true,\s*\},\s*'parentIds\.\$': \{\s*type: String,/);
  assert.match(model, /setParentId\(parentId\) \{\s*this\.assertNoParentCycle\(parentId\);\s*return Cards\.updateAsync\(this\.getRealId\(\), \{ \$set: parentFields\(parentId \? \[parentId\] : \[\]\) \}\);/);
  assert.match(model, /addParent\(parentId\) \{\s*this\.assertNoParentCycle\(parentId\);/);
  assert.match(model, /const cards = await ReactiveCache\.getCards\(onlyChildrenSelector\(this\._id\)\);/, 'archive cascade');
  assert.match(model, /await Cards\.removeAsync\(onlyChildrenSelector\(doc\._id\)\);/, 'delete cascade');
  assert.match(model, /sharedChildrenSelector\(doc\._id\)[\s\S]{0,200}withParentRemoved\(shared, doc\._id\)/, 'a shared subtask loses the deleted parent');
  assert.match(read('server/permissions/cards.js'), /for \(const parentId of parentIdsWritten\(modifier\)\)/, 'every written parent must be visible');
  assert.match(read('server/publications/boards.js'), /collectAllAncestorIds\(parentIds,/);
  assert.match(read('client/components/cards/subtasks.js'), /await targetCard\.addParent\(parentId\);/);
  assert.match(read('client/components/cards/cardDetails.js'), /card\.setPrimaryParent\(cardId === 'none' \? '' : cardId\)/);
  for (const file of ['models/cards.js', 'client/components/cards/subtasks.js', 'client/components/cards/cardDetails.js',
    'server/permissions/cards.js', 'imports/reactiveCache.js']) {
    execFileSync(process.execPath, ['--input-type=module', '--check'], { input: read(file) });
  }
  console.log('  ok - the model, permissions, publication and UI use the shared rules');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
