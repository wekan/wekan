import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

// Server methods own validation, authorization, revisions and lifecycle snapshots.
const ScrumReleases = new Mongo.Collection('scrumReleases');
if (Meteor.isServer) {
  const { ensureIndex } = require('/server/lib/mongoStartup');
  ScrumReleases.deny({ insert: () => true, update: () => true, remove: () => true });
  Meteor.startup(async () => {
    await ensureIndex(ScrumReleases, { boardId: 1 });
  });
}
export default ScrumReleases;
