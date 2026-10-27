'use strict';

// ChecklistRESTBleed (SnowBleed finding 3, Joshua Rogers of Aisle Research,
// fixed in v8.21, commit 251d49eea9): the checklist item REST routes
//   GET|PUT|DELETE /api/boards/:boardId/cards/:cardId/checklists/:checklistId/items/:itemId
//   POST           /api/boards/:boardId/cards/:cardId/checklists/:checklistId/items
// checked access to the board in the PATH and then loaded the item by its id
// alone. A member of any board could name their own board and another board's
// item id, and read, rename, tick or delete it (an IDOR). The routes now
// insist that the item belongs to the checklist and the card in the path, and
// the card to the board in the path - otherwise 404, and nothing is written.
//
//   * the test runs the REAL four handlers (cut from server/models/
//     checklistItems.js) against documents held in memory, with the reporter's
//     attack - an item of a private board through the caller's own board;
//   * the negative test sweeps every REST route of a card child (checklists,
//     checklist items, comments) in the tree and fails on one that does not
//     bind the record it loads to the card AND the board of the path.
//
// Run: node tests/checklistRestBleed.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const pending = [];
const test = (name, fn) => pending.push([name, fn]);

function fixture() {
  const cards = {
    mine: { _id: 'mine', boardId: 'own' },
    victim: { _id: 'victim', boardId: 'private' },
  };
  const checklists = {
    myList: { _id: 'myList', cardId: 'mine' },
    victimList: { _id: 'victimList', cardId: 'victim' },
  };
  const items = {
    myItem: { _id: 'myItem', cardId: 'mine', checklistId: 'myList', title: 'mine', isFinished: false },
    secret: { _id: 'secret', cardId: 'victim', checklistId: 'victimList', title: 'SECRET', isFinished: false },
  };
  const inserted = [];
  const src = read('server/models/checklistItems.js');
  const routesSrc = src.slice(src.indexOf('WebApp.handlers.get('));
  const handlers = {};
  const context = vm.createContext({
    // The caller has full access to their own board only - as the reporter.
    Authentication: {
      async checkBoardAccess(userId, boardId) { if (boardId !== 'own') throw Object.assign(new Error('Forbidden'), { statusCode: 403 }); },
      async checkBoardWriteAccess(userId, boardId) { if (boardId !== 'own') throw Object.assign(new Error('Forbidden'), { statusCode: 403 }); },
    },
    ReactiveCache: {
      getChecklistItem: async id => items[id] || null,
      getChecklistItems: async () => [],
      getCard: async id => cards[id] || null,
      getChecklist: async q => (checklists[q._id] && checklists[q._id].cardId === q.cardId ? checklists[q._id] : null),
    },
    ChecklistItems: {
      insertAsync: async doc => { inserted.push(doc); return 'new'; },
      direct: {
        updateAsync: async (sel, mod) => { if (items[sel._id] && mod.$set) Object.assign(items[sel._id], mod.$set); },
        removeAsync: async sel => { delete items[sel._id]; },
      },
    },
    parseDueAt: require('../server/lib/checklistDeadlines').parseDueAt,
    sendJsonResult: (res, result) => { res.result = result; },
    WebApp: { handlers: Object.fromEntries(['get', 'post', 'put', 'delete'].map(v => [v, (p, fn) => { handlers[v] = fn; }])) },
  });
  vm.runInContext(routesSrc, context);
  const call = async (verb, params, body = {}) => {
    const res = {};
    await handlers[verb]({ userId: 'u', params, body, headers: {} }, res);
    return res.result;
  };
  return { items, inserted, call };
}

const ATTACK = { boardId: 'own', cardId: 'mine', checklistId: 'myList', itemId: 'secret' };

test('the reported attack: another board\'s item through one\'s own board - 404 and untouched', async () => {
  const f = fixture();
  const got = await f.call('get', ATTACK);
  assert.strictEqual(got.code, 404);
  assert.ok(!JSON.stringify(got).includes('SECRET'), 'nothing of the item is returned');
  assert.strictEqual((await f.call('put', ATTACK, { title: 'pwned', isFinished: 'true' })).code, 404);
  assert.deepStrictEqual([f.items.secret.title, f.items.secret.isFinished], ['SECRET', false]);
  assert.strictEqual((await f.call('delete', ATTACK)).code, 404);
  assert.ok(f.items.secret, 'not deleted');
});

