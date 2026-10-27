'use strict';

// LinkedBoardActivitiesBleed (SnowBleed finding 13, Joshua Rogers of Aisle
// Research, fixed in v8.21, commit 91a936e07d): the 'activities' publication
// added the activities of every board LINKED from the requested board (a card
// of type cardType-linkedBoard points at it by linkedId) without asking
// whether the caller could see that linked board. Anybody able to link a
// private board's id into a board of their own read the private board's whole
// activity history. The fix keeps a linked board only when it is visible to
// the caller, and checks the requested board (or the card's board) too.
//
//   * the test runs the REAL publication (server/publications/activities.js)
//     against documents held in memory and inspects the selector it asks for:
//     the reporter's own board linking a private board yields only the own
//     board's id; a card feed of an invisible board yields nothing;
//   * the negative test sweeps the tree for code that collects linked boards
//     (cardType-linkedBoard ... linkedId) into something it publishes or
//     returns without a visibility check of the linked board.
//
// Run: node tests/linkedBoardActivitiesBleed.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const pending = [];
const test = (name, fn) => pending.push([name, fn]);

const { readableWithoutMembership } = require('../models/lib/boardPermission');
function boardProto() {
  const src = read('models/boards.js');
  const cut = name => {
    const i = src.indexOf(`\n  ${name}(`);
    assert.notStrictEqual(i, -1, `models/boards.js: ${name}() not found`);
    return src.slice(i, src.indexOf('\n  },', i) + 4);
  };
  return new Function('readableWithoutMembership', `return {${cut('isVisibleBy')},${cut('isActiveMember')}};`)(readableWithoutMembership);
}
const proto = boardProto();
const board = (id, permission, members) => Object.assign(Object.create(proto), { _id: id, permission, members });
const BOARDS = {
  mine: board('mine', 'private', [{ userId: 'attacker', isActive: true, isAdmin: true }]),
  victim: board('victim', 'private', [{ userId: 'owner', isActive: true, isAdmin: true }]),
  shared: board('shared', 'private', [{ userId: 'attacker', isActive: true }, { userId: 'owner', isActive: true }]),
};
const CARDS = [
  { _id: 'l1', type: 'cardType-linkedBoard', boardId: 'mine', linkedId: 'victim' },
  { _id: 'l2', type: 'cardType-linkedBoard', boardId: 'mine', linkedId: 'shared' },
  { _id: 'victimCard', boardId: 'victim' },
];

function publication() {
  const src = read('server/publications/activities.js').replace(/^import .*$/gm, '');
  let fn;
  const asked = [];
  const ReactiveCache = {
    getBoard: async id => BOARDS[id] || null,
    getCard: async id => CARDS.find(c => c._id === id) || null,
    getCards: async q => CARDS.filter(c => Object.entries(q).every(([k, v]) => c[k] === v)),
    getActivities: async selector => { asked.push(selector); return 'cursor'; },
  };
  const req = name => require(path.join(ROOT, name));
  new Function('Meteor', 'check', 'Match', 'ReactiveCache', 'getFeatureFlags', 'require', src)(
    { publish: (n, f) => { fn = f; } }, () => {}, { Where: () => {}, Maybe: () => {} },
    ReactiveCache, () => ({}), req);
  return {
    asked,
    async sub(userId, kind, id) {
      let ready = false;
      const r = await fn.call({ userId, ready() { ready = true; } }, kind, id, 20, true);
      return ready ? 'ready' : r;
    },
  };
}
const idsOf = selector => {
  const clause = selector.$and ? selector.$and[0] : selector;
  const [field] = Object.keys(clause);
  return { field, ids: clause[field].$in };
};

test('the reported attack: one\'s own board linking a private board does not carry its activities', async () => {
  const p = publication();
  assert.strictEqual(await p.sub('attacker', 'board', 'mine'), 'cursor');
  assert.deepStrictEqual(idsOf(p.asked[0]), { field: 'boardId', ids: ['mine', 'shared'] },
    'only the own board and the linked board the caller can see');
});

