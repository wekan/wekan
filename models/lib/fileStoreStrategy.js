import fs from 'fs';
import path from 'path';
import { createObjectId } from './grid/createObjectId';
import { httpStreamOutput } from './httpStream.js'

export const STORAGE_NAME_FILESYSTEM = "fs";
export const STORAGE_NAME_GRIDFS     = "gridfs";

/** Factory for FileStoreStrategy */
export default class FileStoreStrategyFactory {

  /** constructor
   * @param classFileStoreStrategyFilesystem use this strategy for filesystem storage
   * @param storagePath file storage path
   * @param classFileStoreStrategyGridFs use this strategy for GridFS storage
   * @param gridFsBucket use this GridFS Bucket as GridFS Storage
   */
  constructor(classFileStoreStrategyFilesystem, storagePath, classFileStoreStrategyGridFs, gridFsBucket) {
    this.classFileStoreStrategyFilesystem = classFileStoreStrategyFilesystem;
    this.storagePath = storagePath;
    this.classFileStoreStrategyGridFs = classFileStoreStrategyGridFs;
    this.gridFsBucket = gridFsBucket;
  }

  /** returns the right FileStoreStrategy
   * @param fileObj the current file object
   * @param versionName the current version
   * @param use this storage, or if not set, get the storage from fileObj
   */
  getFileStrategy(fileObj, versionName, storage) {
    if (!storage) {
      storage = fileObj.versions[versionName].storage;
      if (!storage) {
        if (fileObj.meta.source == "import" || fileObj.versions[versionName].meta.gridFsFileId) {
          // uploaded by import, so it's in GridFS (MongoDB)
          storage = STORAGE_NAME_GRIDFS;
        } else {
          // newly uploaded, so it's at the filesystem
          storage = STORAGE_NAME_FILESYSTEM;
        }
      }
    }
    let ret;
    if ([STORAGE_NAME_FILESYSTEM, STORAGE_NAME_GRIDFS].includes(storage)) {
      if (storage == STORAGE_NAME_FILESYSTEM) {
        ret = new this.classFileStoreStrategyFilesystem(fileObj, versionName);
      } else if (storage == STORAGE_NAME_GRIDFS) {
        ret = new this.classFileStoreStrategyGridFs(this.gridFsBucket, fileObj, versionName);
      }
    }
    return ret;
  }
}

/** Strategy to store files */
class FileStoreStrategy {

  /** constructor
   * @param fileObj the current file object
   * @param versionName the current version
   */
  constructor(fileObj, versionName) {
    this.fileObj = fileObj;
    this.versionName = versionName;
  }

  /** after successfull upload */
  onAfterUpload() {
  }

  /** download the file
   * @param http the current http request
   * @param cacheControl cacheControl of FilesCollection
   */
  interceptDownload(http, cacheControl) {
  }

  /** after file remove */
  onAfterRemove() {
  }

  /** returns a read stream
   * @return the read stream
   */
  getReadStream() {
  }

  /** returns a write stream
   * @param filePath if set, use this path
   * @return the write stream
   */
  getWriteStream(filePath) {
  }

  /** writing finished
   * @param finishedData the data of the write stream finish event
   */
  writeStreamFinished(finishedData) {
  }

  /** returns the new file path
   * @param storagePath use this storage path
   * @return the new file path
   */
  getNewPath(storagePath, name) {
    if (!_.isString(name)) {
      name = this.fileObj.name;
    }
    const ret = path.join(storagePath, this.fileObj._id + "-" + this.versionName + "-" + name);
    return ret;
  }

  /** remove the file */
  unlink() {
  }

  /** rename the file (physical)
   * @li at database the filename is updated after this method
   * @param newFilePath the new file path
   */
  rename(newFilePath) {
  }

  /** return the storage name
   * @return the storage name
   */
  getStorageName() {
  }
}

/** Strategy to store attachments at GridFS (MongoDB) */
export class FileStoreStrategyGridFs extends FileStoreStrategy {

  /** constructor
   * @param gridFsBucket use this GridFS Bucket
   * @param fileObj the current file object
   * @param versionName the current version
   */
  constructor(gridFsBucket, fileObj, versionName) {
    super(fileObj, versionName);
    this.gridFsBucket = gridFsBucket;
  }

