'use strict';
const { memberCan } = require('./boardRoleCapabilities');
const { assignedOnlyAllowsCard } = require('./boardCardScope');

// On a card, the caller's board role decides for that card too: an
// assigned-only member runs a card's button only on a card assigned to them
// (GHSA-r4gm-mjj9-g3x8). A board-level button has no card to decide by.
function buttonRuleAllowed(userId, board, cardId, card) {
  return Boolean(board && memberCan(board.members, userId, 'write') &&
    (cardId === undefined || (card && card._id === cardId && card.boardId === board._id &&
      assignedOnlyAllowsCard(board, userId, card))));
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
