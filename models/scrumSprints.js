import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

// Server methods own validation, authorization, revisions and lifecycle snapshots.
const ScrumSprints = new Mongo.Collection('scrumSprints');
if (Meteor.isServer) {
  const { ensureIndex } = require('/server/lib/mongoStartup');
  ScrumSprints.deny({ insert: () => true, update: () => true, remove: () => true });
  Meteor.startup(async () => {
    await ensureIndex(ScrumSprints, { boardId: 1 });
    await ensureIndex(ScrumSprints, { state: 1, _id: 1 });
  });
}
export default ScrumSprints;
