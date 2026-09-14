'use strict';
const { memberCan } = require('./boardRoleCapabilities');

// Shared by server methods and their client stubs. The capability decision is
// identical on both; only the server records attempted unauthorized writes.
function requireBoardMutation(userId, board, source, Meteor) {
  if (board && memberCan(board.members, userId, 'write')) return;
  if (Meteor.isServer) {
    try {
      require('/server/lib/securityLog').record({
        key: 'authz.mutation', action: 'blocked', source,
        detail: 'Board mutation denied because the caller lacks write access.',
      });
    } catch (e) { /* logging must never break the guard */ }
  }
  throw new Meteor.Error('not-authorized', 'You cannot change this board.');
}

module.exports = { requireBoardMutation };
