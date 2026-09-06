import { Meteor } from 'meteor/meteor';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Checklists from '/models/checklists';
import ChecklistItems from '/models/checklistItems';
import Activities from '/models/activities';
import { createAccessibleCard, editableCard } from '/server/lib/accessibleCardOperations';
import { canEditCardOrLinkedCard } from '/server/lib/linkedCardPermission';
import { computeSortForIndex } from '/server/lib/utils';
import { tripCanary } from '/server/lib/canary';
const { toggledChecklistAtMinicard } = require('/models/lib/minicardChecklistVisibility');

const MAX_CHECKLIST_TEXT_LENGTH = 1000;

function cleanChecklistText(value) {
  const text = String(value ?? '').trim();
  if (!text) throw new Meteor.Error('checklist-title-required');
  if (text.length > MAX_CHECKLIST_TEXT_LENGTH) throw new Meteor.Error('checklist-title-too-long');
  return text;
}

function refuseChecklist(userId, item, detail) {
  tripCanary(item ? 'checklist-item.cross-board-move' : 'checklist.cross-board-move', {
    userId, detail,
  });
  throw new Meteor.Error('not-authorized');
}

async function editableChecklistCard(userId, input) {
  const routeBoardId = String(input?.boardId || '');
  const routeCard = await editableCard(userId, input?.cardId, routeBoardId);
  if (routeCard.type !== 'cardType-linkedCard') return { routeCard, contentCard: routeCard };
  const contentCard = await Cards.findOneAsync({ _id: routeCard.linkedId, deletedAt: null });
  if (!contentCard || !(await canEditCardOrLinkedCard(userId, contentCard))) {
    refuseChecklist(userId, false, 'linked checklist source did not grant delegated write access');
  }
  return { routeCard, contentCard };
}

async function checklistContext(userId, input) {
  const context = await editableChecklistCard(userId, input);
  const checklist = await Checklists.findOneAsync({
    _id: String(input?.checklistId || ''),
    cardId: context.contentCard._id,
    boardId: context.contentCard.boardId,
  });
  if (!checklist) refuseChecklist(userId, false,
    'checklist did not belong to the submitted card and board scope');
  return { ...context, checklist };
}

async function checklistItemContext(userId, input) {
  const context = await checklistContext(userId, input);
  const item = await ChecklistItems.findOneAsync({
    _id: String(input?.itemId || ''), checklistId: context.checklist._id,
    cardId: context.contentCard._id, boardId: context.contentCard.boardId,
  });
  if (!item) refuseChecklist(userId, true,
    'checklist item did not belong to its submitted checklist, card and board scope');
  return { ...context, item };
}

async function createAccessibleChecklist(userId, input) {
  const { contentCard } = await editableChecklistCard(userId, input);
  const siblings = await Checklists.find({ cardId: contentCard._id, boardId: contentCard.boardId }, {
    fields: { sort: 1 }, sort: { sort: 1, _id: 1 }, limit: 10000,
  }).fetchAsync();
  const position = input?.position === 'top' ? 0 : siblings.length;
  return Checklists.insertAsync({
    cardId: contentCard._id, boardId: contentCard.boardId,
    title: cleanChecklistText(input?.title),
    sort: computeSortForIndex(siblings, position),
  });
}

async function updateAccessibleChecklistTitle(userId, input) {
  const { checklist } = await checklistContext(userId, input);
  await Checklists.updateAsync(checklist._id, { $set: { title: cleanChecklistText(input?.title) } });
  return true;
}

async function removeAccessibleChecklist(userId, input) {
  const { checklist } = await checklistContext(userId, input);
  // A direct checklist removal historically left invisible orphan items. Remove
  // children first so their hooks and activity cleanup still run.
  await ChecklistItems.removeAsync({ checklistId: checklist._id, cardId: checklist.cardId,
    boardId: checklist.boardId });
  await Checklists.removeAsync({ _id: checklist._id, cardId: checklist.cardId,
    boardId: checklist.boardId });
  return true;
}

async function createAccessibleChecklistItem(userId, input) {
  const { checklist, contentCard } = await checklistContext(userId, input);
  const siblings = await ChecklistItems.find({ checklistId: checklist._id }, {
    fields: { sort: 1 }, sort: { sort: 1, _id: 1 }, limit: 10000,
  }).fetchAsync();
  const position = input?.position === 'top' ? 0 : siblings.length;
  return ChecklistItems.insertAsync({
    title: cleanChecklistText(input?.title), checklistId: checklist._id,
    cardId: contentCard._id, boardId: contentCard.boardId, isFinished: false,
    sort: computeSortForIndex(siblings, position),
  });
}

