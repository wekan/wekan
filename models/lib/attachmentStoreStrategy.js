import { Meteor } from 'meteor/meteor';
import Activities from '/models/activities';
import { deleteActivityUserId } from '/server/lib/attachmentActivityActor';
import FileStoreStrategy, {FileStoreStrategyFilesystem, FileStoreStrategyGridFs, FileStoreStrategyCloud} from './fileStoreStrategy'

// Resolve the user currently performing the action, if any. Returns null when
// there is no DDP user context (e.g. server/system removal).
const currentActingUserId = () => {
  try {
    return Meteor.userId() || null;
  } catch (error) {
    // Meteor.userId() throws outside of a method/publication context.
    return null;
  }
};

// Bug #5504: for 'deleteAttachment' the activity must credit the user who
// performed the removal (the acting user), not the uploader. The acting user
// is taken from Meteor.userId() (set during the DDP remove call on the server),
// falling back to the uploader when there is no acting user (server/system
// removal). The 'addAttachment'/upload activity keeps the uploader unchanged.
const insertActivity = (fileObj, activityType, actingUserId) =>
  Activities.insertAsync({
    userId: activityType === 'deleteAttachment'
      ? deleteActivityUserId(actingUserId, fileObj.userId)
      : fileObj.userId,
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
    insertActivity(this.fileObj, 'deleteAttachment', currentActingUserId());
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
    insertActivity(this.fileObj, 'deleteAttachment', currentActingUserId());
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
    insertActivity(this.fileObj, 'deleteAttachment', currentActingUserId());
  }
}
