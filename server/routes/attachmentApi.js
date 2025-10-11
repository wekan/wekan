import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { ReactiveCache } from '/imports/reactiveCache';
import { Attachments, fileStoreStrategyFactory } from '/models/attachments';
import { moveToStorage } from '/models/lib/fileStoreStrategy';
import { STORAGE_NAME_FILESYSTEM, STORAGE_NAME_GRIDFS, STORAGE_NAME_S3 } from '/models/lib/fileStoreStrategy';
import AttachmentStorageSettings from '/models/attachmentStorageSettings';
import fs from 'fs';
import path from 'path';
import { ObjectID } from 'bson';

// Attachment API HTTP routes
if (Meteor.isServer) {
  // Helper function to authenticate API requests
  function authenticateApiRequest(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Meteor.Error('unauthorized', 'Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    // Here you would validate the token and get the user ID
    // For now, we'll use a simple approach - in production, you'd want proper JWT validation
    const userId = token; // This should be replaced with proper token validation
    
    if (!userId) {
      throw new Meteor.Error('unauthorized', 'Invalid token');
    }

    return userId;
  }

  // Helper function to send JSON response
  function sendJsonResponse(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  }

  // Helper function to send error response
  function sendErrorResponse(res, statusCode, message) {
    sendJsonResponse(res, statusCode, { success: false, error: message });
  }

  // Upload attachment endpoint
  WebApp.connectHandlers.use('/api/attachment/upload', (req, res, next) => {
    if (req.method !== 'POST') {
      return next();
    }

    try {
      const userId = authenticateApiRequest(req);
      
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const { boardId, swimlaneId, listId, cardId, fileData, fileName, fileType, storageBackend } = data;

          // Validate parameters
          if (!boardId || !swimlaneId || !listId || !cardId || !fileData || !fileName) {
            return sendErrorResponse(res, 400, 'Missing required parameters');
          }

          // Check if user has permission to modify the card
          const card = ReactiveCache.getCard(cardId);
          if (!card) {
            return sendErrorResponse(res, 404, 'Card not found');
          }

          const board = ReactiveCache.getBoard(boardId);
          if (!board) {
            return sendErrorResponse(res, 404, 'Board not found');
          }

          // Check permissions
          if (!board.isBoardMember(userId)) {
            return sendErrorResponse(res, 403, 'You do not have permission to modify this card');
          }

          // Check if board allows attachments
          if (!board.allowsAttachments) {
            return sendErrorResponse(res, 403, 'Attachments are not allowed on this board');
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
            return sendErrorResponse(res, 400, 'Invalid storage backend');
          }

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

            sendJsonResponse(res, 200, {
              success: true,
              attachmentId: uploader._id,
              fileName: fileName,
              fileSize: fileBuffer.length,
              storageBackend: targetStorage,
              message: 'Attachment uploaded successfully'
            });
          } else {
            sendErrorResponse(res, 500, 'Failed to upload attachment');
          }
        } catch (error) {
          console.error('API attachment upload error:', error);
          sendErrorResponse(res, 500, error.message);
        }
      });
    } catch (error) {
      sendErrorResponse(res, 401, error.message);
    }
  });

  // Download attachment endpoint
  WebApp.connectHandlers.use('/api/attachment/download/([^/]+)', (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const userId = authenticateApiRequest(req);
      const attachmentId = req.params[0];

      // Get attachment
      const attachment = ReactiveCache.getAttachment(attachmentId);
      if (!attachment) {
        return sendErrorResponse(res, 404, 'Attachment not found');
      }

      // Check permissions
      const board = ReactiveCache.getBoard(attachment.meta.boardId);
      if (!board || !board.isBoardMember(userId)) {
        return sendErrorResponse(res, 403, 'You do not have permission to access this attachment');
      }

      // Get file strategy
      const strategy = fileStoreStrategyFactory.getFileStrategy(attachment, 'original');
      const readStream = strategy.getReadStream();

      if (!readStream) {
        return sendErrorResponse(res, 404, 'File not found in storage');
      }

      // Read file data
      const chunks = [];
      readStream.on('data', (chunk) => {
        chunks.push(chunk);
      });

      readStream.on('end', () => {
        const fileBuffer = Buffer.concat(chunks);
        const base64Data = fileBuffer.toString('base64');
        
        sendJsonResponse(res, 200, {
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
        console.error('Download error:', error);
        sendErrorResponse(res, 500, error.message);
      });
    } catch (error) {
      sendErrorResponse(res, 401, error.message);
    }
  });

  // List attachments endpoint
  WebApp.connectHandlers.use('/api/attachment/list/([^/]+)/([^/]+)/([^/]+)/([^/]+)', (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const userId = authenticateApiRequest(req);
      const boardId = req.params[0];
      const swimlaneId = req.params[1];
      const listId = req.params[2];
      const cardId = req.params[3];

      // Check permissions
      const board = ReactiveCache.getBoard(boardId);
      if (!board || !board.isBoardMember(userId)) {
        return sendErrorResponse(res, 403, 'You do not have permission to access this board');
      }

      let query = { 'meta.boardId': boardId };

      if (swimlaneId && swimlaneId !== 'null') {
        query['meta.swimlaneId'] = swimlaneId;
      }

      if (listId && listId !== 'null') {
        query['meta.listId'] = listId;
      }

      if (cardId && cardId !== 'null') {
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

      sendJsonResponse(res, 200, {
        success: true,
        attachments: attachmentList,
        count: attachmentList.length
      });
    } catch (error) {
      sendErrorResponse(res, 401, error.message);
    }
  });

  // Copy attachment endpoint
  WebApp.connectHandlers.use('/api/attachment/copy', (req, res, next) => {
    if (req.method !== 'POST') {
      return next();
    }

    try {
      const userId = authenticateApiRequest(req);
      
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const { attachmentId, targetBoardId, targetSwimlaneId, targetListId, targetCardId } = data;

          // Get source attachment
          const sourceAttachment = ReactiveCache.getAttachment(attachmentId);
          if (!sourceAttachment) {
            return sendErrorResponse(res, 404, 'Source attachment not found');
          }

          // Check source permissions
          const sourceBoard = ReactiveCache.getBoard(sourceAttachment.meta.boardId);
          if (!sourceBoard || !sourceBoard.isBoardMember(userId)) {
            return sendErrorResponse(res, 403, 'You do not have permission to access the source attachment');
          }

          // Check target permissions
          const targetBoard = ReactiveCache.getBoard(targetBoardId);
          if (!targetBoard || !targetBoard.isBoardMember(userId)) {
            return sendErrorResponse(res, 403, 'You do not have permission to modify the target card');
          }

          // Check if target board allows attachments
          if (!targetBoard.allowsAttachments) {
            return sendErrorResponse(res, 403, 'Attachments are not allowed on the target board');
          }

          // Get source file strategy
          const sourceStrategy = fileStoreStrategyFactory.getFileStrategy(sourceAttachment, 'original');
          const readStream = sourceStrategy.getReadStream();

          if (!readStream) {
            return sendErrorResponse(res, 404, 'Source file not found in storage');
          }

          // Read source file data
          const chunks = [];
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
                sendJsonResponse(res, 200, {
                  success: true,
                  sourceAttachmentId: attachmentId,
                  newAttachmentId: uploader._id,
                  fileName: sourceAttachment.name,
                  fileSize: sourceAttachment.size,
                  message: 'Attachment copied successfully'
                });
              } else {
                sendErrorResponse(res, 500, 'Failed to copy attachment');
              }
            } catch (error) {
              sendErrorResponse(res, 500, error.message);
            }
          });

          readStream.on('error', (error) => {
            sendErrorResponse(res, 500, error.message);
          });
        } catch (error) {
          console.error('API attachment copy error:', error);
          sendErrorResponse(res, 500, error.message);
        }
      });
    } catch (error) {
      sendErrorResponse(res, 401, error.message);
    }
  });

  // Move attachment endpoint
  WebApp.connectHandlers.use('/api/attachment/move', (req, res, next) => {
    if (req.method !== 'POST') {
      return next();
    }

    try {
      const userId = authenticateApiRequest(req);
      
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const { attachmentId, targetBoardId, targetSwimlaneId, targetListId, targetCardId } = data;

          // Get source attachment
          const sourceAttachment = ReactiveCache.getAttachment(attachmentId);
          if (!sourceAttachment) {
            return sendErrorResponse(res, 404, 'Source attachment not found');
          }

          // Check source permissions
          const sourceBoard = ReactiveCache.getBoard(sourceAttachment.meta.boardId);
          if (!sourceBoard || !sourceBoard.isBoardMember(userId)) {
            return sendErrorResponse(res, 403, 'You do not have permission to access the source attachment');
          }

          // Check target permissions
          const targetBoard = ReactiveCache.getBoard(targetBoardId);
          if (!targetBoard || !targetBoard.isBoardMember(userId)) {
            return sendErrorResponse(res, 403, 'You do not have permission to modify the target card');
          }

          // Check if target board allows attachments
          if (!targetBoard.allowsAttachments) {
            return sendErrorResponse(res, 403, 'Attachments are not allowed on the target board');
          }

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

          sendJsonResponse(res, 200, {
            success: true,
            attachmentId: attachmentId,
            fileName: sourceAttachment.name,
            fileSize: sourceAttachment.size,
            sourceBoardId: sourceAttachment.meta.boardId,
            targetBoardId: targetBoardId,
            message: 'Attachment moved successfully'
          });
        } catch (error) {
          console.error('API attachment move error:', error);
          sendErrorResponse(res, 500, error.message);
        }
      });
    } catch (error) {
      sendErrorResponse(res, 401, error.message);
    }
  });

  // Delete attachment endpoint
  WebApp.connectHandlers.use('/api/attachment/delete/([^/]+)', (req, res, next) => {
    if (req.method !== 'DELETE') {
      return next();
    }

    try {
      const userId = authenticateApiRequest(req);
      const attachmentId = req.params[0];

      // Get attachment
      const attachment = ReactiveCache.getAttachment(attachmentId);
      if (!attachment) {
        return sendErrorResponse(res, 404, 'Attachment not found');
      }

      // Check permissions
      const board = ReactiveCache.getBoard(attachment.meta.boardId);
      if (!board || !board.isBoardMember(userId)) {
        return sendErrorResponse(res, 403, 'You do not have permission to delete this attachment');
      }

      // Delete attachment
      Attachments.remove(attachmentId);

      sendJsonResponse(res, 200, {
        success: true,
        attachmentId: attachmentId,
        fileName: attachment.name,
        message: 'Attachment deleted successfully'
      });
    } catch (error) {
      sendErrorResponse(res, 401, error.message);
    }
  });

  // Get attachment info endpoint
  WebApp.connectHandlers.use('/api/attachment/info/([^/]+)', (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const userId = authenticateApiRequest(req);
      const attachmentId = req.params[0];

      // Get attachment
      const attachment = ReactiveCache.getAttachment(attachmentId);
      if (!attachment) {
        return sendErrorResponse(res, 404, 'Attachment not found');
      }

      // Check permissions
      const board = ReactiveCache.getBoard(attachment.meta.boardId);
      if (!board || !board.isBoardMember(userId)) {
        return sendErrorResponse(res, 403, 'You do not have permission to access this attachment');
      }

      const strategy = fileStoreStrategyFactory.getFileStrategy(attachment, 'original');
      
      sendJsonResponse(res, 200, {
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
      });
    } catch (error) {
      sendErrorResponse(res, 401, error.message);
    }
  });
}
