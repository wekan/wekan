'use strict';

// BoardTitleRESTBleed (SnowBleed finding 10, Joshua Rogers of Aisle Research,
// fixed in v8.21, commit 545566f566): PUT /api/boards/:boardId/title renamed
// the board named in the path without asking whether the caller had any right
// to THAT board. The fix put a check of the board in front of the write; the
// route now asks Authentication.checkBoardAdmin (a board admin, or a site
// admin), like every other board-settings route.
//
//   * the test runs the REAL route with the REAL Authentication object (both
//     cut from the source) against boards held in memory: the reporter's
//     non-member, a plain member and a read-only member are refused and the
//     title is left as it was; a board admin and a site admin rename it;
//   * the negative test sweeps every REST route in the tree that WRITES a board
//     document and fails on one with no board-admin / write check - a login or
//     read check alone is the reported shape. (The read side, every :boardId
//     route checking that board, is tests/restBoardDomainsAccess.test.cjs.)
//
// Run: node tests/boardTitleRestBleed.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const pending = [];
const test = (name, fn) => pending.push([name, fn]);

function fixture() {
  const board = {
    _id: 'priv', title: 'Original',
    members: [
      { userId: 'owner', isActive: true, isAdmin: true },
      { userId: 'member', isActive: true, isAdmin: false },
      { userId: 'reader', isActive: true, isReadOnly: true },
      { userId: 'formerAdmin', isActive: false, isAdmin: true },
    ],
  };
  const users = { siteadmin: { _id: 'siteadmin', isAdmin: true } };
  const recorded = [];
  const auth = read('server/authentication.js');
  const at = auth.indexOf('export const Authentication = {');
  const authSrc = auth.slice(at, auth.indexOf('\n};', at) + 3).replace('export const Authentication', 'globalThis.Authentication');
  const boards = read('server/models/boards.js');
  const start = boards.indexOf("WebApp.handlers.put('/api/boards/:boardId/title'");
  assert.notStrictEqual(start, -1, 'the title route');
  const routeSrc = boards.slice(start, boards.indexOf('\n});', start) + 4);
  let handler;
  class MeteorError extends Error { constructor(e, r) { super(r || e); this.error = e; this.reason = r; } }
  const context = vm.createContext({
    Meteor: { Error: MeteorError },
    ReactiveCache: {
      getBoard: async id => (id === board._id ? board : undefined),
      getUser: async q => (users[q._id] && (!q.isAdmin || users[q._id].isAdmin) ? users[q._id] : null),
    },
    Boards: { direct: { updateAsync: async (sel, mod) => { if (sel._id === board._id) Object.assign(board, mod.$set); } } },
    allowIsBoardMemberWithWriteAccess: () => false,
    tripCanary() {}, writeRefusalCanary() {},
    require: name => { assert.strictEqual(name, '/server/lib/securityLog'); return { record: e => recorded.push(e) }; },
    WebApp: { handlers: { put(p, fn) { handler = fn; } } },
    sendJsonResult: (res, result) => { res.result = result; },
    publicErrorData: error => ({ code: error.statusCode || 500, data: { error: error.reason || error.message } }),
  });
  vm.runInContext(authSrc, context);
  vm.runInContext(routeSrc, context);
  return {
    board, recorded,
    async put(userId, title, boardId = board._id) {
      const res = {};
      await handler({ userId, params: { boardId }, body: { title }, headers: {} }, res);
      return res.result;
    },
  };
}

test('the reported attack: a non-member renames nothing, and the attempt is recorded', async () => {
  const f = fixture();
  const result = await f.put('stranger', 'Pwned');
  assert.strictEqual(result.code, 403);
  assert.strictEqual(f.board.title, 'Original');
  assert.ok(f.recorded.some(e => e.key === 'authz.manage-board' && e.action === 'blocked'));
});

test('negative: no member without the admin role renames it, nor anybody logged out', async () => {
  const f = fixture();
  for (const userId of ['member', 'reader', 'formerAdmin']) {
    assert.strictEqual((await f.put(userId, 'x')).code, 403, userId);
  }
  assert.strictEqual((await f.put(undefined, 'x')).code, 401);
  assert.strictEqual((await f.put('stranger', 'x', 'no-such-board')).code, 404);
  assert.strictEqual(f.board.title, 'Original');
});

test('a board admin and a site admin rename it', async () => {
  const f = fixture();
  assert.strictEqual((await f.put('owner', 'By owner')).code, 200);
  assert.strictEqual(f.board.title, 'By owner');
  assert.strictEqual((await f.put('siteadmin', 'By site admin')).code, 200);
  assert.strictEqual(f.board.title, 'By site admin');
});

// --- negative, whole tree ----------------------------------------------------
const WRITE_CHECKS = [
  /Authentication\.checkBoard(?:WriteAccess|Admin)\(/,
  /Authentication\.checkUserId\(/, // the SITE ADMIN check, despite its name
  /Authentication\.checkAdminOrCondition\(/,
  /allowIsBoardAdmin\(/,
  /allowIsBoardMemberWithWriteAccess\(/,
  /userHasBoardWriteAccess\(/,
  /callAsUser\(/, // the Meteor method checks the board
];
const WRITES_BOARD = /Boards\.(?:direct\.)?(?:update|updateAsync|upsert|upsertAsync|remove|removeAsync)\(/;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    if (['node_modules', '_build', '.build', '.tools', '.meteor', 'tests'].includes(e.name)) continue;
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) walk(rel, out);
    else if (/\.(js|cjs|mjs)$/.test(e.name)) out.push(rel);
  }
  return out;
}

function routes(src) {
  const out = [];
  const re = /WebApp\.(?:handlers|connectHandlers|rawHandlers)\.(post|put|delete|patch)\(\s*['"`]([^'"`]*:boardId[^'"`]*)['"`]/g;
  let m;
  while ((m = re.exec(src))) {
    const rest = src.slice(m.index + 1);
    const end = rest.search(/\n\s*WebApp\.(?:handlers|connectHandlers|rawHandlers)\./);
    out.push({ route: `${m[1].toUpperCase()} ${m[2]}`, body: end < 0 ? rest : rest.slice(0, end) });
  }
  return out;
}

test('negative, whole tree: every REST route that writes a board checks admin or write access', () => {
  const unguarded = [];
  let writers = 0;
  for (const file of [...walk('server'), ...walk('models'), ...walk('packages')]) {
    for (const { route, body } of routes(read(file))) {
      if (!WRITES_BOARD.test(body)) continue;
      writers += 1;
      if (!WRITE_CHECKS.some(c => c.test(body))) unguarded.push(`${file}: ${route}`);
    }
  }
  assert.ok(writers >= 5, `the sweep must see the board-writing routes (${writers})`);
  assert.deepStrictEqual(unguarded, [], 'these change a board named by the caller without an admin or write check');
});

test('the sweep would catch the reported shape (negative of the negative)', () => {
  const vulnerable = `WebApp.handlers.put('/api/boards/:boardId/title', async function(req, res) {
    await Authentication.checkBoardAccess(req.userId, req.params.boardId);
    await Boards.direct.updateAsync({ _id: req.params.boardId }, { $set: { title: req.body.title } });
  });`;
  const [r] = routes(vulnerable);
  assert.ok(WRITES_BOARD.test(r.body) && !WRITE_CHECKS.some(c => c.test(r.body)));
});

(async () => {
  for (const [name, fn] of pending) { await fn(); console.log('  ok -', name); }
  console.log(`\nboardTitleRestBleed: ${pending.length} tests passed`);
})().catch(e => { console.error(e); process.exit(1); });
