// List sync (docs/Features/ImportExport/Sync.md, Priority 1 of the
// import/export/sync audit): periodic job that keeps a WeKan list up to date
// from an external tracker (Jira first, end to end; the same mechanism also
// covers GitHub/GitLab/Gitea/Forgejo since their fetchers+parsers already
// exist). Reuses:
//   - the quave:synced-cron scheduling infrastructure server/scheduledRules.js
//     and server/checklistResetSchedule.js already register jobs on
//     (SyncedCron), rather than a separate Meteor.setInterval;
//   - the EXISTING parsers in models/lib/externalParsers.js (parseJira,
//     parseGithub, parseGitlab, parseGitea) - server/lib/listSyncFetch.js only
//     fetches the same raw JSON shape those parsers already consume for
//     one-time import, so there is no second parsing implementation;
//   - normal card update hooks for archives: a disappeared external item
//     is archived conditionally, without recursively archiving local subtasks.
import { Meteor } from 'meteor/meteor';
import Lists from '/models/lists';
import Cards from '/models/cards';
import Boards from '/models/boards';
import ListSyncCredentials from '/models/listSyncCredentials';
import { EXTERNAL_PARSERS, SYNC_CAPABLE_SOURCES } from '/models/lib/externalParsers';
import { planListSyncReconcile, validateListSyncTasks } from '/models/lib/listSyncReconcile';
import { validateImportSourceShape } from '/models/lib/importSourceShape';
import { LIST_SYNC_FETCHERS } from '/server/lib/listSyncFetch';
import { SyncedCron } from '/server/cron/syncedCron';
import { withListSyncLease } from '/server/lib/listSyncLease';
import { ensureIndex } from '/server/lib/mongoStartup';
const { planSyncTextMerge, syncTextSelector, selectSyncTextFields } = require('/models/lib/listSyncTextMerge');
const { syncSourceKey } = require('/models/lib/listSyncSourceIdentity');
const { listSyncCardId } = require('/server/lib/listSyncCardId');
const { readSyncCredential, sweepSyncCredentials } = require('/server/lib/listSyncConfiguration');
const { describeSyncConflict, planSyncConflictResolution } = require('/server/lib/listSyncConflict');

// Sync one list. Exported for the unit test and for a manual "sync now" call;
// the cron job below just calls this for every eligible list.
export async function syncOneList(list, options = {}) {
  try {
    return await withListSyncLease(list._id, async lease => {
      const current = await Lists.findOneAsync({ _id: list._id, boardId: list.boardId });
      if (!current) return { skipped: true, reason: 'list moved or deleted' };
      return reconcileList(current, options, lease);
    });
  } catch (error) {
    if (error.error === 'sync-busy' || error.error === 'sync-lease-lost') {
      return { error: error.reason };
    }
    throw error;
  }
}

