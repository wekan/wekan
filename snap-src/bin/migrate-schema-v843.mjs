/**
 * WeKan schema migration v8.43 — Node.js script (uses the bundled `mongodb` driver)
 *
 * Run with the bundled Node.js (no mongosh needed):
 *   # Snap:
 *   NODE_PATH=$SNAP/programs/server/node_modules \
 *     $SNAP/bin/node $SNAP/bin/migrate-schema-v843.mjs
 *   # From a source/bundle checkout (mongodb driver in ./node_modules):
 *   NODE_PATH=./node_modules node snap-src/bin/migrate-schema-v843.mjs
 *
 * Connection: set MONGO_URL (default mongodb://127.0.0.1:27017/wekan) or pass it
 * as the first argument. Works against FerretDB v1 (MongoDB wire protocol) or
 * plain MongoDB. Idempotent: safe to run multiple times.
 *
 * What it does:
 *   1. Ensures every list has a non-empty swimlaneId.
 *   2. Ensures every card has a non-empty swimlaneId and a valid listId.
 *   3. Creates a "Rescued Data" swimlane for each board that has orphaned
 *      entities (lists or cards without a valid swimlaneId/listId).
 *   4. Marks each board with migrationVersion: 843 once upgraded.
 *   5. Converts cfs.attachments.filerecord documents to the Meteor-Files
 *      (ostrio:files) schema inside the attachments collection.
 *   6. Converts cfs.avatars.filerecord documents similarly.
 *   7. Writes a completion marker to _wekan_migration.
 */

// Resolve the mongodb driver via createRequire (CommonJS): Node's ESM loader ignores
// NODE_PATH, which this tool is documented to set, so a bare `import ... from 'mongodb'`
// resolves nothing. createRequire's require() honors NODE_PATH and the node_modules walk.
import { createRequire } from 'node:module';
const { MongoClient, ObjectId } = createRequire(import.meta.url)('mongodb');

const MONGO_URL = process.argv[2] || process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/wekan';
const SCHEMA_VER = 843;

const client = new MongoClient(MONGO_URL);
await client.connect();
// Always the 'wekan' database (matches the original db.getSiblingDB('wekan')).
const db = client.db('wekan');
const coll = (name) => db.collection(name);

