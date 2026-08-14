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
//
// #6596: a filerecord can point at a GridFS file that is not there - a restore
// that brought `cfs.<coll>.filerecord` without `cfs_gridfs.<coll>.chunks`, a
// binary deleted by hand, or a record whose twin already took the binary with
// it. GridFS answers that with `FileNotFound: file <id> was not found`, which
// says nothing about WHICH attachment is affected or what to do. Say both.
export async function readCollectionFsBuffer(item) {
  const db = getDb();
  const bucket = getBucket(db, item.coll);
  const gridFsId = toObjectId(item.gridFsKey);
  return await new Promise((resolve, reject) => {
    const chunks = [];
    const stream = bucket.openDownloadStream(gridFsId);
    stream.on('data', c => chunks.push(c));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', error => {
      if (isFileNotFound(error)) {
        reject(new Meteor.Error(
          'collectionfs-binary-missing',
          `${item.name || item.sourceId}: its file is not in cfs_gridfs.${item.coll} ` +
          `(record ${item.sourceId}, key ${item.gridFsKey}). The metadata was ` +
          'restored without the binary, or the binary was removed. Nothing to move.',
        ));
        return;
      }
      reject(error);
    });
  });
}

// GridFS reports a missing file as an error with this code/message shape.
export function isFileNotFound(error) {
  if (!error) return false;
  if (error.code === 'ENOENT' || error.code === 232) return true;
  return /FileNotFound/i.test(error.message || '');
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
  if (!gridFsKey) {
    return;
  }
  // #6596: two filerecords can carry the SAME `copies.<coll>.key` - the same
  // file attached twice, or a board copied with its attachments. Deleting the
  // binary with the first of them left the second pointing at nothing, and the
  // migration failed on it with "FileNotFound: file <id> was not found". So the
  // binary goes only when no OTHER record still names it. This is asked AFTER
  // the filerecord above is deleted, so a record never counts itself.
  try {
    const stillUsed = await db.collection(filerecordCollName(coll)).countDocuments(
      { [`copies.${coll}.key`]: gridFsKey },
      { limit: 1 },
    );
    if (stillUsed > 0) {
      return;
    }
  } catch (error) {
    // If the question cannot be asked, keep the binary: a file left behind is
    // recoverable, an attachment deleted out from under another record is not.
    console.error('[collectionFsStore] Could not check for shared binary', gridFsKey, error);
    return;
  }
  try {
    const bucket = getBucket(db, coll);
    await bucket.delete(toObjectId(gridFsKey));
  } catch (error) {
    // file/chunks may already be gone
  }
}
