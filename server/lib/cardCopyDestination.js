import { Meteor } from 'meteor/meteor';
import Boards from '/models/boards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
const { validCardCopyDestination } = require('/models/lib/cardCopyDestination');

export async function requireCardCopyDestination(boardId, swimlaneId, listId) {
  let records = [];
  if ([boardId, swimlaneId, listId].every(id => typeof id === 'string' && id.length > 0)) {
    records = await Promise.all([
      Boards.findOneAsync(boardId, { fields: { _id: 1, deletedAt: 1 } }),
      Swimlanes.findOneAsync({ _id: swimlaneId, boardId }, { fields: { boardId: 1, deletedAt: 1 } }),
      Lists.findOneAsync({ _id: listId, boardId }, { fields: { boardId: 1, deletedAt: 1 } }),
    ]);
  }
  if (!validCardCopyDestination(boardId, swimlaneId, listId, ...records)) {
    const error = new Meteor.Error('invalid-copy-destination', 'Choose a list and swimlane on the destination board.');
    error.statusCode = 400;
    throw error;
  }
}
