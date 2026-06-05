import Activities from '/models/activities';
import FileStoreStrategy, {FileStoreStrategyFilesystem, FileStoreStrategyGridFs, FileStoreStrategyCloud} from './fileStoreStrategy'

const insertActivity = (fileObj, activityType) =>
  Activities.insertAsync({
    userId: fileObj.userId,
    type: 'card',
    activityType,
    attachmentId: fileObj._id,
    attachmentName: fileObj.name,
    boardId: fileObj.meta.boardId,
    cardId: fileObj.meta.cardId,
    listId: fileObj.meta.listId,
    swimlaneId: fileObj.meta.swimlaneId,
  }).catch(error => {
    console.error('Failed to insert attachment activity:', error);
  });

/** Strategy to store attachments at GridFS (MongoDB) */
export class AttachmentStoreStrategyGridFs extends FileStoreStrategyGridFs {

  /** constructor
   * @param gridFsBucket use this GridFS Bucket
   * @param fileObj the current file object
   * @param versionName the current version
   */
  constructor(gridFsBucket, fileObj, versionName, collection) {
    super(gridFsBucket, fileObj, versionName, collection);
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
  constructor(fileObj, versionName, collection) {
    super(fileObj, versionName, collection);
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

/** Strategy to store attachments on a cloud backend (S3/Azure/GCS) */
export class AttachmentStoreStrategyCloud extends FileStoreStrategyCloud {

  /** constructor
   * @param provider cloud storage name ('s3' | 'azure' | 'gcs')
   * @param fileObj the current file object
   * @param versionName the current version
   */
  constructor(provider, fileObj, versionName, collection) {
    super(provider, fileObj, versionName, collection);
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
