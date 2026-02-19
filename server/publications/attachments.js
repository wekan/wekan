import Attachments from '/models/attachments';
import { ObjectID } from 'bson';

Meteor.publish('attachmentsList', async function(limit) {
  const userId = this.userId;

  // Get boards the user has access to
  const userBoards = (await ReactiveCache.getBoards({
    $or: [
      { permission: 'public' },
      { members: { $elemMatch: { userId, isActive: true } } }
    ]
  })).map(board => board._id);

  if (userBoards.length === 0) {
    // User has no access to any boards, return empty cursor
    return this.ready();
  }

  // Get cards from those boards
  const userCards = (await ReactiveCache.getCards({
    boardId: { $in: userBoards },
    archived: false
  })).map(card => card._id);

  if (userCards.length === 0) {
    // No cards found, return empty cursor
    return this.ready();
  }

  // Only return attachments for cards the user has access to
  const ret = (await ReactiveCache.getAttachments(
    { 'meta.cardId': { $in: userCards } },
    {
      fields: {
        _id: 1,
        name: 1,
        size: 1,
        type: 1,
        meta: 1,
        path: 1,
        versions: 1,
      },
      sort: {
        name: 1,
      },
      limit: limit,
    },
    true,
  )).cursor;
  return ret;
});
