// List sync reconcile (docs/Features/ImportExport/Sync.md, #Priority-1 of the
// import/export/sync audit): pure diff between the CURRENT items an external
// tracker (Jira, GitHub, GitLab, Gitea...) reports for a list and the WeKan
// cards already synced from it, with no database or network access - so the
// decision of what to create/update/archive can be pinned exactly by a unit
// test, and server/listSync.js only has to apply the plan this returns.
//
// `externalTasks`: normalized tasks as produced by models/lib/externalParsers.js
//   (parseJira/parseGithub/parseGitlab/parseGitea), each carrying an
//   `externalId` this module uses to match - the SAME shape the one-time
//   import path already consumes, so no second fetch/parse implementation is
//   needed for sync.
// `existingCards`: WeKan cards already in the list, each
//   { _id, syncExternalId, title, description, archived }.
//
// Returns { toCreate, toUpdate, toArchive }:
//   - toCreate: external tasks with no matching card yet (create a new card).
//   - toUpdate: [{ cardId, changes }] for cards whose title/description
//     changed upstream (changes only ever contains keys that actually differ).
//   - toArchive: card ids that were synced from this source but no longer
//     appear upstream. Per the maintainer's explicit instruction ("old
//     entries are at list history") these are ARCHIVED, never deleted - the
//     caller applies this with the existing List/Card archive() helper so the
//     card lands in the board's normal Archive.
export function planListSyncReconcile({ externalTasks = [], existingCards = [] } = {}) {
  const tasksById = new Map();
  externalTasks
    .filter(t => t && t.externalId != null && String(t.externalId).length)
    .forEach(t => tasksById.set(String(t.externalId), t));

  const cardsByExternalId = new Map();
  existingCards
    .filter(c => c && c.syncExternalId)
    .forEach(c => cardsByExternalId.set(String(c.syncExternalId), c));

  const toCreate = [];
  const toUpdate = [];
  const toArchive = [];

  for (const [externalId, task] of tasksById) {
    const card = cardsByExternalId.get(externalId);
    if (!card) {
      toCreate.push(task);
      continue;
    }
    const changes = {};
    if (task.title !== undefined && task.title !== card.title) {
      changes.title = task.title;
    }
    if (task.description !== undefined && task.description !== card.description) {
      changes.description = task.description;
    }
    if (task.column_name !== undefined && task.column_name !== card.column_name) {
      // Signals a status change (e.g. Jira issue moved to a different
      // workflow status) - the caller maps this to a list move when the
      // target list can be resolved, otherwise it is dropped harmlessly.
      changes.column_name = task.column_name;
    }
    if (Object.keys(changes).length) {
      toUpdate.push({ cardId: card._id, changes });
    }
  }

  for (const [externalId, card] of cardsByExternalId) {
    if (!tasksById.has(externalId) && !card.archived) {
      toArchive.push(card._id);
    }
  }

  return { toCreate, toUpdate, toArchive };
}
