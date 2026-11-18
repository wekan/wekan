'use strict';

// RaceBleed (GHSA-3vjg-3p4q-8fwh): a card's children are destroyed only for a
// card whose own removal really happened.
//
// The REST card delete looked the card up on the board the caller was
// authorised for, destroyed its checklists, checklist items, comments,
// attachments and subcards by cardId alone, and removed the card itself last,
// keyed on that board. A move to another board landing in between left the card
// alive on a board the deleter cannot read, with every child gone. The hooked
// removals had the same shape: collection-hooks runs Cards.before.remove (the
// cascade) and then removes by the caller's ORIGINAL selector.
//
// The first tests replay the reporter's race against the pure decision with an
// in-memory store; the rest read the source and fail if any card cascade can run
// before - or without - the card's own removal, anywhere in server/.
//
// Run: node tests/claimedCardRemoval.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { removeClaimedCard, cascadeIfRemoved } = require('../models/lib/claimedCardRemoval');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

// A tiny store: cards by id, and the children cardRemover would destroy.
function store() {
  const cards = new Map([['c', { _id: 'c', boardId: 'A', listId: 'l' }]]);
  const children = new Map([['c', ['checklist', 'item', 'comment', 'attachment']]]);
  const matches = (doc, sel) => Object.entries(sel).every(([k, v]) => doc[k] === v);
  return {
    cards,
    children,
    move(id, boardId) { const d = cards.get(id); if (d) d.boardId = boardId; },
    async removeCard(sel) {
      const doc = cards.get(sel._id);
      if (!doc || !matches(doc, sel)) return 0;
      cards.delete(sel._id);
      return 1;
    },
    async cascade(card) { children.delete(card._id); },
    async exists(id) { return cards.has(id); },
  };
}

test('the reporter\'s race: the move lands after the lookup, the delete touches nothing', async () => {
  const s = store();
  const looked = { ...s.cards.get('c') }; // the DELETE handler's board-scoped lookup
  s.move('c', 'Secret');                   // the admin's PUT wins the window
  const removed = await removeClaimedCard({
    card: looked, selector: { boardId: 'A', listId: 'l' },
    removeCard: sel => s.removeCard(sel), cascade: c => s.cascade(c),
  });
  assert.equal(removed, false, 'the delete lost the race and says so (the handler answers 404)');
  assert.equal(s.cards.get('c').boardId, 'Secret', 'the card is on the board it was moved to');
  assert.deepEqual(s.children.get('c'), ['checklist', 'item', 'comment', 'attachment'],
    'and keeps every checklist, item, comment and attachment');
});

test('negative: the old order - children first, guarded removal last - loses them in that race', async () => {
  // What the code did before: kept here so the test proves the race is real
  // rather than that the new helper happens to pass.
  const s = store();
  const looked = { ...s.cards.get('c') };
  s.move('c', 'Secret');
  await s.cascade(looked);
  const removed = await s.removeCard({ _id: 'c', boardId: 'A', listId: 'l' });
  assert.equal(removed, 0);
  assert.ok(s.cards.has('c') && !s.children.has('c'), 'the card survived without its children');
});

test('the delete wins: the card is gone, then its children, and a later move finds nothing', async () => {
  const s = store();
  const removed = await removeClaimedCard({
    card: { ...s.cards.get('c') }, selector: { boardId: 'A', listId: 'l' },
    removeCard: sel => s.removeCard(sel), cascade: c => s.cascade(c),
  });
  assert.equal(removed, true);
  assert.ok(!s.cards.has('c') && !s.children.has('c'));
  s.move('c', 'Secret');
  assert.ok(!s.cards.has('c'), 'nothing is left to move');
});

test('the selector can never be widened past the card: _id always comes from the card', async () => {
  const seen = [];
  await removeClaimedCard({
    card: { _id: 'c' }, selector: { _id: 'other', boardId: 'A' },
    removeCard: async sel => { seen.push(sel); return 0; }, cascade: async () => assert.fail('no cascade'),
  });
  assert.deepEqual(seen, [{ _id: 'c', boardId: 'A' }]);
  for (const card of [null, undefined, {}, { _id: '' }, { _id: { $ne: null } }]) {
    assert.equal(await removeClaimedCard({
      card, selector: {}, removeCard: async () => assert.fail('no removal'), cascade: async () => assert.fail('no cascade'),
    }), false, JSON.stringify(card));
  }
});

