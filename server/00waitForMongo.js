import { Meteor } from 'meteor/meteor';
import { waitForMongoReady } from '/server/lib/mongoStartup';

// ============================================================================
// MUST be the first server import (see server/imports.js) so this Meteor.startup
// hook is registered first and therefore runs before any other startup hook
// that creates indexes (server/models/users.js, collectionBootstrap.js, ...).
//
// It blocks startup until MongoDB is reachable with an elected replica-set
// primary, preventing the "An error occurred when creating an index ...
// Topology is closed" crash when WeKan starts before MongoDB is ready (common
// right after an upgrade while MongoDB replays its journal).
// ============================================================================
Meteor.startup(async () => {
  await waitForMongoReady();
});
