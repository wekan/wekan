'use strict';

// CardPubSubBleed (SnowBleed finding 11, Joshua Rogers of Aisle Research,
// fixed in v8.21, commit 0f5a9c3877): the 'card' and 'popupCardData'
// publications took a card id from the client and published the card - and
// popupCardData its board and every list of it - checking only the
// assigned-only rule for MEMBERS. A user who was not a member of the card's
// private board, or who was not logged in at all, skipped that rule and got
// the card. The fix asks first whether the card's board is visible to the
// caller. Since then 'card' goes through server/lib/openCardAccess.js
// (readableCard), and 'openCardData' - the open card's comments, attachments,
// checklists - has the same check.
//
//   * the test runs the REAL readableCard and the REAL openCardData and
//     popupCardData bodies against documents held in memory: a non-member and
//     an anonymous caller get nothing of a private board's card, an
//     assigned-only member only the cards assigned to them;
//   * the negative test sweeps every publication in the tree whose argument is
//     a card id and fails on one that does not check the card's board.
//
// Run: node tests/cardPubSubBleed.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const pending = [];
const test = (name, fn) => pending.push([name, fn]);

const { readableWithoutMembership } = require('../models/lib/boardPermission');
const findWhere = (arr, props) => arr && arr.find(item => Object.keys(props).every(k => item[k] === props[k]));
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
const BOARDS = {
  priv: Object.assign(Object.create(proto), { _id: 'priv', permission: 'private', members: [
    { userId: 'member', isActive: true },
    { userId: 'assignedOnly', isActive: true, isNormalAssignedOnly: true },
  ] }),
  pub: Object.assign(Object.create(proto), { _id: 'pub', permission: 'public', members: [] }),
};
const CARDS = {
  secret: { _id: 'secret', boardId: 'priv', assignees: [] },
  assigned: { _id: 'assigned', boardId: 'priv', assignees: ['assignedOnly'] },
  open: { _id: 'open', boardId: 'pub' },
};
const CURSOR = Symbol('cursor');
const ReactiveCache = {
  getCard: async q => CARDS[q._id] || null,
  getBoard: async q => BOARDS[q._id] || null,
  getCards: async () => CURSOR,
};

const access = read('server/lib/openCardAccess.js');
const readableCard = new Function('ReactiveCache', 'findWhere',
  `${access.replace(/^import .*$/gm, '').replace('export async function', 'async function')}\nreturn readableCard;`)(ReactiveCache, findWhere);

const pubs = read('server/publications/cards.js');
function composite(name) {
  const start = pubs.indexOf(`publishComposite('${name}'`);
  assert.notStrictEqual(start, -1, name);
  let fn;
  new Function('publishComposite', 'check', 'ReactiveCache', 'findWhere', pubs.slice(start, pubs.indexOf('\n});', start) + 4))(
    (n, f) => { fn = f; }, () => {}, ReactiveCache, findWhere);
  return async (userId, cardId) => {
    const r = await fn.call({ userId }, cardId);
    // Nothing published: [] or a find() that yields []; something: a find() of the card.
    if (Array.isArray(r)) return false;
    return (await r.find()) === CURSOR;
  };
}
const openCardData = composite('openCardData');
const popupCardData = composite('popupCardData');

test('the card publication delegates to readableCard and publishes only what it allows', () => {
  const at = pubs.indexOf("Meteor.publish('card'");
  const body = pubs.slice(at, pubs.indexOf('\n});', at));
  assert.match(body, /const card = await readableCard\(this\.userId, cardId\);\n\s+if \(!card\) return \[\];/);
});

test('the reported attack: a non-member and an anonymous caller get nothing of a private card', async () => {
  for (const userId of ['stranger', null, undefined]) {
    assert.strictEqual(await readableCard(userId, 'secret'), null, `card: ${userId}`);
    assert.strictEqual(await openCardData(userId, 'secret'), false, `openCardData: ${userId}`);
    assert.strictEqual(await popupCardData(userId, 'secret'), false, `popupCardData: ${userId}`);
  }
});

test('negative: an assigned-only member gets only the cards assigned to them; unknown ids nothing', async () => {
  assert.strictEqual(await readableCard('assignedOnly', 'secret'), null);
  assert.strictEqual(await openCardData('assignedOnly', 'secret'), false);
  assert.strictEqual(await popupCardData('assignedOnly', 'secret'), false);
  assert.strictEqual(await popupCardData('assignedOnly', 'assigned'), true);
  for (const id of ['gone']) {
    assert.strictEqual(await readableCard('member', id), null);
    assert.strictEqual(await popupCardData('member', id), false);
  }
});

test('a member, and anybody on a public board, still get the card', async () => {
  assert.strictEqual(await readableCard('member', 'secret'), CARDS.secret);
  assert.strictEqual(await openCardData('member', 'secret'), true);
  assert.strictEqual(await popupCardData('member', 'secret'), true);
  assert.strictEqual(await readableCard(null, 'open'), CARDS.open);
  assert.strictEqual(await popupCardData('stranger', 'open'), true);
});

// --- negative, whole tree ----------------------------------------------------
const CARD_GUARD = /isVisibleBy\(|readableCard\(|editableCard\(/;
function walk(dir, out = []) {
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    if (['node_modules', '_build', '.build', '.tools', '.meteor', 'tests'].includes(e.name)) continue;
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) walk(rel, out);
    else if (/\.(js|cjs|mjs)$/.test(e.name)) out.push(rel);
  }
  return out;
}
function cardPublications(src) {
  const out = [];
  const re = /(?:Meteor\.publish|publishComposite|Meteor\.publishRelations)\(\s*'([^']+)',\s*(?:async\s+)?(?:function\s*)?\(\s*cardId\b/g;
  let m;
  while ((m = re.exec(src))) {
    const end = src.indexOf('\n});', m.index);
    out.push({ name: m[1], body: src.slice(m.index, end < 0 ? undefined : end) });
  }
  return out;
}

test('negative, whole tree: every publication taking a card id checks the card\'s board', () => {
  const unguarded = [];
  let count = 0;
  for (const file of [...walk('server'), ...walk('models'), ...walk('packages')]) {
    for (const { name, body } of cardPublications(read(file))) {
      count += 1;
      if (!CARD_GUARD.test(body)) unguarded.push(`${file}: ${name}`);
    }
  }
  assert.ok(count >= 4, `the sweep must see the card publications (${count})`);
  assert.deepStrictEqual(unguarded, [], 'these publish a card the caller names without checking its board');
});

test('the sweep would catch the reported shape (negative of the negative)', () => {
  const vulnerable = `Meteor.publish('card', cardId => {
  const card = ReactiveCache.getCard({ _id: cardId });
  return ReactiveCache.getCards({ _id: cardId }, {}, true);
});`;
  const [p] = cardPublications(vulnerable.replace('cardId =>', 'function(cardId)'));
  assert.ok(p && !CARD_GUARD.test(p.body));
});

(async () => {
  for (const [name, fn] of pending) { await fn(); console.log('  ok -', name); }
  console.log(`\ncardPubSubBleed: ${pending.length} tests passed`);
})().catch(e => { console.error(e); process.exit(1); });
