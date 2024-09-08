import { ReactiveCache } from '/imports/reactiveCache';
import { Meteor } from 'meteor/meteor';
import { FilesCollection } from 'meteor/ostrio:files';
import { isFileValid } from './fileValidation';
import { createBucket } from './lib/grid/createBucket';
import fs from 'fs';
import path from 'path';

if (Meteor.isServer) {
  AttachmentsOld = createBucket('cfs_gridfs.attachments');

/*

  Meteor.startup(() => {
    AttachmentsOld.files._ensureIndex({ cardId: 1 });
  });

  AttachmentsOld.allow({
    insert(userId, doc) {
      return allowIsBoardMember(userId, ReactiveCache.getBoard(doc.boardId));
    },
    update(userId, doc) {
      return allowIsBoardMember(userId, ReactiveCache.getBoard(doc.boardId));
    },
    remove(userId, doc) {
      return allowIsBoardMember(userId, ReactiveCache.getBoard(doc.boardId));
    },
    // We authorize the attachment download either:
    // - if the board is public, everyone (even unconnected) can download it
    // - if the board is private, only board members can download it
    download(userId, doc) {
      const board = ReactiveCache.getBoard(doc.boardId);
      if (board.isPublic()) {
        return true;
      } else {
        return board.hasMember(userId);
      }
    },

    fetch: ['boardId'],
  });
}

// XXX Enforce a schema for the AttachmentsOld CollectionFS

if (Meteor.isServer) {
  AttachmentsOld.files.after.insert((userId, doc) => {
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
      AttachmentsOld.update(
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
  });

  AttachmentsOld.files.before.remove((userId, doc) => {
    Activities.insert({
      userId,
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

*/

}

export default AttachmentsOld;
