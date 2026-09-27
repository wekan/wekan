import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

// Private report observations, not editable planning records or an undo stack.
// Report readers must apply the same card visibility as sprint snapshots.
const ScrumDailySnapshots = new Mongo.Collection('scrumDailySnapshots');
if (Meteor.isServer) {
  ScrumDailySnapshots.deny({ insert: () => true, update: () => true, remove: () => true });
  const { ensureIndex } = require('/server/lib/mongoStartup');
  Meteor.startup(async () => {
    await ensureIndex(ScrumDailySnapshots, { boardId: 1, sprintId: 1, startedAt: 1, capturedAt: -1 });
  });
}
export default ScrumDailySnapshots;
