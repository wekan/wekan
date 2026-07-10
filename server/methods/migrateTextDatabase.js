import { Meteor } from 'meteor/meteor';
import { MongoInternals } from 'meteor/mongo';
import { MongoClient } from 'mongodb';
import { ReactiveCache } from '/imports/reactiveCache';

// ─────────────────────────────────────────────────────────────────────────────
// Admin Panel / Attachments: migrate the TEXT-based data (everything that is NOT
// attachments/avatars — those are files on the filesystem) between MongoDB and
// FerretDB v1 (SQLite), in either direction.
//
// WeKan is connected to one database at a time (its MONGO_URL). This copies the
// text collections from that live database into the OTHER database over a second
// driver connection (both MongoDB and FerretDB v1 speak the MongoDB wire
// protocol, so the same Node driver talks to both). After migrating you point
// MONGO_URL at the other database (or, on the snap, `snap set wekan
// database=ferretdb` / `=mongodb`) and restart.
//
// Target URLs (both must be running and reachable):
//   toFerretDB  ->  WEKAN_FERRETDB_URL   (default mongodb://127.0.0.1:27018/wekan)
//   toMongoDB   ->  WEKAN_MONGODB_URL    (default mongodb://127.0.0.1:27019/wekan)
//
// It copies text data only; attachments/avatars stay on the filesystem and are
// unaffected. Idempotent (documents are upserted by _id), so re-running is safe.
// ─────────────────────────────────────────────────────────────────────────────

// Collections that hold FILE data (attachments/avatars, incl. legacy GridFS/CFS
// metadata) — NOT text data, so they are skipped.
const FILE_COLLECTIONS = new Set([
  'attachments', 'avatars',
  'cfs.attachments.filerecord', 'cfs.avatars.filerecord',
  'cfs_gridfs.attachments.files', 'cfs_gridfs.attachments.chunks',
  'cfs_gridfs.avatars.files', 'cfs_gridfs.avatars.chunks',
]);

const BATCH = 200;

// Shared progress the client polls via migrateTextDatabaseStatus().
const progress = {
  running: false, direction: '', phase: 'idle',
  collection: '', collDone: 0, collTotal: 0,
  collectionsDone: 0, collectionsTotal: 0,
  startedAt: null, finishedAt: null, success: null, error: '',
};

function targetUrlFor(direction) {
  if (direction === 'toFerretDB') {
    return process.env.WEKAN_FERRETDB_URL || 'mongodb://127.0.0.1:27018/wekan';
  }
  if (direction === 'toMongoDB') {
    return process.env.WEKAN_MONGODB_URL || 'mongodb://127.0.0.1:27019/wekan';
  }
  throw new Meteor.Error('bad-direction', "direction must be 'toFerretDB' or 'toMongoDB'");
}

async function copyTextData(direction) {
  progress.running = true;
  progress.direction = direction;
  progress.phase = 'connecting';
  progress.collection = ''; progress.collDone = 0; progress.collTotal = 0;
  progress.collectionsDone = 0; progress.collectionsTotal = 0;
  progress.startedAt = new Date().toISOString();
  progress.finishedAt = null; progress.success = null; progress.error = '';

  const srcDb = MongoInternals.defaultRemoteCollectionDriver().mongo.db;
  const targetUrl = targetUrlFor(direction);
  let client;
  try {
    client = await MongoClient.connect(targetUrl);
    const tgtDb = client.db(
      new URL(targetUrl.replace('mongodb://', 'http://')).pathname.slice(1) || 'wekan',
    );

    const names = (await srcDb.listCollections().toArray())
      .map(c => c.name)
      .filter(n => !FILE_COLLECTIONS.has(n) && !n.startsWith('system.'));
    progress.collectionsTotal = names.length;
    progress.phase = 'migrating';

    for (const name of names) {
      progress.collection = name;
      const src = srcDb.collection(name);
      const tgt = tgtDb.collection(name);
      progress.collTotal = await src.countDocuments().catch(() => 0);
      progress.collDone = 0;

      const cursor = src.find({});
      let batch = [];
      const flush = async () => {
        if (!batch.length) return;
        const ops = batch.map(d => ({ replaceOne: { filter: { _id: d._id }, replacement: d, upsert: true } }));
        try { await tgt.bulkWrite(ops, { ordered: false }); }
        catch (e) { /* fall back per-doc */ for (const d of batch) { try { await tgt.replaceOne({ _id: d._id }, d, { upsert: true }); } catch (_) {} } }
        progress.collDone += batch.length;
        batch = [];
      };
      for await (const doc of cursor) {
        batch.push(doc);
        if (batch.length >= BATCH) await flush();
      }
      await flush();
      await cursor.close();
      progress.collectionsDone += 1;
    }

    progress.phase = 'completed';
    progress.success = true;
  } catch (e) {
    progress.phase = 'error';
    progress.success = false;
    progress.error = String(e && e.message ? e.message : e).slice(0, 500);
    console.error('[migrateTextDatabase]', e);
  } finally {
    if (client) { try { await client.close(); } catch (_) {} }
    progress.running = false;
    progress.finishedAt = new Date().toISOString();
  }
}

Meteor.methods({
  async migrateTextDatabaseStatus() {
    const user = await ReactiveCache.getCurrentUser();
    if (!user || !user.isAdmin) return false;
    return { ...progress };
  },

  async migrateTextDatabase(direction) {
    const user = await ReactiveCache.getCurrentUser();
    if (!user || !user.isAdmin) throw new Meteor.Error('not-authorized');
    if (progress.running) throw new Meteor.Error('already-running', 'A database migration is already in progress.');
    // Validate direction up front (throws on bad value).
    targetUrlFor(direction);
    // Run in the background; the client polls migrateTextDatabaseStatus().
    copyTextData(direction);
    return { started: true, direction };
  },
});
