import { Mongo } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { ensureIndex } from './mongoStartup';

// A private recovery checkpoint, never a second audit log or a publication.
// _id is the board ID, so separate server processes cannot start two restores.
const ScrumHistoryPending = new Mongo.Collection('scrumHistoryPending');
ScrumHistoryPending.deny({ insert: () => true, update: () => true, remove: () => true });
// No TTL: removing a checkpoint must not remove its completion evidence.
export const ScrumHistoryCompletions = new Mongo.Collection('scrumHistoryCompletions');
ScrumHistoryCompletions.deny({ insert: () => true, update: () => true, remove: () => true });
export const ScrumHistoryRequests = new Mongo.Collection('scrumHistoryRequests');
ScrumHistoryRequests.deny({ insert: () => true, update: () => true, remove: () => true });
Meteor.startup(async () => {
  await ensureIndex(ScrumHistoryCompletions, { boardId: 1, rowId: 1 });
  await ensureIndex(ScrumHistoryRequests, { boardId: 1, userId: 1 });
});
export default ScrumHistoryPending;
