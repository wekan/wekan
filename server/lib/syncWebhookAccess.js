'use strict';
const { memberCan } = require('../../models/lib/boardRoleCapabilities');
const { isAssignedOnlyMember } = require('../../models/lib/boardCardScope');
const { canonical, sha256 } = require('../../models/lib/changeHistoryIntegrity');
function canWriteWebhookCard({ user, board, card }) {
  return !!(user && !user.loginDisabled && board && card && card.boardId === board._id &&
    memberCan(board.members, user._id, 'write') &&
    (!isAssignedOnlyMember(board, user._id) || (Array.isArray(card.assignees) && card.assignees.includes(user._id))));
}
function isCurrentWebhookTarget({ target, integration, activity }) {
  return !!(target && integration && activity && integration.enabled === true &&
    integration._id === target.integrationId && integration.boardId === target.integrationBoardId &&
    [activity.boardId, '_global'].includes(integration.boardId) &&
    sha256(canonical(integration)) === target.integrationHash);
}
module.exports = { canWriteWebhookCard, isCurrentWebhookTarget };
