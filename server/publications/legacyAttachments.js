import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { MongoInternals } from 'meteor/mongo';
import { ReactiveCache } from '/imports/reactiveCache';
import { canReadBoard } from '/models/lib/boardVisibility';

// Read-in-place support for legacy CollectionFS attachments.
//
// CollectionFS attachments live in `cfs.attachments.filerecord` (not the
// Meteor-Files `attachments` collection), so the normal board publication never
// sends them to the client and they are invisible in the card view. This
// publication synthesizes Meteor-Files-shaped documents from the legacy
// filerecords and pushes them into the client `attachments` collection via
// this.added(), so they appear in the attachment gallery and can be opened /
// downloaded. The binary is streamed on demand by the /cdn/storage/attachments
// route (meta.source === 'legacy').
//
// Legacy records do not change at runtime, so this publication is a one-shot
// snapshot (no observe). Migrating the files to Meteor-Files removes them from
// here and publishes them through the normal path instead.

function extensionOf(name) {
  if (!name) return '';
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
}

Meteor.publish('legacyBoardAttachments', async function (boardId, cardId) {
  check(boardId, String);
  // #6745: the card whose details are open. Without it this sent every legacy
  // attachment of the whole board each time a card was opened - and looked
  // each one up again, one query per file.
  check(cardId, Match.Maybe(String));

  const board = await ReactiveCache.getBoard(boardId);
  if (!canReadBoard(this.userId, board)) {
    return this.ready();
  }

  let records = [];
  try {
    // Use the raw MongoDB driver: a Meteor Mongo.Collection for
    // 'cfs.attachments.filerecord' already exists elsewhere and Meteor forbids a
    // second instance with the same name.
    const db = MongoInternals.defaultRemoteCollectionDriver().mongo.db;
    const selector = cardId ? { boardId, cardId } : { boardId };
    records = await db.collection('cfs.attachments.filerecord').find(selector).toArray();
  } catch (error) {
    return this.ready();
  }

  // Which of these ids already exist as Meteor-Files documents - ONE query for
  // all of them, not one per record.
  const migrated = new Set();
  if (records.length) {
    const existing = await ReactiveCache.getAttachments(
      { _id: { $in: records.map(rec => rec._id) }, 'meta.source': { $ne: 'legacy' } },
      { fields: { _id: 1 } },
    );
    for (const doc of existing || []) migrated.add(doc._id);
  }

  for (const rec of records) {
    const copy = (rec.copies && rec.copies.attachments) || {};
    // Skip records whose binary reference is missing.
    if (!copy.key) {
      continue;
    }
    const name = (rec.original && rec.original.name) || copy.name || rec._id;
    const type = (rec.original && rec.original.type) || copy.type || 'application/octet-stream';
    const size = (rec.original && rec.original.size) || copy.size || 0;
    const ext = extensionOf(name);

    // Don't collide with a Meteor-Files document of the same _id (e.g. if the
    // file was already migrated). Meteor-Files ids are 24-hex ObjectId strings;
    // CollectionFS ids are 17-char Meteor random ids, so collisions are
    // unexpected, but guard anyway.
    if (migrated.has(rec._id)) {
      continue;
    }

    this.added('attachments', rec._id, {
      name,
      size,
      type,
      ext,
      extension: ext,
      extensionWithDot: ext ? `.${ext}` : '',
      mime: type,
      'mime-type': type,
      meta: {
        boardId: rec.boardId,
        swimlaneId: rec.swimlaneId,
        listId: rec.listId,
        cardId: rec.cardId,
        source: 'legacy',
      },
      userId: rec.userId,
      isImage: type.startsWith('image/'),
      isVideo: type.startsWith('video/'),
      isAudio: type.startsWith('audio/'),
      isPDF: type === 'application/pdf',
      isText: type.startsWith('text/'),
      _downloadRoute: '/cdn/storage',
      _collectionName: 'attachments',
      versions: {
        original: {
          storage: 'gridfs',
          type,
          size,
          extension: ext,
          path: `/cdn/storage/attachments/${rec._id}`,
        },
      },
      uploadedAtOstrio: rec.uploadedAt || new Date(),
    });
  }

  this.ready();
});
