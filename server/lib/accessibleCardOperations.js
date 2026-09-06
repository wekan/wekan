import { Meteor } from 'meteor/meteor';
import Boards from '/models/boards';
import Cards, { cardCreation } from '/models/cards';
import CustomFields from '/models/customFields';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import { allowIsBoardMemberWithWriteAccess, computeSortForIndex } from '/server/lib/utils';

async function editablePlacement(userId, boardId, listId, swimlaneId) {
  if (!userId) throw new Meteor.Error('not-authorized');
  const [board, list, swimlane] = await Promise.all([
    Boards.findOneAsync(boardId), Lists.findOneAsync(listId), Swimlanes.findOneAsync(swimlaneId),
  ]);
  if (!board || !list || !swimlane || list.boardId !== boardId
    || swimlane.boardId !== boardId || list.archived === true || swimlane.archived === true) {
    throw new Meteor.Error('not-found');
  }
  if (!allowIsBoardMemberWithWriteAccess(userId, board)) {
    throw new Meteor.Error('not-authorized');
  }
  return { board, list, swimlane };
}

async function createAccessibleCard(userId, input) {
  const boardId = String(input?.boardId || '');
  const listId = String(input?.listId || '');
  const swimlaneId = String(input?.swimlaneId || '');
  const title = String(input?.title || '').trim().slice(0, 1000);
  if (!title) throw new Meteor.Error('card-title-required');
  const { board } = await editablePlacement(userId, boardId, listId, swimlaneId);
  const siblings = await Cards.find({
    boardId, listId, swimlaneId, archived: false, deletedAt: null,
  }, { fields: { sort: 1 }, sort: { sort: 1, _id: 1 } }).fetchAsync();
  const position = input?.position === 'top' ? 0 : siblings.length;
  const automaticFields = await CustomFields.find({ boardIds: boardId }, {
    fields: { automaticallyOnCard: 1, alwaysOnCard: 1 },
  }).fetchAsync();
  const customFields = automaticFields
    .filter(field => field.automaticallyOnCard || field.alwaysOnCard)
    .map(field => ({ _id: field._id, value: null }));
  const cardId = await Cards.direct.insertAsync({
    title, boardId, listId, swimlaneId,
    sort: computeSortForIndex(siblings, position),
    cardNumber: await board.getNextCardNumber(),
    userId, members: [], assignees: [], labelIds: [], customFields,
    type: 'cardType-card',
  });
  const card = await Cards.findOneAsync(cardId);
  await cardCreation(userId, card);
  return cardId;
}

async function moveAccessibleCard(userId, cardId, direction) {
  if (!['up', 'down'].includes(direction)) throw new Meteor.Error('invalid-card-direction');
  const card = await Cards.findOneAsync({ _id: cardId, archived: false, deletedAt: null });
  if (!card) throw new Meteor.Error('not-found');
  await editablePlacement(userId, card.boardId, card.listId, card.swimlaneId);
  const siblings = await Cards.find({
    boardId: card.boardId, listId: card.listId, swimlaneId: card.swimlaneId,
    archived: false, deletedAt: null,
  }, { fields: { sort: 1 }, sort: { sort: 1, _id: 1 } }).fetchAsync();
  const index = siblings.findIndex(item => item._id === card._id);
  const target = index + (direction === 'up' ? -1 : 1);
  if (index < 0 || target < 0 || target >= siblings.length) return false;
  const withoutCard = siblings.filter(item => item._id !== card._id);
  const newPosition = direction === 'up' ? target : target + 1;
  const newSort = computeSortForIndex(withoutCard, newPosition);
  await card.move(card.boardId, card.swimlaneId, card.listId, newSort);
  return true;
}

export { createAccessibleCard, editablePlacement, moveAccessibleCard };
