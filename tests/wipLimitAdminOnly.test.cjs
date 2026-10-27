'use strict';

// A list's WIP limit is set by a board admin. The applyWipLimit /
// enableWipLimit / enableSoftLimit methods always required one, but a member
// with write access could still set `wipLimit` with a plain list update (the
// Lists allow rule) or with REST PUT /api/boards/:boardId/lists/:listId.
// Maintainer decision 2026-10-27: board admins only, on every path.
// Run: node tests/wipLimitAdminOnly.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

const boards = {
  b1: { hasAdmin: id => id === 'admin' },
};
const Boards = { findOneAsync: async id => boards[id] || null };

// The real deny rule from server/permissions/lists.js.
function wipDeny() {
  const src = read('server/permissions/lists.js');
  const at = src.indexOf("if (!fieldNames.includes('wipLimit')) return false;");
  assert.ok(at > 0, 'the wipLimit deny rule');
  const start = src.lastIndexOf('async update(userId, doc, fieldNames) {', at);
  const end = src.indexOf('\n  },', at);
  const body = src.slice(start, end + 4).replace('async update(', 'async function update(');
  return new Function('Boards', `return (${body.replace(/,\s*$/, '')});`)(Boards);
}

(async () => {
  let passed = 0;
  const test = async (name, fn) => { await fn(); passed += 1; console.log('  ok -', name); };
  const deny = wipDeny();
  const list = { boardId: 'b1' };

  await test('a write member\'s list update that sets wipLimit is denied', async () => {
    assert.strictEqual(await deny('member', list, ['wipLimit']), true);
    assert.strictEqual(await deny('member', list, ['title', 'wipLimit']), true);
    assert.strictEqual(await deny('member', { boardId: 'gone' }, ['wipLimit']), true);
  });

  await test('negative: a board admin sets it, and other list fields stay with write access', async () => {
    assert.strictEqual(await deny('admin', list, ['wipLimit']), false);
    assert.strictEqual(await deny('member', list, ['title']), false);
    assert.strictEqual(await deny('member', list, ['color', 'sort']), false);
  });

  await test('REST PUT asks for a board admin before writing a wipLimit', () => {
    const src = read('server/models/lists.js');
    const at = src.indexOf("WebApp.handlers.put('/api/boards/:boardId/lists/:listId'");
    assert.ok(at > 0);
    const body = src.slice(at, src.indexOf('\nWebApp.handlers.', at + 10));
    const check = body.indexOf('if (set.wipLimit !== undefined) {');
    assert.ok(check > 0, 'no admin check for wipLimit');
    assert.match(body.slice(check, check + 200), /await Authentication\.checkBoardAdmin\(req\.userId, paramBoardId\);/);
    assert.ok(check < body.indexOf('Lists.direct.updateAsync('), 'checked before the write');
  });

  await test('negative: every server method that changes a WIP limit requires a board admin first', () => {
    const src = read('server/models/lists.js');
    let methods = 0;
    for (const m of src.matchAll(/\n  async (\w+)\([^)]*\) \{/g)) {
      const end = src.indexOf('\n  },', m.index);
      const fn = src.slice(m.index, end < 0 ? undefined : end);
      const write = fn.search(/\.(setWipLimit|toggleWipLimit|toggleSoftLimit)\(/);
      if (write < 0) continue;
      methods += 1;
      assert.match(fn.slice(0, write), /hasAdmin\(this\.userId\)/, `${m[1]}: board admin before the change`);
    }
    assert.ok(methods >= 3, `applyWipLimit, enableWipLimit, enableSoftLimit - saw ${methods}`);
  });

  console.log(`\n${passed} tests passed`);
})().catch(e => { console.error(e); process.exit(1); });
