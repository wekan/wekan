import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import { Attachments, fileStoreStrategyFactory } from '/models/attachments';
import { moveToStorage } from '/models/lib/fileStoreStrategy';
import { STORAGE_NAME_FILESYSTEM, STORAGE_NAME_GRIDFS, STORAGE_NAME_S3 } from '/models/lib/fileStoreStrategy';
import AttachmentStorageSettings from '/models/attachmentStorageSettings';
import fs from 'fs';
import path from 'path';
import { ObjectID } from 'bson';

// Attachment API methods
if (Meteor.isServer) {
  Meteor.methods({
    // Upload attachment via API
    'api.attachment.upload'(boardId, swimlaneId, listId, cardId, fileData, fileName, fileType, storageBackend) {
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Must be logged in');
      }

      // Validate parameters
      if (!boardId || !swimlaneId || !listId || !cardId || !fileData || !fileName) {
        throw new Meteor.Error('invalid-parameters', 'Missing required parameters');
      }

      // Check if user has permission to modify the card
      const card = ReactiveCache.getCard(cardId);
      if (!card) {
        throw new Meteor.Error('card-not-found', 'Card not found');
      }

      const board = ReactiveCache.getBoard(boardId);
      if (!board) {
        throw new Meteor.Error('board-not-found', 'Board not found');
      }

      // Check permissions
      if (!board.isBoardMember(this.userId)) {
        throw new Meteor.Error('not-authorized', 'You do not have permission to modify this card');
      }

      // Check if board allows attachments
      if (!board.allowsAttachments) {
        throw new Meteor.Error('attachments-not-allowed', 'Attachments are not allowed on this board');
      }

      // Get default storage backend if not specified
      let targetStorage = storageBackend;
      if (!targetStorage) {
        try {
          const settings = AttachmentStorageSettings.findOne({});
          targetStorage = settings ? settings.getDefaultStorage() : STORAGE_NAME_FILESYSTEM;
        } catch (error) {
          targetStorage = STORAGE_NAME_FILESYSTEM;
        }
      }

      // Validate storage backend
      if (![STORAGE_NAME_FILESYSTEM, STORAGE_NAME_GRIDFS, STORAGE_NAME_S3].includes(targetStorage)) {
        throw new Meteor.Error('invalid-storage', 'Invalid storage backend');
      }

      try {
        // Create file object from base64 data
        const fileBuffer = Buffer.from(fileData, 'base64');
        const file = new File([fileBuffer], fileName, { type: fileType || 'application/octet-stream' });

        // Create attachment metadata
        const fileId = new ObjectID().toString();
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
        const uploader = Attachments.insert({
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
    'api.attachment.download'(attachmentId) {
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Must be logged in');
      }

      // Get attachment
      const attachment = ReactiveCache.getAttachment(attachmentId);
      if (!attachment) {
        throw new Meteor.Error('attachment-not-found', 'Attachment not found');
      }

      // Check permissions
      const board = ReactiveCache.getBoard(attachment.meta.boardId);
      if (!board || !board.isBoardMember(this.userId)) {
        throw new Meteor.Error('not-authorized', 'You do not have permission to access this attachment');
      }

      try {
        // Get file strategy
        const strategy = fileStoreStrategyFactory.getFileStrategy(attachment, 'original');
        const readStream = strategy.getReadStream();

        if (!readStream) {
          throw new Meteor.Error('file-not-found', 'File not found in storage');
        }

        // Read file data
        const chunks = [];
        return new Promise((resolve, reject) => {
          readStream.on('data', (chunk) => {
            chunks.push(chunk);
          });

          readStream.on('end', () => {
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
            reject(new Meteor.Error('download-error', error.message));
          });
        });
      } catch (error) {
        console.error('API attachment download error:', error);
        throw new Meteor.Error('download-error', error.message);
      }
    },

    // List attachments for board, swimlane, list, or card
    'api.attachment.list'(boardId, swimlaneId, listId, cardId) {
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Must be logged in');
      }

      // Check permissions
      const board = ReactiveCache.getBoard(boardId);
      if (!board || !board.isBoardMember(this.userId)) {
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

        const attachments = ReactiveCache.getAttachments(query);

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
    'api.attachment.copy'(attachmentId, targetBoardId, targetSwimlaneId, targetListId, targetCardId) {
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Must be logged in');
      }

      // Get source attachment
      const sourceAttachment = ReactiveCache.getAttachment(attachmentId);
      if (!sourceAttachment) {
        throw new Meteor.Error('attachment-not-found', 'Source attachment not found');
      }

      // Check source permissions
      const sourceBoard = ReactiveCache.getBoard(sourceAttachment.meta.boardId);
      if (!sourceBoard || !sourceBoard.isBoardMember(this.userId)) {
        throw new Meteor.Error('not-authorized', 'You do not have permission to access the source attachment');
      }

      // Check target permissions
      const targetBoard = ReactiveCache.getBoard(targetBoardId);
      if (!targetBoard || !targetBoard.isBoardMember(this.userId)) {
        throw new Meteor.Error('not-authorized', 'You do not have permission to modify the target card');
      }

      // Check if target board allows attachments
      if (!targetBoard.allowsAttachments) {
        throw new Meteor.Error('attachments-not-allowed', 'Attachments are not allowed on the target board');
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

          readStream.on('end', () => {
            try {
              const fileBuffer = Buffer.concat(chunks);
              const file = new File([fileBuffer], sourceAttachment.name, { type: sourceAttachment.type });

              // Create new attachment metadata
              const fileId = new ObjectID().toString();
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
              const uploader = Attachments.insert({
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
    'api.attachment.move'(attachmentId, targetBoardId, targetSwimlaneId, targetListId, targetCardId) {
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Must be logged in');
      }

      // Get source attachment
      const sourceAttachment = ReactiveCache.getAttachment(attachmentId);
      if (!sourceAttachment) {
        throw new Meteor.Error('attachment-not-found', 'Source attachment not found');
      }

      // Check source permissions
      const sourceBoard = ReactiveCache.getBoard(sourceAttachment.meta.boardId);
      if (!sourceBoard || !sourceBoard.isBoardMember(this.userId)) {
        throw new Meteor.Error('not-authorized', 'You do not have permission to access the source attachment');
      }

      // Check target permissions
      const targetBoard = ReactiveCache.getBoard(targetBoardId);
      if (!targetBoard || !targetBoard.isBoardMember(this.userId)) {
        throw new Meteor.Error('not-authorized', 'You do not have permission to modify the target card');
      }

      // Check if target board allows attachments
      if (!targetBoard.allowsAttachments) {
        throw new Meteor.Error('attachments-not-allowed', 'Attachments are not allowed on the target board');
      }

      try {
        // Update attachment metadata
        Attachments.update(attachmentId, {
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
    'api.attachment.delete'(attachmentId) {
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Must be logged in');
      }

      // Get attachment
      const attachment = ReactiveCache.getAttachment(attachmentId);
      if (!attachment) {
        throw new Meteor.Error('attachment-not-found', 'Attachment not found');
      }

      // Check permissions
      const board = ReactiveCache.getBoard(attachment.meta.boardId);
      if (!board || !board.isBoardMember(this.userId)) {
        throw new Meteor.Error('not-authorized', 'You do not have permission to delete this attachment');
      }

      try {
        // Delete attachment
        Attachments.remove(attachmentId);

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
    'api.attachment.info'(attachmentId) {
      if (!this.userId) {
        throw new Meteor.Error('not-authorized', 'Must be logged in');
      }

      // Get attachment
      const attachment = ReactiveCache.getAttachment(attachmentId);
      if (!attachment) {
        throw new Meteor.Error('attachment-not-found', 'Attachment not found');
      }

      // Check permissions
      const board = ReactiveCache.getBoard(attachment.meta.boardId);
      if (!board || !board.isBoardMember(this.userId)) {
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
}
