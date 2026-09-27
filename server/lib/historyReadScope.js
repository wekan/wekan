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
    const cards = assigned ? await Cards.find({ boardId, ...assigned }, { fields: { _id: 1 } }).fetchAsync() : [];
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
    if (!card || !(await canEditCardOrLinkedCard(userId, card, board))) {
      throw new Meteor.Error('not-authorized', 'You cannot edit this card through History.');
    }
  }
}