async function reconcileList(list, { fetchers = LIST_SYNC_FETCHERS, resolution, previewConflicts = false,
  assertConflictAccess } = {}, { assertCurrent }) {
  const source = list.syncSource;
  if (!source || !source.type || source.enabled === false) return { skipped: true };
  if (!SYNC_CAPABLE_SOURCES.includes(source.type)) {
    return { skipped: true, reason: 'source type has no externalId-capable parser' };
  }
  const parser = EXTERNAL_PARSERS[source.type];
  const fetcher = fetchers[source.type];
  if (!parser || !fetcher) return { skipped: true, reason: 'no parser/fetcher for source type' };
  let conflictScope = assertConflictAccess ? await assertConflictAccess() : null;

  const credential = await readSyncCredential(ListSyncCredentials, list);

  let parsed, sourceKey;
  const listSelector = { _id: list._id, boardId: list.boardId, syncSource: source,
    syncRevision: list.syncRevision === undefined ? { $exists: false } : list.syncRevision };
  try {
    sourceKey = syncSourceKey(source);
    if (!credential || credential.sourceKey !== sourceKey) {
      throw new Error('Save Sync settings with a credential for this server and project before syncing.');
    }
    const raw = await fetcher(source, credential);
    validateImportSourceShape(source.type, raw);
    parsed = parser(raw);
    validateListSyncTasks(parsed?.tasks);
  } catch (e) {
    await assertCurrent();
    if (!conflictScope) await Lists.updateAsync(listSelector, {
      $set: { 'syncSource.lastSyncError': String((e && e.message) || e).slice(0, 500) },
    });
    try {
      // #Priority-1 sync: a fetch failure is usually a bad/expired credential
      // or an unreachable URL - a config problem worth surfacing the same way
      // other repeated-failure conditions are, without breaking the sync loop
      // if logging itself throws.
      // eslint-disable-next-line global-require
      const { record } = require('/server/lib/securityLog');
      record({
        key: 'listSyncFetchFailed',
        action: 'blocked',
        source: source.type,
        detail: `list ${list._id}: ${String((e && e.message) || e).slice(0, 200)}`,
      });
    } catch (logError) {
      // logging must never break the guard
    }
    return { error: String((e && e.message) || e) };
  }

  await assertCurrent();
  const externalTasks = selectSyncTextFields(parsed.tasks, source.fields);

  // A response fetched for a previous configuration must not start a new
  // reconcile after a source switch or disconnect. Card writes below still
  // use their own identity preconditions; this is not a transaction.
  if (!await Lists.findOneAsync(listSelector)) {
    return { error: 'Sync settings changed while fetching. Retry sync.' };
  }
  // Manual callers with an assigned-only role review their own existing
  // cards. They must not trigger a list-wide create/update/archive run.
  conflictScope = assertConflictAccess ? await assertConflictAccess() : null;

  const existingCards = (
    await Cards.find({ boardId: list.boardId, listId: list._id, syncSourceType: source.type, syncSourceKey: sourceKey,
      ...(conflictScope || {}) }).fetchAsync()
  ).map(c => ({
    _id: c._id,
    syncExternalId: c.syncExternalId,
    syncSourceType: c.syncSourceType,
    syncSourceKey: c.syncSourceKey,
    syncLastSource: c.syncLastSource,
    title: c.title,
    description: c.description,
    spentTime: c.spentTime,
    archived: c.archived,
  }));

  const merge = planSyncTextMerge(externalTasks, existingCards);
  if (resolution) {
    const plan = planSyncConflictResolution(merge.conflicts, existingCards, externalTasks, list, sourceKey, resolution);
    if (!plan) return { error: 'This conflict changed. Run Sync again to review the current values.' };
    const currentScope = assertConflictAccess ? await assertConflictAccess() : null;
    await assertCurrent();
    if (!await Lists.findOneAsync(listSelector)) return { error: 'Sync settings changed. Run Sync again.' };
    const selector = syncTextSelector(plan.card, list.boardId, list._id);
    // Assignment loss between the read and write must fail the same atomic
    // comparison as a changed card value. Scope remains server-owned.
    const changed = await Cards.updateAsync(currentScope ? { $and: [selector, currentScope] } : selector,
      { $set: { ...plan.changes, dateLastActivity: new Date() }, ...(plan.unset ? { $unset: plan.unset } : {}) });
    return changed ? { resolved: true } : { error: 'The card changed. Run Sync again to review the current values.' };
  }
  if (merge.conflicts.length) {
    // This status is published with the list, including to assigned-only
    // members. Put card identifiers and values only in the scoped response.
    const error = merge.conflicts.some(row => row.field === 'syncExternalId')
      ? 'Duplicate local Sync identity. Resolve duplicate card mappings before retrying.'
      : 'Sync text conflict. Review the conflicting values in the Sync popup.';
    await assertCurrent();
    if (!conflictScope) await Lists.updateAsync(listSelector, { $set: { 'syncSource.lastSyncError': error } });
    const cardsById = new Map(existingCards.map(card => [card._id, card]));
    const tasksById = new Map(externalTasks.map(task => [String(task.externalId), task]));
    if (previewConflicts && assertConflictAccess) {
      const currentScope = await assertConflictAccess();
      if (JSON.stringify(currentScope) !== JSON.stringify(conflictScope)) return { error: 'Your card access changed. Run Sync again.' };
    }
    return { error, reviewOnly: !!conflictScope, conflicts: merge.conflicts.slice(0, 50).map(conflict => previewConflicts ? describeSyncConflict(conflict,
      cardsById.get(conflict.cardId), tasksById.get(conflict.externalId), list, sourceKey, existingCards) : conflict) };
  }
  if (conflictScope) return { reviewOnly: true, conflicts: [] };
  const plan = planListSyncReconcile({ externalTasks: merge.tasks, existingCards });
  // Apply operation selection before preflight, writes and result counts.
  // Missing switches retain the behavior of existing configurations.
  if (source.createCards === false) plan.toCreate = [];
  if (source.archiveCards === false) plan.toArchive = [];
  const updatesByCard = new Map(plan.toUpdate.map(row => [row.cardId, row]));
  const existingById = new Map(existingCards.map(card => [card._id, card]));
  for (const [cardId, baseline] of merge.baselines) {
    let update = updatesByCard.get(cardId);
    if (!update) { update = { cardId, changes: {} }; plan.toUpdate.push(update); }
    update.changes.syncLastSource = baseline;
  }

  // Do not recursively archive independent local work through a synced parent.
  for (const cardId of plan.toArchive) {
    if (await Cards.findOneAsync({ parentId: cardId, archived: { $ne: true }, _id: { $nin: plan.toArchive } })) {
      const error = 'Sync archive conflict: an active subtask is not in the source archive plan.';
      await assertCurrent();
      await Lists.updateAsync(listSelector, { $set: { 'syncSource.lastSyncError': error } });
      return { error };
    }
  }

  const board = await Boards.findOneAsync(list.boardId);
  const now = new Date();

  for (const task of plan.toCreate) {
    const cardId = listSyncCardId(list._id, sourceKey, task.externalId);
    try {
      // eslint-disable-next-line no-await-in-loop
      await assertCurrent();
      await Cards.insertAsync({
        _id: cardId,
        title: task.title || 'Imported item',
        description: task.description || '',
        ...(task.spentTime !== undefined ? { spentTime: task.spentTime } : {}),
        listId: list._id,
        swimlaneId: list.swimlaneId || (board && (await board.getDefaultSwimlineAsync())._id) || '',
        boardId: list.boardId,
        sort: -1,
        dateLastActivity: now,
        syncExternalId: String(task.externalId),
        syncSourceType: source.type,
        syncSourceKey: sourceKey,
        syncLastSource: {
          ...(task.title !== undefined ? { title: task.title } : {}),
          ...(task.description !== undefined ? { description: task.description } : {}),
          ...(task.spentTime !== undefined ? { spentTime: task.spentTime } : {}),
        },
      });
    } catch (e) {
      // A second worker or a retry after a card move must not create a new
      // target or overwrite the existing card. Never treat a duplicate as a
      // successful reconciliation: its contents may have changed meanwhile.
      if (e.code !== 11000 || !await Cards.findOneAsync({ _id: cardId })) throw e;
      const error = 'Sync creation conflict: a card for this source item already exists. Retry Sync; if the card was moved, return it to this list before retrying.';
      await assertCurrent();
      await Lists.updateAsync(listSelector, { $set: { 'syncSource.lastSyncError': error } });
      return { error };
    }
  }

  for (const update of plan.toUpdate) {
    const { column_name, ...cardChanges } = update.changes;
    // eslint-disable-next-line no-await-in-loop
    if (Object.keys(cardChanges).length) {
      // eslint-disable-next-line no-await-in-loop
      const previous = existingById.get(update.cardId);
      await assertCurrent();
      const changed = await Cards.updateAsync(syncTextSelector(previous, list.boardId, list._id), { $set: { ...cardChanges, dateLastActivity: now } });
      if (!changed) {
        const error = 'Sync card changed while applying updates; retry sync.';
        await assertCurrent();
        await Lists.updateAsync(listSelector, { $set: { 'syncSource.lastSyncError': error } });
        return { error };
      }
    }
    // column_name (a status change upstream) is recorded but not auto-moved
    // across lists here - moving a card out of the very list a sync watches
    // would make the next run's diff undefined. Left for a future pass; see
    // CHANGELOG TODO Later.
  }

  for (const cardId of plan.toArchive) {
    const previous = existingById.get(cardId);
    await assertCurrent();
    const changed = await Cards.updateAsync(syncTextSelector(previous, list.boardId, list._id), {
      $set: { archived: true, archivedAt: now },
    });
    if (!changed) {
      const error = 'Sync card changed while archiving; retry sync.';
      await assertCurrent();
      await Lists.updateAsync(listSelector, { $set: { 'syncSource.lastSyncError': error } });
      return { error };
    }
  }

  await assertCurrent();
  await Lists.updateAsync(listSelector, {
    $set: { 'syncSource.lastSyncedAt': now, 'syncSource.lastSyncError': '' },
  });

  return {
    created: plan.toCreate.length,
    updated: plan.toUpdate.length,
    archived: plan.toArchive.length,
  };
}

