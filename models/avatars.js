import { Meteor } from 'meteor/meteor';
import { FilesCollection } from 'meteor/ostrio:files';
import { createBucket } from './lib/grid/createBucket';
import fs from 'fs';
import path from 'path';
import FileStoreStrategyFactory, { FileStoreStrategyFilesystem, FileStoreStrategyGridFs} from '/models/lib/fileStoreStrategy';

let avatarsBucket;
if (Meteor.isServer) {
  avatarsBucket = createBucket('avatars');
}

const fileStoreStrategyFactory = new FileStoreStrategyFactory(FileStoreStrategyFilesystem, FileStoreStrategyGridFs, avatarsBucket);

Avatars = new FilesCollection({
  debug: false, // Change to `true` for debugging
  collectionName: 'avatars',
  allowClientCode: true,
  storagePath() {
    if (process.env.WRITABLE_PATH) {
      return path.join(process.env.WRITABLE_PATH, 'uploads', 'avatars');
    }
    return path.normalize(`assets/app/uploads/${this.collectionName}`);;
  },
  onBeforeUpload(file) {
    if (file.size <= 72000 && file.type.startsWith('image/')) {
      return true;
    }
    return 'avatar-too-big';
  },
  onAfterUpload(fileObj) {
    Object.keys(fileObj.versions).forEach(versionName => {
      fileStoreStrategyFactory.getFileStrategy(this, fileObj, versionName).onAfterUpload();
    });
  },
  interceptDownload(http, fileObj, versionName) {
    const ret = fileStoreStrategyFactory.getFileStrategy(this, fileObj, versionName).interceptDownload(http);
    return ret;
  },
  onAfterRemove(files) {
    files.forEach(fileObj => {
      Object.keys(fileObj.versions).forEach(versionName => {
        fileStoreStrategyFactory.getFileStrategy(this, fileObj, versionName).onAfterRemove();
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
    const storagePath = Avatars.storagePath();
    if (!fs.existsSync(storagePath)) {
      console.log("create storagePath because it doesn't exist: " + storagePath);
      fs.mkdirSync(storagePath, { recursive: true });
    }
  });
}

export default Avatars;
