'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buttonRuleAllowed, requireButtonRuleContext } = require('../models/lib/buttonRulePermission');
const { BOARD_ROLES, ROLE_FLAGS, roleCan } = require('../models/lib/boardRoleCapabilities');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
test('button rule requires write access and binds a supplied card to its board', () => {
  for (const role of BOARD_ROLES) {
    const member = { userId: 'u', isActive: true, [ROLE_FLAGS[role] || 'normal']: true };
    const board = { _id: 'A', members: [member] };
    assert.equal(buttonRuleAllowed('u', board, 'c', { _id: 'c', boardId: 'A' }), roleCan(role, 'write'));
    assert.equal(buttonRuleAllowed('u', board, undefined, undefined), roleCan(role, 'write'), 'board button remains supported');
    assert.equal(buttonRuleAllowed('u', board, 'c', { _id: 'c', boardId: 'B' }), false);
    assert.equal(buttonRuleAllowed('u', board, 'missing', null), false);
    assert.equal(buttonRuleAllowed(null, board, undefined, undefined), false);
  }
  assert.throws(() => requireButtonRuleContext('u', null, 'c', null, { Error: class extends Error {} }), 'logger failure cannot bypass refusal');
});
test('negative: method and shared action dispatcher both enforce the manual context', () => {
  const method = read('server/rulesButton.js');
  const at = method.indexOf("  async 'rules.runButton'");
  const body = method.slice(at, method.indexOf('  // Create a rule', at));
  assert.doesNotMatch(body, /\.hasMember\(/);
  assert.match(body, /requireButtonRuleContext\(this.userId, board, cardId, card, Meteor\)/);
  assert.ok(body.indexOf('requireButtonRuleContext') < body.indexOf('RulesHelper.performAction'));
  const helper = read('server/rulesHelper.js');
  const actionAt = helper.indexOf('  async performAction(');
  const guardAt = helper.indexOf('requireButtonRuleContext(activity.userId', actionAt);
  assert.ok(guardAt > actionAt && guardAt < helper.indexOf('const boardLevelActions', actionAt));
  assert.match(helper.slice(actionAt, guardAt), /activity.activityType === 'button'/);
});
