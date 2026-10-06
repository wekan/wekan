'use strict';
// GHSA-r3c4-5xwp-vf54 reported GET /api/boards/:boardId/domains as readable by
// any logged-in user, because the route calls Authentication.checkUserId and
// the report took that for a login check. It is the SITE ADMIN check: a
// logged-in caller who is not an admin gets 403. The route has answered only
// site admins since it was added (#5850, v9.59): Meteor's findOneAsync gives
// `undefined` for no match, so even the `admin === undefined` test it used until
// v12.15 refused everyone else. Not vulnerable; these tests keep it that way.
//
//   * the test runs the REAL route handler with the REAL Authentication object
//     (both cut from the source), against boards held in memory - the
//     reporter's non-member, and the board's own members, are refused;
//   * the negative test sweeps every REST route with :boardId in its path, in
//     the whole tree, and fails on one that checks neither access to THAT board
//     nor a site admin - a login check alone is the shape the report described.
//
// Run: node --test tests/restBoardDomainsAccess.test.cjs
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const BOARD = {
  _id: 'private-board',
  domains: [{domain: 'partner.example', isActive: true}],
  members: [
    {userId: 'member', isActive: true, isAdmin: false},
    {userId: 'commenter', isActive: true, isCommentOnly: true},
    {userId: 'gone', isActive: false},
  ],
};
const USERS = {admin: {_id: 'admin', isAdmin: true}};

function route() {
  const auth = read('server/authentication.js');
  const authSrc = auth.slice(auth.indexOf('export const Authentication = {'), auth.indexOf('\n};', auth.indexOf('export const Authentication = {')) + 3)
    .replace('export const Authentication', 'globalThis.Authentication');
  const boards = read('server/models/boards.js');
  const start = boards.indexOf("WebApp.handlers.get('/api/boards/:boardId/domains'");
  const routeSrc = boards.slice(start, boards.indexOf('\n});', start) + 4);
  let handler;
  class MeteorError extends Error {
    constructor(error, reason) { super(reason || error); this.error = error; this.reason = reason; }
  }
  const context = vm.createContext({
    Meteor: {Error: MeteorError},
    ReactiveCache: {
      getBoard: async id => (id === BOARD._id ? BOARD : undefined),
      getUser: async query => (USERS[query._id] && (!query.isAdmin || USERS[query._id].isAdmin) ? USERS[query._id] : null),
    },
    allowIsBoardMemberWithWriteAccess: () => false,
    tripCanary() {},
    writeRefusalCanary() {},
    require: name => { throw new Error(`unexpected require ${name}`); },
    WebApp: {handlers: {get(p, fn) { handler = fn; }}},
    sendJsonResult: (res, result) => { res.result = result; },
    publicErrorData: error => ({code: error.statusCode || 500, data: {error: error.reason || error.message}}),
  });
  vm.runInContext(authSrc, context);
  vm.runInContext(routeSrc, context);
  return {
    async get(userId, boardId = BOARD._id) {
      const res = {};
      await handler({userId, params: {boardId}, headers: {}}, res);
      return res.result;
    },
  };
}

test('a site admin reads the domains', async () => {
  const r = route();
  assert.deepEqual(JSON.parse(JSON.stringify(await r.get('admin'))), {code: 200, data: BOARD.domains});
});

test('the reporter\'s attack: an authenticated non-member is refused with nothing disclosed', async () => {
  const r = route();
  const result = await r.get('outsider');
  assert.equal(result.code, 403);
  assert.ok(!JSON.stringify(result).includes('partner.example'), 'no domain in the refusal');
});

test('negative: nobody else gets the list through this route either', async () => {
  const r = route();
  // Members included - they read `domains` with the board, from
  // GET /api/boards/:boardId, which checks board access.
  for (const userId of ['member', 'commenter', 'gone']) {
    const result = await r.get(userId);
    assert.equal(result.code, 403, userId);
    assert.ok(!JSON.stringify(result).includes('partner.example'), userId);
  }
  assert.equal((await r.get(undefined)).code, 401, 'not logged in');
  assert.equal((await r.get(null)).code, 401, 'a null user id is not a user');
  // A missing board is refused the same way an existing one is, so the route
  // tells a non-admin nothing about which boards exist.
  assert.deepEqual((await r.get('outsider', 'no-such-board')).code, (await r.get('outsider')).code);
});