async function checklistDestination(userId, input) {
  return editableChecklistCard(userId, {
    boardId: input?.targetBoardId,
    cardId: input?.targetCardId,
  });
}

async function copyAccessibleChecklist(userId, input) {
  const [{ checklist }, { contentCard: target }] = await Promise.all([
    checklistContext(userId, input), checklistDestination(userId, input),
  ]);
  const [items, siblings] = await Promise.all([
    ChecklistItems.find({ checklistId: checklist._id, cardId: checklist.cardId,
      boardId: checklist.boardId }, {
      fields: { title: 1, sort: 1, isFinished: 1 }, sort: { sort: 1, _id: 1 }, limit: 10000,
    }).fetchAsync(),
    Checklists.find({ cardId: target._id, boardId: target.boardId }, {
      fields: { sort: 1 }, sort: { sort: 1, _id: 1 }, limit: 10000,
    }).fetchAsync(),
  ]);
  const copiedAt = new Date();
  const copiedId = await Checklists.direct.insertAsync({
    cardId: target._id,
    boardId: target.boardId,
    userId,
    title: checklist.title,
    sort: computeSortForIndex(siblings, siblings.length),
    createdAt: copiedAt,
    modifiedAt: copiedAt,
    ...(typeof checklist.hideCheckedChecklistItems === 'boolean'
      ? { hideCheckedChecklistItems: checklist.hideCheckedChecklistItems } : {}),
    ...(typeof checklist.hideAllChecklistItems === 'boolean'
      ? { hideAllChecklistItems: checklist.hideAllChecklistItems } : {}),
    ...(typeof checklist.showChecklistAtMinicard === 'boolean'
      ? { showChecklistAtMinicard: checklist.showChecklistAtMinicard } : {}),
  });
  for (const item of items) {
    await ChecklistItems.direct.insertAsync({
      checklistId: copiedId,
      cardId: target._id,
      boardId: target.boardId,
      userId,
      title: item.title,
      sort: item.sort,
      isFinished: item.isFinished === true,
      createdAt: copiedAt,
      modifiedAt: copiedAt,
    });
  }
  return copiedId;
}

async function moveAccessibleChecklistToCard(userId, input) {
  const [{ checklist }, { contentCard: target }] = await Promise.all([
    checklistContext(userId, input), checklistDestination(userId, input),
  ]);
  if (checklist.cardId === target._id && checklist.boardId === target.boardId) return false;
  const siblings = await Checklists.find({ cardId: target._id, boardId: target.boardId }, {
    fields: { sort: 1 }, sort: { sort: 1, _id: 1 }, limit: 10000,
  }).fetchAsync();
  const moved = {
    cardId: target._id,
    boardId: target.boardId,
  };
  const items = await ChecklistItems.find({ checklistId: checklist._id,
    cardId: checklist.cardId, boardId: checklist.boardId }, {
    fields: { _id: 1 }, limit: 10000,
  }).fetchAsync();
  for (const item of items) {
    await ChecklistItems.updateAsync({ _id: item._id, checklistId: checklist._id,
      cardId: checklist.cardId, boardId: checklist.boardId }, { $set: moved });
  }
  const activities = await Activities.find({ checklistId: checklist._id }, {
    fields: { _id: 1 }, limit: 10000,
  }).fetchAsync();
  for (const activity of activities) {
    await Activities.updateAsync(activity._id, { $set: moved });
  }
  await Checklists.direct.updateAsync({ _id: checklist._id, cardId: checklist.cardId,
    boardId: checklist.boardId }, { $set: {
    ...moved, sort: computeSortForIndex(siblings, siblings.length),
  } });
  return true;
}

async function convertAccessibleChecklistItemToCard(userId, input) {
  const { item } = await checklistItemContext(userId, input);
  const target = {
    boardId: String(input?.targetBoardId || ''),
    swimlaneId: String(input?.targetSwimlaneId || ''),
    listId: String(input?.targetListId || ''),
    cardId: String(input?.targetCardId || ''),
  };
  const cardId = await createAccessibleCard(userId, {
    boardId: target.boardId,
    swimlaneId: target.swimlaneId,
    listId: target.listId,
    relativeCardId: target.cardId,
    position: input?.position,
    title: cleanChecklistText(input?.title || item.title),
  });
  const user = await Meteor.users.findOneAsync(userId);
  if (user) await user.setMoveAndCopyDialogOption(String(input?.boardId || ''), target);
  return cardId;
}

