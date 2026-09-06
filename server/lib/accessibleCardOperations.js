import { Meteor } from 'meteor/meteor';
import Boards from '/models/boards';
import Cards, { cardCreation } from '/models/cards';
import CustomFields from '/models/customFields';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import {
  allowIsBoardAdmin,
  allowIsBoardMemberWithWriteAccess,
  computeSortForIndex,
} from '/server/lib/utils';
import { canEditCardOrLinkedCard } from '/server/lib/linkedCardPermission';
import { tripCanary } from '/server/lib/canary';

const MAX_CARD_DESCRIPTION_LENGTH = 1024 * 1024;
const CARD_DATE_FIELDS = ['receivedAt', 'startAt', 'dueAt', 'endAt'];

function refuseCardWrite(userId, detail) {
  tripCanary('board.write-without-capability', { userId, detail });
  throw new Meteor.Error('not-authorized');
}

async function editablePlacement(userId, boardId, listId, swimlaneId) {
  if (!userId) throw new Meteor.Error('not-authorized');
  const [board, list, swimlane] = await Promise.all([
    Boards.findOneAsync(boardId), Lists.findOneAsync(listId), Swimlanes.findOneAsync(swimlaneId),
  ]);
  if (!board || !list || !swimlane || list.boardId !== boardId
    || swimlane.boardId !== boardId || list.archived === true || swimlane.archived === true) {
    refuseCardWrite(userId, 'card placement did not match one active board/list/swimlane');
  }
  if (!allowIsBoardMemberWithWriteAccess(userId, board)) {
    refuseCardWrite(userId, 'card placement board did not grant write access');
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
  let position = input?.position === 'top' ? 0 : siblings.length;
  const relativeCardId = String(input?.relativeCardId || '');
  if (relativeCardId) {
    const relativeIndex = siblings.findIndex(card => card._id === relativeCardId);
    if (relativeIndex < 0) {
      refuseCardWrite(userId, 'relative card did not belong to the submitted destination');
    }
    position = relativeIndex + (input?.position === 'below' ? 1 : 0);
  }
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

async function moveAccessibleCardToList(userId, input) {
  const boardId = String(input?.boardId || '');
  const card = await editableCard(userId, input?.cardId, boardId);
  await editablePlacement(userId, boardId, String(input?.listId || ''), card.swimlaneId);
  const siblings = await Cards.find({
    boardId, listId: String(input.listId), swimlaneId: card.swimlaneId,
    archived: false, deletedAt: null, _id: { $ne: card._id },
  }, { fields: { sort: 1 }, sort: { sort: 1, _id: 1 } }).fetchAsync();
  const position = input?.position === 'bottom' ? siblings.length : 0;
  await card.move(boardId, card.swimlaneId, String(input.listId),
    computeSortForIndex(siblings, position));
  return true;
}

async function editableCard(userId, cardId, expectedBoardId) {
  if (!userId) throw new Meteor.Error('not-authorized');
  const card = await Cards.findOneAsync({ _id: String(cardId || ''), deletedAt: null });
  if (!card) throw new Meteor.Error('not-found');
  if (expectedBoardId && card.boardId !== expectedBoardId) {
    refuseCardWrite(userId, 'card did not belong to the submitted route board');
  }
  if (!(await canEditCardOrLinkedCard(userId, card))) {
    refuseCardWrite(userId, 'card did not grant direct or delegated write access');
  }
  return card;
}

async function authorizeContentTarget(userId, card) {
  if (card.type === 'cardType-linkedCard') {
    const target = await Cards.findOneAsync({ _id: card.linkedId, deletedAt: null });
    if (!target || !(await canEditCardOrLinkedCard(userId, target))) {
      refuseCardWrite(userId, 'linked card target did not grant write access');
    }
  } else if (card.type === 'cardType-linkedBoard') {
    const target = await Boards.findOneAsync(card.linkedId);
    if (!target || !allowIsBoardAdmin(userId, target)) {
      refuseCardWrite(userId, 'linked board target did not grant administrator access');
    }
  }
}

async function updateAccessibleCardContent(userId, input) {
  const card = await editableCard(userId, input?.cardId, String(input?.boardId || ''));
  const field = input?.field;
  if (!['title', 'description'].includes(field)) throw new Meteor.Error('invalid-card-field');
  await authorizeContentTarget(userId, card);
  let value = String(input?.value ?? '');
  if (field === 'title') value = value.trim().slice(0, 1000);
  else if (value.length > MAX_CARD_DESCRIPTION_LENGTH) {
    throw new Meteor.Error('description-too-long');
  }
  if (field === 'title') await card.setTitle(value);
  else await card.setDescription(value);
  return true;
}

async function updateAccessibleCardDate(userId, input) {
  const card = await editableCard(userId, input?.cardId, String(input?.boardId || ''));
  const field = String(input?.field || '');
  if (!CARD_DATE_FIELDS.includes(field)) throw new Meteor.Error('invalid-card-date-field');
  await authorizeContentTarget(userId, card);
  const rawValue = input?.value instanceof Date
    ? input.value.toISOString() : String(input?.value ?? '').trim();
  if (!rawValue) {
    await card[`unset${field[0].toUpperCase()}${field.slice(1, -2)}`]();
    return true;
  }
  if (rawValue.length > 40
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(rawValue)) {
    throw new Meteor.Error('invalid-card-date');
  }
  const date = new Date(rawValue);
  if (!Number.isFinite(date.getTime())) throw new Meteor.Error('invalid-card-date');
  const method = {
    receivedAt: 'setReceived', startAt: 'setStart', dueAt: 'setDue', endAt: 'setEnd',
  }[field];
  await card[method](date);
  return true;
}

async function editableCardTree(userId, root) {
  const pending = [root];
  const seen = new Set();
  while (pending.length) {
    const card = pending.shift();
    if (seen.has(card._id)) throw new Meteor.Error('invalid-card-tree');
    seen.add(card._id);
    if (seen.size > 10000) throw new Meteor.Error('card-tree-too-large');
    if (!(await canEditCardOrLinkedCard(userId, card))) {
      refuseCardWrite(userId, 'a descendant card did not grant write access');
    }
    const children = await Cards.find({ parentId: card._id, deletedAt: null }).fetchAsync();
    pending.push(...children);
  }
}

async function setAccessibleCardArchived(userId, input) {
  const card = await editableCard(userId, input?.cardId, String(input?.boardId || ''));
  const archived = input?.archived;
  if (typeof archived !== 'boolean') throw new Meteor.Error('invalid-card-archive-state');
  await editableCardTree(userId, card);
  if (archived) await card.archive();
  else await card.restore();
  return true;
}

export {
  createAccessibleCard,
  editableCard,
  editablePlacement,
  moveAccessibleCard,
  moveAccessibleCardToList,
  setAccessibleCardArchived,
  updateAccessibleCardDate,
  updateAccessibleCardContent,
};
