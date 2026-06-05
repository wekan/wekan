import { MongoInternals } from 'meteor/mongo';

// ============================================================================
// WeKan MongoDB startup helpers
//
// Two problems this module solves, both seen when upgrading WeKan/MongoDB
// (e.g. the "Topology is closed" / "Server selection timed out" crash on
// startup, https://github.com/wekan/wekan/issues ):
//
//   1. WeKan must WAIT until MongoDB is actually reachable and has an elected
//      replica-set primary before it starts creating indexes. Otherwise the
//      first createIndex() throws and Node exits.
//
//   2. Index creation must be IDEMPOTENT: check the existing indexes and only
//      add the ones that are missing, so an upgrade never crashes on an index
//      that already exists (or has different options).
//
// All log messages here are intentionally English only (no i18n) so they are
// readable in `docker logs`, `snap logs wekan` and the Node.js terminal.
// ============================================================================

// How long to wait for MongoDB before printing the "you may need to upgrade
// the database with mongodump/mongorestore" guidance. We keep retrying after
// this; we just stop staying silent. Override with WEKAN_DB_WAIT_TIMEOUT
// (seconds).
const WAIT_HINT_AFTER_SECONDS = parseInt(
  process.env.WEKAN_DB_WAIT_TIMEOUT || '120',
  10,
);
const RETRY_INTERVAL_MS = 5000;

// Printed once, in English only, when MongoDB stays unreachable long enough
// that a database/MongoDB-version upgrade is the likely cause.
const UPGRADE_HINT = `
========================================================================
WeKan: still cannot connect to MongoDB.

If you just upgraded WeKan or MongoDB, the existing database may have been
created by an OLDER MongoDB version that the new MongoDB cannot open, so
MongoDB never finishes starting and WeKan keeps waiting here.

How to upgrade the database (dump with the old version, restore with the new):

  1. Start the OLD, previously-working MongoDB version.
  2. Back up:    mongodump --archive=/dump/wekan.archive --gzip
  3. Stop the old MongoDB. Start the NEW MongoDB version on an EMPTY data dir.
  4. Restore:    mongorestore --archive=/dump/wekan.archive --gzip --drop
  5. Start WeKan again.

Attachments and avatars are stored ON DISK under WRITABLE_PATH, NOT in
MongoDB, so when moving to a new server ALSO copy that whole directory
(it contains "files", "attachments" and "avatars"):
  - Snap:   /var/snap/wekan/common/files
  - Docker: the "wekan-files" volume mounted at /data
  - Source: the WRITABLE_PATH you configured in start-wekan.sh

Also check the MongoDB logs (docker logs wekan-db / snap logs wekan.mongodb)
for the real reason, for example:
  - incompatible featureCompatibilityVersion (step major versions one by one),
  - "wrong mongod version" on the data files,
  - an unclean shutdown that needs  mongod --repair.
WeKan will keep retrying every ${RETRY_INTERVAL_MS / 1000}s in case MongoDB is
just slow to replay its journal.
========================================================================
`;

function getRawDb() {
  // Available once the `mongo` package has loaded, which is before any
  // application code runs.
  return MongoInternals.defaultRemoteCollectionDriver().mongo.db;
}

// Resolve a node-mongodb rawCollection from a Meteor Mongo.Collection, a
// Meteor-Files FilesCollection (its Mongo.Collection is at `.collection`), or
// anything that already exposes rawCollection().
function getRawCollection(collection) {
  if (!collection) return null;
  if (typeof collection.rawCollection === 'function') {
    return collection.rawCollection();
  }
  if (collection._collection && typeof collection._collection.rawCollection === 'function') {
    return collection._collection.rawCollection();
  }
  if (collection.collection && typeof collection.collection.rawCollection === 'function') {
    return collection.collection.rawCollection();
  }
  return null;
}

// One connectivity probe: must answer AND be a writable primary, because we
// are about to create indexes (a write). Throws on any failure.
async function probeMongo() {
  const hello = await getRawDb().command({ hello: 1 });
  if (!hello.isWritablePrimary) {
    throw new Error('MongoDB reachable but replica-set primary not elected yet');
  }
}

/**
 * Block until MongoDB is reachable and a writable primary is available.
 * Never rejects: it keeps retrying, and after WAIT_HINT_AFTER_SECONDS it prints
 * the (English) mongodump/mongorestore upgrade guidance once.
 */
export async function waitForMongoReady() {
  let waited = 0;
  let hintShown = false;
  // Fast path: already connected.
  try {
    await probeMongo();
    return;
  } catch (e) {
    console.log(`WeKan: waiting for MongoDB to become ready (${e.message})...`);
  }
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL_MS));
    waited += RETRY_INTERVAL_MS / 1000;
    try {
      await probeMongo();
      console.log('WeKan: MongoDB is ready.');
      return;
    } catch (e) {
      if (!hintShown && waited >= WAIT_HINT_AFTER_SECONDS) {
        console.error(UPGRADE_HINT);
        hintShown = true;
      } else {
        console.log(`WeKan: MongoDB not ready yet (${e.message}), retrying in ${RETRY_INTERVAL_MS / 1000}s...`);
      }
    }
  }
}

/**
 * Idempotent index creation: look at the indexes that already exist on the
 * collection and only create the index when no index with the same key pattern
 * is present. Never throws — a single index problem must not crash startup.
 *
 * @param {Mongo.Collection|{rawCollection:Function}} collection
 * @param {Object} keys     index key spec, e.g. { boardId: 1 }
 * @param {Object} [options] passed straight through to createIndex (unique, etc.)
 * @returns {Promise<boolean>} true if an index was created, false if skipped
 */
export async function ensureIndex(collection, keys, options = {}) {
  const raw = getRawCollection(collection);
  if (!raw) {
    console.error('WeKan ensureIndex: could not resolve rawCollection, skipping', keys);
    return false;
  }
  const wanted = JSON.stringify(keys);
  try {
    let existing = [];
    try {
      existing = await raw.indexes();
    } catch (e) {
      // Collection may not exist yet — that is fine, createIndex will make it.
      existing = [];
    }
    const alreadyThere = existing.some(idx => JSON.stringify(idx.key) === wanted);
    if (alreadyThere) {
      return false;
    }
    await raw.createIndex(keys, options);
    return true;
  } catch (e) {
    // e.g. transient connection error or an option conflict on an existing
    // index. Log in English and continue; do not crash the whole server.
    console.error(
      `WeKan ensureIndex: failed to ensure index ${wanted} on "${raw.collectionName}": ${e.message}`,
    );
    return false;
  }
}
