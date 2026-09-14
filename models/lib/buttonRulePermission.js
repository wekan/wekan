'use strict';
const { memberCan } = require('./boardRoleCapabilities');

function buttonRuleAllowed(userId, board, cardId, card) {
  return Boolean(board && memberCan(board.members, userId, 'write') &&
    (cardId === undefined || (card && card._id === cardId && card.boardId === board._id)));
}

function requireButtonRuleContext(userId, board, cardId, card, Meteor) {
  if (buttonRuleAllowed(userId, board, cardId, card)) return;
  try {
    require('/server/lib/securityLog').record({
      key: 'authz.rule-button', action: 'blocked', source: 'rule:button',
      detail: 'Button rule denied because its caller or card is outside the writable board context.',
    });
  } catch (e) { /* logging must never break the guard */ }
  throw new Meteor.Error('not-authorized', 'Button rule context is not authorized.');
}

module.exports = { buttonRuleAllowed, requireButtonRuleContext };
