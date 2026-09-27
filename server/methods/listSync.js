// List sync configuration methods (docs/Features/ImportExport/Sync.md). Lets
// a board member with write access mark a list as synced from an external
// tracker and store its credential. The credential itself is written into
// ListSyncCredentials (models/listSyncCredentials.js), a collection with no
// publication anywhere in the codebase - `listSync.hasCredential` only ever
// returns a boolean, never the token, mirroring how
// server/models/attachmentStorageSettings.js masks its cloud secrets before
// they can reach the client.
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import Lists from '/models/lists';
import Cards from '/models/cards';
import ListSyncCredentials from '/models/listSyncCredentials';
import { ReactiveCache } from '/imports/reactiveCache';
import { allowIsBoardMemberWithWriteAccess } from '/server/lib/utils';
import { SYNC_CAPABLE_SOURCES } from '/models/lib/externalParsers';
import { syncOneList } from '/server/listSync';
import { withListSyncLease } from '/server/lib/listSyncLease';
const { normalizeSyncSource, syncSourceKey } = require('/models/lib/listSyncSourceIdentity');
const { readSyncCredential, commitSyncConfiguration } = require('/server/lib/listSyncConfiguration');
const { assignedOnlyCardScope } = require('/models/lib/boardCardScope');

async function assertWriteAccess(userId, boardId) {
  if (!userId) {
    throw new Meteor.Error('not-authorized', 'You must be logged in.');
  }
  const board = await ReactiveCache.getBoard(boardId);
  if (!board || !allowIsBoardMemberWithWriteAccess(userId, board)) {
    throw new Meteor.Error('not-authorized', 'You do not have write access to this board.');
  }
  return board;
}

async function assertConflictAccess(userId, boardId) {
  const board = await assertWriteAccess(userId, boardId);
  return assignedOnlyCardScope(board, userId);
}

Meteor.methods({
  // Configure (or clear) a list's sync source. `token`/`username` are stored
  // separately in ListSyncCredentials; pass `token: null` to leave a
  // previously stored credential untouched only for the SAME source.
  async setListSyncSource(listId, config) {
    check(listId, String);
    check(config, Match.OneOf(null, {
      type: Match.OneOf(...SYNC_CAPABLE_SOURCES),
      url: Match.Optional(String),
      projectKey: String,
      enabled: Match.Optional(Boolean),
      createCards: Match.Optional(Boolean),
      archiveCards: Match.Optional(Boolean),
      fields: Match.Optional([Match.OneOf('title', 'description', 'spentTime')]),
      token: Match.Optional(Match.OneOf(String, null)),
      username: Match.Optional(String),
    }));

    const list = await Lists.findOneAsync(listId);
    if (!list) throw new Meteor.Error('list-not-found', 'List not found.');
    await assertWriteAccess(this.userId, list.boardId);

    return withListSyncLease(listId, async ({ assertCurrent }) => {
      const list = await Lists.findOneAsync(listId);
      if (!list) throw new Meteor.Error('list-not-found', 'List not found.');
      await assertWriteAccess(this.userId, list.boardId);
      let source, sourceKey, oldKey;
      try {
        source = config === null ? null : normalizeSyncSource(config);
        sourceKey = source && syncSourceKey(source);
      } catch (error) {
        throw new Meteor.Error('invalid-sync-source', error.message);
      }
      // An old malformed URL must not prevent disconnecting a broken source.
      // Its legacy cards remain unbound; a new project must never adopt them.
      try { oldKey = list.syncSource && syncSourceKey(list.syncSource); } catch (error) { oldKey = null; }
      // Before replacing or clearing a legacy configuration, retain its identity
      // on its cards. Never infer an old card's project from the NEW config.
      const legacyCards = { boardId: list.boardId, listId,
        syncSourceType: { $exists: true }, syncSourceKey: { $exists: false } };
      const unknownCards = oldKey ? { ...legacyCards,
        syncSourceType: { $exists: true, $ne: list.syncSource.type } } : legacyCards;
      if (source && await Cards.findOneAsync(unknownCards)) {
        throw new Meteor.Error('sync-source-unknown',
          'This list has legacy Sync cards without a known source. Configure Sync in a new list.');
      }
      if (oldKey) {
        await assertCurrent();
        await Cards.updateAsync({ ...legacyCards, syncSourceType: list.syncSource.type },
          { $set: { syncSourceKey: oldKey } }, { multi: true });
      }

      const previousCredential = await readSyncCredential(ListSyncCredentials, list);
      let credential = null;
      if (config?.token) {
        credential = { token: config.token, username: config.username || '', sourceKey };
      } else if (source && previousCredential && oldKey === sourceKey &&
        (!previousCredential.sourceKey || previousCredential.sourceKey === sourceKey)) {
        credential = { ...previousCredential, sourceKey };
      }
      const publicSource = source ? {
        type: source.type, url: source.url, projectKey: source.projectKey,
        enabled: config.enabled !== false,
        createCards: config.createCards !== false,
        archiveCards: config.archiveCards !== false,
        fields: config.fields || ['title', 'description'],
      } : null;
      try {
        return await commitSyncConfiguration({ lists: Lists, credentials: ListSyncCredentials,
          list, source: publicSource, credential, previousCredential, assertCurrent });
      } catch (error) {
        if (error.code === 'sync-config-changed') {
          throw new Meteor.Error(error.code, error.message);
        }
        throw error;
      }
    });
  },

  async hasListSyncCredential(listId) {
    check(listId, String);
    const list = await Lists.findOneAsync(listId);
    if (!list) throw new Meteor.Error('list-not-found', 'List not found.');
    await assertWriteAccess(this.userId, list.boardId);
    const credential = await readSyncCredential(ListSyncCredentials, list);
    if (!credential || !list.syncSource) return false;
    try { return credential.sourceKey === syncSourceKey(list.syncSource); } catch (error) { return false; }
  },

  // Manual "sync now" - runs the same reconcile the periodic cron job runs,
  // synchronously, so the UI can show the result immediately.
  async syncListNow(listId) {
    check(listId, String);
    const list = await Lists.findOneAsync(listId);
    if (!list) throw new Meteor.Error('list-not-found', 'List not found.');
    await assertWriteAccess(this.userId, list.boardId);
    return syncOneList(list, { previewConflicts: true,
      assertConflictAccess: () => assertConflictAccess(this.userId, list.boardId) });
  },

  async previewListSync(listId) {
    check(listId, String);
    const list = await Lists.findOneAsync(listId);
    if (!list) throw new Meteor.Error('list-not-found', 'List not found.');
    await assertWriteAccess(this.userId, list.boardId);
    return syncOneList(list, { dryRun: true,
      assertConflictAccess: () => assertConflictAccess(this.userId, list.boardId) });
  },

  async resolveListSyncConflict(listId, resolution) {
    check(listId, String);
    check(resolution, { cardId: String, field: Match.OneOf('title', 'description', 'spentTime', 'syncExternalId', 'archive', 'creation'),
      choice: Match.OneOf('local', 'source', 'detach', 'replace'), fingerprint: String });
    if (!/^[a-f0-9]{64}$/.test(resolution.fingerprint)) throw new Meteor.Error('invalid-sync-conflict');
    const list = await Lists.findOneAsync(listId);
    if (!list) throw new Meteor.Error('list-not-found', 'List not found.');
    await assertConflictAccess(this.userId, list.boardId);
    return syncOneList(list, { resolution, assertConflictAccess: () => assertConflictAccess(this.userId, list.boardId) });
  },
});
