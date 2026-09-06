import { Meteor } from 'meteor/meteor';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Checklists from '/models/checklists';
import ChecklistItems from '/models/checklistItems';
import { editableCard } from '/server/lib/accessibleCardOperations';
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
  createAccessibleChecklist,
  createAccessibleChecklistItem,
  editableChecklistCard,
  moveAccessibleChecklist,
  moveAccessibleChecklistItem,
  removeAccessibleChecklist,
  removeAccessibleChecklistItem,
  toggleAccessibleChecklistItem,
  toggleAccessibleChecklistSetting,
  updateAccessibleChecklistItemTitle,
  updateAccessibleChecklistTitle,
};
