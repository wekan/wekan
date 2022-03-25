import fs from 'fs';
import { createBucket } from './grid/createBucket';
import { createObjectId } from './grid/createObjectId';
import { createOnAfterUpload } from './fsHooks/createOnAfterUpload';
import { createInterceptDownload } from './fsHooks/createInterceptDownload';
import { createOnAfterRemove } from './fsHooks/createOnAfterRemove';

const insertActivity = (fileObj, activityType) =>
  Activities.insert({
    userId: fileObj.userId,
    type: 'card',
    activityType,
    attachmentId: fileObj._id,
    attachmentName: fileObj.name,
    boardId: fileObj.meta.boardId,
    cardId: fileObj.meta.cardId,
    listId: fileObj.meta.listId,
    swimlaneId: fileObj.meta.swimlaneId,
  });

let attachmentBucket;
if (Meteor.isServer) {
  attachmentBucket = createBucket('attachments');
}

/** Strategy to store attachments */
class AttachmentStoreStrategy {

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
    // If the attachment doesn't have a source field or its source is different than import
    if (!this.fileObj.meta.source || this.fileObj.meta.source !== 'import') {
      // Add activity about adding the attachment
      insertActivity(this.fileObj, 'addAttachment');
    }
  }

  /** download the file
   * @param http the current http request
   */
  interceptDownload(http) {
  }

  /** after file remove */
  onAfterRemove() {
    insertActivity(this.fileObj, 'deleteAttachment');
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

  static getFileStrategy(filesCollection, fileObj, versionName, storage) {
    if (!storage) {
      storage = fileObj.versions[versionName].storage || "gridfs";
    }
    let ret;
    if (["fs", "gridfs"].includes(storage)) {
      if (storage == "fs") {
        ret = new AttachmentStoreStrategyFilesystem(filesCollection, fileObj, versionName);
      } else if (storage == "gridfs") {
        ret = new AttachmentStoreStrategyGridFs(filesCollection, fileObj, versionName);
      }
    }
    console.log("getFileStrategy: ", ret.constructor.name);
    return ret;
  }
}

/** Strategy to store attachments at GridFS (MongoDB) */
class AttachmentStoreStrategyGridFs extends AttachmentStoreStrategy {

  /** constructor
   * @param filesCollection the current FilesCollection instance
   * @param fileObj the current file object
   * @param versionName the current version
   */
  constructor(filesCollection, fileObj, versionName) {
    super(filesCollection, fileObj, versionName);
  }

  /** after successfull upload */
  onAfterUpload() {
    createOnAfterUpload(this.filesCollection, attachmentBucket, this.fileObj, this.versionName);
    super.onAfterUpload();
  }

  /** download the file
   * @param http the current http request
   */
  interceptDownload(http) {
    const ret = createInterceptDownload(this.filesCollection, attachmentBucket, this.fileObj, http, this.versionName);
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
    const gridFsFileId = (this.fileObj.versions[this.versionName].meta || {})
      .gridFsFileId;
    let ret;
    if (gridFsFileId) {
      const gfsId = createObjectId({ gridFsFileId });
      ret = attachmentBucket.openDownloadStream(gfsId);
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
    const ret = attachmentBucket.openUploadStream(this.fileObj.name, {
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
    createOnAfterRemove(this.filesCollection, attachmentBucket, this.fileObj, this.versionName);
    const gridFsFileIdName = this.getGridFsFileIdName();
    Attachments.update({ _id: this.fileObj._id }, { $unset: { [gridFsFileIdName]: 1 } });
  }

  /** return the storage name
   * @return the storage name
   */
  getStorageName() {
    return "gridfs";
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
class AttachmentStoreStrategyFilesystem extends AttachmentStoreStrategy {

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
    const newFileName = this.fileObj.name;
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

export default AttachmentStoreStrategy;
