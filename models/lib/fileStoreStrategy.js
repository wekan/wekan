import fs from 'fs';
import { createObjectId } from './grid/createObjectId';
import { createInterceptDownload } from './fsHooks/createInterceptDownload';

/** Factory for FileStoreStrategy */
export default class FileStoreStrategyFactory {

  /** constructor
   * @param classFileStoreStrategyFilesystem use this strategy for filesystem storage
   * @param classFileStoreStrategyGridFs use this strategy for GridFS storage
   * @param gridFsBucket use this GridFS Bucket as GridFS Storage
   */
  constructor(classFileStoreStrategyFilesystem, classFileStoreStrategyGridFs, gridFsBucket) {
    this.classFileStoreStrategyFilesystem = classFileStoreStrategyFilesystem;
    this.classFileStoreStrategyGridFs = classFileStoreStrategyGridFs;
    this.gridFsBucket = gridFsBucket;
  }

  /** returns the right FileStoreStrategy
   * @param filesCollection the current FilesCollection instance
   * @param fileObj the current file object
   * @param versionName the current version
   * @param use this storage, or if not set, get the storage from fileObj
   */
  getFileStrategy(filesCollection, fileObj, versionName, storage) {
    if (!storage) {
      storage = fileObj.versions[versionName].storage;
      if (!storage) {
        if (fileObj.meta.source == "import") {
          // uploaded by import, so it's in GridFS (MongoDB)
          storage = "gridfs";
        } else {
          // newly uploaded, so it's at the filesystem
          storage = "fs";
        }
      }
    }
    let ret;
    if (["fs", "gridfs"].includes(storage)) {
      if (storage == "fs") {
        ret = new this.classFileStoreStrategyFilesystem(filesCollection, fileObj, versionName);
      } else if (storage == "gridfs") {
        ret = new this.classFileStoreStrategyGridFs(this.gridFsBucket, filesCollection, fileObj, versionName);
      }
    }
    return ret;
  }
}

/** Strategy to store files */
class FileStoreStrategy {

  /** constructor
   * @param filesCollection the current FilesCollection instance
   * @param fileObj the current file object
   * @param versionName the current version
   */
  constructor(filesCollection, fileObj, versionName) {
    this.filesCollection = filesCollection;
    this.fileObj = fileObj;
    this.versionName = versionName;
  }

  /** after successfull upload */
  onAfterUpload() {
  }

  /** download the file
   * @param http the current http request
   */
  interceptDownload(http) {
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
   * @return the write stream
   */
  getWriteStream() {
  }

  /** writing finished
   * @param finishedData the data of the write stream finish event
   */
  writeStreamFinished(finishedData) {
  }

  /** remove the file */
  unlink() {
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
   * @param filesCollection the current FilesCollection instance
   * @param fileObj the current file object
   * @param versionName the current version
   */
  constructor(gridFsBucket, filesCollection, fileObj, versionName) {
    super(filesCollection, fileObj, versionName);
    this.gridFsBucket = gridFsBucket;
  }

  /** download the file
   * @param http the current http request
   */
  interceptDownload(http) {
    const ret = createInterceptDownload(this.filesCollection, this.gridFsBucket, this.fileObj, http, this.versionName);
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
   * @return the write stream
   */
  getWriteStream() {
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
    return "gridfs";
  }

  /** returns the GridFS Object-Id
   * @return the GridFS Object-Id
   */
  getGridFsObjectId() {
    const gridFsFileId = (this.fileObj.versions[this.versionName].meta || {})
      .gridFsFileId;
    let ret;
    if (gridFsFileId) {
      ret = createObjectId({ gridFsFileId });
    }
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
   * @param filesCollection the current FilesCollection instance
   * @param fileObj the current file object
   * @param versionName the current version
   */
  constructor(filesCollection, fileObj, versionName) {
    super(filesCollection, fileObj, versionName);
  }

  /** returns a read stream
   * @return the read stream
   */
  getReadStream() {
    const ret = fs.createReadStream(this.fileObj.versions[this.versionName].path)
    return ret;
  }

  /** returns a write stream
   * @return the write stream
   */
  getWriteStream() {
    const filePath = this.fileObj.versions[this.versionName].path;
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

  /** return the storage name
   * @return the storage name
   */
  getStorageName() {
    return "fs";
  }
}

/** move the fileObj to another storage
 * @param fileObj move this fileObj to another storage
 * @param storageDestination the storage destination (fs or gridfs)
 * @param fileStoreStrategyFactory get FileStoreStrategy from this factory
 */
export const moveToStorage = function(fileObj, storageDestination, fileStoreStrategyFactory) {
  Object.keys(fileObj.versions).forEach(versionName => {
    const strategyRead = fileStoreStrategyFactory.getFileStrategy(this, fileObj, versionName);
    const strategyWrite = fileStoreStrategyFactory.getFileStrategy(this, fileObj, versionName, storageDestination);

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
};