  /** download the file
   * @param http the current http request
   * @param cacheControl cacheControl of FilesCollection
   */
  interceptDownload(http, cacheControl) {
    const readStream = this.getReadStream();
    const downloadFlag = http?.params?.query?.download;

    let ret = false;
    if (readStream) {
      ret = true;
      httpStreamOutput(readStream, this.fileObj.name, http, downloadFlag, cacheControl);
    }

    return ret;
  }

  /** after file remove */
  onAfterRemove() {
    this.unlink();
    super.onAfterRemove();
  }

  /** returns a read stream
   * @return the read stream
   */
  getReadStream() {
    const gfsId = this.getGridFsObjectId();
    let ret;
    if (gfsId) {
      ret = this.gridFsBucket.openDownloadStream(gfsId);
    }
    return ret;
  }

  /** returns a write stream
   * @param filePath if set, use this path
   * @return the write stream
   */
  getWriteStream(filePath) {
    const fileObj = this.fileObj;
    const versionName = this.versionName;
    const metadata = { ...fileObj.meta, versionName, fileId: fileObj._id };
    const ret = this.gridFsBucket.openUploadStream(this.fileObj.name, {
      contentType: fileObj.type || 'binary/octet-stream',
      metadata,
    });
    return ret;
  }

  /** writing finished
   * @param finishedData the data of the write stream finish event
   */
  writeStreamFinished(finishedData) {
    const gridFsFileIdName = this.getGridFsFileIdName();
    Attachments.update({ _id: this.fileObj._id }, { $set: { [gridFsFileIdName]: finishedData._id.toHexString(), } });
  }

  /** remove the file */
  unlink() {
    const gfsId = this.getGridFsObjectId();
    if (gfsId) {
      this.gridFsBucket.delete(gfsId, err => {
        if (err) {
          console.error("error on gfs bucket.delete: ", err);
        }
      });
    }

    const gridFsFileIdName = this.getGridFsFileIdName();
    Attachments.update({ _id: this.fileObj._id }, { $unset: { [gridFsFileIdName]: 1 } });
  }

  /** return the storage name
   * @return the storage name
   */
  getStorageName() {
    return STORAGE_NAME_GRIDFS;
  }

  /** returns the GridFS Object-Id
   * @return the GridFS Object-Id
   */
  getGridFsObjectId() {
    let ret;
    const gridFsFileId = this.getGridFsFileId();
    if (gridFsFileId) {
      ret = createObjectId({ gridFsFileId });
    }
    return ret;
  }

  /** returns the GridFS Object-Id
   * @return the GridFS Object-Id
   */
  getGridFsFileId() {
    const ret = (this.fileObj.versions[this.versionName].meta || {})
      .gridFsFileId;
    return ret;
  }

  /** returns the property name of gridFsFileId
   * @return the property name of gridFsFileId
   */
  getGridFsFileIdName() {
    const ret = `versions.${this.versionName}.meta.gridFsFileId`;
    return ret;
  }
}

/** Strategy to store attachments at filesystem */
export class FileStoreStrategyFilesystem extends FileStoreStrategy {

  /** constructor
   * @param fileObj the current file object
   * @param versionName the current version
   */
  constructor(fileObj, versionName) {
    super(fileObj, versionName);
  }

  /** returns a read stream
   * @return the read stream
   */
  getReadStream() {
    const ret = fs.createReadStream(this.fileObj.versions[this.versionName].path)
    return ret;
  }

  /** returns a write stream
   * @param filePath if set, use this path
   * @return the write stream
   */
  getWriteStream(filePath) {
    if (!_.isString(filePath)) {
      filePath = this.fileObj.versions[this.versionName].path;
    }
    const ret = fs.createWriteStream(filePath);
    return ret;
  }

  /** writing finished
   * @param finishedData the data of the write stream finish event
   */
  writeStreamFinished(finishedData) {
  }

  /** remove the file */
  unlink() {
    const filePath = this.fileObj.versions[this.versionName].path;
    fs.unlink(filePath, () => {});
  }

  /** rename the file (physical)
   * @li at database the filename is updated after this method
   * @param newFilePath the new file path
   */
  rename(newFilePath) {
    fs.renameSync(this.fileObj.versions[this.versionName].path, newFilePath);
  }

  /** return the storage name
   * @return the storage name
   */
  getStorageName() {
    return STORAGE_NAME_FILESYSTEM;
  }
}

