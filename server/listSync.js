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
//   - the EXISTING archive() helpers on Cards/Lists for "old entries are at
//     list history": a card whose external item disappeared is archived, not
//     deleted.
import { Meteor } from 'meteor/meteor';
import Lists from '/models/lists';
import Cards from '/models/cards';
import Boards from '/models/boards';
import ListSyncCredentials from '/models/listSyncCredentials';
import { EXTERNAL_PARSERS, SYNC_CAPABLE_SOURCES } from '/models/lib/externalParsers';
import { planListSyncReconcile } from '/models/lib/listSyncReconcile';
import { LIST_SYNC_FETCHERS } from '/server/lib/listSyncFetch';
import { SyncedCron } from '/server/cron/syncedCron';

// Sync one list. Exported for the unit test and for a manual "sync now" call;
// the cron job below just calls this for every eligible list.
export async function syncOneList(list, { fetchers = LIST_SYNC_FETCHERS } = {}) {
  const source = list.syncSource;
  if (!source || !source.type || source.enabled === false) return { skipped: true };
  if (!SYNC_CAPABLE_SOURCES.includes(source.type)) {
    return { skipped: true, reason: 'source type has no externalId-capable parser' };
  }
  const parser = EXTERNAL_PARSERS[source.type];
  const fetcher = fetchers[source.type];
  if (!parser || !fetcher) return { skipped: true, reason: 'no parser/fetcher for source type' };

  const credential = await ListSyncCredentials.findOneAsync({ listId: list._id });
  if (!credential) return { skipped: true, reason: 'no credential stored for this list' };

  let raw;
  try {
    raw = await fetcher(source, credential);
  } catch (e) {
    await Lists.updateAsync(list._id, {
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

  const parsed = parser(raw);
  const externalTasks = parsed.tasks || [];

  const existingCards = (
    await Cards.find({ listId: list._id, syncSourceType: source.type }).fetchAsync()
  ).map(c => ({
    _id: c._id,
    syncExternalId: c.syncExternalId,
    title: c.title,
    description: c.description,
    archived: c.archived,
  }));

  const plan = planListSyncReconcile({ externalTasks, existingCards });

  const board = await Boards.findOneAsync(list.boardId);
  const now = new Date();

  for (const task of plan.toCreate) {
    // eslint-disable-next-line no-await-in-loop
    await Cards.insertAsync({
      title: task.title || 'Imported item',
      description: task.description || '',
      listId: list._id,
      swimlaneId: list.swimlaneId || (board && (await board.getDefaultSwimlineAsync())._id) || '',
      boardId: list.boardId,
      sort: -1,
      dateLastActivity: now,
      syncExternalId: String(task.externalId),
      syncSourceType: source.type,
    });
  }

  for (const update of plan.toUpdate) {
    const { column_name, ...cardChanges } = update.changes;
    // eslint-disable-next-line no-await-in-loop
    if (Object.keys(cardChanges).length) {
      // eslint-disable-next-line no-await-in-loop
      await Cards.updateAsync(update.cardId, { $set: { ...cardChanges, dateLastActivity: now } });
    }
    // column_name (a status change upstream) is recorded but not auto-moved
    // across lists here - moving a card out of the very list a sync watches
    // would make the next run's diff undefined. Left for a future pass; see
    // CHANGELOG TODO Later.
  }

  for (const cardId of plan.toArchive) {
    // eslint-disable-next-line no-await-in-loop
    const card = await Cards.findOneAsync(cardId);
    if (card) {
      // eslint-disable-next-line no-await-in-loop
      await card.archive();
    }
  }

  await Lists.updateAsync(list._id, {
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

Meteor.startup(() => {
  try {
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
