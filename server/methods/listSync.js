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
import ListSyncCredentials from '/models/listSyncCredentials';
import { ReactiveCache } from '/imports/reactiveCache';
import { allowIsBoardMemberWithWriteAccess } from '/server/lib/utils';
import { SYNC_CAPABLE_SOURCES } from '/models/lib/externalParsers';
import { syncOneList } from '/server/listSync';

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

Meteor.methods({
  // Configure (or clear) a list's sync source. `token`/`username` are stored
  // separately in ListSyncCredentials; pass `token: null` to leave a
  // previously stored credential untouched (e.g. when only changing the
  // project key).
  async setListSyncSource(listId, config) {
    check(listId, String);
    check(config, Match.OneOf(null, {
      type: Match.OneOf(...SYNC_CAPABLE_SOURCES),
      url: Match.Optional(String),
      projectKey: String,
      enabled: Match.Optional(Boolean),
      token: Match.Optional(Match.OneOf(String, null)),
      username: Match.Optional(String),
    }));

    const list = await Lists.findOneAsync(listId);
    if (!list) throw new Meteor.Error('list-not-found', 'List not found.');
    await assertWriteAccess(this.userId, list.boardId);

    if (config === null) {
      await Lists.updateAsync(listId, { $unset: { syncSource: '' } });
      await ListSyncCredentials.removeAsync({ listId });
      return { cleared: true };
    }

    await Lists.updateAsync(listId, {
      $set: {
        syncSource: {
          type: config.type,
          url: config.url || '',
          projectKey: config.projectKey,
          enabled: config.enabled !== false,
        },
      },
    });

    if (config.token) {
      await ListSyncCredentials.upsertAsync(
        { listId },
        { $set: { listId, token: config.token, username: config.username || '' } },
      );
    }

    return { ok: true };
  },

  async hasListSyncCredential(listId) {
    check(listId, String);
    const list = await Lists.findOneAsync(listId);
    if (!list) throw new Meteor.Error('list-not-found', 'List not found.');
    await assertWriteAccess(this.userId, list.boardId);
    const credential = await ListSyncCredentials.findOneAsync({ listId });
    return !!credential;
  },

  // Manual "sync now" - runs the same reconcile the periodic cron job runs,
  // synchronously, so the UI can show the result immediately.
  async syncListNow(listId) {
    check(listId, String);
    const list = await Lists.findOneAsync(listId);
    if (!list) throw new Meteor.Error('list-not-found', 'List not found.');
    await assertWriteAccess(this.userId, list.boardId);
    return syncOneList(list);
  },
});
