// #3818 / #4729: periodic job that scans checklists with an automatic-reset
// interval (daily/weekly/monthly) and, once each one is due, unchecks all of
// its items and stamps lastResetAt. Reuses the same quave:synced-cron
// infrastructure server/scheduledRules.js already registers a job on, rather
// than a separate Meteor.setInterval.
import { Meteor } from 'meteor/meteor';
import Checklists from '/models/checklists';
import ChecklistItems from '/models/checklistItems';
import { selectChecklistsDueForReset } from '/models/lib/checklistResetSchedule';
import { SyncedCron } from '/server/cron/syncedCron';

// Un-check every item of `checklist` (a single multi-update, not a per-item
// helper call, so a scheduled reset of many checklists does not generate a
// per-item activity for a change nobody made) and stamp lastResetAt.
export async function applyChecklistAutoReset(checklist, now = new Date()) {
  await ChecklistItems.updateAsync(
    { checklistId: checklist._id, isFinished: true },
    { $set: { isFinished: false } },
    { multi: true },
  );
  await Checklists.updateAsync(checklist._id, { $set: { lastResetAt: now } });
}

// Scan every checklist with a resetInterval set and reset the ones that are due.
export async function scanChecklistResetSchedule(now = new Date()) {
  const candidates = await Checklists.find({
    resetInterval: { $exists: true, $nin: [null, 'none'] },
  }).fetchAsync();

  const dueChecklists = selectChecklistsDueForReset(candidates, now);
  for (const checklist of dueChecklists) {
    try {
      // eslint-disable-next-line no-await-in-loop
      await applyChecklistAutoReset(checklist, now);
    } catch (e) {
      // Never let one bad checklist stop the rest from resetting.
      // eslint-disable-next-line no-console
      console.error('checklistResetSchedule: error resetting checklist', checklist._id, e);
    }
  }
}

Meteor.startup(() => {
  try {
    SyncedCron.add({
      name: 'wekan-checklist-auto-reset',
      schedule(parser) {
        return parser.text('every 1 hour');
      },
      job() {
        return scanChecklistResetSchedule(new Date());
      },
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('checklistResetSchedule: failed to register cron job', e);
  }
});
