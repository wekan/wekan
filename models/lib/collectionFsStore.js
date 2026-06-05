import { Meteor } from 'meteor/meteor';
import { MongoInternals } from 'meteor/mongo';
import { Random } from 'meteor/random';

/**
 * Read/write/delete helpers for the legacy CollectionFS GridFS layout, used by
 * the unified attachment/avatar storage migration.
 *
 * Verified structure (from a real WeKan 6.09 mongorestore):
 *
 *   cfs.<coll>.filerecord  (metadata, _id = Meteor random id)
 *     { _id, original:{name,size,type},
 *       boardId, swimlaneId, listId, cardId, userId, uploadedAt,   // top level
 *       copies: { <coll>: { name, type, size, key:<gridfs file _id hex>,
 *                           updatedAt, createdAt } } }
 *
 *   cfs_gridfs.<coll>.files / .chunks   (GridFS bucket; file _id = copies.<coll>.key)
 *     files: { _id:ObjectId, filename, contentType, length, chunkSize, uploadDate, md5 }
 *
 * `coll` is 'attachments' or 'avatars'.
 */

function getDb() {
  const db = MongoInternals.defaultRemoteCollectionDriver()?.mongo?.db;
  if (!db) {
    throw new Meteor.Error('mongo-unavailable', 'MongoDB connection is not available');
  }
  return db;
}

function getBucket(db, coll) {
  const { GridFSBucket } = MongoInternals.NpmModule;
  return new GridFSBucket(db, { bucketName: `cfs_gridfs.${coll}` });
}

function toObjectId(hexOrId) {
  const { ObjectId } = MongoInternals.NpmModule;
  if (hexOrId instanceof ObjectId) return hexOrId;
  return new ObjectId(String(hexOrId));
}

function filerecordCollName(coll) {
  return `cfs.${coll}.filerecord`;
}

// Normalize a filerecord into the common shape the migration engine consumes.
export function normalizeCollectionFsRecord(coll, rec) {
  const copy = (rec.copies && rec.copies[coll]) || {};
  const key = copy.key;
  return {
    backend: 'collectionfs',
    coll,
    sourceId: rec._id,
    gridFsKey: key,
    name: (rec.original && rec.original.name) || copy.name || rec._id,
    type: (rec.original && rec.original.type) || copy.type || 'application/octet-stream',
    size: (rec.original && rec.original.size) || copy.size || 0,
    // CollectionFS keeps board/card ids at the top level; Meteor-Files nests
    // them under meta. Carry them in a normalized `meta` plus the owner userId.
    meta: {
      boardId: rec.boardId,
      swimlaneId: rec.swimlaneId,
      listId: rec.listId,
      cardId: rec.cardId,
    },
    userId: rec.userId,
    uploadedAt: rec.uploadedAt || (copy.createdAt) || new Date(),
  };
}

// List all CollectionFS records for a collection ('attachments' | 'avatars').
export async function listCollectionFsRecords(coll) {
  if (!Meteor.isServer) return [];
  const db = getDb();
  let recs = [];
  try {
    recs = await db.collection(filerecordCollName(coll)).find({}).toArray();
  } catch (error) {
    return [];
  }
  return recs
    .map(rec => normalizeCollectionFsRecord(coll, rec))
    .filter(r => r.gridFsKey); // only records whose binary key is present
}

export async function countCollectionFsRecords(coll) {
  if (!Meteor.isServer) return 0;
  const db = getDb();
  try {
    return await db.collection(filerecordCollName(coll)).countDocuments({});
  } catch (error) {
    return 0;
  }
}

// Read the binary for a normalized CollectionFS record into a Buffer.
export async function readCollectionFsBuffer(item) {
  const db = getDb();
  const bucket = getBucket(db, item.coll);
  const gridFsId = toObjectId(item.gridFsKey);
  return await new Promise((resolve, reject) => {
    const chunks = [];
    const stream = bucket.openDownloadStream(gridFsId);
    stream.on('data', c => chunks.push(c));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

// Write a buffer into the CollectionFS layout (GridFS bucket + filerecord),
// reproducing the genuine old-WeKan structure. `info` carries the normalized
// fields (name, type, size, meta{boardId,...}, userId, uploadedAt).
export async function writeCollectionFsRecord(coll, info, buffer) {
  const db = getDb();
  const bucket = getBucket(db, coll);

  // 1. Write the binary; the GridFS file _id becomes the filerecord "key".
  const gridFsId = await new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(info.name, {
      contentType: info.type,
    });
    uploadStream.on('error', reject);
    uploadStream.on('finish', () => resolve(uploadStream.id));
    uploadStream.end(buffer);
  });

  const now = info.uploadedAt || new Date();
  const recordId = Random.id();
  const filerecord = {
    _id: recordId,
    original: {
      name: info.name,
      size: info.size || (buffer ? buffer.length : 0),
      type: info.type,
      updatedAt: now,
    },
    boardId: info.meta && info.meta.boardId,
    swimlaneId: info.meta && info.meta.swimlaneId,
    listId: info.meta && info.meta.listId,
    cardId: info.meta && info.meta.cardId,
    userId: info.userId,
    uploadedAt: now,
    copies: {
      [coll]: {
        name: info.name,
        type: info.type,
        size: info.size || (buffer ? buffer.length : 0),
        key: gridFsId.toString(),
        updatedAt: now,
        createdAt: now,
      },
    },
  };
  await db.collection(filerecordCollName(coll)).insertOne(filerecord);
  return { sourceId: recordId, gridFsKey: gridFsId.toString() };
}

// Delete a CollectionFS record's filerecord and its GridFS binary.
export async function deleteCollectionFsRecord(coll, sourceId, gridFsKey) {
  const db = getDb();
  try {
    await db.collection(filerecordCollName(coll)).deleteOne({ _id: sourceId });
  } catch (error) {
    console.error('[collectionFsStore] Failed to delete filerecord', sourceId, error);
  }
  if (gridFsKey) {
    try {
      const bucket = getBucket(db, coll);
      await bucket.delete(toObjectId(gridFsKey));
    } catch (error) {
      // file/chunks may already be gone
    }
  }
}