test('after.remove: the cascade runs for a card that is gone, never for one that stayed', async () => {
  const s = store();
  const doc = { ...s.cards.get('c') };
  assert.equal(await cascadeIfRemoved({ doc, exists: id => s.exists(id), cascade: c => s.cascade(c) }), false,
    'collection-hooks calls after.remove for a fetched card the selector no longer matched');
  assert.ok(s.children.has('c'));
  s.cards.delete('c');
  assert.equal(await cascadeIfRemoved({ doc, exists: id => s.exists(id), cascade: c => s.cascade(c) }), true);
  assert.ok(!s.children.has('c'));
});

// ── the shape, everywhere ────────────────────────────────────────────────────

// Every server file, without the bundler's copy (_build) or the tool area.
function serverFiles(dir = 'server', out = []) {
  for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entry.name);
    if (entry.isDirectory()) serverFiles(rel, out);
    else if (entry.name.endsWith('.js')) out.push(rel);
  }
  return out;
}

test('negative: no card cascade runs in Cards.before.remove, anywhere in server/', () => {
  // A before hook runs before the removal it cannot know will match.
  for (const file of serverFiles()) {
    const src = read(file);
    let at = -1;
    while ((at = src.indexOf('Cards.before.remove(', at + 1)) !== -1) {
      const body = src.slice(at, src.indexOf('\n});', at));
      for (const shape of ['cardRemover(', '.removeAsync(', 'customFieldLinks: {']) {
        assert.ok(!body.includes(shape), `${file}: Cards.before.remove must not run ${shape}`);
      }
    }
  }
});

test('negative: every direct cardRemover call goes through the claim', () => {
  for (const file of serverFiles()) {
    const src = read(file);
    let at = -1;
    while ((at = src.indexOf('cardRemover(', at + 1)) !== -1) {
      const line = src.slice(src.lastIndexOf('\n', at) + 1, src.indexOf('\n', at));
      if (/^\s*(\/\/|\*)/.test(line) || /^\s*cardRemover,\s*$/.test(line)) continue;
      assert.match(line, /cascade: \w+ => cardRemover\(/, `${file}: ${line.trim()}`);
    }
  }
  const cards = read('server/models/cards.js');
  assert.equal((cards.match(/removeClaimedCard\(\{/g) || []).length, 2, 'the single and the bulk delete');
  assert.ok(/Cards\.after\.remove\(async \(userId, doc\) => \{\s*await cascadeIfRemoved\(/.test(cards),
    'the hooked removals cascade from after.remove, gated on the card being gone');
});

test('negative: a list deletion removes a card only while it is still in that list', () => {
  const lists = read('server/models/lists.js');
  const hook = lists.slice(lists.indexOf('Lists.before.remove('), lists.indexOf('\n});', lists.indexOf('Lists.before.remove(')));
  assert.ok(!/Cards\.removeAsync\(card\._id\)/.test(hook), 'not by a bare id, which follows a moved card');
  assert.equal((hook.match(/Cards\.removeAsync\(\{ _id: card\._id, listId: doc\._id \}\)/g) || []).length, 2);
});

test('the lost race is visible in Admin Panel / Problems as RaceBleed', () => {
  const cards = read('server/models/cards.js');
  assert.match(cards, /key: 'authz\.card-delete-race', action: 'blocked'/);
  const entry = require('../models/lib/securityCategories').CATALOG['authz.card-delete-race'];
  assert.ok(entry, 'the catalog key exists');
  assert.equal(entry.bleed, 'RaceBleed');
  assert.equal(entry.cwe, 'CWE-367');
  // A member whose delete arrived after somebody else's move is not attacking:
  // the record must never disable the account (negative: PurgeBleed's does).
  assert.equal(entry.blocksAccount, false);
  assert.notEqual(require('../models/lib/securityCategories').CATALOG['authz.card-delete'].blocksAccount, false);
});

test('negative: the REST board move that lost to a delete is a 404, never a crash in cardMove', () => {
  // The other half of the race: the delete won, so the move's keyed update
  // matched nothing, and cardMove then read `boardId` of a card that is gone
  // (500). The update's count decides, before anything else runs for it.
  const cards = read('server/models/cards.js');
  const at = cards.indexOf('const movedCount = await Cards.direct.updateAsync(');
  assert.ok(at > 0, 'the board move keeps its update count');
  const after = cards.slice(at, cards.indexOf('await cardMove(', at));
  assert.match(after, /if \(!movedCount\) \{\s*sendJsonResult\(res, \{ code: 404, data: \{ error: 'Card not found' \} \}\);\s*return;/);
  assert.ok(after.indexOf('if (!movedCount)') < after.indexOf('syncCardChildrenBoard('), 'before the children are re-homed');
});
