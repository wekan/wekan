import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { ensureIndex } from '/server/lib/mongoStartup';

const ListSyncRunReports = new Mongo.Collection('listSyncRunReports');
ListSyncRunReports.deny({ insert: () => true, update: () => true, remove: () => true });
Meteor.startup(async () => {
  await ensureIndex(ListSyncRunReports, { listId: 1, boardId: 1, incarnation: 1, startedAt: -1 });
  await ensureIndex(ListSyncRunReports, { startedAt: -1, _id: -1 });
  await ensureIndex(ListSyncRunReports, { status: 1, startedAt: -1, _id: -1 });
  await ensureIndex(ListSyncRunReports, { startedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
});
export default ListSyncRunReports;
