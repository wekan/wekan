import '/server/notifications/storedRulePlans';
import '/server/notifications/storedWebhooks';
import '/server/notifications/storedDelivery';
import '/server/lib/listSyncOperations';
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
import { DDP } from 'meteor/ddp';
import { allowIsBoardMemberWithWriteAccess } from '/server/lib/utils';
const { assignedOnlyCardScope } = require('/models/lib/boardCardScope');
const { withScheduledSyncActor } = require('/server/lib/scheduledSyncActor');
import Lists from '/models/lists';
import Cards from '/models/cards';
import Boards from '/models/boards';
import CustomFields from '/models/customFields';
const { syncEstimateMapping, addSyncEstimates, cardSyncEstimate } = require('/models/lib/listSyncEstimate');
const { TIME_FIELDS, syncTimeMappings, timeMappingIdentities, addSyncTimeEstimates, cardSyncTimes, syncTimeBaseline, syncValueChanges } = require('/models/lib/listSyncTimeEstimates');
import ListSyncCredentials from '/models/listSyncCredentials';
import { EXTERNAL_PARSERS, SYNC_CAPABLE_SOURCES } from '/models/lib/externalParsers';
import { planListSyncReconcile, validateListSyncTasks } from '/models/lib/listSyncReconcile';
import { validateImportSourceShape } from '/models/lib/importSourceShape';
import { LIST_SYNC_FETCHERS } from '/server/lib/listSyncFetch';
import { SyncedCron } from '/server/cron/syncedCron';
import { withListSyncLease } from '/server/lib/listSyncLease';
import { ensureIndex } from '/server/lib/mongoStartup';
import ListSyncTargets from '/server/lib/listSyncTargets';
import ListSyncRunReports from '/server/lib/listSyncRunReports';
const { withSyncRunReport } = require('/server/lib/syncRunReport');
const { planSyncTextMerge, syncTextSelector, selectSyncTextFields } = require('/models/lib/listSyncTextMerge');
const { syncSourceKey } = require('/models/lib/listSyncSourceIdentity');
const { readSyncCredential, sweepSyncCredentials } = require('/server/lib/listSyncConfiguration');
const { describeSyncConflict, planSyncConflictResolution } = require('/server/lib/listSyncConflict');
const { readSyncTarget, replaceSyncTarget, describeCreationConflict } = require('/server/lib/listSyncTarget');
const { syncCoverage, prepareSyncWrites, describeSyncPreview } = require('/server/lib/listSyncPreview');
const { describeSyncSourceCoverage } = require('/server/lib/listSyncSourceCoverage');
// Empty/whitespace source text is a real comparison baseline. Keep schema
// validation and hooks, but do not clean these values into missing/trimmed data.
const SYNC_TEXT_WRITE_OPTIONS = { removeEmptyStrings: false, trimStrings: false };

// Sync one list. Exported for the unit test and for a manual "sync now" call;
// the cron job below just calls this for every eligible list.
export async function syncOneList(list, options = {}) {
  try {
    return await withListSyncLease(list._id, async lease => {
      const current = await Lists.findOneAsync({ _id: list._id, boardId: list.boardId });
      if (!current) return { skipped: true, reason: 'list moved or deleted' };
      if (options.scheduled) {
        return withScheduledSyncActor({ list: current,
          credential: await readSyncCredential(ListSyncCredentials, current),
          findUser: id => Meteor.users.findOneAsync(id, { fields: { loginDisabled: 1 } }),
          findBoard: id => Boards.findOneAsync(id),
          canWrite: allowIsBoardMemberWithWriteAccess, assignedScope: assignedOnlyCardScope,
          withActor: (userId, fn) => DDP._CurrentMethodInvocation.withValue({ userId, isSimulation: false }, fn),
          run: assertCurrent => reconcileList(current, options, { assertCurrent }),
          assertCurrent: lease.assertCurrent,
        });
      }
      return reconcileList(current, options, lease);
    });
  } catch (error) {
    if (['sync-actor-required', 'sync-actor-denied'].includes(error.code)) {
      await Lists.updateAsync({ _id: list._id, boardId: list.boardId, syncSource: list.syncSource,
        syncRevision: list.syncRevision === undefined ? { $exists: false } : list.syncRevision,
        syncCredentialIncarnation: list.syncCredentialIncarnation === undefined ? { $exists: false } : list.syncCredentialIncarnation,
      }, { $set: { 'syncSource.lastSyncError': error.message } });
      return { error: error.message };
    }
    if (error.code === 'sync-estimate-invalid') return { error: error.message };
    if (error.error === 'sync-busy' || error.error === 'sync-lease-lost') {
      return { error: error.reason };
    }
    throw error;
  }
}

