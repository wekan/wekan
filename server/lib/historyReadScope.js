import { Meteor } from 'meteor/meteor';
import { canEditCardOrLinkedCard } from '/server/lib/linkedCardPermission';
import Boards from '/models/boards';
import Cards from '/models/cards';
import { visibleBoardIds } from '/server/lib/visibleBoardIds';
const { assignedOnlyCardScope } = require('/models/lib/boardCardScope');
const { readableHistoryRow } = require('/models/lib/historyReadScope');

export async function filterReadableHistoryRows(rows, userId) {
  const boardIds = [...new Set(rows.map(row => row.boardId).filter(Boolean))];
  const visible = await visibleBoardIds(userId, boardIds);
  const scopes = new Map();
  for (const boardId of visible) {
    const board = await Boards.findOneAsync(boardId);
    const assigned = assignedOnlyCardScope(board, userId);
    const cardIds = [...new Set(rows.filter(row => row.boardId === boardId)
      .map(row => row.cardId || (row.entityType === 'card' ? row.entityId : null)).filter(Boolean))];
    const cards = assigned && cardIds.length ? await Cards.find({ $and: [
      { boardId, ...assigned }, { _id: { $in: cardIds } },
    ] }, { fields: { _id: 1 } }).fetchAsync() : [];
    scopes.set(boardId, { visible: true, assignedOnly: Boolean(assigned), cardIds: new Set(cards.map(card => card._id)) });
  }
  return rows.filter(row => readableHistoryRow(row, scopes.get(row.boardId)));
}

export async function requireHistoryRowAccess(row, userId) {
  if ((await filterReadableHistoryRows([row], userId)).length !== 1) {
    throw new Meteor.Error('not-authorized', 'This history entry is outside your current access.');
  }
  const cardId = row.cardId || (row.entityType === 'card' ? row.entityId : null);
  if (cardId) {
    const card = await Cards.findOneAsync(cardId);
    const board = card && await Boards.findOneAsync(card.boardId);
    // Not recorded: a member demoted while the History pane is open reaches
    // this by clicking Restore (HistoryScopeBleed is a deliberate omission).
    if (!card || !(await canEditCardOrLinkedCard(userId, card, board, { recordDenial: false }))) {
      throw new Meteor.Error('not-authorized', 'You cannot edit this card through History.');
    }
  }
  // HistoryScopeBleed sibling (2026-10-02): a row keeps the board it was
  // recorded on, but a list or swimlane can move to another board since - and
  // restore/undo/redo then write it, and a deleted list's cards, wherever it
  // is now. Write access is needed where it is NOW, and on any board the row's
  // content moves something to.
  const { memberCan } = require('/models/lib/boardRoleCapabilities');
  const writable = async boardId => {
    const board = boardId && await Boards.findOneAsync(boardId);
    return !!board && memberCan(board.members, userId, 'write');
  };
  if (row.entityType === 'list' || row.entityType === 'swimlane') {
    const Collection = row.entityType === 'list' ? require('/models/lists').default : require('/models/swimlanes').default;
    const doc = await Collection.findOneAsync(row.entityId, { fields: { boardId: 1 } });
    if (doc && !(await writable(doc.boardId))) {
      throw new Meteor.Error('not-authorized', 'This history entry is outside your current access.');
    }
  }
  const destination = row.content && typeof row.content.boardId === 'string' ? row.content.boardId : null;
  if (destination && destination !== row.boardId && !(await writable(destination))) {
    throw new Meteor.Error('not-authorized', 'This history entry is outside your current access.');
  }
}
