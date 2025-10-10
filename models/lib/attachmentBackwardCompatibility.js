import { ReactiveCache } from '/imports/reactiveCache';
import { Meteor } from 'meteor/meteor';
import { MongoInternals } from 'meteor/mongo';

/**
 * Backward compatibility layer for CollectionFS to Meteor-Files migration
 * Handles reading attachments from old CollectionFS database structure
 */

// Old CollectionFS collections
const OldAttachmentsFiles = new Mongo.Collection('cfs_gridfs.attachments.files');
const OldAttachmentsFileRecord = new Mongo.Collection('cfs.attachments.filerecord');

/**
 * Check if an attachment exists in the new Meteor-Files structure
 * @param {string} attachmentId - The attachment ID to check
 * @returns {boolean} - True if exists in new structure
 */
export function isNewAttachmentStructure(attachmentId) {
  if (Meteor.isServer) {
    return !!ReactiveCache.getAttachment(attachmentId);
  }
  return false;
}

/**
 * Get attachment data from old CollectionFS structure
 * @param {string} attachmentId - The attachment ID
 * @returns {Object|null} - Attachment data in new format or null if not found
 */
export function getOldAttachmentData(attachmentId) {
  if (Meteor.isServer) {
    try {
      // First try to get from old filerecord collection
      const fileRecord = OldAttachmentsFileRecord.findOne({ _id: attachmentId });
      if (!fileRecord) {
        return null;
      }

      // Get file data from old files collection
      const fileData = OldAttachmentsFiles.findOne({ _id: attachmentId });
      if (!fileData) {
        return null;
      }

      // Convert old structure to new structure
      const convertedAttachment = {
        _id: attachmentId,
        name: fileRecord.original?.name || fileData.filename || 'Unknown',
        size: fileRecord.original?.size || fileData.length || 0,
        type: fileRecord.original?.type || fileData.contentType || 'application/octet-stream',
        extension: getFileExtension(fileRecord.original?.name || fileData.filename || ''),
        extensionWithDot: getFileExtensionWithDot(fileRecord.original?.name || fileData.filename || ''),
        meta: {
          boardId: fileRecord.boardId,
          swimlaneId: fileRecord.swimlaneId,
          listId: fileRecord.listId,
          cardId: fileRecord.cardId,
          userId: fileRecord.userId,
          source: 'legacy'
        },
        uploadedAt: fileRecord.uploadedAt || fileData.uploadDate || new Date(),
        updatedAt: fileRecord.original?.updatedAt || fileData.uploadDate || new Date(),
        // Legacy compatibility fields
        isImage: isImageFile(fileRecord.original?.type || fileData.contentType),
        isVideo: isVideoFile(fileRecord.original?.type || fileData.contentType),
        isAudio: isAudioFile(fileRecord.original?.type || fileData.contentType),
        isText: isTextFile(fileRecord.original?.type || fileData.contentType),
        isJSON: isJSONFile(fileRecord.original?.type || fileData.contentType),
        isPDF: isPDFFile(fileRecord.original?.type || fileData.contentType),
        // Legacy link method for compatibility
        link: function(version = 'original') {
          return `/cfs/files/attachments/${this._id}`;
        },
        // Legacy versions structure for compatibility
        versions: {
          original: {
            path: `/cfs/files/attachments/${this._id}`,
            size: this.size,
            type: this.type,
            storage: 'gridfs'
          }
        }
      };

      return convertedAttachment;
    } catch (error) {
      console.error('Error reading old attachment data:', error);
      return null;
    }
  }
  return null;
}

/**
 * Get file extension from filename
 * @param {string} filename - The filename
 * @returns {string} - File extension without dot
 */
function getFileExtension(filename) {
  if (!filename) return '';
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.substring(lastDot + 1).toLowerCase();
}

/**
 * Get file extension with dot
 * @param {string} filename - The filename
 * @returns {string} - File extension with dot
 */
function getFileExtensionWithDot(filename) {
  const ext = getFileExtension(filename);
  return ext ? `.${ext}` : '';
}

/**
 * Check if file is an image
 * @param {string} mimeType - MIME type
 * @returns {boolean} - True if image
 */
function isImageFile(mimeType) {
  return mimeType && mimeType.startsWith('image/');
}