test('negative: every mismatched path is refused - the item, checklist, card or board', async () => {
  const f = fixture();
  for (const params of [
    { ...ATTACK, cardId: 'victim', checklistId: 'victimList' }, // the item's own card, but one's own board
    { boardId: 'own', cardId: 'mine', checklistId: 'victimList', itemId: 'myItem' }, // wrong checklist
    { boardId: 'own', cardId: 'victim', checklistId: 'myList', itemId: 'myItem' }, // wrong card
    { boardId: 'own', cardId: 'mine', checklistId: 'myList', itemId: 'gone' },
  ]) {
    for (const verb of ['get', 'put', 'delete']) {
      assert.strictEqual((await f.call(verb, params, { title: 'x' })).code, 404, `${verb} ${JSON.stringify(params)}`);
    }
  }
  // Creating an item in another board's checklist through one's own board.
  assert.strictEqual((await f.call('post', { boardId: 'own', cardId: 'victim', checklistId: 'victimList' }, { title: 'x' })).code, 404);
  assert.strictEqual((await f.call('post', { boardId: 'own', cardId: 'mine', checklistId: 'victimList' }, { title: 'x' })).code, 404);
  assert.deepStrictEqual(f.inserted, []);
  assert.deepStrictEqual(f.items.myItem.title, 'mine');
  // And the board in the path is still checked first.
  await assert.rejects(f.call('get', { boardId: 'private', cardId: 'victim', checklistId: 'victimList', itemId: 'secret' }), /Forbidden/);
});

test('one\'s own item is read, changed, created and deleted as before', async () => {
  const f = fixture();
  const own = { boardId: 'own', cardId: 'mine', checklistId: 'myList', itemId: 'myItem' };
  assert.strictEqual((await f.call('get', own)).code, 200);
  assert.strictEqual((await f.call('put', own, { title: 'renamed', isFinished: 'true' })).code, 200);
  assert.deepStrictEqual([f.items.myItem.title, f.items.myItem.isFinished], ['renamed', true]);
  assert.strictEqual((await f.call('post', { boardId: 'own', cardId: 'mine', checklistId: 'myList' }, { title: 'new' })).code, 200);
  assert.strictEqual(f.inserted.length, 1);
  assert.strictEqual((await f.call('delete', own)).code, 200);
  assert.ok(!f.items.myItem);
});

// --- negative, whole tree ----------------------------------------------------
const BINDS_CARD = /cardId(?::\s*paramCardId|\s*[!=]==\s*paramCardId)/;
const BINDS_BOARD = /boardId(?::\s*paramBoardId|\s*[!=]==\s*paramBoardId)/;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    if (['node_modules', '_build', '.build', '.tools', '.meteor', 'tests'].includes(e.name)) continue;
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) walk(rel, out);
    else if (/\.(js|cjs|mjs)$/.test(e.name)) out.push(rel);
  }
  return out;
}

function childRoutes(src) {
  const out = [];
  const re = /WebApp\.(?:handlers|connectHandlers|rawHandlers)\.(get|post|put|delete|patch)\(\s*['"`]([^'"`]*\/cards\/:cardId\/(?:checklists|comments)\/:[^'"`]*)['"`]/g;
  let m;
  while ((m = re.exec(src))) {
    const rest = src.slice(m.index + 1);
    const end = rest.search(/\n\s*WebApp\.(?:handlers|connectHandlers|rawHandlers)\./);
    out.push({ route: `${m[1].toUpperCase()} ${m[2]}`, path: m[2], body: end < 0 ? rest : rest.slice(0, end) });
  }
  return out;
}

test('negative, whole tree: every card-child REST route binds its record to the path\'s card and board', () => {
  const unbound = [];
  let count = 0;
  for (const file of [...walk('server'), ...walk('models'), ...walk('packages')]) {
    for (const r of childRoutes(read(file))) {
      count += 1;
      const missing = [];
      if (!BINDS_CARD.test(r.body)) missing.push('card');
      if (!BINDS_BOARD.test(r.body)) missing.push('board');
      if (/:itemId/.test(r.path) && !/checklistId(?::\s*paramChecklistId|\s*[!=]==\s*paramChecklistId)/.test(r.body)) missing.push('checklist');
      if (missing.length) unbound.push(`${file}: ${r.route} (${missing.join(', ')})`);
    }
  }
  assert.ok(count >= 9, `the sweep must see the checklist and comment routes (${count})`);
  assert.deepStrictEqual(unbound, [], 'these load a record by id without tying it to the path');
});

test('the sweep would catch the reported shape (negative of the negative)', () => {
  const vulnerable = `WebApp.handlers.get(
  '/api/boards/:boardId/cards/:cardId/checklists/:checklistId/items/:itemId',
  async function(req, res) {
    const paramBoardId = req.params.boardId;
    await Authentication.checkBoardAccess(req.userId, paramBoardId);
    sendJsonResult(res, { code: 200, data: await ReactiveCache.getChecklistItem(req.params.itemId) });
  });`;
  const [r] = childRoutes(vulnerable);
  assert.ok(!BINDS_CARD.test(r.body) && !BINDS_BOARD.test(r.body));
});

(async () => {
  for (const [name, fn] of pending) { await fn(); console.log('  ok -', name); }
  console.log(`\nchecklistRestBleed: ${pending.length} tests passed`);
})().catch(e => { console.error(e); process.exit(1); });
