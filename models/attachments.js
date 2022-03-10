import { Meteor } from 'meteor/meteor';
import { FilesCollection } from 'meteor/ostrio:files';
import fs from 'fs';
import path from 'path';
import { createBucket } from './lib/grid/createBucket';
import { createOnAfterUpload } from './lib/fsHooks/createOnAfterUpload';
import { createInterceptDownload } from './lib/fsHooks/createInterceptDownload';
import { createOnAfterRemove } from './lib/fsHooks/createOnAfterRemove';

let attachmentBucket;
if (Meteor.isServer) {
  attachmentBucket = createBucket('attachments');
}

const insertActivity = (fileObj, activityType) =>
  Activities.insert({
    userId: fileObj.userId,
    type: 'card',
    activityType,
    attachmentId: fileObj._id,
    // this preserves the name so that notifications can be meaningful after
    // this file is removed
    attachmentName: fileObj.name,
    boardId: fileObj.meta.boardId,
    cardId: fileObj.meta.cardId,
    listId: fileObj.meta.listId,
    swimlaneId: fileObj.meta.swimlaneId,
  });

// XXX Enforce a schema for the Attachments FilesCollection
// see: https://github.com/VeliovGroup/Meteor-Files/wiki/Schema

Attachments = new FilesCollection({
  debug: false, // Change to `true` for debugging
  collectionName: 'attachments',
  allowClientCode: true,
  storagePath() {
    if (process.env.WRITABLE_PATH) {
      return path.join(process.env.WRITABLE_PATH, 'uploads', 'attachments');
    }
    return path.normalize(`assets/app/uploads/${this.collectionName}`);
  },
  onAfterUpload: function onAfterUpload(fileRef) {
    createOnAfterUpload(attachmentBucket).call(this, fileRef);
    // If the attachment doesn't have a source field
    // or its source is different than import
    if (!fileRef.meta.source || fileRef.meta.source !== 'import') {
      // Add activity about adding the attachment
      insertActivity(fileRef, 'addAttachment');
    }
  },
  interceptDownload: createInterceptDownload(attachmentBucket),
  onAfterRemove: function onAfterRemove(files) {
    createOnAfterRemove(attachmentBucket).call(this, files);
    files.forEach(fileObj => {
      insertActivity(fileObj, 'deleteAttachment');
    });
  },
  // We authorize the attachment download either:
  // - if the board is public, everyone (even unconnected) can download it
  // - if the board is private, only board members can download it
  protected(fileObj) {
    const board = Boards.findOne(fileObj.meta.boardId);
    if (board.isPublic()) {
      return true;
    }
    return board.hasMember(this.userId);
  },
});

if (Meteor.isServer) {
  Attachments.allow({
    insert(userId, fileObj) {
      return allowIsBoardMember(userId, Boards.findOne(fileObj.boardId));
    },
    update(userId, fileObj) {
      return allowIsBoardMember(userId, Boards.findOne(fileObj.boardId));
    },
    remove(userId, fileObj) {
      return allowIsBoardMember(userId, Boards.findOne(fileObj.boardId));
    },
    fetch: ['meta'],
  });

  Meteor.startup(() => {
    Attachments.collection._ensureIndex({ 'meta.cardId': 1 });
    const storagePath = Attachments.storagePath();
    if (!fs.existsSync(storagePath)) {
      console.log("create storagePath because it doesn't exist: " + storagePath);
      fs.mkdirSync(storagePath, { recursive: true });
    }
  });
}

export default Attachments;
