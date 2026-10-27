'use strict';

// FixDuplicateBleed (SnowBleed finding 12, Joshua Rogers of Aisle Research,
// fixed in v8.21, commit 4ce181d172): the fixDuplicateLists.* Meteor methods
// (server/methods/fixDuplicateLists.js) ran for ANY logged-in user:
// fixAllBoards rewrote the lists and swimlanes of every board on the server,
// fixBoard those of any board, and getReport listed every board's id, title
// and duplicate list and swimlane names. The fix: fixAllBoards and getReport
// need a site admin, fixBoard a board admin of that board.
//
//   * the test runs the REAL method bodies against stubs: a plain user, a
//     board member and an unknown user are refused before anything is read or
//     written; a site admin and the board's admin are let through;
//   * the negative test sweeps every Meteor method in the tree that reads
//     EVERY board (an empty selector on Boards) and fails on one without a
//     site-admin check.
//
// Run: node tests/fixDuplicateBleed.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const pending = [];
const test = (name, fn) => pending.push([name, fn]);

class MeteorError extends Error { constructor(e, r) { super(r || e); this.error = e; } }

function load() {
  const src = read('server/methods/fixDuplicateLists.js').replace(/^import .*$/gm, '');
  const methods = {};
  const touched = [];
  const board = {
    _id: 'b1', title: 'Board',
    hasAdmin(userId) { return userId === 'boardAdmin'; },
  };
  const users = { siteadmin: { _id: 'siteadmin', isAdmin: true }, plain: { _id: 'plain' }, boardAdmin: { _id: 'boardAdmin' } };
  const collection = name => ({
    find: () => ({ fetchAsync: async () => { touched.push(name); return name === 'Boards' ? [board] : []; } }),
    updateAsync: async () => { touched.push(`${name}.update`); },
    removeAsync: async () => { touched.push(`${name}.remove`); },
  });
  new Function('Meteor', 'check', 'Boards', 'Lists', 'Swimlanes', 'Cards', 'ReactiveCache', src)(
    { methods: m => Object.assign(methods, m), Error: MeteorError }, () => {},
    collection('Boards'), collection('Lists'), collection('Swimlanes'), collection('Cards'),
    { getUser: async id => users[id], getBoard: async id => (id === 'b1' ? board : undefined) });
  return { methods, touched, call: (name, userId, ...a) => methods[name].apply({ userId }, a) };
}
const refused = async p => { try { await p; return false; } catch (e) { return true; } };

test('the reported attack: a plain user runs none of the three methods, and nothing is read', async () => {
  const f = load();
  assert.deepStrictEqual(Object.keys(f.methods).sort(),
    ['fixDuplicateLists.fixAllBoards', 'fixDuplicateLists.fixBoard', 'fixDuplicateLists.getReport']);
  for (const userId of ['plain', 'boardAdmin', null, 'unknownUser']) {
    assert.ok(await refused(f.call('fixDuplicateLists.fixAllBoards', userId)), `fixAllBoards: ${userId}`);
    assert.ok(await refused(f.call('fixDuplicateLists.getReport', userId)), `getReport: ${userId}`);
  }
  for (const userId of ['plain', null]) {
    assert.ok(await refused(f.call('fixDuplicateLists.fixBoard', userId, 'b1')), `fixBoard: ${userId}`);
  }
  assert.ok(await refused(f.call('fixDuplicateLists.fixBoard', 'boardAdmin', 'other')), 'another board');
  assert.deepStrictEqual(f.touched, [], 'nothing was read or written');
});

test('negative: a site admin runs the instance-wide ones, the board admin fixBoard', async () => {
  const f = load();
  assert.strictEqual((await f.call('fixDuplicateLists.fixAllBoards', 'siteadmin')).totalBoardsProcessed, 1);
  assert.ok(await f.call('fixDuplicateLists.getReport', 'siteadmin'));
  assert.ok(f.touched.includes('Boards'), 'the site admin report reads the boards');
  assert.ok(!(await refused(f.call('fixDuplicateLists.fixBoard', 'boardAdmin', 'b1'))));
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
const EVERY_BOARD = /\bBoards\.(?:find|findAsync|rawCollection\(\)\.find)\(\s*(?:\{\s*\})?\s*[,)]|getBoards\(\s*(?:\{\s*\})?\s*[,)]/;
const SITE_ADMIN = /\.isAdmin\b|isAdmin: true|requireAdmin\(|checkUserId\(|assertAdmin|requireSiteAdmin/;
function methodsOf(src) {
  const found = [];
  let at = 0;
  while ((at = src.indexOf('Meteor.methods({', at)) >= 0) {
    let end = src.indexOf('\n});', at);
    if (end < 0) end = src.length;
    const block = src.slice(at, end);
    const all = [...block.matchAll(/\n( {2,4})(?:async\s+)?'?([\w.]+)'?\s*\(([^)]*)\)\s*\{/g)]
      .filter(m => !['if', 'for', 'while', 'switch', 'catch', 'function'].includes(m[2]));
    const indent = Math.min(...all.map(m => m[1].length));
    for (const m of all.filter(x => x[1].length === indent)) {
      const close = block.indexOf(`\n${m[1]}}`, m.index + 1);
      found.push({ name: m[2], body: block.slice(m.index, close < 0 ? undefined : close) });
    }
    at = end + 1;
  }
  return found;
}

test('negative, whole tree: every Meteor method that reads every board checks a site admin', () => {
  const unguarded = [];
  let count = 0;
  for (const file of [...walk('server'), ...walk('models')]) {
    const src = read(file);
    if (!src.includes('Meteor.methods(')) continue;
    for (const { name, body } of methodsOf(src)) {
      if (!EVERY_BOARD.test(body)) continue;
      count += 1;
      if (!SITE_ADMIN.test(body)) unguarded.push(`${file}: ${name}`);
    }
  }
  assert.ok(count >= 2, `the sweep must see fixAllBoards and getReport (${count})`);
  assert.deepStrictEqual(unguarded, [], 'these read or change every board for any caller');
});

test('the sweep would catch the reported shape (negative of the negative)', () => {
  const vulnerable = `Meteor.methods({
  async 'fixDuplicateLists.fixAllBoards'() {
    if (!this.userId) {
      throw new Meteor.Error('not-authorized');
    }
    const allBoards = await Boards.find({}).fetchAsync();
  }
});`;
  const [m] = methodsOf(vulnerable);
  assert.ok(EVERY_BOARD.test(m.body) && !SITE_ADMIN.test(m.body));
});

(async () => {
  for (const [name, fn] of pending) { await fn(); console.log('  ok -', name); }
  console.log(`\nfixDuplicateBleed: ${pending.length} tests passed`);
})().catch(e => { console.error(e); process.exit(1); });
