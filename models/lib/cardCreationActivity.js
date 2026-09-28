'use strict';
// Shared payload for ordinary card creation and durable Sync planning.
function cardCreationActivity(userId, card, list, swimlane) {
  return { userId, activityType: 'createCard', boardId: card.boardId,
    listName: list.title, listId: card.listId, cardId: card._id,
    cardTitle: card.title, swimlaneName: swimlane.title, swimlaneId: card.swimlaneId };
}
module.exports = { cardCreationActivity };
