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
//     caller applies a conditional archived/archivedAt update so the card
//     lands in the board's normal Archive without cascading to local subtasks.
// Missing IDs must not be dropped as if those source items disappeared, and
// duplicate IDs must not silently choose the last of two conflicting records.
export function validateListSyncTasks(tasks) {
  if (!Array.isArray(tasks)) throw new Error('Invalid sync task collection');
  const ids = new Set();
  for (const task of tasks) {
    const id = task?.externalId;
    if (!((typeof id === 'string' && id.trim().length > 0) ||
      (typeof id === 'number' && Number.isSafeInteger(id) && id >= 0))) {
      throw new Error('Sync task is missing a valid external ID');
    }
    if (ids.has(String(id))) throw new Error('Duplicate sync external ID');
    ids.add(String(id));
    if (task.spentTime !== undefined && (typeof task.spentTime !== 'number' || !Number.isFinite(task.spentTime) || task.spentTime < 0)) throw new Error('Invalid sync spent time');
    for (const field of ['originalEstimate', 'remainingEstimate']) {
      if (task[field] !== undefined && task[field] !== null && (typeof task[field] !== 'number' || !Number.isFinite(task[field]) || task[field] < 0 || task[field] > 1e12)) throw new Error(`Invalid sync ${field}`);
    }
    if (task.estimate !== undefined && task.estimate !== null && (typeof task.estimate !== 'number' || !Number.isFinite(task.estimate) || task.estimate < 0 || task.estimate > 1e12)) throw new Error('Invalid sync estimate');
    for (const field of ['title', 'description', 'column_name']) {
      if (task[field] !== undefined && typeof task[field] !== 'string') throw new Error(`Invalid sync task ${field}`);
    }
  }
}

export function planListSyncReconcile({ externalTasks = [], existingCards = [] } = {}) {
  validateListSyncTasks(externalTasks);
  const tasksById = new Map();
  externalTasks.forEach(t => tasksById.set(String(t.externalId), t));

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
    if (task.spentTime !== undefined && task.spentTime !== card.spentTime) changes.spentTime = task.spentTime;
    for (const field of ['originalEstimate', 'remainingEstimate']) if (task[field] !== undefined && task[field] !== card[field]) changes[field] = task[field];
    if (task.estimate !== undefined && task.estimate !== card.estimate) changes.estimate = task.estimate;
    if (task.column_name !== undefined && task.column_name !== card.column_name) {
      // Signals a status change (e.g. Jira issue moved to a different
      // workflow status). Current Sync reports it as an unmapped field in
      // preview and excludes it from writes; automatic list moves are pending.
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
