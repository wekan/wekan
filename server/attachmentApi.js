import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import Attachments from '/models/attachments';
import { fileStoreStrategyFactory } from '/models/attachments.server';
import { moveToStorage } from '/models/lib/fileStoreStrategy';
import { STORAGE_NAME_FILESYSTEM, STORAGE_NAME_GRIDFS, STORAGE_NAME_S3 } from '/models/lib/fileStoreStrategy';
import AttachmentStorageSettings from '/models/attachmentStorageSettings';
import fs from 'fs';
import path from 'path';
import { ObjectId } from 'bson';

const HARD_MAX_API_FILE_BYTES = 64 * 1024 * 1024;

// Returns true if the user may *write* to the board (add/change/remove
// attachments): an active member who is not read-only, comment-only,
// no-comments, worker, or assigned-only — or a global site admin. Mirrors
// Authentication.checkBoardWriteAccess. Read operations keep using
// board.hasMember().
async function userHasBoardWriteAccess(board, userId) {
  if (!board || !userId || !Array.isArray(board.members)) {
    return false;
  }
  const writeAccess = board.members.some(
    m =>
      m.userId === userId &&
      m.isActive &&
      !m.isNoComments &&
      !m.isCommentOnly &&
      !m.isWorker &&
      !m.isReadOnly &&
      !m.isReadAssignedOnly,
  );
  if (writeAccess) {
    return true;
  }
  const admin = await ReactiveCache.getUser({ _id: userId, isAdmin: true });
  return admin !== undefined;
}

function normalizeConfiguredLimit(configuredValue, fallbackValue = 0) {
  if (Number.isFinite(configuredValue) && configuredValue >= 0) {
    return configuredValue;
  }
  return Number.isFinite(fallbackValue) && fallbackValue >= 0 ? fallbackValue : 0;
}

function getEffectiveApiFileLimit(maxBytes) {
  if (Number.isFinite(maxBytes) && maxBytes > 0) {
    return Math.min(maxBytes, HARD_MAX_API_FILE_BYTES);
  }
  // Unlimited in settings still uses a hard in-memory safety cap.
  return HARD_MAX_API_FILE_BYTES;
}

function maxBase64LengthForBytes(maxBytes) {
  const safeBytes = Number.isFinite(maxBytes) && maxBytes > 0 ? maxBytes : HARD_MAX_API_FILE_BYTES;
  return Math.ceil((safeBytes * 4) / 3) + 4;
}

function parseNonNegativeInt(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
}

async function getApiTransferLimits() {
  const envUploadFallback = parseNonNegativeInt(process.env.ATTACHMENT_API_MAX_UPLOAD_BYTES, 0);
  const envDownloadFallback = parseNonNegativeInt(process.env.ATTACHMENT_API_MAX_DOWNLOAD_BYTES, 0);

  const fallback = {
    apiUploadMaxBytes: envUploadFallback,
    apiDownloadMaxBytes: envDownloadFallback,
    apiUploadBlocked: false,
    apiDownloadBlocked: false,
  };

  try {
    const settings = await AttachmentStorageSettings.findOneAsync({});
    const limitSettings = settings?.limitSettings || {};

    const apiUploadMaxBytes = normalizeConfiguredLimit(limitSettings.apiUploadMaxBytes, fallback.apiUploadMaxBytes);
    const apiDownloadMaxBytes = normalizeConfiguredLimit(limitSettings.apiDownloadMaxBytes, fallback.apiDownloadMaxBytes);
    const apiUploadBlocked = limitSettings.apiUploadBlocked === true;
    const apiDownloadBlocked = limitSettings.apiDownloadBlocked === true;

    return {
      apiUploadMaxBytes,
      apiDownloadMaxBytes,
      apiUploadBlocked,
      apiDownloadBlocked,
      effectiveApiUploadMaxBytes: getEffectiveApiFileLimit(apiUploadMaxBytes),
      effectiveApiDownloadMaxBytes: getEffectiveApiFileLimit(apiDownloadMaxBytes),
    };
  } catch (error) {
    const apiUploadMaxBytes = normalizeConfiguredLimit(null, fallback.apiUploadMaxBytes);
    const apiDownloadMaxBytes = normalizeConfiguredLimit(null, fallback.apiDownloadMaxBytes);

    return {
      apiUploadMaxBytes,
      apiDownloadMaxBytes,
      apiUploadBlocked: false,
      apiDownloadBlocked: false,
      effectiveApiUploadMaxBytes: getEffectiveApiFileLimit(apiUploadMaxBytes),
      effectiveApiDownloadMaxBytes: getEffectiveApiFileLimit(apiDownloadMaxBytes),
    };
  }
}