test('negative: the private board itself, and a card on it, publish nothing to a non-member', async () => {
  const p = publication();
  assert.strictEqual(await p.sub('attacker', 'board', 'victim'), 'ready');
  assert.strictEqual(await p.sub('attacker', 'card', 'victimCard'), 'ready');
  assert.strictEqual(await p.sub(null, 'board', 'mine'), 'ready', 'nor anything logged out');
  assert.strictEqual(await p.sub('attacker', 'board', 'gone'), 'ready');
  assert.deepStrictEqual(p.asked, [], 'no activity query was made');
});

test('the private board\'s own member still sees its linked boards\' activities', async () => {
  const p = publication();
  CARDS.push({ _id: 'l3', type: 'cardType-linkedBoard', boardId: 'victim', linkedId: 'shared' });
  assert.strictEqual(await p.sub('owner', 'board', 'victim'), 'cursor');
  assert.deepStrictEqual(idsOf(p.asked[0]).ids, ['victim', 'shared']);
});

// --- negative, whole tree ----------------------------------------------------
function walk(dir, out = []) {
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    if (['node_modules', '_build', '.build', '.tools', '.meteor', 'tests'].includes(e.name)) continue;
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) walk(rel, out);
    else if (/\.(js|cjs|mjs)$/.test(e.name)) out.push(rel);
  }
  return out;
}
// A server read that follows linked boards: it queries the linked-board cards
// and then uses their `linkedId`. Each such place must check the linked board.
const FOLLOWS = /["']type["']?\s*:\s*["']cardType-linkedBoard["'][\s\S]{0,600}?\.linkedId\b/g;
const LINKED_GUARD = /isVisibleBy\(|hasMember\(|isActiveMember\(|mayCopyFromBoard\(|checkBoardAccess\(/;

test('negative, whole tree: code that follows linked boards checks each linked board', () => {
  const unguarded = [];
  let count = 0;
  for (const file of [...walk('server'), ...walk('models'), ...walk('imports')]) {
    const src = read(file);
    for (const m of src.matchAll(FOLLOWS)) {
      // models/boards.js's activities() helper reads the client's Minimongo,
      // which holds only what the publication above sent; the next test pins
      // that no server code calls it.
      if (file === 'models/boards.js' && src.slice(Math.max(0, m.index - 120), m.index).includes('\n  activities() {')) continue;
      count += 1;
      const window = src.slice(m.index, m.index + m[0].length + 400);
      if (!LINKED_GUARD.test(window)) unguarded.push(`${file}:${src.slice(0, m.index).split('\n').length}`);
    }
  }
  assert.ok(count >= 1, `the sweep must see the activities publication (${count})`);
  assert.deepStrictEqual(unguarded, [], 'these follow a linked board without checking it');
});

test('negative: no server code calls the client-side Board.activities() helper', () => {
  const callers = [...walk('server'), ...walk('imports')].filter(f => /\.activities\(\)/.test(read(f)));
  assert.deepStrictEqual(callers, [], 'it follows linked boards unchecked - fine on the client, not on the server');
});

test('the sweep would catch the reported shape (negative of the negative)', () => {
  const vulnerable = `ReactiveCache.getCards({
      "type": "cardType-linkedBoard",
      "boardId": id}
      ).forEach(card => {
        linkedElmtId.push(card.linkedId);
    });`;
  const [m] = vulnerable.matchAll(FOLLOWS);
  assert.ok(m && !LINKED_GUARD.test(vulnerable));
});

(async () => {
  for (const [name, fn] of pending) { await fn(); console.log('  ok -', name); }
  console.log(`\nlinkedBoardActivitiesBleed: ${pending.length} tests passed`);
})().catch(e => { console.error(e); process.exit(1); });
