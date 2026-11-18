'use strict';
// Scheduled rules, auto-archive and attachment retention act as the board.
// They read `board.createdBy`, which the Boards schema does not have, so a
// scheduled rule ran as nobody and its "create card" action failed on every
// run: "scheduledRules: error running trigger ... User ID is required in cards
// insertAsync" (production docker log, v13.13).
// Run: node --test tests/boardActor.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { boardActorId } = require('../models/lib/boardActor');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

test('the board acts as its first active admin, else its first active member', () => {
  assert.strictEqual(boardActorId({ members: [
    { userId: 'gone-admin', isActive: false, isAdmin: true },
    { userId: 'member', isActive: true },
    { userId: 'admin', isActive: true, isAdmin: true },
  ] }), 'admin');
  assert.strictEqual(boardActorId({ members: [{ userId: 'gone', isActive: false }, { userId: 'member', isActive: true }] }), 'member');
});

test('negative: a board with no active member acts as nobody, and createdBy is not read', () => {
  assert.strictEqual(boardActorId({ createdBy: 'someone', members: [{ userId: 'gone', isActive: false, isAdmin: true }] }), null);
  for (const board of [null, undefined, {}, { members: 'x' }, { members: [null, { isActive: true }, { userId: '', isActive: true }] }]) {
    assert.strictEqual(boardActorId(board), null);
  }
});

test('the Boards schema has no createdBy, so nothing may read board.createdBy', () => {
  assert.doesNotMatch(read('models/boards.js'), /^\s+createdBy:\s*\{/m, 'if Boards gains createdBy, revisit boardActor.js');
  const hits = [];
  const walk = dir => {
    for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      const rel = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!['node_modules', '.build', '.tools', 'tests'].includes(entry.name) && !entry.name.startsWith('_build')) walk(rel);
      }
      // Code only: the comments that explain the change name it.
      else if (/\.(c?js|mjs)$/.test(entry.name)
        && /\bboard\??\.createdBy\b/.test(read(rel).replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, ''))) hits.push(rel);
    }
  };
  for (const dir of ['server', 'models', 'client', 'imports']) walk(dir);
  assert.deepStrictEqual(hits, []);
});

test('a scheduled rule acts as the board, and its created card names its author', () => {
  const scheduled = read('server/scheduledRules.js');
  assert.match(scheduled, /^import \{ boardActorId \} from '\/models\/lib\/boardActor';$/m);
  assert.match(scheduled, /const userId = boardActorId\(board\) \|\| undefined;/);
  const helper = read('server/rulesHelper.js');
  const create = helper.slice(helper.indexOf("if (action.actionType === 'createCard') {"));
  assert.match(create.slice(0, 1200), /const authorId = resolveActingUserId\(activity\);[\s\S]*\.\.\.\(authorId \? \{ userId: authorId \} : \{\}\),/);
});