async function updateAccessibleChecklistItemTitle(userId, input) {
  const { item } = await checklistItemContext(userId, input);
  await ChecklistItems.updateAsync(item._id, { $set: { title: cleanChecklistText(input?.title) } });
  return true;
}

async function toggleAccessibleChecklistItem(userId, input) {
  const { item } = await checklistItemContext(userId, input);
  await ChecklistItems.updateAsync(item._id, { $set: { isFinished: item.isFinished !== true } });
  return true;
}

async function removeAccessibleChecklistItem(userId, input) {
  const { item } = await checklistItemContext(userId, input);
  await ChecklistItems.removeAsync({ _id: item._id, checklistId: item.checklistId,
    cardId: item.cardId, boardId: item.boardId });
  return true;
}

async function toggleAccessibleChecklistSetting(userId, input) {
  const { checklist, contentCard } = await checklistContext(userId, input);
  const setting = String(input?.setting || '');
  const values = {
    hideCheckedChecklistItems: checklist.hideCheckedChecklistItems !== true,
    hideAllChecklistItems: checklist.hideAllChecklistItems !== true,
  };
  if (setting === 'showChecklistAtMinicard') {
    const board = await Boards.findOneAsync(contentCard.boardId, {
      fields: { allowsChecklistsOnMinicard: 1 },
    });
    values.showChecklistAtMinicard = toggledChecklistAtMinicard(
      checklist, board?.allowsChecklistsOnMinicard === true,
    );
  }
  if (!Object.prototype.hasOwnProperty.call(values, setting)) {
    throw new Meteor.Error('invalid-checklist-setting');
  }
  await Checklists.updateAsync(checklist._id, { $set: { [setting]: values[setting] } });
  return true;
}

function reorderedSort(siblings, id, direction) {
  if (!['up', 'down'].includes(direction)) throw new Meteor.Error('invalid-checklist-direction');
  const index = siblings.findIndex(candidate => candidate._id === id);
  const target = index + (direction === 'up' ? -1 : 1);
  if (index < 0 || target < 0 || target >= siblings.length) return null;
  const without = siblings.filter(candidate => candidate._id !== id);
  return computeSortForIndex(without, direction === 'up' ? target : target + 1);
}

async function moveAccessibleChecklist(userId, input) {
  const { checklist, contentCard } = await checklistContext(userId, input);
  const siblings = await Checklists.find({ cardId: contentCard._id, boardId: contentCard.boardId }, {
    fields: { sort: 1 }, sort: { sort: 1, _id: 1 }, limit: 10000,
  }).fetchAsync();
  const sort = reorderedSort(siblings, checklist._id, input?.direction);
  if (sort === null) return false;
  await Checklists.updateAsync(checklist._id, { $set: { sort } });
  return true;
}

async function moveAccessibleChecklistItem(userId, input) {
  const { item, checklist } = await checklistItemContext(userId, input);
  const siblings = await ChecklistItems.find({ checklistId: checklist._id,
    cardId: checklist.cardId, boardId: checklist.boardId }, {
    fields: { sort: 1 }, sort: { sort: 1, _id: 1 }, limit: 10000,
  }).fetchAsync();
  const sort = reorderedSort(siblings, item._id, input?.direction);
  if (sort === null) return false;
  await ChecklistItems.updateAsync(item._id, { $set: { sort } });
  return true;
}

export {
  MAX_CHECKLIST_TEXT_LENGTH,
  checklistContext,
  checklistItemContext,
  cleanChecklistText,
  convertAccessibleChecklistItemToCard,
  copyAccessibleChecklist,
  createAccessibleChecklist,
  createAccessibleChecklistItem,
  editableChecklistCard,
  moveAccessibleChecklist,
  moveAccessibleChecklistItem,
  moveAccessibleChecklistToCard,
  removeAccessibleChecklist,
  removeAccessibleChecklistItem,
  toggleAccessibleChecklistItem,
  toggleAccessibleChecklistSetting,
  updateAccessibleChecklistItemTitle,
  updateAccessibleChecklistTitle,
};
