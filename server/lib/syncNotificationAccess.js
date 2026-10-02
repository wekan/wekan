'use strict';
const { isAssignedOnlyMember } = require('../../models/lib/boardCardScope');
const { boardNotificationRecipients } = require('../../models/lib/boardNotificationRecipients');
// A card or list the activity names must be there and agree with it; a
// board-level activity names neither (2026-10-03). An assigned-only member
// receives only what concerns a card assigned to them - never a board-level
// event, whose scope cannot be checked against their assignments.
function canReceiveStoredNotification({ user, board, card, list, activity }) {
  if (typeof user?._id !== 'string' || !user._id || user.loginDisabled || !activity || !board ||
      board._id !== activity.boardId) return false;
  if (activity.cardId ? (!card || card._id !== activity.cardId || card.boardId !== board._id) : card) return false;
  if (activity.listId ? (!list || list._id !== activity.listId || list.boardId !== board._id ||
      (card && card.listId !== activity.listId)) : list) return false;
  if (isAssignedOnlyMember(board, user._id) &&
      (!card || !Array.isArray(card.assignees) || !card.assignees.includes(user._id))) return false;
  return boardNotificationRecipients([user._id], board.members, board.watchers,
    [...(list?.watchers || []), ...(card?.watchers || [])]).includes(user._id);
}
module.exports = { canReceiveStoredNotification };
