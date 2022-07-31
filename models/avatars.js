import { Meteor } from 'meteor/meteor';
import { FilesCollection } from 'meteor/ostrio:files';
import { createBucket } from './lib/grid/createBucket';
import fs from 'fs';
import path from 'path';
import FileStoreStrategyFactory, { FileStoreStrategyFilesystem, FileStoreStrategyGridFs} from '/models/lib/fileStoreStrategy';

let avatarsBucket;
let storagePath;
if (Meteor.isServer) {
  avatarsBucket = createBucket('avatars');
  storagePath = path.join(process.env.WRITABLE_PATH, 'avatars');
}

const fileStoreStrategyFactory = new FileStoreStrategyFactory(FileStoreStrategyFilesystem, storagePath, FileStoreStrategyGridFs, avatarsBucket);

Avatars = new FilesCollection({
  debug: false, // Change to `true` for debugging
  collectionName: 'avatars',
  allowClientCode: true,
  storagePath() {
    const ret = fileStoreStrategyFactory.storagePath;
    return ret;
  },
  onBeforeUpload(file) {
    if (file.size <= 72000 && file.type.startsWith('image/')) {
      return true;
    }
    return 'avatar-too-big';
  },
  onAfterUpload(fileObj) {
    // current storage is the filesystem, update object and database
    Object.keys(fileObj.versions).forEach(versionName => {
      fileObj.versions[versionName].storage = "fs";
    });
    Avatars.update({ _id: fileObj._id }, { $set: { "versions" : fileObj.versions } });
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
});

function isOwner(userId, doc) {
  return userId && userId === doc.userId;
}

if (Meteor.isServer) {
  Avatars.allow({
    insert: isOwner,
    update: isOwner,
    remove: isOwner,
    fetch: ['userId'],
  });

  Meteor.startup(() => {
    const storagePath = fileStoreStrategyFactory.storagePath;
    if (!fs.existsSync(storagePath)) {
      console.log("create storagePath because it doesn't exist: " + storagePath);
      fs.mkdirSync(storagePath, { recursive: true });
    }
  });
}

export default Avatars;
