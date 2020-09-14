import { Meteor } from 'meteor/meteor';
import { FilesCollection } from 'meteor/ostrio:files';
import { createBucket } from './lib/grid/createBucket';
import { createOnAfterUpload } from './lib/fsHooks/createOnAfterUpload';
import { createInterceptDownload } from './lib/fsHooks/createInterceptDownload';
import { createOnAfterRemove } from './lib/fsHooks/createOnAfterRemove';

const attachmentBucket = createBucket('attachments');

// XXX Enforce a schema for the Attachments FilesCollection
// see: https://github.com/VeliovGroup/Meteor-Files/wiki/Schema

export const Attachments = new FilesCollection({
  debug: false, // Change to `true` for debugging
  collectionName: 'attachments',
  allowClientCode: false,
  onAfterUpload(doc) {
    // If the attachment doesn't have a source field
    // or its source is different than import
    if (!doc.source || doc.source !== 'import') {
      // Add activity about adding the attachment
      Activities.insert({
        userId,
        type: 'card',
        activityType: 'addAttachment',
        attachmentId: doc._id,
        // this preserves the name so that notifications can be meaningful after
        // this file is removed
        attachmentName: doc.original.name,
        boardId: doc.boardId,
        cardId: doc.cardId,
        listId: doc.listId,
        swimlaneId: doc.swimlaneId,
      });
    } else {
      // Don't add activity about adding the attachment as the activity
      // be imported and delete source field
      Attachments.update(
        {
          _id: doc._id,
        },
        {
          $unset: {
            source: '',
          },
        },
      );
    }
    createOnAfterUpload(attachmentBucket)(doc);
  },
  interceptDownload: createInterceptDownload(attachmentBucket),
  onAfterRemove(docs) {
    docs.forEach(function(doc) {
      Activities.insert({
        userId: doc.userId,
        type: 'card',
        activityType: 'deleteAttachment',
        attachmentId: doc._id,
        // this preserves the name so that notifications can be meaningful after
        // this file is removed
        attachmentName: doc.original.name,
        boardId: doc.boardId,
        cardId: doc.cardId,
        listId: doc.listId,
        swimlaneId: doc.swimlaneId,
      });
    });
    createOnAfterRemove(attachmentBucket)(docs);
  },
  // We authorize the attachment download either:
  // - if the board is public, everyone (even unconnected) can download it
  // - if the board is private, only board members can download it
  downloadCallback(doc) {
    const board = Boards.findOne(doc.boardId);
    if (board.isPublic()) {
      return true;
    } else {
      return board.hasMember(this.userId);
    }
  },
});

if (Meteor.isServer) {
  Attachments.allow({
    insert(userId, doc) {
      return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
    },
    update(userId, doc) {
      return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
    },
    remove(userId, doc) {
      return allowIsBoardMember(userId, Boards.findOne(doc.boardId));
    },
    fetch: ['boardId'],
  });

  Meteor.startup(() => {
    Attachments.collection._ensureIndex({ cardId: 1 });
  });
}

export default Attachments;
