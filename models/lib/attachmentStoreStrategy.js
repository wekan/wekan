import fs from 'fs';
import FileStoreStrategy, {FileStoreStrategyFilesystem, FileStoreStrategyGridFs, FileStoreStrategyS3} from './fileStoreStrategy'

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

/** Strategy to store attachments at GridFS (MongoDB) */
export class AttachmentStoreStrategyGridFs extends FileStoreStrategyGridFs {

  /** constructor
   * @param gridFsBucket use this GridFS Bucket
   * @param fileObj the current file object
   * @param versionName the current version
   */
  constructor(gridFsBucket, fileObj, versionName) {
    super(gridFsBucket, fileObj, versionName);
  }

  /** after successfull upload */
  onAfterUpload() {
    super.onAfterUpload();
    // If the attachment doesn't have a source field or its source is different than import
    if (!this.fileObj.meta.source || this.fileObj.meta.source !== 'import') {
      // Add activity about adding the attachment
      insertActivity(this.fileObj, 'addAttachment');
    }
  }

  /** after file remove */
  onAfterRemove() {
    super.onAfterRemove();
    insertActivity(this.fileObj, 'deleteAttachment');
  }
}

/** Strategy to store attachments at filesystem */
export class AttachmentStoreStrategyFilesystem extends FileStoreStrategyFilesystem {

  /** constructor
   * @param fileObj the current file object
   * @param versionName the current version
   */
  constructor(fileObj, versionName) {
    super(fileObj, versionName);
  }

  /** after successfull upload */
  onAfterUpload() {
    super.onAfterUpload();
    // If the attachment doesn't have a source field or its source is different than import
    if (!this.fileObj.meta.source || this.fileObj.meta.source !== 'import') {
      // Add activity about adding the attachment
      insertActivity(this.fileObj, 'addAttachment');
    }
  }

  /** after file remove */
  onAfterRemove() {
    super.onAfterRemove();
    insertActivity(this.fileObj, 'deleteAttachment');
  }
}

/** Strategy to store attachments at filesystem */
export class AttachmentStoreStrategyS3 extends FileStoreStrategyS3 {

  /** constructor
   * @param s3Bucket use this S3 Bucket
   * @param fileObj the current file object
   * @param versionName the current version
   */
  constructor(s3Bucket, fileObj, versionName) {
    super(s3Bucket, fileObj, versionName);
  }

  /** after successfull upload */
  onAfterUpload() {
    super.onAfterUpload();
    // If the attachment doesn't have a source field or its source is different than import
    if (!this.fileObj.meta.source || this.fileObj.meta.source !== 'import') {
      // Add activity about adding the attachment
      insertActivity(this.fileObj, 'addAttachment');
    }
  }

  /** after file remove */
  onAfterRemove() {
    super.onAfterRemove();
    insertActivity(this.fileObj, 'deleteAttachment');
  }
}
