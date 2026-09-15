'use strict';
// Hall of Fame regression coverage: ManageBoardBleed.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
test('actual board-admin guard denies normal members and accepts board/site admins', async () => {
  const text = read('server/authentication.js');
  const at = text.indexOf('  async checkBoardAdmin(');
  const end = text.indexOf('\n  },', at);
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const run = new AsyncFunction('userId', 'boardId', 'Authentication', 'ReactiveCache', 'require', text.slice(text.indexOf('\n', at) + 1, end));
  for (const [isAdmin, siteAdmin] of [[false, false], [true, false], [false, true]]) {
    const logs = [];
    const call = run('u', 'b', {
      checkLoggedIn() {}, checkBoardExists() {},
      async checkAdminOrCondition(id, allowed) { if (!allowed && !siteAdmin) throw Object.assign(Error('Forbidden'), { statusCode: 403 }); },
    }, { getBoard: async () => ({ members: [{ userId: 'u', isActive: true, isAdmin }] }) },
    () => ({ record: event => logs.push(event) }));
    if (isAdmin || siteAdmin) await call;
    else await assert.rejects(call, { statusCode: 403 });
    assert.equal(logs.length, isAdmin || siteAdmin ? 0 : 1);
  }
});
test('negative inventory: REST board management and all rule mutations require admin', () => {
  for (const file of ['server/models/boards.js', 'server/models/rules.js']) {
    assert.doesNotMatch(read(file), /Authentication\.checkBoardWriteAccess\(/, file);
  }
  const boards = read('server/models/boards.js');
  for (const route of ['title', 'cardSettings']) {
    const at = boards.indexOf(`WebApp.handlers.put('/api/boards/:boardId/${route}'`);
    const body = boards.slice(at, boards.indexOf('\n});', at));
    assert.match(body, /Authentication\.checkBoardAdmin\(/);
    assert.ok(body.indexOf('checkBoardAdmin') < body.indexOf('Boards.direct.updateAsync'));
  }
  assert.equal((read('server/models/rules.js').match(/Authentication\.checkBoardAdmin\(/g) || []).length, 3);
});
