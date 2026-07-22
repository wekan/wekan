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
//
// NOTE (#6500): this cannot cover EVERY index creation. Meteor runs package
// startup hooks before app startup hooks, so `accounts-base` creates the
// Meteor.users indexes before this hook runs; if the database is not ready at
// that moment WeKan still crashes there ("...creating an index for collection
// users: Topology is closed") before binding its HTTP port — which on a fresh
// `docker compose up` shows as "Connection reset by peer". Moving this wait to a
// module-level top-level `await` does NOT work: Meteor 3's Mongo connection is not
// usable at module-load time, so it deadlocks and the server never starts. The
// reliable fix is therefore to not start WeKan until the database is accepting
// connections — see the ferretdb healthcheck + `depends_on: condition:
// service_healthy` in docker-compose.yml (and the DB-first ordering the snap /
// start-wekan.sh already use).
// ============================================================================
Meteor.startup(async () => {
  await waitForMongoReady();
});
