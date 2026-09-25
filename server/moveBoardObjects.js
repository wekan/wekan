import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import Boards from '/models/boards';
import Swimlanes from '/models/swimlanes';
import Lists from '/models/lists';
import Cards from '/models/cards';
import Checklists from '/models/checklists';
import ChecklistItems from '/models/checklistItems';
import Activities from '/models/activities';
import { allowIsBoardAdminOrSiteAdmin } from '/server/lib/utils';
const { columnModifier } = require('/models/lib/boardSettingsColumns');
const { DRAG_SETTINGS, canDragSelection } = require('/models/lib/boardDragging');
import { requireBoardMutation } from '/models/lib/boardMutationGuard';
const { memberCan } = require('/models/lib/boardRoleCapabilities');
const { selectionRoots, kinds } = require('/models/lib/structuralSelection');
const collections = { swimlane: Swimlanes, list: Lists, card: Cards, checklist: Checklists, item: ChecklistItems };
const targetShape = { boardId: String, swimlaneId: Match.Optional(String), listId: Match.Optional(String), cardId: Match.Optional(String), checklistId: Match.Optional(String), itemId: Match.Optional(String), position: Match.Optional(Match.OneOf('before', 'after')) };
async function boardAccess(userId, id) {
  const board = await Boards.findOneAsync(id);
  requireBoardMutation(userId, board, 'moveBoardObjects', Meteor);
  return board;
}
async function describe(kind, doc) {
  const ancestors = [];
  let card = kind === 'card' ? doc : null;
  if (kind === 'item') ancestors.push(`checklist:${doc.checklistId}`);
  if (kind === 'checklist' || kind === 'item') {
    card = await Cards.findOneAsync(doc.cardId);
    if (!card) throw new Meteor.Error('not-found');
    ancestors.push(`card:${card._id}`);
  }
  if (card) ancestors.push(`list:${card.listId}`, `swimlane:${card.swimlaneId}`);
  if (kind === 'list' && doc.swimlaneId) ancestors.push(`swimlane:${doc.swimlaneId}`);
  return { ...doc, kind, ancestors, boardId: card?.boardId || doc.boardId };
}
async function destination(userId, target) {
  await boardAccess(userId, target.boardId);
  const result = {};
  for (const [kind, field] of [['swimlane', 'swimlaneId'], ['list', 'listId'], ['card', 'cardId'], ['checklist', 'checklistId'], ['item', 'itemId']]) {
    if (!target[field]) continue;
    const doc = await collections[kind].findOneAsync(target[field]);
    if (!doc || doc.archived || (await describe(kind, doc)).boardId !== target.boardId) throw new Meteor.Error('invalid-destination');
    result[kind] = doc;
  }
  if (result.list?.swimlaneId && result.list.swimlaneId !== target.swimlaneId) throw new Meteor.Error('invalid-destination');
  if (result.card && (result.card.listId !== target.listId || result.card.swimlaneId !== target.swimlaneId)) throw new Meteor.Error('invalid-destination');
  if (result.checklist && result.checklist.cardId !== target.cardId) throw new Meteor.Error('invalid-destination');
  if (result.item && result.item.checklistId !== target.checklistId) throw new Meteor.Error('invalid-destination');
  return result;
}
// Insert a stable ordered group before/after an unselected anchor, renumbering
// the destination siblings so repeated moves cannot exhaust fractional indexes.
async function positionGroup(kind, ids, selector, anchor, after) {
  const collection = collections[kind];
  const siblings = (await collection.find(selector, { sort: { sort: 1, _id: 1 } }).fetchAsync()).filter(doc => !ids.includes(doc._id));
  let index = anchor ? siblings.findIndex(doc => doc._id === anchor) : after ? siblings.length : 0;
  if (index < 0) throw new Meteor.Error('invalid-position');
  if (anchor && after) index++;
  const order = siblings.map(doc => doc._id); order.splice(index, 0, ...ids);
  for (let i = 0; i < order.length; i++) await collection.updateAsync(order[i], { $set: { sort: i } });
}
Meteor.methods({
  async setBoardSettingsColumn(boardId, section, column, enabled) {
    check(boardId, String); check(section, String); check(column, String); check(enabled, Boolean);
    const modifier = columnModifier(section, column, enabled);
    if (!modifier) throw new Meteor.Error('invalid-setting');
    const board = await Boards.findOneAsync(boardId);
    if (!this.userId || !board || !(await allowIsBoardAdminOrSiteAdmin(this.userId, board))) throw new Meteor.Error('not-authorized');
    return Boards.updateAsync(boardId, modifier);
  },
  async setBoardDragging(boardId, kind, enabled) {
    check(boardId, String); check(kind, String); check(enabled, Boolean);
    const setting = DRAG_SETTINGS.find(entry => entry.kind === kind);
    if (!setting) throw new Meteor.Error('invalid-setting');
    const board = await Boards.findOneAsync(boardId);
    if (!this.userId || !board || !(await allowIsBoardAdminOrSiteAdmin(this.userId, board))) throw new Meteor.Error('not-authorized');
    return Boards.updateAsync(boardId, { $set: { [setting.field]: enabled } });
  },
  async structuralMoveOptions(target) {
    check(target, targetShape);
    if (!this.userId) throw new Meteor.Error('not-authorized');
    const boards = await Boards.find({ 'members.userId': this.userId, archived: false }).fetchAsync();
    const writable = [];
    for (const board of boards) if (memberCan(board.members, this.userId, 'write')) writable.push({ _id: board._id, title: board.title });
    await boardAccess(this.userId, target.boardId);
    const projected = async (collection, query) => (await collection.find(query, { sort: { sort: 1 }, fields: { title: 1 } }).fetchAsync());
    const result = { boardId: writable, swimlaneId: await projected(Swimlanes, { boardId: target.boardId, archived: false }) };
    if (target.swimlaneId) result.listId = await projected(Lists, { boardId: target.boardId, archived: false, $or: [{ swimlaneId: target.swimlaneId }, { swimlaneId: '' }, { swimlaneId: { $exists: false } }] });
    if (target.listId) result.cardId = await projected(Cards, { boardId: target.boardId, listId: target.listId, swimlaneId: target.swimlaneId, archived: false });
    if (target.cardId && await Cards.findOneAsync({ _id: target.cardId, boardId: target.boardId })) result.checklistId = await projected(Checklists, { cardId: target.cardId });
    if (target.checklistId && await Checklists.findOneAsync({ _id: target.checklistId, boardId: target.boardId })) result.itemId = await projected(ChecklistItems, { checklistId: target.checklistId });
    return result;
  },
  async moveBoardObjects(sourceBoardId, selection, target, options = {}) {
    check(options, { drag: Match.Optional(Boolean) });
    check(sourceBoardId, String); check(selection, [{ kind: String, id: String }]); check(target, targetShape);
    if (!selection.length || selection.length > 200 || selection.some(entry => !kinds.includes(entry.kind))) throw new Meteor.Error('invalid-selection');
    const sourceBoard = await boardAccess(this.userId, sourceBoardId);
    if (options.drag && !canDragSelection(sourceBoard, selection)) throw new Meteor.Error('drag-disabled');
    const dest = await destination(this.userId, target);
    const entries = [];
    for (const entry of selection) {
      const doc = await collections[entry.kind].findOneAsync(entry.id);
      if (!doc || doc.archived) throw new Meteor.Error('not-found');
      const described = await describe(entry.kind, doc);
      if (described.boardId !== sourceBoardId) throw new Meteor.Error('invalid-selection');
      entries.push(described);
    }
    const roots = selectionRoots(entries);
    const rootKeys = new Set(roots.map(doc => `${doc.kind}:${doc._id}`));
    // Reject targets that themselves move, including unselected descendants.
    for (const [kind, doc] of Object.entries(dest)) {
      const described = await describe(kind, doc);
      if ([`${kind}:${doc._id}`, ...described.ancestors].some(key => rootKeys.has(key))) throw new Meteor.Error('invalid-destination', 'Choose a destination outside the selected objects.');
    }
    const needsLane = roots.some(doc => doc.kind !== 'swimlane');
    const needsList = roots.some(doc => ['card', 'checklist', 'item'].includes(doc.kind));
    if ((needsLane && !dest.swimlane) || (needsList && !dest.list)) throw new Meteor.Error('invalid-destination', 'Choose a destination swimlane and list.');
    const grouped = Object.fromEntries(kinds.map(kind => [kind, roots.filter(doc => doc.kind === kind)]));
    // All permissions and parent relationships above are checked before writes.
    for (const lane of grouped.swimlane) {
      // Card move hooks validate the destination lane against its board.
      // Move the parent first or they substitute the destination default lane.
      await Swimlanes.updateAsync(lane._id, { $set: { boardId: target.boardId } });
      if (lane.boardId !== target.boardId) {
        const lists = await Lists.find({ boardId: sourceBoardId, swimlaneId: lane._id }).fetchAsync();
        for (const list of lists) await Lists.updateAsync(list._id, { $set: { boardId: target.boardId } });
        const cards = await Cards.find({ boardId: sourceBoardId, swimlaneId: lane._id }).fetchAsync();
        const mapping = new Map(lists.map(list => [list._id, list._id]));
        for (const card of cards) {
          if (!mapping.has(card.listId)) {
            const list = await Lists.findOneAsync(card.listId);
            const { _id, ...copy } = list;
            mapping.set(_id, await Lists.insertAsync({ ...copy, boardId: target.boardId, swimlaneId: lane._id }));
          }
          await card.move(target.boardId, lane._id, mapping.get(card.listId), card.sort);
        }
      }
    }
    if (grouped.swimlane.length && sourceBoardId !== target.boardId) {
      const source = await Boards.findOneAsync(sourceBoardId);
      await source.getDefaultSwimlineAsync();
    }
    for (const list of grouped.list) {
      await Lists.updateAsync(list._id, { $set: { boardId: target.boardId, swimlaneId: target.swimlaneId } });
      for (const card of await Cards.find({ boardId: sourceBoardId, listId: list._id }).fetchAsync()) await card.move(target.boardId, target.swimlaneId, list._id, card.sort);
    }
    for (const card of grouped.card) {
      const live = await Cards.findOneAsync(card._id);
      await live.move(target.boardId, target.swimlaneId, target.listId);
    }
    let cardId = target.cardId;
    if ((grouped.checklist.length || grouped.item.length) && !cardId) {
      cardId = await Cards.insertAsync({ boardId: target.boardId, swimlaneId: target.swimlaneId, listId: target.listId,
        title: (grouped.checklist[0] || grouped.item[0]).title, userId: this.userId, sort: 0 });
      grouped.card.push({ _id: cardId });
    }
    for (const checklist of grouped.checklist) {
      await Meteor.server.method_handlers.moveChecklist.apply(this, [checklist._id, cardId]);
    }
    let checklistId = target.checklistId;
    if (grouped.item.length && !checklistId) {
      checklistId = await Checklists.insertAsync({ cardId, title: grouped.item[0].title, sort: 0 });
      grouped.checklist.push({ _id: checklistId });
    }
    for (const item of grouped.item) {
      await ChecklistItems.updateAsync(item._id, { $set: { cardId, checklistId, boardId: target.boardId } });
      await Activities.updateAsync({ checklistItemId: item._id }, { $set: { cardId, checklistId, boardId: target.boardId } }, { multi: true });
    }
    const selectors = { swimlane: { boardId: target.boardId, archived: false }, list: { boardId: target.boardId, archived: false, $or: [{ swimlaneId: target.swimlaneId }, { swimlaneId: '' }, { swimlaneId: { $exists: false } }] }, card: { boardId: target.boardId, swimlaneId: target.swimlaneId, listId: target.listId, archived: false }, checklist: { cardId }, item: { checklistId } };
    const anchors = { swimlane: target.swimlaneId, list: target.listId, card: target.cardId, checklist: target.checklistId, item: target.itemId };
    for (const kind of kinds) if (grouped[kind].length) await positionGroup(kind, grouped[kind].map(doc => doc._id), selectors[kind], anchors[kind], target.position !== 'before');
    return { moved: roots.length, cardId, checklistId };
  },
});
