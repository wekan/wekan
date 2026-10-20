// Attachment retention (models/lib/attachmentRetention.js): once a night,
// soft-delete card attachments older than ATTACHMENTS_RETENTION_DAYS and purge
// attachments soft-deleted longer ago than ATTACHMENTS_PURGE_DELETED_AFTER_DAYS.
// Both off unless set. This file only reads and writes; the rules are pure and
// tested in the library.
//
// The soft delete is the card's own "Delete" (server/attachmentSoftDelete.js):
// cover unset, activity written, card history row with Restore. The purge is
// Attachments.removeAsync, whose onAfterRemove removes the file from whatever
// storage holds it (filesystem, GridFS, S3/Azure/GCS/WebDAV) - so record and
// file always go together, which a script working directly on MongoDB cannot
// guarantee.
//
// ATTACHMENTS_RETENTION_DRY_RUN=true counts and logs what each step would do and
// changes nothing. ATTACHMENTS_RETENTION_MAX_PER_RUN caps each step per night, so
// a first run on a large instance is spread over several nights.
import { Meteor } from 'meteor/meteor';
import Attachments from '/models/attachments';
import Boards from '/models/boards';
import Cards from '/models/cards';
import { SyncedCron } from '/server/cron/syncedCron';
import { softDeleteAttachment } from '/server/attachmentSoftDelete';
import { authEnv, authConfigReady } from '/server/lib/authConfig';

const {
  retentionSettings, expiredCandidateSelector, isExpired,
  purgeCandidateSelector, isPurgeable, retentionActorId,
} = require('/models/lib/attachmentRetention');

const log = message => console.log(`attachmentRetention: ${message}`); // eslint-disable-line no-console

const FIELDS = {
  _id: 1, name: 1, size: 1, userId: 1, meta: 1, deletedAt: 1,
  uploadedAt: 1, uploadedAtOstrio: 1, versions: 1,
};

async function softDeleteExpired(settings, now) {
  const { retentionDays: days, mode, dryRun, maxPerRun } = settings;
  const result = { checked: 0, deleted: 0, bytes: 0 };
  if (!days) return result;
  // Oldest first, streamed: in card-inactive mode many old attachments sit on
  // cards still in use and are skipped, so a fixed-size read could see only
  // those, night after night. Scanning stops after `maxPerRun` deletions or
  // 50x that many candidates, whichever comes first.
  const scanLimit = maxPerRun * 50;
  const cursor = Attachments.collection.rawCollection().find(expiredCandidateSelector(days, now), {
    projection: FIELDS, sort: { uploadedAtOstrio: 1, uploadedAt: 1 },
  });
  const cards = new Map();
  const boards = new Map();
  for await (const attachment of cursor) {
    if (result.deleted >= maxPerRun || result.checked >= scanLimit) break;
    result.checked += 1;
    const { cardId, boardId } = attachment.meta || {};
    try {
      if (!cards.has(cardId)) {
        // eslint-disable-next-line no-await-in-loop
        cards.set(cardId, await Cards.findOneAsync(cardId, { fields: { _id: 1, type: 1, dateLastActivity: 1, coverId: 1, boardId: 1 } }));
      }
      const card = cards.get(cardId);
      const bid = boardId || (card && card.boardId);
      if (!boards.has(bid)) {
        // eslint-disable-next-line no-await-in-loop
        boards.set(bid, await Boards.findOneAsync(bid, { fields: { _id: 1, type: 1, createdBy: 1 } }));
      }
      const board = boards.get(bid);
      if (!isExpired({ attachment, card, board, days, mode, now })) continue;
      result.deleted += 1;
      result.bytes += Number(attachment.size) || 0;
      if (dryRun) {
        log(`[dry run] would delete "${attachment.name}" (${attachment._id}) on card ${cardId}`);
        continue;
      }
      // eslint-disable-next-line no-await-in-loop
      await softDeleteAttachment({ userId: retentionActorId({ attachment, board }), attachment });
    } catch (e) {
      // One attachment that cannot be handled must not stop the rest.
      console.error('attachmentRetention: could not delete attachment', attachment._id, e.message); // eslint-disable-line no-console
    }
  }
  return result;
}

async function purgeDeleted(settings, now) {
  const { purgeDeletedAfterDays: days, dryRun, maxPerRun } = settings;
  const result = { purged: 0, bytes: 0 };
  if (!days) return result;
  const selector = purgeCandidateSelector(days, now);
  const candidates = await Attachments.collection.find(selector, {
    fields: FIELDS, sort: { deletedAt: 1 }, limit: maxPerRun,
  }).fetchAsync();
  for (const attachment of candidates) {
    if (!isPurgeable({ attachment, days, now })) continue;
    result.purged += 1;
    result.bytes += Number(attachment.size) || 0;
    if (dryRun) {
      log(`[dry run] would purge "${attachment.name}" (${attachment._id}), deleted ${new Date(attachment.deletedAt).toISOString()}`);
      continue;
    }
    try {
      // Re-check in the write: an attachment restored while the job runs stays.
      // eslint-disable-next-line no-await-in-loop
      await Attachments.removeAsync({ _id: attachment._id, deletedAt: selector.deletedAt });
    } catch (e) {
      result.purged -= 1;
      result.bytes -= Number(attachment.size) || 0;
      console.error('attachmentRetention: could not purge attachment', attachment._id, e.message); // eslint-disable-line no-console
    }
  }
  return result;
}

// Admin Panel / Attachments / Retention first, then the environment variable
// (models/lib/authConfigCatalog.js), read on every run: a change there needs
// no restart.
const currentSettings = () => retentionSettings(authEnv);

export async function runAttachmentRetention(settings = currentSettings(), now = new Date()) {
  if (!settings.retentionDays && !settings.purgeDeletedAfterDays) return null;
  const prefix = settings.dryRun ? '[dry run] ' : '';
  const expired = await softDeleteExpired(settings, now);
  if (settings.retentionDays) {
    log(`${prefix}deleted ${expired.deleted} attachment(s), ${expired.bytes} bytes, older than ${settings.retentionDays} days (mode ${settings.mode}); restorable from the card history`);
  }
  const purged = await purgeDeleted(settings, now);
  if (settings.purgeDeletedAfterDays) {
    log(`${prefix}purged ${purged.purged} attachment(s), ${purged.bytes} bytes, deleted more than ${settings.purgeDeletedAfterDays} days ago`);
  }
  return { expired, purged };
}

Meteor.startup(() => {
  // Read once here only to say what is configured; every run reads again.
  authConfigReady.then(() => {
    const settings = currentSettings();
    if (settings.retentionDays || settings.purgeDeletedAfterDays) {
      log(`enabled: retention ${settings.retentionDays || 'off'} days (${settings.mode}), purge deleted after ${settings.purgeDeletedAfterDays || 'off'} days${settings.dryRun ? ', DRY RUN' : ''}`);
    }
  }).catch(() => {});
  try {
    SyncedCron.add({
      name: 'wekan-attachment-retention',
      schedule(parser) {
        return parser.text('at 3:45 am');
      },
      async job() {
        await authConfigReady;
        return runAttachmentRetention(currentSettings(), new Date());
      },
    });
  } catch (e) {
    console.error('attachmentRetention: failed to register cron job', e); // eslint-disable-line no-console
  }
});