let exitCode = 0;
try {
  // ── Idempotency check ──────────────────────────────────────────────────────
  const marker = await coll('_wekan_migration').findOne({ _id: 'schema_v843' });
  if (marker && marker.completedAt) {
    console.log('Schema v8.43 already applied at ' + marker.completedAt + ' — skipping.');
    await client.close();
    process.exit(0);
  }

  console.log('=== Applying WeKan schema v8.43 ===');

  // ── 1. Build per-board default-swimlane map ────────────────────────────────
  console.log('Step 1: Building default swimlane map...');
  const defaultSwimlaneId = {};   // boardId → first swimlaneId
  for (const sw of await coll('swimlanes')
      .find({ archived: false }, { projection: { _id: 1, boardId: 1, sort: 1 } })
      .sort({ sort: 1 }).toArray()) {
    const bid = String(sw.boardId);
    if (!defaultSwimlaneId[bid]) defaultSwimlaneId[bid] = String(sw._id);
  }

  // ── 2. Ensure each board that has entities has at least one swimlane ───────
  console.log('Step 2: Creating default swimlanes for boards that have none...');
  for (const board of await coll('boards').find({}).toArray()) {
    const boardId = String(board._id);
    if (await coll('swimlanes').countDocuments({ boardId }) === 0) {
      const newId = new ObjectId();
      await coll('swimlanes').insertOne({
        _id: newId, title: 'Default', boardId, archived: false, sort: 0,
        type: 'swimlane', createdAt: new Date(), modifiedAt: new Date(), updatedAt: new Date(),
      });
      defaultSwimlaneId[boardId] = String(newId);
      console.log('  Created default swimlane for board ' + boardId);
    }
  }

  // ── 3. Build list → swimlaneId map ────────────────────────────────────────
  console.log('Step 3: Building list → swimlane map...');
  const listSwimlaneMap = {};  // listId → swimlaneId
  for (const ls of await coll('lists').find({}, { projection: { _id: 1, swimlaneId: 1 } }).toArray()) {
    listSwimlaneMap[String(ls._id)] = ls.swimlaneId || '';
  }

  // ── 4. Ensure all lists have a swimlaneId ─────────────────────────────────
  console.log('Step 4: Patching lists without swimlaneId...');
  let listFixed = 0;
  for (const list of await coll('lists')
      .find({ $or: [{ swimlaneId: { $exists: false } }, { swimlaneId: '' }, { swimlaneId: null }] }).toArray()) {
    const bid = String(list.boardId);
    const sid = defaultSwimlaneId[bid] || '';
    if (!sid) continue;
    await coll('lists').updateOne({ _id: list._id }, { $set: { swimlaneId: sid } });
    listSwimlaneMap[String(list._id)] = sid;
    listFixed++;
  }
  console.log('  Lists patched: ' + listFixed);

  // ── 5. Ensure all cards have a swimlaneId and a valid listId ──────────────
  console.log('Step 5: Patching cards without swimlaneId or with invalid listId...');
  const allListIds = new Set(
    (await coll('lists').find({}, { projection: { _id: 1 } }).toArray()).map(l => String(l._id)));
  // First list per board for orphan fallback
  const firstListByBoard = {};
  for (const l of await coll('lists')
      .find({}, { projection: { _id: 1, boardId: 1, swimlaneId: 1 } }).sort({ sort: 1 }).toArray()) {
    if (!firstListByBoard[l.boardId]) firstListByBoard[l.boardId] = l;
  }

  let cardFixed = 0;
  let cardOrphaned = 0;
  const rescuedSwimlanes = {};   // boardId → { swimlaneId, listId }

  async function getOrCreateRescuedSwimlane(boardId) {
    if (rescuedSwimlanes[boardId]) return rescuedSwimlanes[boardId];
    const sw = await coll('swimlanes').findOne({ boardId, title: /rescued.*data/i });
    if (!sw) {
      const id = new ObjectId();
      await coll('swimlanes').insertOne({
        _id: id, title: 'Rescued Data (Missing Swimlane)', boardId, archived: false,
        sort: 9999999, type: 'swimlane', color: 'red',
        createdAt: new Date(), modifiedAt: new Date(), updatedAt: new Date(),
      });
      const listId = new ObjectId();
      await coll('lists').insertOne({
        _id: listId, title: 'Rescued Cards', boardId, swimlaneId: String(id),
        archived: false, sort: 0, type: 'list',
        createdAt: new Date(), modifiedAt: new Date(), updatedAt: new Date(),
      });
      rescuedSwimlanes[boardId] = { swimlaneId: String(id), listId: String(listId) };
    } else {
      const rescList = await coll('lists').findOne({ boardId, swimlaneId: String(sw._id), title: /rescued/i });
      if (!rescList) {
        const listId = new ObjectId();
        await coll('lists').insertOne({
          _id: listId, title: 'Rescued Cards', boardId, swimlaneId: String(sw._id),
          archived: false, sort: 0, type: 'list',
          createdAt: new Date(), modifiedAt: new Date(), updatedAt: new Date(),
        });
        rescuedSwimlanes[boardId] = { swimlaneId: String(sw._id), listId: String(listId) };
      } else {
        rescuedSwimlanes[boardId] = { swimlaneId: String(sw._id), listId: String(rescList._id) };
      }
    }
    return rescuedSwimlanes[boardId];
  }

  for (const card of await coll('cards').find({}).toArray()) {
    const bid = String(card.boardId);
    const lid = String(card.listId || '');
    const sid = String(card.swimlaneId || '');
    let newSid = sid;
    let newLid = lid;
    let changed = false;

    if (!newSid) {
      newSid = (lid && listSwimlaneMap[lid]) ? listSwimlaneMap[lid] : (defaultSwimlaneId[bid] || '');
      changed = true;
    }
    if (lid && !allListIds.has(lid)) {
      const rescued = await getOrCreateRescuedSwimlane(bid);
      newLid = rescued.listId;
      newSid = rescued.swimlaneId;
      changed = true;
      cardOrphaned++;
    }
    if (!newLid && firstListByBoard[bid]) {
      const fl = firstListByBoard[bid];
      newLid = String(fl._id);
      newSid = fl.swimlaneId || newSid;
      changed = true;
    }
    if (changed) {
      await coll('cards').updateOne({ _id: card._id }, { $set: { swimlaneId: newSid, listId: newLid } });
      cardFixed++;
    }
  }
  console.log('  Cards patched: ' + cardFixed + ' (' + cardOrphaned + ' orphaned → Rescued Data swimlane)');

  // ── 6. Stamp boards with migrationVersion ─────────────────────────────────
  console.log('Step 6: Stamping boards with migrationVersion ' + SCHEMA_VER + '...');
  const stamp = { migrationVersion: SCHEMA_VER, comprehensiveMigrationCompleted: true, fixMissingListsCompleted: true };
  await coll('boards').updateMany({ migrationVersion: { $lt: SCHEMA_VER } }, { $set: stamp });
  await coll('boards').updateMany({ migrationVersion: { $exists: false } }, { $set: stamp });

  // ── 7. Convert CollectionFS attachment records → Meteor-Files format ────────
  console.log('Step 7: Converting cfs.attachments.filerecord → attachments (Meteor-Files)...');
  const collNames = (await db.listCollections().toArray()).map(c => c.name);
  let cfsAttachConverted = 0;
  if (collNames.includes('cfs.attachments.filerecord')) {
    for (const record of await coll('cfs.attachments.filerecord').find({}).toArray()) {
      if (await coll('attachments').findOne({ _id: record._id })) continue;
      const original = record.original || {};
      const meta = record.meta || {};
      const now = new Date();
      await coll('attachments').insertOne({
        _id: record._id,
        name: original.name || record.filename || String(record._id),
        size: original.size || 0,
        type: original.type || 'application/octet-stream',
        extension: (original.name || '').split('.').pop() || '',
        extensionWithDot: (original.name || '').includes('.') ? '.' + (original.name || '').split('.').pop() : '',
        meta: {
          boardId: meta.boardId || '', cardId: meta.cardId || '', listId: meta.listId || '',
          swimlaneId: meta.swimlaneId || '', userId: meta.userId || '',
          source: 'cfs-migration', cfsOriginalId: String(record._id), originalFilename: original.name || '',
        },
        path: '',
        versions: { original: { path: '', size: original.size || 0, type: original.type || 'application/octet-stream', storage: 'fs' } },
        userId: meta.userId || '',
        uploadedAt: record.uploadedAt || record.createdAt || now,
        uploadedAtOstrio: record.uploadedAt || record.createdAt || now,
        updatedAt: now, public: false, collectionName: 'attachments',
      });
      cfsAttachConverted++;
    }
  }
  console.log('  CFS attachments converted: ' + cfsAttachConverted);

  // ── 8. Convert CollectionFS avatar records → Meteor-Files format ────────────
  console.log('Step 8: Converting cfs.avatars.filerecord → avatars (Meteor-Files)...');
  let cfsAvatarConverted = 0;
  if (collNames.includes('cfs.avatars.filerecord')) {
    for (const record of await coll('cfs.avatars.filerecord').find({}).toArray()) {
      if (await coll('avatars').findOne({ _id: record._id })) continue;
      const original = record.original || {};
      const now = new Date();
      await coll('avatars').insertOne({
        _id: record._id,
        name: original.name || String(record._id),
        size: original.size || 0,
        type: original.type || 'image/jpeg',
        extension: (original.name || '').split('.').pop() || '',
        extensionWithDot: (original.name || '').includes('.') ? '.' + (original.name || '').split('.').pop() : '',
        meta: { source: 'cfs-migration', cfsOriginalId: String(record._id), originalFilename: original.name || '' },
        path: '',
        versions: { original: { path: '', size: original.size || 0, type: original.type || 'image/jpeg', storage: 'fs' } },
        userId: record.userId || (record.meta && record.meta.userId) || '',
        uploadedAt: record.uploadedAt || record.createdAt || now,
        uploadedAtOstrio: record.uploadedAt || record.createdAt || now,
        updatedAt: now, public: false, collectionName: 'avatars',
      });
      cfsAvatarConverted++;
    }
  }
  console.log('  CFS avatars converted: ' + cfsAvatarConverted);

  // ── 9. Normalise legacy /cfs/files/... coverIds to the bare file id ─────────
  console.log('Step 9: Normalising legacy file URL references in cards...');
  let urlsFixed = 0;
  for (const card of await coll('cards').find({ coverId: /^\/cfs\/files\// }).toArray()) {
    const newId = card.coverId.replace(/^.*\/([^/]+)$/, '$1').replace(/\?.*$/, '');
    await coll('cards').updateOne({ _id: card._id }, { $set: { coverId: newId } });
    urlsFixed++;
  }
  console.log('  Card coverIds normalised: ' + urlsFixed);

  // ── 10. Write completion marker ────────────────────────────────────────────
  await coll('_wekan_migration').replaceOne(
    { _id: 'schema_v843' },
    {
      _id: 'schema_v843', schemaVersion: SCHEMA_VER, completedAt: new Date(),
      stats: {
        listsPatched: listFixed, cardsPatched: cardFixed, cardsOrphaned: cardOrphaned,
        cfsAttachmentsConverted: cfsAttachConverted, cfsAvatarsConverted: cfsAvatarConverted,
        urlsNormalised: urlsFixed,
      },
    },
    { upsert: true });

  console.log('');
  console.log('=== Schema v8.43 migration complete ===');
  console.log('  Lists patched:       ' + listFixed);
  console.log('  Cards patched:       ' + cardFixed);
  console.log('  Cards rescued:       ' + cardOrphaned);
  console.log('  CFS attach conv:     ' + cfsAttachConverted);
  console.log('  CFS avatar conv:     ' + cfsAvatarConverted);
  console.log('  URLs normalised:     ' + urlsFixed);
} catch (e) {
  console.error('Schema v8.43 migration failed: ' + (e && e.stack ? e.stack : e));
  exitCode = 1;
} finally {
  await client.close();
}
process.exit(exitCode);
