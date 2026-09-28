import { Meteor } from 'meteor/meteor';
import Boards from '/models/boards';
import Cards from '/models/cards';
const { archiveYear, archiveContributions } = require('/models/lib/archiveContributions');
const { assignedOnlyCardScope } = require('/models/lib/boardCardScope');

export async function loadArchiveContributions(userId, boardId, year) {
  year = archiveYear(year);
  const board = await Boards.findOneAsync(boardId);
  if (!board || !board.isVisibleBy({ _id: userId })) throw new Meteor.Error('not-authorized');
  const scope = assignedOnlyCardScope(board, userId);
  const report = archiveContributions(year, board.labels);
  // Iterate projected records instead of retaining the board's cards in memory.
  await Cards.find({ boardId, archived: true,
    archivedAt: { $gte: report.from, $lt: report.until }, ...(scope || {}),
  }, { fields: { archived: 1, archivedAt: 1, labelIds: 1 } }).forEachAsync(card => report.add(card));
  const current = await Boards.findOneAsync(boardId);
  if (!current || !current.isVisibleBy({ _id: userId }) ||
      JSON.stringify(assignedOnlyCardScope(current, userId)) !== JSON.stringify(scope)) {
    throw new Meteor.Error('not-authorized');
  }
  return report.result();
}
