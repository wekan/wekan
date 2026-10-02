// Every card of the sprint and every list: a snapshot has no card cap
// (maintainer decision of 2026-10-03; its rows are stored in chunks). Exclude
// large unrelated card bodies and attachments, retaining rollover
// preconditions.
async function loadScrumSnapshotInputs({ cards, lists, boardId, sprintId, includeArchived }) {
  const [cardRows, listRows] = await Promise.all([
    cards.find({ boardId, 'scrum.sprintId': sprintId,
      ...(includeArchived ? {} : { archived: { $ne: true } }) }, {
      fields: { listId: 1, archived: 1, dueComplete: 1, 'poker.estimation': 1,
        customFields: 1, scrum: 1, scrumRevision: 1 },
    }).fetchAsync(),
    lists.find({ boardId }, { fields: { scrum: 1 } }).fetchAsync(),
  ]);
  return { cards: cardRows, lists: listRows };
}
module.exports = { loadScrumSnapshotInputs };
