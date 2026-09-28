'use strict';
const { isAssignedOnlyMember } = require('../../models/lib/boardCardScope');
const { boardNotificationRecipients } = require('../../models/lib/boardNotificationRecipients');
function canReceiveStoredNotification({ user, board, card, list, activity }) {
  if (typeof user?._id !== 'string' || !user._id || user.loginDisabled || !activity || !board || !card || !list ||
      board._id !== activity.boardId || card._id !== activity.cardId ||
      card.boardId !== board._id || card.listId !== activity.listId ||
      list._id !== activity.listId || list.boardId !== board._id) return false;
  if (isAssignedOnlyMember(board, user._id) &&
      (!Array.isArray(card.assignees) || !card.assignees.includes(user._id))) return false;
  return boardNotificationRecipients([user._id], board.members, board.watchers,
    [...(list.watchers || []), ...(card.watchers || [])]).includes(user._id);
}
module.exports = { canReceiveStoredNotification };
