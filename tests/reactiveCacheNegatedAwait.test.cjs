'use strict';

// On the server ReactiveCache.get*() is async and returns a Promise, which is
// always truthy. `!ReactiveCache.getUser(id)` was therefore always false, and
// Boards.removeMember's #5330 branch for members whose account was deleted
// never ran on the server. These tests pin the fix and keep the shape out of
// the whole tree.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const root = path.join(__dirname, '..');
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    // rspack output is skipped by prefix (tests/sourceWalkersSkipBuildOutput.test.cjs).
    if (e.name === 'node_modules' || e.name.startsWith('.') || e.name.startsWith('_build')) return [];
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : /\.(c|m)?js$/.test(e.name) ? [p] : [];
  });
}

function extractMethod(source, signature) {
  const start = source.indexOf(signature);
  assert.ok(start >= 0, `${signature} not found`);
  let depth = 0;
  for (let i = source.indexOf('{', start); i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1);
  }
  throw new Error('unbalanced braces');
}

function removeMemberFixture({ userExists }) {
  const source = fs.readFileSync(path.join(root, 'models/boards.js'), 'utf8');
  const method = extractMethod(source, 'async removeMember(memberId)');
  const updates = [];
  const scope = {
    ReactiveCache: { async getUser() { return userExists ? { _id: 'gone' } : null; } },
    Boards: { async updateAsync(id, modifier) { updates.push(modifier); } },
    pullMemberById: (members, id) => members.filter(m => m.userId !== id),
  };
  const make = new Function(...Object.keys(scope), `return { ${method} };`);
  const board = Object.assign(make(...Object.values(scope)), {
    _id: 'b1',
    members: [
      { userId: 'admin', isAdmin: true, isActive: true },
      { userId: 'gone', isAdmin: false, isActive: true },
    ],
    memberIndex(id) { return this.members.map(x => x.userId).indexOf(id); },
    activeAdmins() { return this.members.filter(m => m.isAdmin && m.isActive); },
  });
  return { board, updates };
}

test('a member whose account was deleted is removed from the board, not just deactivated', async () => {
  const { board, updates } = removeMemberFixture({ userExists: false });
  await board.removeMember('gone');
  assert.deepEqual(JSON.parse(JSON.stringify(updates)), [
    { $set: { members: [{ userId: 'admin', isAdmin: true, isActive: true }] } },
  ]);
});

test('an existing user is still deactivated by index, keeping the history', async () => {
  const { board, updates } = removeMemberFixture({ userExists: true });
  await board.removeMember('gone');
  assert.equal(updates.length, 1);
  assert.deepEqual(updates[0].$set, { 'members.1.isActive': false, 'members.1.isAdmin': false });
});

test('no server-side code negates an un-awaited async ReactiveCache lookup', () => {
  // client/ is excluded: ReactiveCache is synchronous in the browser.
  const offenders = [];
  for (const file of ['server', 'models'].flatMap(d => walk(path.join(root, d)))) {
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (/!\s*ReactiveCache\.get[A-Z]\w*\(/.test(line)) {
        offenders.push(`${path.relative(root, file)}:${i + 1}: ${line.trim()}`);
      }
    });
  }
  assert.deepEqual(offenders, []);
});