async function reconcileList(list, { fetchers = LIST_SYNC_FETCHERS, resolution, previewConflicts = false, dryRun = false,
  assertConflictAccess, recordCoverage } = {}, { assertCurrent }) {
  if (dryRun && resolution) return { error: 'Preview cannot resolve conflicts.' };
  const source = list.syncSource;
  if (!source || !source.type || (!dryRun && source.enabled === false)) return { skipped: true };
  if (!SYNC_CAPABLE_SOURCES.includes(source.type)) {
    return { skipped: true, reason: 'source type has no externalId-capable parser' };
  }
  const parser = EXTERNAL_PARSERS[source.type];
  const fetcher = fetchers[source.type];
  if (!parser || !fetcher) return { skipped: true, reason: 'no parser/fetcher for source type' };
  let conflictScope = assertConflictAccess ? await assertConflictAccess() : null;

  if (dryRun && conflictScope) return { error: 'Full-list write access is required to preview Sync.' };

  if (!dryRun && !resolution && !conflictScope && !recordCoverage) {
    await assertCurrent();
    return withSyncRunReport(ListSyncRunReports.rawCollection(), list,
      recordCoverage => reconcileList(list, { fetchers, previewConflicts,
        assertConflictAccess, recordCoverage }, { assertCurrent }));
  }

  const credential = await readSyncCredential(ListSyncCredentials, list);

  let parsed, sourceKey, sourceCoverage, estimateMapping;
  let timeMappings = {};
  const readTimeMappings = async () => syncTimeMappings(source,
    source.fields?.some(field => Object.hasOwn(TIME_FIELDS, field))
      ? await CustomFields.find({ boardIds: list.boardId, 'settings.jiraTimeField': { $in: ['original', 'remaining'] } }).fetchAsync() : [], estimateMapping);
  const listSelector = { _id: list._id, boardId: list.boardId, syncSource: source,
    syncRevision: list.syncRevision === undefined ? { $exists: false } : list.syncRevision,
    syncCredentialIncarnation: list.syncCredentialIncarnation === undefined ? { $exists: false } : list.syncCredentialIncarnation };
  try {
    sourceKey = syncSourceKey(source);
    if (!credential || credential.sourceKey !== sourceKey) {
      throw new Error('Save Sync settings with a credential for this server and project before syncing.');
    }
    const mapping = syncEstimateMapping(source, source.estimateCustomFieldId &&
      await CustomFields.findOneAsync({ _id: source.estimateCustomFieldId, boardIds: list.boardId }));
    if (mapping && mapping.identity !== source.estimateMappingIdentity) {
      throw new Error('Estimate field mapping changed. Save Sync settings again before syncing.');
    }
    estimateMapping = mapping;
    timeMappings = await readTimeMappings();
    if (JSON.stringify(timeMappingIdentities(timeMappings)) !== JSON.stringify(source.timeMappingIdentities || {})) {
      throw new Error('Time estimate mapping changed. Save Sync settings again before syncing.');
    }
    const raw = await fetcher(estimateMapping ? { ...source, estimateFieldId: estimateMapping.estimateFieldId } : source, credential);
    validateImportSourceShape(source.type, raw);
    parsed = parser(raw);
    parsed.tasks = addSyncTimeEstimates(addSyncEstimates(parsed.tasks, raw, estimateMapping), raw, timeMappings);
    validateListSyncTasks(parsed?.tasks);
    if (dryRun || recordCoverage) sourceCoverage = describeSyncSourceCoverage(source.type, raw, source.fields, estimateMapping, timeMappings);
    if (recordCoverage) await recordCoverage({ ...syncCoverage(parsed, source), source: sourceCoverage });
  } catch (e) {
    await assertCurrent();
    if (dryRun) return { error: String((e && e.message) || e) };
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

  const assertLease = assertCurrent;
  assertCurrent = async () => {
    await assertLease();
    if (Object.keys(timeMappings).length && JSON.stringify(timeMappingIdentities(await readTimeMappings())) !== JSON.stringify(timeMappingIdentities(timeMappings))) {
      throw new Meteor.Error('sync-time-estimate-changed', 'Time estimate mapping changed. Save Sync settings again.');
    }
    if (estimateMapping) {
      const current = syncEstimateMapping(source, await CustomFields.findOneAsync({
        _id: estimateMapping.localFieldId, boardIds: list.boardId }));
      if (current.identity !== estimateMapping.identity) throw new Meteor.Error('sync-estimate-changed',
        'Estimate field mapping changed. Save Sync settings again.');
    }
  };
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
  if (dryRun && conflictScope) return { error: 'Full-list write access is required to preview Sync.' };

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
    customFields: c.customFields,
    ...cardSyncTimes(c, timeMappings),
    ...(estimateMapping ? { estimate: cardSyncEstimate(c, estimateMapping) } : {}),
    archived: c.archived,
  }));

  const merge = planSyncTextMerge(externalTasks, existingCards, estimateMapping, timeMappings);
  const plan = merge.conflicts.length ? null : planListSyncReconcile({ externalTasks: merge.tasks, existingCards });
  const archiveConflicts = [];
  const creationConflicts = [];
  const creationTargets = new Map();
  if (plan) {
    if (source.createCards === false) plan.toCreate = [];
    if (source.archiveCards === false) plan.toArchive = [];
    const byId = new Map(existingCards.map(card => [card._id, card]));
    // Inspect before any writes, including for assigned-only review. Do not
    // reveal subtask identifiers/content: only the visible parent is returned.
    for (const cardId of plan.toArchive) {
      if (await Cards.findOneAsync({ parentId: cardId, archived: { $ne: true }, _id: { $nin: plan.toArchive } },
        { fields: { _id: 1 } })) archiveConflicts.push({ cardId, externalId: String(byId.get(cardId).syncExternalId), field: 'archive' });
    }
    if (!conflictScope && !archiveConflicts.length) {
      for (const task of plan.toCreate) {
        const target = await readSyncTarget(ListSyncTargets, list._id, sourceKey, task.externalId);
        creationTargets.set(String(task.externalId), target);
        if (await Cards.findOneAsync({ _id: target.targetId }, { fields: { _id: 1 } })) {
          creationConflicts.push(describeCreationConflict(list, sourceKey, target, task));
        }
      }
    }
  }
  const conflicts = merge.conflicts.length ? merge.conflicts : archiveConflicts.length ? archiveConflicts : creationConflicts;
  prepareSyncWrites(plan, merge.baselines);
  if (dryRun) {
    await assertCurrent();
    if (assertConflictAccess && await assertConflictAccess()) return { error: 'Your card access changed. Run preview again.' };
    if (!await Lists.findOneAsync(listSelector)) return { error: 'Sync settings changed. Run preview again.' };
    const cardsById = new Map(existingCards.map(card => [card._id, card]));
    const tasksById = new Map(externalTasks.map(task => [String(task.externalId), task]));
    return { preview: describeSyncPreview({ plan, cards: existingCards,
      coverage: { ...syncCoverage(parsed, source), source: sourceCoverage }, blocked: conflicts.length > 0 }),
      conflicts: conflicts.slice(0, 50).map(conflict => describeSyncConflict(conflict,
        cardsById.get(conflict.cardId), tasksById.get(conflict.externalId), list, sourceKey, existingCards)) };
  }
  if (resolution) {
    if (resolution.field === 'creation') {
      const preview = creationConflicts.find(row => row.cardId === resolution.cardId);
      if (!preview || resolution.choice !== 'replace' || preview.fingerprint !== resolution.fingerprint) {
        return { error: 'This conflict changed. Run Sync again to review the current values.' };
      }
      if (assertConflictAccess && await assertConflictAccess()) return { error: 'Full-list write access is required to create a replacement.' };
      await assertCurrent();
      if (!await Lists.findOneAsync(listSelector)) return { error: 'Sync settings changed. Run Sync again.' };
      const changed = await replaceSyncTarget(ListSyncTargets, creationTargets.get(preview.externalId));
      return changed ? { resolved: true } : { error: 'The replacement target changed. Run Sync again.' };
    }
    const plan = planSyncConflictResolution(conflicts, existingCards, externalTasks, list, sourceKey, resolution, estimateMapping, timeMappings);
    if (!plan) return { error: 'This conflict changed. Run Sync again to review the current values.' };
    const currentScope = assertConflictAccess ? await assertConflictAccess() : null;
    await assertCurrent();
    if (!await Lists.findOneAsync(listSelector)) return { error: 'Sync settings changed. Run Sync again.' };
    const selector = syncTextSelector(plan.card, list.boardId, list._id);
    // Assignment loss between the read and write must fail the same atomic
    // comparison as a changed card value. Scope remains server-owned.
    const changed = await Cards.updateAsync(currentScope ? { $and: [selector, currentScope] } : selector,
      { $set: { ...syncValueChanges(plan.changes, plan.card, estimateMapping, timeMappings), dateLastActivity: new Date() }, ...(plan.unset ? { $unset: plan.unset } : {}) }, SYNC_TEXT_WRITE_OPTIONS);
    return changed ? { resolved: true } : { error: 'The card changed. Run Sync again to review the current values.' };
  }
  if (conflicts.length) {
    // This status is published with the list, including to assigned-only
    // members. Put card identifiers and values only in the scoped response.
    const error = creationConflicts.length
      ? 'Sync creation conflict: a previous card occupies the target ID. Review replacement in the Sync popup.'
      : archiveConflicts.length
      ? 'Sync archive conflict: an active subtask is not in the source archive plan.'
      : conflicts.some(row => row.field === 'syncExternalId')
        ? 'Duplicate local Sync identity. Resolve duplicate card mappings before retrying.'
        : 'Sync field conflict. Review the conflicting values in the Sync popup.';
    await assertCurrent();
    if (!conflictScope) await Lists.updateAsync(listSelector, { $set: { 'syncSource.lastSyncError': error } });
    const cardsById = new Map(existingCards.map(card => [card._id, card]));
    const tasksById = new Map(externalTasks.map(task => [String(task.externalId), task]));
    if (previewConflicts && assertConflictAccess) {
      const currentScope = await assertConflictAccess();
      if (JSON.stringify(currentScope) !== JSON.stringify(conflictScope)) return { error: 'Your card access changed. Run Sync again.' };
    }
    return { error, reviewOnly: !!conflictScope, conflicts: conflicts.slice(0, 50).map(conflict => previewConflicts ? describeSyncConflict(conflict,
      cardsById.get(conflict.cardId), tasksById.get(conflict.externalId), list, sourceKey, existingCards)
      : { cardId: conflict.cardId, externalId: conflict.externalId, field: conflict.field }) };
  }
  if (conflictScope) return { reviewOnly: true, conflicts: [] };
  const existingById = new Map(existingCards.map(card => [card._id, card]));

  const board = await Boards.findOneAsync(list.boardId);
  const now = new Date();

  for (const task of plan.toCreate) {
    const target = creationTargets.get(String(task.externalId));
    const cardId = target.targetId;
    try {
      // eslint-disable-next-line no-await-in-loop
      await assertCurrent();
      if ((await readSyncTarget(ListSyncTargets, list._id, sourceKey, task.externalId)).targetId !== cardId) {
        return { error: 'The replacement target changed. Run Sync again.' };
      }
      await Cards.insertAsync({
        _id: cardId,
        title: task.title || 'Imported item',
        description: task.description || '',
        ...(task.spentTime !== undefined ? { spentTime: task.spentTime } : {}),
        ...syncValueChanges(Object.fromEntries(['estimate', ...Object.keys(TIME_FIELDS)].filter(field => task[field] !== undefined).map(field => [field, task[field]])), null, estimateMapping, timeMappings),
        listId: list._id,
        swimlaneId: list.swimlaneId || (board && (await board.getDefaultSwimlineAsync())._id) || '',
        boardId: list.boardId,
        sort: -1,
        dateLastActivity: now,
        syncExternalId: String(task.externalId),
        syncSourceType: source.type,
        syncSourceKey: sourceKey,
        syncLastSource: {
          ...syncTimeBaseline(task, timeMappings),
          ...(task.title !== undefined ? { title: task.title } : {}),
          ...(task.description !== undefined ? { description: task.description } : {}),
          ...(task.spentTime !== undefined ? { spentTime: task.spentTime } : {}),
          ...(task.estimate !== undefined ? { estimate: task.estimate, estimateMapping: estimateMapping.identity } : {}),
        },
      }, SYNC_TEXT_WRITE_OPTIONS);
    } catch (e) {
      // A second worker or a retry after a card move must not create a new
      // target or overwrite the existing card. Never treat a duplicate as a
      // successful reconciliation: its contents may have changed meanwhile.
      if (e.code !== 11000 || !await Cards.findOneAsync({ _id: cardId })) throw e;
      const error = 'Sync creation conflict: a card for this source item already exists. Retry Sync to review a replacement in the Sync popup.';
      await assertCurrent();
      await Lists.updateAsync(listSelector, { $set: { 'syncSource.lastSyncError': error } });
      return { error };
    }
  }

  for (const update of plan.toUpdate) {
    const cardChanges = update.changes;
    // eslint-disable-next-line no-await-in-loop
    if (Object.keys(cardChanges).length) {
      // eslint-disable-next-line no-await-in-loop
      const previous = existingById.get(update.cardId);
      await assertCurrent();
      const changed = await Cards.updateAsync(syncTextSelector(previous, list.boardId, list._id), { $set: { ...syncValueChanges(cardChanges, previous, estimateMapping, timeMappings), dateLastActivity: now } }, SYNC_TEXT_WRITE_OPTIONS);
      if (!changed) {
        const error = 'Sync card changed while applying updates; retry sync.';
        await assertCurrent();
        await Lists.updateAsync(listSelector, { $set: { 'syncSource.lastSyncError': error } });
        return { error };
      }
    }

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
      await syncOneList(list, { scheduled: true });
    } catch (e) {
      // Never let one broken list's sync stop the rest.
      // eslint-disable-next-line no-console
      console.error('listSync: error syncing list', list._id, e);
    }
  }
}

Meteor.startup(async () => {
  try {
    await ensureIndex(ListSyncCredentials, { listId: 1, _id: 1 });
    SyncedCron.add({
      name: 'wekan-list-sync-credential-cleanup',
      schedule(parser) { return parser.text('every 1 hour'); },
      async job() {
        try {
          const result = await sweepSyncCredentials({ lists: Lists, credentials: ListSyncCredentials,
            cursor: ListSyncCredentials.rawCollection().find({}, { projection: { _id: 1, listId: 1, incarnation: 1, configurationId: 1 } })
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
