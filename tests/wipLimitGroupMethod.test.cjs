'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

(async () => {
  let methods, writes = 0, listCount = 2;
  const board = {
    getWipLimitGroups: () => [{ _id: 'group' }],
    updateWipLimitGroup: async () => ++writes,
  };
  const source = fs.readFileSync('server/methods/wipLimitGroups.js', 'utf8').replace(/^import .*;\n/gm, '');
  vm.runInNewContext(source, {
    Meteor: { methods: value => { methods = value; }, Error: class extends Error {} },
    check() {}, Match: { Optional: value => value },
    Boards: { findOneAsync: async id => id === 'board' ? board : null },
    Lists: { find: query => {
      assert.equal(query.boardId, 'board');
      assert.equal(query.archived, false);
      return { countAsync: async () => listCount };
    } },
    allowIsBoardAdminOrSiteAdmin: async id => id === 'admin',
  });
  const call = (userId, fields, boardId = 'board', groupId = 'group') =>
    methods.updateWipLimitGroup.call({ userId }, boardId, groupId, fields);
  assert.equal(await call('admin', { listIds: ['a', 'b'], limit: 2 }), 1);
  assert.equal(await call('admin', { enabled: false }), 2);
  for (const userId of [null, 'outsider', 'member']) {
    await assert.rejects(call(userId, { enabled: false }), /not-authorized/);
  }
  await assert.rejects(call('admin', {}, 'missing'), /not-authorized/);
  await assert.rejects(call('admin', {}, 'board', 'missing'), /group-not-found/);
  for (const limit of [0, -1, NaN, Infinity]) {
    await assert.rejects(call('admin', { limit }), /invalid-limit/);
  }
  for (const listIds of [[], ['a'], ['a', 'a']]) {
    await assert.rejects(call('admin', { listIds }), /invalid-lists/);
  }
  listCount = 1;
  await assert.rejects(call('admin', { listIds: ['a', 'foreign'] }), /invalid-lists/);
  assert.equal(writes, 2, 'rejected mutations never write');
  assert.match(source, /check\(boardId, String\)/);
  assert.match(source, /check\(groupId, String\)/);
  assert.match(source, /check\(fields, \{/);
  assert.match(fs.readFileSync('server/imports.js', 'utf8'), /import '\/server\/methods\/wipLimitGroups'/);
  const model = fs.readFileSync('models/boards.js', 'utf8');
  const helper = model.slice(model.indexOf('  async updateWipLimitGroup('), model.indexOf('  async removeWipLimitGroup('));
  let mutation;
  const update = vm.runInNewContext(`({${helper}}).updateWipLimitGroup`, {
    Meteor: { isClient: false },
    Boards: { updateAsync: async (selector, modifier) => { mutation = { selector, modifier }; return 1; } },
  });
  const groups = [{ _id: 'group', listIds: ['a', 'b'], limit: 1 }, { _id: 'other', limit: 3 }];
  const context = { _id: 'board', getWipLimitGroups: () => groups };
  assert.equal(await update.call(context, 'group', { limit: 2, enabled: false, unexpected: 'ignored' }), 1);
  assert.equal(mutation.selector.wipLimitGroups, groups, 'compare the snapshot to prevent lost concurrent edits');
  assert.equal(mutation.modifier.$set.wipLimitGroups[0].limit, 2);
  assert.equal(mutation.modifier.$set.wipLimitGroups[0].enabled, false);
  assert.equal(mutation.modifier.$set.wipLimitGroups[0].unexpected, undefined);
  assert.equal(mutation.modifier.$set.wipLimitGroups[1], groups[1]);
  assert.equal(groups[0].limit, 1, 'do not mutate the comparison snapshot');
  mutation = null;
  assert.equal(await update.call(context, 'missing', { limit: 2 }), 0);
  assert.equal(await update.call(context, 'group', {}), 0);
  assert.equal(mutation, null);
  console.log('WIP group method preserves admin authorization and rejects invalid groups/lists');
})().catch(error => { console.error(error); process.exitCode = 1; });