/**
 * Check if file is a video
 * @param {string} mimeType - MIME type
 * @returns {boolean} - True if video
 */
function isVideoFile(mimeType) {
  return mimeType && mimeType.startsWith('video/');
}

/**
 * Check if file is audio
 * @param {string} mimeType - MIME type
 * @returns {boolean} - True if audio
 */
function isAudioFile(mimeType) {
  return mimeType && mimeType.startsWith('audio/');
}

/**
 * Check if file is text
 * @param {string} mimeType - MIME type
 * @returns {boolean} - True if text
 */
function isTextFile(mimeType) {
  return mimeType && mimeType.startsWith('text/');
}

/**
 * Check if file is JSON
 * @param {string} mimeType - MIME type
 * @returns {boolean} - True if JSON
 */
function isJSONFile(mimeType) {
  return mimeType === 'application/json';
}

/**
 * Check if file is PDF
 * @param {string} mimeType - MIME type
 * @returns {boolean} - True if PDF
 */
function isPDFFile(mimeType) {
  return mimeType === 'application/pdf';
}

/**
 * Get attachment with backward compatibility
 * @param {string} attachmentId - The attachment ID
 * @returns {Object|null} - Attachment data or null if not found
 */
export function getAttachmentWithBackwardCompatibility(attachmentId) {
  // First try new structure
  if (isNewAttachmentStructure(attachmentId)) {
    return ReactiveCache.getAttachment(attachmentId);
  }

  // Fall back to old structure
  return getOldAttachmentData(attachmentId);
}

/**
 * Get attachments for a card with backward compatibility
 * @param {Object} query - Query object
 * @returns {Array} - Array of attachments
 */
export function getAttachmentsWithBackwardCompatibility(query) {
  const newAttachments = ReactiveCache.getAttachments(query);
  const oldAttachments = [];

  if (Meteor.isServer) {
    try {
      // Query old structure for the same card
      const cardId = query['meta.cardId'];
      if (cardId) {
        const oldFileRecords = OldAttachmentsFileRecord.find({ cardId }).fetch();
        for (const fileRecord of oldFileRecords) {
          const oldAttachment = getOldAttachmentData(fileRecord._id);
          if (oldAttachment) {
            oldAttachments.push(oldAttachment);
          }
        }
      }
    } catch (error) {
      console.error('Error reading old attachments:', error);
    }
  }

  // Combine and deduplicate
  const allAttachments = [...newAttachments, ...oldAttachments];
  const uniqueAttachments = allAttachments.filter((attachment, index, self) =>
    index === self.findIndex(a => a._id === attachment._id)
  );

  return uniqueAttachments;
}

/**
 * Get file stream from old GridFS structure
 * @param {string} attachmentId - The attachment ID
 * @returns {Object|null} - GridFS file stream or null if not found
 */
export function getOldAttachmentStream(attachmentId) {
  if (Meteor.isServer) {
    try {
      const db = MongoInternals.defaultRemoteCollectionDriver().mongo.db;
      const bucket = new MongoInternals.NpmModule.GridFSBucket(db, {
        bucketName: 'cfs_gridfs.attachments'
      });

      const downloadStream = bucket.openDownloadStreamByName(attachmentId);
      return downloadStream;
    } catch (error) {
      console.error('Error creating GridFS stream:', error);
      return null;
    }
  }
  return null;
}

/**
 * Get file data from old GridFS structure
 * @param {string} attachmentId - The attachment ID
 * @returns {Buffer|null} - File data buffer or null if not found
 */
export function getOldAttachmentDataBuffer(attachmentId) {
  if (Meteor.isServer) {
    try {
      const db = MongoInternals.defaultRemoteCollectionDriver().mongo.db;
      const bucket = new MongoInternals.NpmModule.GridFSBucket(db, {
        bucketName: 'cfs_gridfs.attachments'
      });

      return new Promise((resolve, reject) => {
        const chunks = [];
        const downloadStream = bucket.openDownloadStreamByName(attachmentId);

        downloadStream.on('data', (chunk) => {
          chunks.push(chunk);
        });

        downloadStream.on('end', () => {
          resolve(Buffer.concat(chunks));
        });

        downloadStream.on('error', (error) => {
          reject(error);
        });
      });
    } catch (error) {
      console.error('Error reading GridFS data:', error);
      return null;
    }
  }
  return null;
}
