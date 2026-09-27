import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

// Server methods own validation, authorization, revisions and lifecycle snapshots.
const ScrumEvents = new Mongo.Collection('scrumEvents');
if (Meteor.isServer) {
  const { ensureIndex } = require('/server/lib/mongoStartup');
  ScrumEvents.deny({ insert: () => true, update: () => true, remove: () => true });
  Meteor.startup(async () => {
    await ensureIndex(ScrumEvents, { boardId: 1 });
  });
}
export default ScrumEvents;
