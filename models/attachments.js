import { Meteor } from 'meteor/meteor';
import { FilesCollection } from 'meteor/ostrio:files';
import fs from 'fs';
import path from 'path';
import AttachmentStoreStrategy from '/models/lib/attachmentStoreStrategy';

// XXX Enforce a schema for the Attachments FilesCollection
// see: https://github.com/VeliovGroup/Meteor-Files/wiki/Schema

Attachments = new FilesCollection({
  debug: false, // Change to `true` for debugging
  collectionName: 'attachments',
  allowClientCode: true,
  namingFunction(opts) {
    const filenameWithoutExtension = opts.name.replace(/(.+)\..+/, "$1");
    const ret = opts.meta.fileId + "-" + filenameWithoutExtension;
    // remove fileId from meta, it was only stored there to have this information here in the namingFunction function
    delete opts.meta.fileId;
    return ret;
  },
  storagePath() {
    if (process.env.WRITABLE_PATH) {
      return path.join(process.env.WRITABLE_PATH, 'uploads', 'attachments');
    }
    return path.normalize(`assets/app/uploads/${this.collectionName}`);
  },
  onAfterUpload(fileObj) {
    Object.keys(fileObj.versions).forEach(versionName => {
      AttachmentStoreStrategy.getFileStrategy(this, fileObj, versionName).onAfterUpload();
    })
  },
  interceptDownload(http, fileObj, versionName) {
    const ret = AttachmentStoreStrategy.getFileStrategy(this, fileObj, versionName).interceptDownload(http);
    return ret;
  },
  onAfterRemove(files) {
    files.forEach(fileObj => {
      Object.keys(fileObj.versions).forEach(versionName => {
        AttachmentStoreStrategy.getFileStrategy(this, fileObj, versionName).onAfterRemove();
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
    moveToStorage(fileObjId, storageDestination) {
      check(fileObjId, String);
      check(storageDestination, String);

      const fileObj = Attachments.findOne({_id: fileObjId});

      Object.keys(fileObj.versions).forEach(versionName => {
        const strategyRead = AttachmentStoreStrategy.getFileStrategy(this, fileObj, versionName);
        const strategyWrite = AttachmentStoreStrategy.getFileStrategy(this, fileObj, versionName, storageDestination);

        if (strategyRead.constructor.name != strategyWrite.constructor.name) {
          const readStream = strategyRead.getReadStream();
          const writeStream = strategyWrite.getWriteStream();

          writeStream.on('error', error => {
            console.error('[writeStream error]: ', error, fileObjId);
          });

          readStream.on('error', error => {
            console.error('[readStream error]: ', error, fileObjId);
          });

          writeStream.on('finish', Meteor.bindEnvironment((finishedData) => {
            strategyWrite.writeStreamFinished(finishedData);
          }));

          // https://forums.meteor.com/t/meteor-code-must-always-run-within-a-fiber-try-wrapping-callbacks-that-you-pass-to-non-meteor-libraries-with-meteor-bindenvironmen/40099/8
          readStream.on('end', Meteor.bindEnvironment(() => {
            Attachments.update({ _id: fileObj._id }, { $set: { [`versions.${versionName}.storage`]: strategyWrite.getStorageName() } });
            strategyRead.unlink();
          }));

          readStream.pipe(writeStream);
        }
      });
    },
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
