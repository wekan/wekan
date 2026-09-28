import boardScope from '../../models/lib/boardCardScope.js';
const { isAssignedOnlyMember } = boardScope;
const dateFields = { receivedAt: 1, startAt: 1, dueAt: 1, endAt: 1 };
const cardFields = { ...dateFields, boardId: 1, assignees: 1, archived: 1 };
const boardFields = { ...dateFields, permission: 1, members: 1 };
const unique = values => [...new Set(values.filter(value => typeof value === 'string' && value))].sort();
const signature = docs => JSON.stringify(docs.map(doc => Object.fromEntries(
  Object.keys(doc).sort().map(key => [key, doc[key]]))).sort((a, b) => a._id.localeCompare(b._id)));

// Resolve exactly one hop, like the card date helpers, without publishing any
// source document. Observe before reading and recheck the captured data/policy
// after the table scan, including when an observer callback is delayed.
export async function prepareTableLinkedDates({ Cards, Boards, scope, userId, canReadBoard, watch }) {
  const wrappers = await Cards.rawCollection().find({ $and: [scope,
    { type: { $in: ['cardType-linkedCard', 'cardType-linkedBoard'] } }] },
  { projection: { type: 1, linkedId: 1 } }).toArray();
  const cardIds = unique(wrappers.filter(card => card.type === 'cardType-linkedCard').map(card => card.linkedId));
  const linkedBoardIds = unique(wrappers.filter(card => card.type === 'cardType-linkedBoard').map(card => card.linkedId));
  await watch('linked-date-cards', JSON.stringify(cardIds), Cards.find({ _id: { $in: cardIds } }, { fields: cardFields }));
  const readCards = () => Cards.rawCollection().find({ _id: { $in: cardIds } }, { projection: cardFields }).toArray();
  const sources = await readCards();
  const boardIds = unique([...linkedBoardIds, ...sources.map(card => card.boardId)]);
  await watch('linked-date-boards', JSON.stringify(boardIds), Boards.find({ _id: { $in: boardIds } }, { fields: boardFields }));
  const readBoards = () => Boards.find({ _id: { $in: boardIds } }, { fields: boardFields }).fetchAsync();
  const boards = await readBoards();
  const allowed = new Map(boards.filter(board => canReadBoard(userId, board)).map(board => [board._id, board]));
  const dates = doc => Object.fromEntries(Object.keys(dateFields).map(field => [field, doc?.[field] ?? null]));
  const cardDates = new Map(sources.filter(card => {
    const board = allowed.get(card.boardId);
    return board && card.archived === false && (!isAssignedOnlyMember(board, userId) || card.assignees?.includes(userId));
  }).map(card => [card._id, dates(card)]));
  const boardDates = new Map([...allowed].map(([id, board]) => [id, dates(board)]));
  const beforeCards = signature(sources), beforeBoards = signature(boards);
  return {
    dates(card) {
      if (card.type === 'cardType-linkedCard') return cardDates.get(card.linkedId) || dates(null);
      if (card.type === 'cardType-linkedBoard') return boardDates.get(card.linkedId) || dates(null);
      return dates(card);
    },
    async isCurrent() {
      const [currentCards, currentBoards] = await Promise.all([readCards(), readBoards()]);
      return signature(currentCards) === beforeCards && signature(currentBoards) === beforeBoards;
    },
  };
}