export async function scanListSync() {
  const lists = await Lists.find({
    'syncSource.type': { $exists: true },
    'syncSource.enabled': { $ne: false },
    archived: false,
  }).fetchAsync();
  for (const list of lists) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await syncOneList(list);
    } catch (e) {
      // Never let one broken list's sync stop the rest.
      // eslint-disable-next-line no-console
      console.error('listSync: error syncing list', list._id, e);
    }
  }
}

Meteor.startup(async () => {
  try {
    await ensureIndex(ListSyncCredentials, { listId: 1, generation: 1 });
    SyncedCron.add({
      name: 'wekan-list-sync-credential-cleanup',
      schedule(parser) { return parser.text('every 1 hour'); },
      async job() {
        try {
          const result = await sweepSyncCredentials({ lists: Lists, credentials: ListSyncCredentials,
            cursor: ListSyncCredentials.rawCollection().find({}, { projection: { _id: 0, listId: 1 } })
              .sort({ listId: 1 }).batchSize(100) });
          if (result.failed) console.error('listSync: credential cleanup failed for some lists; retrying on the next sweep.');
          return result;
        } catch (_) {
          console.error('listSync: credential cleanup scan failed; retrying on the next sweep.');
          return { failed: true };
        }
      },
    });
    SyncedCron.add({
      name: 'wekan-list-sync',
      schedule(parser) {
        return parser.text('every 15 minutes');
      },
      job() {
        return scanListSync();
      },
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('listSync: failed to register cron job', e);
  }
});
