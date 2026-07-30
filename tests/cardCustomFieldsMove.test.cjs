'use strict';

// Regression guard for #6560: moving or copying a card to another board blanked
// every custom field id. Run: node tests/cardCustomFieldsMove.test.cjs
//
// The values survived, but each entry came out keyed by `_id: ""`, which no board
// can match to a field definition, so the card showed every custom field as empty.
//
// `Cards.helpers.mapCustomFieldsToBoard()` was SYNCHRONOUS and called
// `ReactiveCache.getCustomField()`, which is async on the SERVER (it awaits
// findOneAsync) and synchronous only on the client. So on the server both lookups
// returned Promises. A Promise is truthy, so the "field not found" guard never
// fired and the "destination board has its own definition" branch always did -
// assigning `newCf._id`, which on a Promise is `undefined`. The schema declares
// `customFields.$._id` as `optional: true, defaultValue: ''`, so collection2
// cleaned that undefined to `''` on the way to the database. Nothing threw.
//
// This is the same defect as #6504 (unawaited ReactiveCache.getBoard in the same
// cross-board branch of move()), one line further down, which is why the guard
// added then is generalised in tests/cardMoveAwaitBoard.test.cjs.
//
// So the function is loaded OUT of models/cards.js and run against both stubs -
// an async ReactiveCache (the server, where this broke) and a sync one (the
// client, where it always worked) - and must produce the same result for both.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'models', 'cards.js'), 'utf8');

let passed = 0;
const tests = [];
function test(name, fn) { tests.push([name, fn]); }

// ── lift the real function out of models/cards.js ───────────────────────────
// The file is a Meteor ES module and cannot be required here, so take the one
// function and give it the collaborators it uses.
function sliceFunction(name) {
  const at = src.indexOf(`async ${name}(`);
  assert.notStrictEqual(at, -1, `${name} must exist and be async`);
  const open = src.indexOf('{', at);
  let depth = 0;
  let i = open;
  let state = 'code';
  let quote = '';
  for (; i < src.length; i++) {
    const c = src[i];
    const next = src[i + 1];
    if (state === 'line') { if (c === '\n') state = 'code'; continue; }
    if (state === 'block') { if (c === '*' && next === '/') { state = 'code'; i++; } continue; }
    if (state === 'string') {
      if (c === '\\') { i++; continue; }
      if (c === quote) state = 'code';
      continue;
    }
    if (c === '/' && next === '/') { state = 'line'; i++; continue; }
    if (c === '/' && next === '*') { state = 'block'; i++; continue; }
    if (c === '"' || c === "'" || c === '`') { state = 'string'; quote = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return src.slice(at, i + 1); }
  }
  throw new Error(`could not find the end of ${name}`);
}

function loadMapper(ReactiveCache) {
  const body = sliceFunction('mapCustomFieldsToBoard');
  // eslint-disable-next-line no-new-func
  return new Function('ReactiveCache', `return ({ ${body} }).mapCustomFieldsToBoard;`)(
    ReactiveCache,
  );
}

// ── the world the function looks at ─────────────────────────────────────────
// Board A has "Difficulty" (dropdown); board B has its own definition of the same
// name and type; "Notes" exists only on board A.
function makeWorld() {
  const added = [];
  const fields = [
    { _id: 'cfA', name: 'Difficulty', type: 'dropdown', boardIds: ['boardA'] },
    { _id: 'cfB', name: 'Difficulty', type: 'dropdown', boardIds: ['boardB'] },
    { _id: 'cfNotes', name: 'Notes', type: 'text', boardIds: ['boardA'] },
  ].map(f => ({
    ...f,
    async addBoard(boardId) { added.push([f._id, boardId]); f.boardIds.push(boardId); },
  }));

  const findOne = selector => {
    if (typeof selector === 'string') return fields.find(f => f._id === selector) || undefined;
    const sel = selector || {};
    // Mirrors what Mongo does with `{ boardIds: 'x' }` against an array field.
    return fields.find(f =>
      (sel.boardIds === undefined || (f.boardIds || []).includes(sel.boardIds))
      && (sel.name === undefined || f.name === sel.name)
      && (sel.type === undefined || f.type === sel.type)) || undefined;
  };

  return { fields, added, findOne };
}

// The server's ReactiveCache: async, which is what broke.
const asyncCache = world => ({ getCustomField: async (sel = {}) => world.findOne(sel) });
// The client's: synchronous, which always worked and must keep working.
const syncCache = world => ({ getCustomField: (sel = {}) => world.findOne(sel) });

console.log('cardCustomFieldsMove:');

