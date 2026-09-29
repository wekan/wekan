// Nextcloud Deck-style auto-archive (models/lib/autoArchive.js): every hour,
// archive the cards of boards with "Archive cards after N days without
// activity" set that nobody has touched for that long. Same quave:synced-cron
// infrastructure as server/checklistResetSchedule.js.
import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp';
import Boards from '/models/boards';
import Cards from '/models/cards';
import { SyncedCron } from '/server/cron/syncedCron';

const {
  AUTO_ARCHIVE_BATCH, AUTO_ARCHIVE_BOARD_SELECTOR, normalizeAutoArchiveDays, autoArchiveCardSelector,
} = require('/models/lib/autoArchive');

// The archive is recorded as the board creator's, the same attribution the
// scheduled rules (server/scheduledRules.js) use for what the board itself
// does on a timer.
async function asUser(userId, fn) {
  if (userId && typeof DDP._CurrentMethodInvocation?.withValue === 'function') {
    return DDP._CurrentMethodInvocation.withValue({ userId }, fn);
  }
  return fn();
}

export async function autoArchiveBoard(board, now = new Date()) {
  const days = normalizeAutoArchiveDays(board.autoArchiveInactiveDays);
  if (!days) return 0;
  const cards = await Cards.find(autoArchiveCardSelector(board._id, days, now), {
    sort: { dateLastActivity: 1 }, limit: AUTO_ARCHIVE_BATCH,
  }).fetchAsync();
  let archived = 0;
  for (const card of cards) {
    try {
      // card.archive() also archives its subtasks and records archivedCard.
      // eslint-disable-next-line no-await-in-loop
      await asUser(board.createdBy, () => card.archive());
      archived += 1;
    } catch (e) {
      // One card that cannot be archived must not stop the rest.
      // eslint-disable-next-line no-console
      console.error('autoArchiveCards: could not archive card', card._id, e.message);
    }
  }
  return archived;
}

export async function scanAutoArchive(now = new Date()) {
  const boards = await Boards.find(AUTO_ARCHIVE_BOARD_SELECTOR, {
    fields: { _id: 1, autoArchiveInactiveDays: 1, createdBy: 1 },
  }).fetchAsync();
  for (const board of boards) {
    // eslint-disable-next-line no-await-in-loop
    await autoArchiveBoard(board, now);
  }
}

Meteor.startup(() => {
  try {
    SyncedCron.add({
      name: 'wekan-card-auto-archive',
      schedule(parser) {
        return parser.text('every 1 hour');
      },
      job() {
        return scanAutoArchive(new Date());
      },
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('autoArchiveCards: failed to register cron job', e);
  }
});
