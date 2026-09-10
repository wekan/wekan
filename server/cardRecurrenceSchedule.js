// Kanboard-style whole-card recurrence: periodic job that scans cards with a
// recurrenceInterval set and, once each one is due, creates a fresh copy of it
// in the same list (a new "next occurrence") and stamps lastRecurrenceAt on
// the source card. Reuses the same quave:synced-cron infrastructure
// server/checklistResetSchedule.js already registers a job on, rather than a
// separate Meteor.setInterval.
import { Meteor } from 'meteor/meteor';
import Cards from '/models/cards';
import Boards from '/models/boards';
import { selectCardsDueForRecurrence } from '/models/lib/cardRecurrenceSchedule';
import { SyncedCron } from '/server/cron/syncedCron';

// Create the next occurrence of `card`: a new card in the same
// board/swimlane/list, carrying over title, description, labels and custom
// fields, but starting fresh otherwise (no members/assignees, no checklists,
// no due dates, no recurrence carried into the clone itself except the same
// interval, so the chain keeps recurring).
export async function createCardRecurrence(card, now = new Date()) {
  const board = await Boards.findOneAsync(card.boardId);
  const nextCardNumber =
    board && typeof board.getNextCardNumber === 'function'
      ? await board.getNextCardNumber()
      : undefined;

  const newCardDoc = {
    title: card.title,
    description: card.description,
    boardId: card.boardId,
    swimlaneId: card.swimlaneId,
    listId: card.listId,
    labelIds: card.labelIds || [],
    customFields: card.customFields || [],
    userId: card.userId,
    sort: card.sort,
    recurrenceInterval: card.recurrenceInterval,
  };
  if (nextCardNumber !== undefined) {
    newCardDoc.cardNumber = nextCardNumber;
  }

  const newCardId = await Cards.insertAsync(newCardDoc);
  await Cards.updateAsync(card._id, { $set: { lastRecurrenceAt: now } });
  return newCardId;
}

// Scan every card with a recurrenceInterval set and spawn the next occurrence
// of the ones that are due.
export async function scanCardRecurrenceSchedule(now = new Date()) {
  const candidates = await Cards.find({
    recurrenceInterval: { $exists: true, $nin: [null, 'none'] },
    archived: { $ne: true },
  }).fetchAsync();

  const dueCards = selectCardsDueForRecurrence(candidates, now);
  for (const card of dueCards) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await createCardRecurrence(card, now);
    } catch (e) {
      // Never let one bad card stop the rest from recurring.
      // eslint-disable-next-line no-console
      console.error('cardRecurrenceSchedule: error recurring card', card._id, e);
    }
  }
}

Meteor.startup(() => {
  try {
    SyncedCron.add({
      name: 'wekan-card-recurrence',
      schedule(parser) {
        return parser.text('every 1 hour');
      },
      job() {
        return scanCardRecurrenceSchedule(new Date());
      },
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('cardRecurrenceSchedule: failed to register cron job', e);
  }
});
