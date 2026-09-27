import { Meteor } from 'meteor/meteor';
import { EJSON } from 'meteor/ejson';
import { SyncedCron } from '/server/cron/syncedCron';
import Cards from '/models/cards';
import Boards from '/models/boards';
import Lists from '/models/lists';
import ScrumSprints from '/models/scrumSprints';
import ScrumDailySnapshots from '/models/scrumDailySnapshots';
import { ScrumImportPending } from '/server/lib/scrumImportJournal';
const { captureDailySprint } = require('/server/lib/scrumDailyCapture');

export async function captureOneSprint(sprint) {
  if (sprint.scrumImportPending) return { skipped: true };
  if (sprint.state !== 'active') return { skipped: true };
  if (!sprint.startSnapshot) return { skipped: true };
  if (await ScrumImportPending.findOneAsync(sprint.boardId, { fields: { _id: 1 } })) return { skipped: true };
  const at = new Date(), day = at.toISOString().slice(0, 10);
  if (await ScrumDailySnapshots.findOneAsync({ sprintId: sprint._id, boardId: sprint.boardId,
    startedAt: new Date(sprint.startSnapshot.at), day }, { fields: { _id: 1 } })) return { skipped: true };
  const [cards, lists] = await Promise.all([
    Cards.find({ boardId: sprint.boardId, 'scrum.sprintId': sprint._id }, { limit: 10001,
      fields: { listId: 1, archived: 1, dueComplete: 1, 'poker.estimation': 1, customFields: 1 } }).fetchAsync(),
    Lists.find({ boardId: sprint.boardId }, { limit: 10001, fields: { scrum: 1 } }).fetchAsync(),
  ]);
  const current = await ScrumSprints.findOneAsync(sprint._id);
  if (!current || current.state !== 'active' || !EJSON.equals(current.startSnapshot, sprint.startSnapshot)) return { skipped: true };
  if (await ScrumImportPending.findOneAsync(sprint.boardId, { fields: { _id: 1 } })) return { skipped: true };
  const result = await captureDailySprint({ sprint, cards, lists, snapshots: ScrumDailySnapshots, at: new Date() });
  // Cover deletion during the capture as well as the normal board-delete hook.
  if (!await Boards.findOneAsync(sprint.boardId, { fields: { _id: 1 } })) {
    await ScrumDailySnapshots.removeAsync({ boardId: sprint.boardId });
    return { skipped: true };
  }
  return result;
}

export async function scanScrumDailySnapshots() {
  let lastId;
  while (true) {
    const sprints = await ScrumSprints.find({ state: 'active', ...(lastId ? { _id: { $gt: lastId } } : {}) },
      { sort: { _id: 1 }, limit: 50 }).fetchAsync();
    if (!sprints.length) return;
    for (const sprint of sprints) {
      try {
        await captureOneSprint(sprint);
      } catch (error) {
        // Failure leaves a visible missing day; never synthesize an observation.
        console.error('scrumDailySnapshots: capture failed', sprint._id, error.message);
      }
    }
    lastId = sprints[sprints.length - 1]._id;
  }
}

Meteor.startup(() => {
  Boards.after.remove(async (_userId, board) => {
    await ScrumDailySnapshots.removeAsync({ boardId: board._id });
  });
  SyncedCron.add({ name: 'wekan-scrum-daily-snapshots',
    schedule: parser => parser.text('every 15 minutes'), job: scanScrumDailySnapshots });
});