// Attachment API methods
Meteor.methods({
    // Upload attachment via API
    async 'api.attachment.upload'(boardId, swimlaneId, listId, cardId, fileData, fileName, fileType, storageBackend) {
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Must be logged in');
      }

      // Validate parameters
      if (!boardId || !swimlaneId || !listId || !cardId || !fileData || !fileName) {
        throw new Meteor.Error('invalid-parameters', 'Missing required parameters');
      }

      // Check if user has permission to modify the card
      const card = await ReactiveCache.getCard(cardId);
      if (!card) {
        throw new Meteor.Error('card-not-found', 'Card not found');
      }

      const board = await ReactiveCache.getBoard(boardId);
      if (!board) {
        throw new Meteor.Error('board-not-found', 'Board not found');
      }

      // The card must actually belong to the board the caller named, otherwise
      // boardId could be spoofed to a board the caller is a member of while the
      // attachment is attached to a card on a different board.
      if (card.boardId !== boardId) {
        throw new Meteor.Error('invalid-parameters', 'Card does not belong to this board');
      }

      // Check permissions: uploading requires write access, not just membership
      // (read-only / comment-only / worker members cannot add attachments).
      if (!(await userHasBoardWriteAccess(board, this.userId))) {
        throw new Meteor.Error('not-authorized', 'You do not have permission to modify this card');
      }

      // Check if board allows attachments
      if (!board.allowsAttachments) {
        throw new Meteor.Error('attachments-not-allowed', 'Attachments are not allowed on this board');
      }

      // Always use admin-configured default storage backend for API uploads.
      let targetStorage = STORAGE_NAME_FILESYSTEM;
      try {
        const settings = await AttachmentStorageSettings.findOneAsync({});
        targetStorage = settings ? settings.getDefaultStorage() : STORAGE_NAME_FILESYSTEM;
      } catch (error) {
        targetStorage = STORAGE_NAME_FILESYSTEM;
      }

      // Validate storage backend
      if (![STORAGE_NAME_FILESYSTEM, STORAGE_NAME_GRIDFS, STORAGE_NAME_S3].includes(targetStorage)) {
        throw new Meteor.Error('invalid-storage', 'Invalid storage backend');
      }

      try {
        const {
          apiUploadBlocked,
          effectiveApiUploadMaxBytes,
        } = await getApiTransferLimits();

        if (apiUploadBlocked) {
          throw new Meteor.Error('uploads-disabled', 'API uploads are disabled by administrator');
        }

        if (typeof fileData !== 'string') {
          throw new Meteor.Error('invalid-parameters', 'Invalid fileData format');
        }

        const maxBase64Length = maxBase64LengthForBytes(effectiveApiUploadMaxBytes);
        if (fileData.length > maxBase64Length) {
          throw new Meteor.Error('file-too-large', 'Attachment exceeds API upload limit');
        }

        // Create file object from base64 data
        const fileBuffer = Buffer.from(fileData, 'base64');
        if (fileBuffer.length > effectiveApiUploadMaxBytes) {
          throw new Meteor.Error('file-too-large', 'Attachment exceeds API upload limit');
        }
        const file = new File([fileBuffer], fileName, { type: fileType || 'application/octet-stream' });

        // Create attachment metadata
        const fileId = new ObjectId().toString();
        const meta = {
          boardId: boardId,
          swimlaneId: swimlaneId,
          listId: listId,
          cardId: cardId,
          fileId: fileId,
          source: 'api',
          storageBackend: targetStorage
        };

        // Create attachment
        const uploader = await Attachments.insertAsync({
          file: file,
          meta: meta,
          isBase64: false,
          transport: 'http'
        });

        if (uploader) {
          // Move to target storage if not filesystem
          if (targetStorage !== STORAGE_NAME_FILESYSTEM) {
            Meteor.defer(() => {
              try {
                moveToStorage(uploader, targetStorage, fileStoreStrategyFactory);
              } catch (error) {
                console.error('Error moving attachment to target storage:', error);
              }
            });
          }

          return {
            success: true,
            attachmentId: uploader._id,
            fileName: fileName,
            fileSize: fileBuffer.length,
            storageBackend: targetStorage,
            message: 'Attachment uploaded successfully'
          };
        } else {
          throw new Meteor.Error('upload-failed', 'Failed to upload attachment');
        }
      } catch (error) {
        console.error('API attachment upload error:', error);
        throw new Meteor.Error('upload-error', error.message);
      }
    },

    // Download attachment via API
    async 'api.attachment.download'(attachmentId) {
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Must be logged in');
      }

      // Get attachment
      const attachment = await ReactiveCache.getAttachment(attachmentId);
      if (!attachment) {
        throw new Meteor.Error('attachment-not-found', 'Attachment not found');
      }

      // Check permissions
      const board = await ReactiveCache.getBoard(attachment.meta.boardId);
      if (!board || !board.hasMember(this.userId)) {
        throw new Meteor.Error('not-authorized', 'You do not have permission to access this attachment');
      }

      try {
        const {
          apiDownloadBlocked,
          effectiveApiDownloadMaxBytes,
        } = await getApiTransferLimits();

        if (apiDownloadBlocked) {
          throw new Meteor.Error('downloads-disabled', 'API downloads are disabled by administrator');
        }

        if (Number.isFinite(attachment.size) && attachment.size > effectiveApiDownloadMaxBytes) {
          throw new Meteor.Error('file-too-large', 'Attachment exceeds API download limit');
        }

        // Get file strategy
        const strategy = fileStoreStrategyFactory.getFileStrategy(attachment, 'original');
        const readStream = strategy.getReadStream();

        if (!readStream) {
          throw new Meteor.Error('file-not-found', 'File not found in storage');
        }

        // Read file data
        const chunks = [];
        return new Promise((resolve, reject) => {
          let settled = false;
          let totalBytes = 0;

          const fail = (error) => {
            if (settled) {
              return;
            }
            settled = true;
            try {
              readStream.destroy();
            } catch (destroyError) {
              // Ignore destroy errors.
            }
            reject(error);
          };

          readStream.on('data', (chunk) => {
            totalBytes += chunk.length || 0;
            if (totalBytes > effectiveApiDownloadMaxBytes) {
              fail(new Meteor.Error('file-too-large', 'Attachment exceeds API download limit'));
              return;
            }
            chunks.push(chunk);
          });

          readStream.on('end', () => {
            if (settled) {
              return;
            }
            settled = true;
            const fileBuffer = Buffer.concat(chunks);
            const base64Data = fileBuffer.toString('base64');

            resolve({
              success: true,
              attachmentId: attachmentId,
              fileName: attachment.name,
              fileSize: attachment.size,
              fileType: attachment.type,
              base64Data: base64Data,
              storageBackend: strategy.getStorageName()
            });
          });

          readStream.on('error', (error) => {
            fail(new Meteor.Error('download-error', error.message));
          });
        });
      } catch (error) {
        console.error('API attachment download error:', error);
        throw new Meteor.Error('download-error', error.message);
      }
    },

    // Upload a board background image via API.
    //
    // This is the board-level counterpart of api.attachment.upload: instead of
    // attaching a file to a card, it stores a board-level attachment (no card)
    // and sets it as the board's active background. Managing backgrounds is
    // board-admin-gated (same as removeBoardBackground).
    async 'api.board.uploadBackground'(boardId, fileData, fileName, fileType) {
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Must be logged in');
      }
      if (!boardId || !fileData || !fileName) {
        throw new Meteor.Error('invalid-parameters', 'Missing required parameters');
      }

      const board = await ReactiveCache.getBoard(boardId);
      if (!board) {
        throw new Meteor.Error('board-not-found', 'Board not found');
      }

      // Board-admin (or global admin) required, matching removeBoardBackground.
      const user = await ReactiveCache.getUser(this.userId);
      const isAdmin =
        (board.hasAdmin && board.hasAdmin(this.userId)) || (user && user.isAdmin);
      if (!isAdmin) {
        throw new Meteor.Error('not-authorized', 'Board admin required');
      }

      // Always use the admin-configured default storage backend for API uploads.
      let targetStorage = STORAGE_NAME_FILESYSTEM;
      try {
        const settings = await AttachmentStorageSettings.findOneAsync({});
        targetStorage = settings ? settings.getDefaultStorage() : STORAGE_NAME_FILESYSTEM;
      } catch (error) {
        targetStorage = STORAGE_NAME_FILESYSTEM;
      }
      if (![STORAGE_NAME_FILESYSTEM, STORAGE_NAME_GRIDFS, STORAGE_NAME_S3].includes(targetStorage)) {
        throw new Meteor.Error('invalid-storage', 'Invalid storage backend');
      }

      try {
        const { apiUploadBlocked, effectiveApiUploadMaxBytes } = await getApiTransferLimits();
        if (apiUploadBlocked) {
          throw new Meteor.Error('uploads-disabled', 'API uploads are disabled by administrator');
        }
        if (typeof fileData !== 'string') {
          throw new Meteor.Error('invalid-parameters', 'Invalid fileData format');
        }
        if (fileData.length > maxBase64LengthForBytes(effectiveApiUploadMaxBytes)) {
          throw new Meteor.Error('file-too-large', 'Background exceeds API upload limit');
        }

        const fileBuffer = Buffer.from(fileData, 'base64');
        if (fileBuffer.length > effectiveApiUploadMaxBytes) {
          throw new Meteor.Error('file-too-large', 'Background exceeds API upload limit');
        }
        const file = new File([fileBuffer], fileName, { type: fileType || 'image/png' });

        const fileId = new ObjectId().toString();
        const meta = {
          boardId,
          fileId,
          source: 'api-background',
          storageBackend: targetStorage,
        };
        const uploader = await Attachments.insertAsync({
          file,
          meta,
          isBase64: false,
          transport: 'http',
        });
        if (!uploader) {
          throw new Meteor.Error('upload-failed', 'Failed to upload background');
        }
        if (targetStorage !== STORAGE_NAME_FILESYSTEM) {
          Meteor.defer(() => {
            try {
              moveToStorage(uploader, targetStorage, fileStoreStrategyFactory);
            } catch (error) {
              console.error('Error moving background to target storage:', error);
            }
          });
        }

        // Make the uploaded image the board's active background.
        await board.setBackgroundImage(uploader._id);
        const updated = await ReactiveCache.getBoard(boardId);

        return {
          success: true,
          attachmentId: uploader._id,
          fileName,
          fileSize: fileBuffer.length,
          storageBackend: targetStorage,
          backgroundImageURL: updated ? updated.backgroundImageURL : '',
          message: 'Board background uploaded successfully',
        };
      } catch (error) {
        console.error('API board background upload error:', error);
        throw new Meteor.Error('upload-error', error.message);
      }
    },

    // Download the board's current background image via API (board members).
    // Returns the image bytes as base64, mirroring api.attachment.download.
    async 'api.board.downloadBackground'(boardId) {
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Must be logged in');
      }
      const board = await ReactiveCache.getBoard(boardId);
      if (!board || !board.hasMember(this.userId)) {
        throw new Meteor.Error('not-authorized', 'You do not have permission to access this board');
      }
      const attachmentId = board.backgroundImageId;
      if (!attachmentId) {
        throw new Meteor.Error('no-background', 'Board has no background image set');
      }
      const attachment = await ReactiveCache.getAttachment(attachmentId);
      if (!attachment) {
        throw new Meteor.Error('attachment-not-found', 'Background attachment not found');
      }

      try {
        const { apiDownloadBlocked, effectiveApiDownloadMaxBytes } = await getApiTransferLimits();
        if (apiDownloadBlocked) {
          throw new Meteor.Error('downloads-disabled', 'API downloads are disabled by administrator');
        }
        if (Number.isFinite(attachment.size) && attachment.size > effectiveApiDownloadMaxBytes) {
          throw new Meteor.Error('file-too-large', 'Background exceeds API download limit');
        }

        const strategy = fileStoreStrategyFactory.getFileStrategy(attachment, 'original');
        const readStream = strategy.getReadStream();
        if (!readStream) {
          throw new Meteor.Error('file-not-found', 'File not found in storage');
        }

        const chunks = [];
        return new Promise((resolve, reject) => {
          let settled = false;
          let totalBytes = 0;
          const fail = (error) => {
            if (settled) return;
            settled = true;
            try { readStream.destroy(); } catch (e) { /* ignore */ }
            reject(error);
          };
          readStream.on('data', (chunk) => {
            totalBytes += chunk.length || 0;
            if (totalBytes > effectiveApiDownloadMaxBytes) {
              fail(new Meteor.Error('file-too-large', 'Background exceeds API download limit'));
              return;
            }
            chunks.push(chunk);
          });
          readStream.on('end', () => {
            if (settled) return;
            settled = true;
            const fileBuffer = Buffer.concat(chunks);
            resolve({
              success: true,
              attachmentId,
              fileName: attachment.name,
              fileSize: attachment.size,
              fileType: attachment.type,
              base64Data: fileBuffer.toString('base64'),
              backgroundImageURL: board.backgroundImageURL || '',
              storageBackend: strategy.getStorageName(),
            });
          });
          readStream.on('error', (error) => {
            fail(new Meteor.Error('download-error', error.message));
          });
        });
      } catch (error) {
        console.error('API board background download error:', error);
        throw new Meteor.Error('download-error', error.message);
      }
    },

    // List attachments for board, swimlane, list, or card
    async 'api.attachment.list'(boardId, swimlaneId, listId, cardId) {
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Must be logged in');
      }

      // Check permissions
      const board = await ReactiveCache.getBoard(boardId);
      if (!board || !board.hasMember(this.userId)) {
        throw new Meteor.Error('not-authorized', 'You do not have permission to access this board');
      }

      try {
        let query = { 'meta.boardId': boardId };

        if (swimlaneId) {
          query['meta.swimlaneId'] = swimlaneId;
        }

        if (listId) {
          query['meta.listId'] = listId;
        }

        if (cardId) {
          query['meta.cardId'] = cardId;
        }

        const attachments = await ReactiveCache.getAttachments(query);
        
        const attachmentList = attachments.map(attachment => {
          const strategy = fileStoreStrategyFactory.getFileStrategy(attachment, 'original');
          return {
            attachmentId: attachment._id,
            fileName: attachment.name,
            fileSize: attachment.size,
            fileType: attachment.type,
            storageBackend: strategy.getStorageName(),
            boardId: attachment.meta.boardId,
            swimlaneId: attachment.meta.swimlaneId,
            listId: attachment.meta.listId,
            cardId: attachment.meta.cardId,
            createdAt: attachment.uploadedAt,
            isImage: attachment.isImage
          };
        });

        return {
          success: true,
          attachments: attachmentList,
          count: attachmentList.length
        };
      } catch (error) {
        console.error('API attachment list error:', error);
        throw new Meteor.Error('list-error', error.message);
      }
    },

    // Copy attachment to another card
    async 'api.attachment.copy'(attachmentId, targetBoardId, targetSwimlaneId, targetListId, targetCardId) {
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Must be logged in');
      }

      // Get source attachment
      const sourceAttachment = await ReactiveCache.getAttachment(attachmentId);
      if (!sourceAttachment) {
        throw new Meteor.Error('attachment-not-found', 'Source attachment not found');
      }

      // Check source permissions (reading the source needs membership)
      const sourceBoard = await ReactiveCache.getBoard(sourceAttachment.meta.boardId);
      if (!sourceBoard || !sourceBoard.hasMember(this.userId)) {
        throw new Meteor.Error('not-authorized', 'You do not have permission to access the source attachment');
      }

      // Check target permissions: writing the copy needs write access.
      const targetBoard = await ReactiveCache.getBoard(targetBoardId);
      if (!targetBoard || !(await userHasBoardWriteAccess(targetBoard, this.userId))) {
        throw new Meteor.Error('not-authorized', 'You do not have permission to modify the target card');
      }

      // Check if target board allows attachments
      if (!targetBoard.allowsAttachments) {
        throw new Meteor.Error('attachments-not-allowed', 'Attachments are not allowed on the target board');
      }

      // A copy creates a new attachment, so honour the admin API upload limits.
      const {
        apiUploadBlocked,
        effectiveApiUploadMaxBytes,
      } = await getApiTransferLimits();
      if (apiUploadBlocked) {
        throw new Meteor.Error('uploads-disabled', 'API uploads are disabled by administrator');
      }

      try {
        // Get source file strategy
        const sourceStrategy = fileStoreStrategyFactory.getFileStrategy(sourceAttachment, 'original');
        const readStream = sourceStrategy.getReadStream();

        if (!readStream) {
          throw new Meteor.Error('file-not-found', 'Source file not found in storage');
        }

        // Read source file data
        const chunks = [];
        return new Promise((resolve, reject) => {
          readStream.on('data', (chunk) => {
            chunks.push(chunk);
          });

          readStream.on('end', async () => {
            try {
              const fileBuffer = Buffer.concat(chunks);
              if (fileBuffer.length > effectiveApiUploadMaxBytes) {
                reject(new Meteor.Error('file-too-large', 'Attachment exceeds API upload limit'));
                return;
              }
              const file = new File([fileBuffer], sourceAttachment.name, { type: sourceAttachment.type });

              // Create new attachment metadata
              const fileId = new ObjectId().toString();
              const meta = {
                boardId: targetBoardId,
                swimlaneId: targetSwimlaneId,
                listId: targetListId,
                cardId: targetCardId,
                fileId: fileId,
                source: 'api-copy',
                copyFrom: attachmentId,
                copyStorage: sourceStrategy.getStorageName()
              };

              // Create new attachment
              const uploader = await Attachments.insertAsync({
                file: file,
                meta: meta,
                isBase64: false,
                transport: 'http'
              });

              if (uploader) {
                resolve({
                  success: true,
                  sourceAttachmentId: attachmentId,
                  newAttachmentId: uploader._id,
                  fileName: sourceAttachment.name,
                  fileSize: sourceAttachment.size,
                  message: 'Attachment copied successfully'
                });
              } else {
                reject(new Meteor.Error('copy-failed', 'Failed to copy attachment'));
              }
            } catch (error) {
              reject(new Meteor.Error('copy-error', error.message));
            }
          });

          readStream.on('error', (error) => {
            reject(new Meteor.Error('copy-error', error.message));
          });
        });
      } catch (error) {
        console.error('API attachment copy error:', error);
        throw new Meteor.Error('copy-error', error.message);
      }
    },

    // Move attachment to another card
    async 'api.attachment.move'(attachmentId, targetBoardId, targetSwimlaneId, targetListId, targetCardId) {
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Must be logged in');
      }

      // Get source attachment
      const sourceAttachment = await ReactiveCache.getAttachment(attachmentId);
      if (!sourceAttachment) {
        throw new Meteor.Error('attachment-not-found', 'Source attachment not found');
      }

      // Check source permissions: a move removes the attachment from the source
      // board, so it requires write access there.
      const sourceBoard = await ReactiveCache.getBoard(sourceAttachment.meta.boardId);
      if (!sourceBoard || !(await userHasBoardWriteAccess(sourceBoard, this.userId))) {
        throw new Meteor.Error('not-authorized', 'You do not have permission to access the source attachment');
      }

      // Check target permissions: a move adds the attachment to the target
      // board, so it requires write access there too.
      const targetBoard = await ReactiveCache.getBoard(targetBoardId);
      if (!targetBoard || !(await userHasBoardWriteAccess(targetBoard, this.userId))) {
        throw new Meteor.Error('not-authorized', 'You do not have permission to modify the target card');
      }

      // Check if target board allows attachments
      if (!targetBoard.allowsAttachments) {
        throw new Meteor.Error('attachments-not-allowed', 'Attachments are not allowed on the target board');
      }

      try {
        // Update attachment metadata
        await Attachments.updateAsync(attachmentId, {
          $set: {
            'meta.boardId': targetBoardId,
            'meta.swimlaneId': targetSwimlaneId,
            'meta.listId': targetListId,
            'meta.cardId': targetCardId,
            'meta.source': 'api-move',
            'meta.movedAt': new Date()
          }
        });

        return {
          success: true,
          attachmentId: attachmentId,
          fileName: sourceAttachment.name,
          fileSize: sourceAttachment.size,
          sourceBoardId: sourceAttachment.meta.boardId,
          targetBoardId: targetBoardId,
          message: 'Attachment moved successfully'
        };
      } catch (error) {
        console.error('API attachment move error:', error);
        throw new Meteor.Error('move-error', error.message);
      }
    },

    // Delete attachment via API
    async 'api.attachment.delete'(attachmentId) {
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Must be logged in');
      }

      // Get attachment
      const attachment = await ReactiveCache.getAttachment(attachmentId);
      if (!attachment) {
        throw new Meteor.Error('attachment-not-found', 'Attachment not found');
      }

      // Check permissions: deleting requires write access, not just membership.
      const board = await ReactiveCache.getBoard(attachment.meta.boardId);
      if (!board || !(await userHasBoardWriteAccess(board, this.userId))) {
        throw new Meteor.Error('not-authorized', 'You do not have permission to delete this attachment');
      }

      try {
        // Delete attachment
        await Attachments.removeAsync(attachmentId);

        return {
          success: true,
          attachmentId: attachmentId,
          fileName: attachment.name,
          message: 'Attachment deleted successfully'
        };
      } catch (error) {
        console.error('API attachment delete error:', error);
        throw new Meteor.Error('delete-error', error.message);
      }
    },

    // Get attachment info via API
    async 'api.attachment.info'(attachmentId) {
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Must be logged in');
      }

      // Get attachment
      const attachment = await ReactiveCache.getAttachment(attachmentId);
      if (!attachment) {
        throw new Meteor.Error('attachment-not-found', 'Attachment not found');
      }

      // Check permissions
      const board = await ReactiveCache.getBoard(attachment.meta.boardId);
      if (!board || !board.hasMember(this.userId)) {
        throw new Meteor.Error('not-authorized', 'You do not have permission to access this attachment');
      }

      try {
        const strategy = fileStoreStrategyFactory.getFileStrategy(attachment, 'original');

        return {
          success: true,
          attachmentId: attachment._id,
          fileName: attachment.name,
          fileSize: attachment.size,
          fileType: attachment.type,
          storageBackend: strategy.getStorageName(),
          boardId: attachment.meta.boardId,
          swimlaneId: attachment.meta.swimlaneId,
          listId: attachment.meta.listId,
          cardId: attachment.meta.cardId,
          createdAt: attachment.uploadedAt,
          isImage: attachment.isImage,
          versions: Object.keys(attachment.versions).map(versionName => ({
            versionName: versionName,
            storage: attachment.versions[versionName].storage,
            size: attachment.versions[versionName].size,
            type: attachment.versions[versionName].type
          }))
        };
      } catch (error) {
        console.error('API attachment info error:', error);
        throw new Meteor.Error('info-error', error.message);
      }
    }
  });
