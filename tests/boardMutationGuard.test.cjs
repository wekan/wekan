'use strict';
// Hall of Fame regression coverage: MutationBleed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const root = path.join(__dirname, '..');
const roles = require('../models/lib/boardRoleCapabilities');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
function loadGuard(logs, broken = false) {
  const context = { module: { exports: {} }, require(name) {
    if (name === './boardRoleCapabilities') return roles;
    assert.equal(name, '/server/lib/securityLog');
    return { record(event) { if (broken) throw Error('logging failure'); logs.push(event); } };
  } };
  vm.runInNewContext(read('models/lib/boardMutationGuard.js'), context);
  return context.module.exports.requireBoardMutation;
}
const Meteor = { isServer: true, Error: class extends Error {
  constructor(code, message) { super(message); this.error = code; }
} };
test('all roles follow the canonical write policy, with bounded denial logging', () => {
  for (const role of roles.BOARD_ROLES) {
    const member = { userId: 'u', isActive: true };
    if (roles.ROLE_FLAGS[role]) member[roles.ROLE_FLAGS[role]] = true;
    const logs = [], guard = loadGuard(logs);
    const call = () => guard('u', { members: [member] }, 'test', Meteor);
    if (roles.roleCan(role, 'write')) assert.doesNotThrow(call);
    else assert.throws(call, { error: 'not-authorized' });
    assert.equal(logs.length, roles.roleCan(role, 'write') ? 0 : 1);
    if (logs.length) assert.equal(logs[0].key, 'authz.mutation');
  }
  for (const board of [null, { members: [] }, { members: [{ userId: 'u', isActive: false }] }]) {
    assert.throws(() => loadGuard([], true)('u', board, 'test', Meteor), { error: 'not-authorized' });
  }
});
test('reported moveList attack is refused before any move or archive', async () => {
  const source = read('server/models/lists.js');
  const at = source.indexOf('  async moveList(');
  const end = source.indexOf('    // #6670:', at);
  const prefix = source.slice(source.indexOf('\n', at) + 1, end);
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const run = new AsyncFunction('listId', 'boardId', 'swimlaneId', 'neighborListId', 'position', 'title', 'check', 'Match', 'Meteor', 'ReactiveCache', 'Boards', 'requireBoardMutation', prefix);
  const board = flag => ({ members: [{ userId: 'u', isActive: true, ...flag }] });
  for (const [sourceRole, targetRole, denied] of [
    [{ isCommentOnly: true }, {}, true], [{}, { isReadOnly: true }, true], [{}, {}, false],
  ]) {
    const logs = [];
    const call = run.call({ userId: 'u' }, 'l', 'b', '', null, null, null,
      () => {}, { OneOf() {} }, Meteor,
      { getList: async () => ({ boardId: 'a', title: 'L' }), getBoard: async () => board(targetRole) },
      { findOneAsync: async () => board(sourceRole) }, loadGuard(logs));
    if (denied) await assert.rejects(call, { error: 'not-authorized' });
    else await call;
    assert.equal(logs.length, denied ? 1 : 0);
  }
});
test('negative inventory: every reported sibling uses the shared write guard', () => {
  const cases = [
    ['server/models/lists.js', '  async moveList(', '  async applyWipLimit(', 2],
    ['server/publications/swimlanes.js', '  async moveSwimlane(', '\n});', 2],
    ['server/models/checklists.js', '  async moveChecklist(', '\n});', 2],
    ['models/import.js', '  async importScoped(', '\n});', 1],
    ['models/attachments.server.js', '  async renameAttachment(', '  async validateAttachment(', 1],
    ['server/models/changeHistory.js', 'const requireBoardWrite =', '\n};', 1],
  ];
  for (const [file, start, end, count] of cases) {
    const text = read(file), at = text.indexOf(start);
    assert.ok(at >= 0, file);
    const body = text.slice(at, text.indexOf(end, at));
    assert.equal((body.match(/requireBoardMutation\(/g) || []).length, count, file);
    assert.doesNotMatch(body, /!.*(?:\.hasMember\(|\.hasCommentOnly\(|\.isBoardMember\(|allowIsBoardMember(?:ByCard)?\()/, file);
  }
  assert.doesNotMatch(read('server/models/lists.js'), /typeof allowIsBoardMemberWithWriteAccess/);
});
