const { SCRUM_SNAPSHOT_LIMIT } = require('../../models/lib/scrum');

// Fetch one sentinel beyond the snapshot limit so the snapshot validator can
// reject incomplete input before any lifecycle/History writes. Exclude large
// unrelated card bodies and attachments, retaining rollover preconditions.
async function loadScrumSnapshotInputs({ cards, lists, boardId, sprintId, includeArchived }) {
  const [cardRows, listRows] = await Promise.all([
    cards.find({ boardId, 'scrum.sprintId': sprintId,
      ...(includeArchived ? {} : { archived: { $ne: true } }) }, {
      limit: SCRUM_SNAPSHOT_LIMIT + 1,
      fields: { listId: 1, archived: 1, dueComplete: 1, 'poker.estimation': 1,
        customFields: 1, scrum: 1, scrumRevision: 1 },
    }).fetchAsync(),
    lists.find({ boardId }, { limit: SCRUM_SNAPSHOT_LIMIT + 1,
      fields: { scrum: 1 } }).fetchAsync(),
  ]);
  return { cards: cardRows, lists: listRows };
}
module.exports = { loadScrumSnapshotInputs };