test('checkUserId is the site admin check, and the route keeps using it', () => {
  const auth = read('server/authentication.js');
  const body = auth.slice(auth.indexOf('async checkUserId('), auth.indexOf('checkLoggedIn(userId)'));
  assert.match(body, /ReactiveCache\.getUser\(\{ _id: userId, isAdmin: true \}\)/);
  assert.match(body, /if \(!admin\)/, 'and refuses anything that is not an admin document');
  const boards = read('server/models/boards.js');
  const start = boards.indexOf("WebApp.handlers.get('/api/boards/:boardId/domains'");
  const route = boards.slice(start, boards.indexOf('\n});', start));
  assert.ok(route.indexOf('Authentication.checkUserId(req.userId)') < route.indexOf('board.domains'),
    'the admin check runs before anything is read');
});

// --- negative, whole tree ----------------------------------------------------
// What counts as checking access to the board named in the path. Each is a
// helper that loads THAT board and refuses a caller without access to it.
const BOARD_CHECKS = [
  /Authentication\.checkBoard(?:Access|WriteAccess|Admin)\(/,
  /Authentication\.checkUserId\(/, // the SITE ADMIN check, despite its name
  /Authentication\.checkAdminOrCondition\(/,
  /allowIsBoardAdmin\(/,
  /allowIsBoardMemberWithWriteAccess\(/, // the board's write capability table
  /\.canExport\(/, // exporters: board.isVisibleBy(user)
  /\.hasMember\(/,
  /callAsUser\(/, // runs the Meteor method as the caller; the method checks the board
  /checkRestDependencyAccess\(/,
  /userHasBoardWriteAccess\(/,
];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(path.join(ROOT, dir), {withFileTypes: true})) {
    if (['node_modules', '_build', '.build', '.tools', '.meteor', 'tests'].includes(entry.name)) continue;
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) walk(rel, out);
    else if (/\.(js|cjs|mjs)$/.test(entry.name)) out.push(rel);
  }
  return out;
}

// The handler's body, and the body of a same-file function it hands the
// request to (cardMemberFieldHandler, handleAttachmentList, ...).
function handlerSource(src, at) {
  const rest = src.slice(at);
  const end = rest.search(/\n\s*WebApp\.(?:handlers|connectHandlers|rawHandlers)\./);
  let body = end < 0 ? rest : rest.slice(0, end);
  const delegated = [...body.matchAll(/(?:await\s+|,\s*)([A-Za-z_$][\w$]*)\s*(?:\(\s*req\b|\))/g)].map(m => m[1]);
  for (const name of new Set(delegated)) {
    const def = new RegExp(`(?:function\\s+${name}\\s*\\(|(?:const|let|var)\\s+${name}\\s*=)`).exec(src);
    if (def) body += src.slice(def.index, def.index + 4000);
  }
  return body;
}

test('negative, whole tree: every REST route with :boardId checks that board or a site admin', () => {
  const unguarded = [];
  let routes = 0;
  for (const file of [...walk('server'), ...walk('models'), ...walk('packages')]) {
    const src = read(file);
    const re = /WebApp\.(?:handlers|connectHandlers|rawHandlers)\.(get|post|put|delete|patch|use)\(\s*['"`]([^'"`]*:boardId[^'"`]*)['"`]/g;
    let m;
    while ((m = re.exec(src))) {
      routes += 1;
      const body = handlerSource(src, m.index);
      if (!BOARD_CHECKS.some(check => check.test(body))) unguarded.push(`${file}: ${m[1].toUpperCase()} ${m[2]}`);
    }
  }
  assert.ok(routes > 50, `the sweep must see the REST API (${routes} routes)`);
  assert.deepEqual(unguarded, [], 'these read or change a board named by the caller without checking access to it');
});

test('the sweep would catch the reported shape: a login check alone (negative of the negative)', () => {
  const vulnerable = `WebApp.handlers.get('/api/boards/:boardId/domains', async function(req, res) {
  try {
    Authentication.checkLoggedIn(req.userId);
    const board = await ReactiveCache.getBoard(req.params.boardId);
    sendJsonResult(res, { code: 200, data: board.domains || [] });
  } catch (error) {}
});`;
  assert.ok(!BOARD_CHECKS.some(check => check.test(handlerSource(vulnerable, 0))));
});