for (const [label, cacheOf] of [['server (async)', asyncCache], ['client (sync)', syncCache]]) {
  test(`${label}: a value is re-keyed to the destination board's own field`, async () => {
    const world = makeWorld();
    const map = loadMapper(cacheOf(world));
    const card = { customFields: [{ _id: 'cfA', value: 'hard' }] };

    const out = await map.call(card, 'boardB');

    assert.deepStrictEqual(out, [{ _id: 'cfB', value: 'hard' }],
      'the value keeps its value and points at board B\'s definition of the same '
      + 'field - it must NOT come out as _id: "" (#6560)');
    assert.deepStrictEqual(world.added, [], 'and nothing needed sharing');
  });

  test(`${label}: a field the destination board lacks is shared with it instead`, async () => {
    const world = makeWorld();
    const map = loadMapper(cacheOf(world));
    const card = { customFields: [{ _id: 'cfNotes', value: 'hello' }] };

    const out = await map.call(card, 'boardB');

    assert.deepStrictEqual(out, [{ _id: 'cfNotes', value: 'hello' }],
      'the value keeps pointing at the definition it already had');
    assert.deepStrictEqual(world.added, [['cfNotes', 'boardB']],
      'and that definition gains the destination board, so the value still resolves');
  });
}

test('addBoard is awaited, so the sharing is done before the card is written', async () => {
  // addBoard() is async too. Until the lookups above were awaited its branch was
  // unreachable, so its own missing await had never been exercised.
  const world = makeWorld();
  let settled = false;
  const slow = {
    getCustomField: async (sel = {}) => world.findOne(sel),
  };
  const map = loadMapper(slow);
  const notes = world.fields.find(f => f._id === 'cfNotes');
  notes.addBoard = async boardId => {
    await new Promise(resolve => setTimeout(resolve, 5));
    settled = true;
    notes.boardIds.push(boardId);
  };

  await map.call({ customFields: [{ _id: 'cfNotes', value: 'x' }] }, 'boardB');
  assert.strictEqual(settled, true,
    'the returned array must not be handed back while addBoard is still running');
});

test('an unknown field id is passed through untouched', async () => {
  const world = makeWorld();
  const map = loadMapper(asyncCache(world));
  const out = await map.call({ customFields: [{ _id: 'gone', value: 'keep me' }] }, 'boardB');
  assert.deepStrictEqual(out, [{ _id: 'gone', value: 'keep me' }],
    'a definition that no longer exists must not cost the stored value');
});

test('an entry with no id is never matched against an arbitrary field', async () => {
  // getCustomField() defaults its selector to `{}`, so looking up an empty id
  // would return the FIRST custom field in the collection and re-key the value to
  // it - turning a blank entry (including one blanked by this very bug) into a
  // wrong value on the destination board.
  const world = makeWorld();
  const map = loadMapper(asyncCache(world));

  const out = await map.call({ customFields: [{ _id: '', value: 'orphan' }] }, 'boardB');
  assert.deepStrictEqual(out, [{ _id: '', value: 'orphan' }]);

  const undef = await map.call({ customFields: [{ value: 'orphan' }] }, 'boardB');
  assert.deepStrictEqual(undef, [{ value: 'orphan' }]);
});

test('the source card is not re-keyed by copying it elsewhere', async () => {
  // copy() works on a shallow copy of the card "to avoid mutating the source card
  // in ReactiveCache" - and the old `cf._id = …` reached straight through that
  // copy into the source card's own entry objects.
  const world = makeWorld();
  const map = loadMapper(asyncCache(world));
  const entry = { _id: 'cfA', value: 'hard' };
  const card = { customFields: [entry] };

  const out = await map.call(card, 'boardB');

  assert.strictEqual(entry._id, 'cfA', 'the card being copied FROM keeps its own field id');
  assert.notStrictEqual(out[0], entry, 'the result is a new entry, not the same object');
});

test('missing or malformed customFields still yields an array', async () => {
  const world = makeWorld();
  const map = loadMapper(asyncCache(world));
  assert.deepStrictEqual(await map.call({}, 'boardB'), []);
  assert.deepStrictEqual(await map.call({ customFields: null }, 'boardB'), []);
  // Legacy data has been seen storing `{}` here rather than an array.
  assert.deepStrictEqual(await map.call({ customFields: {} }, 'boardB'), []);
});

test('both callers await it', async () => {
  // An unawaited call puts a Promise straight into the document, which is how the
  // whole class of bug gets in.
  const calls = [...src.matchAll(/(\w*\s*)this\.mapCustomFieldsToBoard\(/g)];
  assert.ok(calls.length >= 2, `expected move() and copy() to call it, found ${calls.length}`);
  const unawaited = [...src.matchAll(/[^ ]\s*=\s*this\.mapCustomFieldsToBoard\(/g)];
  assert.deepStrictEqual(unawaited, [], 'every call site must be `await this.mapCustom…`');
  assert.strictEqual(
    (src.match(/= await this\.mapCustomFieldsToBoard\(/g) || []).length, calls.length,
    'move() and copy() both assign the AWAITED result');
});

(async () => {
  for (const [name, fn] of tests) {
    try {
      await fn();
      passed++;
      console.log('  ok -', name);
    } catch (err) {
      console.error(`  FAIL - ${name}\n    ${err.message}`);
      process.exitCode = 1;
    }
  }
  console.log(`\ncardCustomFieldsMove: ${passed} tests passed`);
})();