/** move the fileObj to another storage
 * @param fileObj move this fileObj to another storage
 * @param storageDestination the storage destination (fs or gridfs)
 * @param fileStoreStrategyFactory get FileStoreStrategy from this factory
 */
export const moveToStorage = function(fileObj, storageDestination, fileStoreStrategyFactory) {
  Object.keys(fileObj.versions).forEach(versionName => {
    const strategyRead = fileStoreStrategyFactory.getFileStrategy(fileObj, versionName);
    const strategyWrite = fileStoreStrategyFactory.getFileStrategy(fileObj, versionName, storageDestination);

    if (strategyRead.constructor.name != strategyWrite.constructor.name) {
      const readStream = strategyRead.getReadStream();

      const filePath = strategyWrite.getNewPath(fileStoreStrategyFactory.storagePath);
      const writeStream = strategyWrite.getWriteStream(filePath);

      writeStream.on('error', error => {
        console.error('[writeStream error]: ', error, fileObj._id);
      });

      readStream.on('error', error => {
        console.error('[readStream error]: ', error, fileObj._id);
      });

      writeStream.on('finish', Meteor.bindEnvironment((finishedData) => {
        strategyWrite.writeStreamFinished(finishedData);
      }));

      // https://forums.meteor.com/t/meteor-code-must-always-run-within-a-fiber-try-wrapping-callbacks-that-you-pass-to-non-meteor-libraries-with-meteor-bindenvironmen/40099/8
      readStream.on('end', Meteor.bindEnvironment(() => {
        Attachments.update({ _id: fileObj._id }, { $set: {
          [`versions.${versionName}.storage`]: strategyWrite.getStorageName(),
          [`versions.${versionName}.path`]: filePath,
        } });
        strategyRead.unlink();
      }));

      readStream.pipe(writeStream);
    }
  });
};

export const copyFile = function(fileObj, newCardId, fileStoreStrategyFactory) {
  const versionName = "original";
  const strategyRead = fileStoreStrategyFactory.getFileStrategy(fileObj, versionName);
  const readStream = strategyRead.getReadStream();
  const strategyWrite = fileStoreStrategyFactory.getFileStrategy(fileObj, versionName, STORAGE_NAME_FILESYSTEM);

  const tempPath = path.join(fileStoreStrategyFactory.storagePath, Random.id() + "-" + versionName + "-" + fileObj.name);
  const writeStream = strategyWrite.getWriteStream(tempPath);

  writeStream.on('error', error => {
    console.error('[writeStream error]: ', error, fileObj._id);
  });

  readStream.on('error', error => {
    console.error('[readStream error]: ', error, fileObj._id);
  });

  // https://forums.meteor.com/t/meteor-code-must-always-run-within-a-fiber-try-wrapping-callbacks-that-you-pass-to-non-meteor-libraries-with-meteor-bindenvironmen/40099/8
  readStream.on('end', Meteor.bindEnvironment(() => {
    const fileId = Random.id();
    Attachments.addFile(
      tempPath,
      {
        fileName: fileObj.name,
        type: fileObj.type,
        meta: {
          boardId: fileObj.meta.boardId,
          cardId: newCardId,
          listId: fileObj.meta.listId,
          swimlaneId: fileObj.meta.swimlaneId,
          source: 'copy',
          copyFrom: fileObj._id,
          copyStorage: strategyRead.getStorageName(),
        },
        userId: fileObj.userId,
        size: fileObj.fileSize,
        fileId,
      },
      (err, fileRef) => {
        if (err) {
          console.log(err);
        } else {
          // Set the userId again
          Attachments.update({ _id: fileRef._id }, { $set: { userId: fileObj.userId } });
        }
      },
      true,
    );
  }));

  readStream.pipe(writeStream);
};

export const rename = function(fileObj, newName, fileStoreStrategyFactory) {
  Object.keys(fileObj.versions).forEach(versionName => {
    const strategy = fileStoreStrategyFactory.getFileStrategy(fileObj, versionName);
    const newFilePath = strategy.getNewPath(fileStoreStrategyFactory.storagePath, newName);
    strategy.rename(newFilePath);

    Attachments.update({ _id: fileObj._id }, { $set: {
      "name": newName,
      [`versions.${versionName}.path`]: newFilePath,
    } });
  });
};
