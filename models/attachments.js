import { Meteor } from 'meteor/meteor';
import { FilesCollection } from 'meteor/ostrio:files';
import { createBucket } from './lib/grid/createBucket';
import fs from 'fs';
import path from 'path';
import { AttachmentStoreStrategyFilesystem, AttachmentStoreStrategyGridFs} from '/models/lib/attachmentStoreStrategy';
import FileStoreStrategyFactory, {moveToStorage, rename, STORAGE_NAME_FILESYSTEM, STORAGE_NAME_GRIDFS} from '/models/lib/fileStoreStrategy';

let attachmentBucket;
let storagePath;
if (Meteor.isServer) {
  attachmentBucket = createBucket('attachments');
  storagePath = path.join(process.env.WRITABLE_PATH, 'attachments');
}

export const fileStoreStrategyFactory = new FileStoreStrategyFactory(AttachmentStoreStrategyFilesystem, storagePath, AttachmentStoreStrategyGridFs, attachmentBucket);

// XXX Enforce a schema for the Attachments FilesCollection
// see: https://github.com/VeliovGroup/Meteor-Files/wiki/Schema

Attachments = new FilesCollection({
  debug: false, // Change to `true` for debugging
  collectionName: 'attachments',
  allowClientCode: true,
  namingFunction(opts) {
    const filenameWithoutExtension = opts.name.replace(/(.+)\..+/, "$1");
    const ret = opts.meta.fileId + "-original-" + filenameWithoutExtension;
    // remove fileId from meta, it was only stored there to have this information here in the namingFunction function
    delete opts.meta.fileId;
    return ret;
  },
  storagePath() {
    const ret = fileStoreStrategyFactory.storagePath;
    return ret;
  },
  onAfterUpload(fileObj) {
    let storage = fileObj.meta.copyStorage || STORAGE_NAME_GRIDFS;
    // current storage is the filesystem, update object and database
    Object.keys(fileObj.versions).forEach(versionName => {
      fileObj.versions[versionName].storage = STORAGE_NAME_FILESYSTEM;
    });
    Attachments.update({ _id: fileObj._id }, { $set: { "versions" : fileObj.versions } });
    moveToStorage(fileObj, storage, fileStoreStrategyFactory);
  },
  interceptDownload(http, fileObj, versionName) {
    const ret = fileStoreStrategyFactory.getFileStrategy(fileObj, versionName).interceptDownload(http, this.cacheControl);
    return ret;
  },
  onAfterRemove(files) {
    files.forEach(fileObj => {
      Object.keys(fileObj.versions).forEach(versionName => {
        fileStoreStrategyFactory.getFileStrategy(fileObj, versionName).onAfterRemove();
      });
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

  Meteor.methods({
    moveAttachmentToStorage(fileObjId, storageDestination) {
      check(fileObjId, String);
      check(storageDestination, String);

      const fileObj = Attachments.findOne({_id: fileObjId});
      moveToStorage(fileObj, storageDestination, fileStoreStrategyFactory);
    },
    renameAttachment(fileObjId, newName) {
      check(fileObjId, String);
      check(newName, String);

      const fileObj = Attachments.findOne({_id: fileObjId});
      rename(fileObj, newName, fileStoreStrategyFactory);
    },
  });

  Meteor.startup(() => {
    Attachments.collection.createIndex({ 'meta.cardId': 1 });
    const storagePath = fileStoreStrategyFactory.storagePath;
    if (!fs.existsSync(storagePath)) {
      console.log("create storagePath because it doesn't exist: " + storagePath);
      fs.mkdirSync(storagePath, { recursive: true });
    }
  });
}

export default Attachments;
