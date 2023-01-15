import { ReactiveCache } from '/imports/reactiveCache';
import { Meteor } from 'meteor/meteor';
import { FilesCollection } from 'meteor/ostrio:files';
import { formatFleURL } from 'meteor/ostrio:files/lib';
import { isFileValid } from './fileValidation';
import { createBucket } from './lib/grid/createBucket';
import { TAPi18n } from '/imports/i18n';
import fs from 'fs';
import path from 'path';
import FileStoreStrategyFactory, { FileStoreStrategyFilesystem, FileStoreStrategyGridFs, STORAGE_NAME_FILESYSTEM } from '/models/lib/fileStoreStrategy';

const filesize = require('filesize');

let avatarsUploadExternalProgram;
let avatarsUploadMimeTypes = [];
let avatarsUploadSize = 72000;
let avatarsBucket;
let storagePath;

if (Meteor.isServer) {
  if (process.env.AVATARS_UPLOAD_MIME_TYPES) {
    avatarsUploadMimeTypes = process.env.AVATARS_UPLOAD_MIME_TYPES.split(',');
    avatarsUploadMimeTypes = avatarsUploadMimeTypes.map(value => value.trim());
  }

  if (process.env.AVATARS_UPLOAD_MAX_SIZE) {
    avatarsUploadSize_ = parseInt(process.env.AVATARS_UPLOAD_MAX_SIZE);

    if (_.isNumber(avatarsUploadSize_) && avatarsUploadSize_ > 0) {
      avatarsUploadSize = avatarsUploadSize_;
    }
  }

  if (process.env.AVATARS_UPLOAD_EXTERNAL_PROGRAM) {
    avatarsUploadExternalProgram = process.env.AVATARS_UPLOAD_EXTERNAL_PROGRAM;

    if (!avatarsUploadExternalProgram.includes("{file}")) {
      avatarsUploadExternalProgram = undefined;
    }
  }

  avatarsBucket = createBucket('avatars');
  storagePath = path.join(process.env.WRITABLE_PATH, 'avatars');
}

const fileStoreStrategyFactory = new FileStoreStrategyFactory(FileStoreStrategyFilesystem, storagePath, FileStoreStrategyGridFs, avatarsBucket);

Avatars = new FilesCollection({
  debug: false, // Change to `true` for debugging
  collectionName: 'avatars',
  allowClientCode: true,
  namingFunction(opts) {
    let filenameWithoutExtension = ""
    let fileId = "";
    if (opts?.name) {
      // Client
      filenameWithoutExtension = opts.name.replace(/(.+)\..+/, "$1");
      fileId = opts.meta.fileId;
      delete opts.meta.fileId;
    } else if (opts?.file?.name) {
      // Server
      if (opts.file.extension) {
        filenameWithoutExtension = opts.file.name.replace(new RegExp(opts.file.extensionWithDot + "$"), "")
      } else {
        // file has no extension, so don't replace anything, otherwise the last character is removed (because extensionWithDot = '.')
        filenameWithoutExtension = opts.file.name;
      }
      fileId = opts.fileId;
    }
    else {
      // should never reach here
      filenameWithoutExtension = Math.random().toString(36).slice(2);
      fileId = Math.random().toString(36).slice(2);
    }
    const ret = fileId + "-original-" + filenameWithoutExtension;
    // remove fileId from meta, it was only stored there to have this information here in the namingFunction function
    return ret;
  },
  sanitize(str, max, replacement) {
    // keep the original filename
    return str;
  },
  storagePath() {
    const ret = fileStoreStrategyFactory.storagePath;
    return ret;
  },
  onBeforeUpload(file) {
    if (file.size <= avatarsUploadSize && file.type.startsWith('image/')) {
      return true;
    }
    return TAPi18n.__('avatar-too-big', {size: filesize(avatarsUploadSize)});
  },
  onAfterUpload(fileObj) {
    // current storage is the filesystem, update object and database
    Object.keys(fileObj.versions).forEach(versionName => {
      fileObj.versions[versionName].storage = STORAGE_NAME_FILESYSTEM;
    });

    Avatars.update({ _id: fileObj._id }, { $set: { "versions": fileObj.versions } });

    const isValid = Promise.await(isFileValid(fileObj, avatarsUploadMimeTypes, avatarsUploadSize, avatarsUploadExternalProgram));

    if (isValid) {
      ReactiveCache.getUser(fileObj.userId).setAvatarUrl(`${formatFleURL(fileObj)}?auth=false&brokenIsFine=true`);
    } else {
      Avatars.remove(fileObj._id);
    }
  },
  interceptDownload(http, fileObj, versionName) {
    const ret = fileStoreStrategyFactory.getFileStrategy(fileObj, versionName).interceptDownload(http, this.cacheControl);
    return ret;
  },
  onBeforeRemove(files) {
    files.forEach(fileObj => {
      if (fileObj.userId) {
        ReactiveCache.getUser(fileObj.userId).setAvatarUrl('');
      }
    });

    return true;
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
