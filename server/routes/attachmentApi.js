import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { WebApp } from 'meteor/webapp';
import { createAuthMiddleware } from 'meteor/accounts-express';
import { ReactiveCache } from '/imports/reactiveCache';
import Attachments from '/models/attachments';
import {
  findOrCreateHeaderLoginUser,
  isTrustedHeaderLoginSource,
} from '/server/lib/headerLoginAuth';
import { fileStoreStrategyFactory } from '/models/attachments.server';
import { Settings } from '../../models/settings';
import { moveToStorage } from '/models/lib/fileStoreStrategy';
import { STORAGE_NAME_FILESYSTEM, STORAGE_NAME_GRIDFS, STORAGE_NAME_S3 } from '/models/lib/fileStoreStrategy';
import AttachmentStorageSettings from '/models/attachmentStorageSettings';
import fs from 'fs';
import path from 'path';
import { ObjectId } from 'bson';

const HARD_MAX_API_FILE_BYTES = 64 * 1024 * 1024;
const HARD_MAX_API_UPLOAD_BODY_BYTES = 96 * 1024 * 1024;

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

// Attachment API HTTP routes
// Helper function to authenticate API requests using X-User-Id and X-Auth-Token
async function authenticateApiRequest(req) {
  // Preferred path: accounts-express middleware populated authenticated user context.
  if (req?.userId) {
    return req.userId;
  }

  // Optional header-login path for trusted upstream SSO proxies.
  const headerLoginUserId = await findOrCreateHeaderLoginUser(req);
  if (headerLoginUserId) {
    return headerLoginUserId;
  }

  // Legacy path kept for backward compatibility.
  const userId = req.headers['x-user-id'];
  const authToken = req.headers['x-auth-token'];

  if (!userId || !authToken) {
    throw new Meteor.Error('unauthorized', 'Missing X-User-Id or X-Auth-Token headers');
  }

  // Hash the token and validate against stored login tokens
  const hashedToken = Accounts._hashLoginToken(authToken);
  const user = await Meteor.users.findOneAsync({
    _id: userId,
    'services.resume.loginTokens.hashedToken': hashedToken,
  });

  if (!user) {
    throw new Meteor.Error('unauthorized', 'Invalid credentials');
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

// Returns true if the user may *write* to the board (add/change/remove
// attachments), mirroring Authentication.checkBoardWriteAccess: an active member
// who is not read-only, comment-only, no-comments, worker, or assigned-only —
// or a global site admin. Read operations should keep using board.hasMember().
async function userHasBoardWriteAccess(board, userId) {
  if (!board || !userId) {
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
  // Global site admins may write to any board.
  const admin = await ReactiveCache.getUser({ _id: userId, isAdmin: true });
  return admin !== undefined;
}

// Upload attachment endpoint
WebApp.handlers.use('/api', createAuthMiddleware());

WebApp.handlers.use('/api/attachment/upload', async (req, res, next) => {
    if (req.method !== 'POST') {
      return next();
    }

    // Set timeout to prevent hanging connections
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        sendErrorResponse(res, 408, 'Request timeout');
      }
    }, 30000); // 30 second timeout

    try {
      const userId = await authenticateApiRequest(req);
      const {
        apiUploadBlocked,
        effectiveApiUploadMaxBytes,
      } = await getApiTransferLimits();

      if (apiUploadBlocked) {
        clearTimeout(timeout);
        return sendErrorResponse(res, 403, 'API uploads are disabled by administrator');
      }

      let body = '';
      let bodyBytes = 0;
      let bodyComplete = false;

      req.on('data', chunk => {
        if (bodyComplete) {
          return;
        }

        bodyBytes += chunk.length || 0;
        if (bodyBytes > HARD_MAX_API_UPLOAD_BODY_BYTES) {
          bodyComplete = true;
          clearTimeout(timeout);
          if (!res.headersSent) {
            sendErrorResponse(res, 413, 'Request payload exceeds server safety limit');
          }
          req.destroy();
          return;
        }

        body += chunk.toString();
      });

      req.on('end', async () => {
        if (bodyComplete) return; // Already processed
        bodyComplete = true;
        clearTimeout(timeout);

        try {
          const data = JSON.parse(body);
          const { boardId, swimlaneId, listId, cardId, fileData, fileName, fileType } = data;

          // Validate parameters
          if (!boardId || !swimlaneId || !listId || !cardId || !fileData || !fileName) {
            return sendErrorResponse(res, 400, 'Missing required parameters');
          }

          if (typeof fileData !== 'string') {
            return sendErrorResponse(res, 400, 'Invalid fileData format');
          }

          const maxBase64Length = maxBase64LengthForBytes(effectiveApiUploadMaxBytes);
          if (fileData.length > maxBase64Length) {
            return sendErrorResponse(res, 413, 'Attachment exceeds API upload limit');
          }

          // Check if user has permission to modify the card
          const card = await ReactiveCache.getCard(cardId);
          if (!card) {
            return sendErrorResponse(res, 404, 'Card not found');
          }

          const board = await ReactiveCache.getBoard(boardId);
          if (!board) {
            return sendErrorResponse(res, 404, 'Board not found');
          }

          // Verify that the card belongs to the specified board
          if (card.boardId !== boardId) {
            return sendErrorResponse(res, 400, 'Card does not belong to the specified board');
          }

          // Verify that the swimlaneId and listId match the card's actual swimlane and list
          if (card.swimlaneId !== swimlaneId) {
            return sendErrorResponse(res, 400, 'Swimlane ID does not match the card\'s swimlane');
          }

          if (card.listId !== listId) {
            return sendErrorResponse(res, 400, 'List ID does not match the card\'s list');
          }

          // Check permissions: uploading requires write access, not just
          // membership (read-only / comment-only / worker members cannot add
          // attachments).
          if (!(await userHasBoardWriteAccess(board, userId))) {
            return sendErrorResponse(res, 403, 'You do not have permission to modify this card');
          }

          // Check if board allows attachments
          if (!board.allowsAttachments) {
            return sendErrorResponse(res, 403, 'Attachments are not allowed on this board');
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
            return sendErrorResponse(res, 400, 'Invalid storage backend');
          }

          // Create file object from base64 data
          const fileBuffer = Buffer.from(fileData, 'base64');
          if (fileBuffer.length > effectiveApiUploadMaxBytes) {
            return sendErrorResponse(res, 413, 'Attachment exceeds API upload limit');
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

      req.on('error', (error) => {
        clearTimeout(timeout);
        if (!res.headersSent) {
          console.error('Request error:', error);
          sendErrorResponse(res, 400, 'Request error');
        }
      });
    } catch (error) {
      clearTimeout(timeout);
      sendErrorResponse(res, 401, error.message);
    }
  });

  // Upload a board BACKGROUND image (board-level, no card). This is the
  // background counterpart of /api/attachment/upload: it stores a board-level
  // attachment and sets it as the board's active background. Board-admin gated.
  WebApp.handlers.use('/api/attachment/upload-background', async (req, res, next) => {
    if (req.method !== 'POST') {
      return next();
    }
    const timeout = setTimeout(() => {
      if (!res.headersSent) sendErrorResponse(res, 408, 'Request timeout');
    }, 30000);
    try {
      const userId = await authenticateApiRequest(req);
      const { apiUploadBlocked, effectiveApiUploadMaxBytes } = await getApiTransferLimits();
      if (apiUploadBlocked) {
        clearTimeout(timeout);
        return sendErrorResponse(res, 403, 'API uploads are disabled by administrator');
      }

      let body = '';
      let bodyBytes = 0;
      let bodyComplete = false;
      req.on('data', chunk => {
        if (bodyComplete) return;
        bodyBytes += chunk.length || 0;
        if (bodyBytes > HARD_MAX_API_UPLOAD_BODY_BYTES) {
          bodyComplete = true;
          clearTimeout(timeout);
          if (!res.headersSent) sendErrorResponse(res, 413, 'Request payload exceeds server safety limit');
          req.destroy();
          return;
        }
        body += chunk.toString();
      });

      req.on('end', async () => {
        if (bodyComplete) return;
        bodyComplete = true;
        clearTimeout(timeout);
        try {
          const data = JSON.parse(body);
          const { boardId, fileData, fileName, fileType } = data;
          if (!boardId || !fileData || !fileName) {
            return sendErrorResponse(res, 400, 'Missing required parameters');
          }
          if (typeof fileData !== 'string') {
            return sendErrorResponse(res, 400, 'Invalid fileData format');
          }
          if (fileData.length > maxBase64LengthForBytes(effectiveApiUploadMaxBytes)) {
            return sendErrorResponse(res, 413, 'Background exceeds API upload limit');
          }
          const board = await ReactiveCache.getBoard(boardId);
          if (!board) {
            return sendErrorResponse(res, 404, 'Board not found');
          }
          // Managing backgrounds is board-admin (or global admin) gated.
          const isAdmin =
            (board.hasAdmin && board.hasAdmin(userId)) ||
            !!(await ReactiveCache.getUser({ _id: userId, isAdmin: true }));
          if (!isAdmin) {
            return sendErrorResponse(res, 403, 'Board admin required');
          }

          let targetStorage = STORAGE_NAME_FILESYSTEM;
          try {
            const settings = await AttachmentStorageSettings.findOneAsync({});
            targetStorage = settings ? settings.getDefaultStorage() : STORAGE_NAME_FILESYSTEM;
          } catch (error) {
            targetStorage = STORAGE_NAME_FILESYSTEM;
          }
          if (![STORAGE_NAME_FILESYSTEM, STORAGE_NAME_GRIDFS, STORAGE_NAME_S3].includes(targetStorage)) {
            return sendErrorResponse(res, 400, 'Invalid storage backend');
          }

          const fileBuffer = Buffer.from(fileData, 'base64');
          if (fileBuffer.length > effectiveApiUploadMaxBytes) {
            return sendErrorResponse(res, 413, 'Background exceeds API upload limit');
          }
          const file = new File([fileBuffer], fileName, { type: fileType || 'image/png' });
          const fileId = new ObjectId().toString();
          const meta = { boardId, fileId, source: 'api-background', storageBackend: targetStorage };
          const uploader = await Attachments.insertAsync({
            file, meta, isBase64: false, transport: 'http',
          });
          if (!uploader) {
            return sendErrorResponse(res, 500, 'Failed to upload background');
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
          await board.setBackgroundImage(uploader._id);
          const updated = await ReactiveCache.getBoard(boardId);
          sendJsonResponse(res, 200, {
            success: true,
            attachmentId: uploader._id,
            fileName,
            fileSize: fileBuffer.length,
            storageBackend: targetStorage,
            backgroundImageURL: updated ? updated.backgroundImageURL : '',
            message: 'Board background uploaded successfully',
          });
        } catch (error) {
          console.error('API board background upload error:', error);
          sendErrorResponse(res, 500, error.message);
        }
      });

      req.on('error', (error) => {
        clearTimeout(timeout);
        if (!res.headersSent) sendErrorResponse(res, 400, 'Request error');
      });
    } catch (error) {
      clearTimeout(timeout);
      sendErrorResponse(res, 401, error.message);
    }
  });

  // Download a board's current BACKGROUND image (board members), as base64.
  WebApp.handlers.use('/api/attachment/download-background/:boardId', async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }
    try {
      const userId = await authenticateApiRequest(req);
      const { apiDownloadBlocked, effectiveApiDownloadMaxBytes } = await getApiTransferLimits();
      if (apiDownloadBlocked) {
        return sendErrorResponse(res, 403, 'API downloads are disabled by administrator');
      }
      const board = await ReactiveCache.getBoard(req.params.boardId);
      if (!board || !board.hasMember(userId)) {
        return sendErrorResponse(res, 403, 'You do not have permission to access this board');
      }
      const attachmentId = board.backgroundImageId;
      if (!attachmentId) {
        return sendErrorResponse(res, 404, 'Board has no background image set');
      }
      const attachment = await ReactiveCache.getAttachment(attachmentId);
      if (!attachment) {
        return sendErrorResponse(res, 404, 'Background attachment not found');
      }
      const strategy = fileStoreStrategyFactory.getFileStrategy(attachment, 'original');
      const readStream = strategy.getReadStream();
      if (!readStream) {
        return sendErrorResponse(res, 404, 'File not found in storage');
      }
      if (Number.isFinite(attachment.size) && attachment.size > effectiveApiDownloadMaxBytes) {
        return sendErrorResponse(res, 413, 'Background exceeds API download limit');
      }
      const chunks = [];
      let totalBytes = 0;
      let responseSent = false;
      const fail = (statusCode, message) => {
        if (responseSent || res.headersSent) return;
        responseSent = true;
        try { readStream.destroy(); } catch (e) { /* ignore */ }
        sendErrorResponse(res, statusCode, message);
      };
      readStream.on('data', (chunk) => {
        totalBytes += chunk.length || 0;
        if (totalBytes > effectiveApiDownloadMaxBytes) {
          fail(413, 'Background exceeds API download limit');
          return;
        }
        chunks.push(chunk);
      });
      readStream.on('end', () => {
        if (responseSent || res.headersSent) return;
        responseSent = true;
        const fileBuffer = Buffer.concat(chunks);
        sendJsonResponse(res, 200, {
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
        console.error('Background download error:', error);
        sendErrorResponse(res, 500, error.message);
      });
    } catch (error) {
      sendErrorResponse(res, 401, error.message);
    }
  });

  // Download attachment endpoint
  WebApp.handlers.use('/api/attachment/download/:attachmentId', async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const userId = await authenticateApiRequest(req);
      const {
        apiDownloadBlocked,
        effectiveApiDownloadMaxBytes,
      } = await getApiTransferLimits();

      if (apiDownloadBlocked) {
        return sendErrorResponse(res, 403, 'API downloads are disabled by administrator');
      }
      const attachmentId = req.params.attachmentId;

      // Get attachment
      const attachment = await ReactiveCache.getAttachment(attachmentId);
      if (!attachment) {
        return sendErrorResponse(res, 404, 'Attachment not found');
      }

      // Check permissions
      const board = await ReactiveCache.getBoard(attachment.meta.boardId);
      if (!board || !board.hasMember(userId)) {
        return sendErrorResponse(res, 403, 'You do not have permission to access this attachment');
      }

      // Get file strategy
      const strategy = fileStoreStrategyFactory.getFileStrategy(attachment, 'original');
      const readStream = strategy.getReadStream();

      if (!readStream) {
        return sendErrorResponse(res, 404, 'File not found in storage');
      }

      if (Number.isFinite(attachment.size) && attachment.size > effectiveApiDownloadMaxBytes) {
        return sendErrorResponse(res, 413, 'Attachment exceeds API download limit');
      }

      // Read file data
      const chunks = [];
      let totalBytes = 0;
      let responseSent = false;

      const fail = (statusCode, message) => {
        if (responseSent || res.headersSent) {
          return;
        }
        responseSent = true;
        try {
          readStream.destroy();
        } catch (destroyError) {
          // Ignore destroy errors.
        }
        sendErrorResponse(res, statusCode, message);
      };

      readStream.on('data', (chunk) => {
        totalBytes += chunk.length || 0;
        if (totalBytes > effectiveApiDownloadMaxBytes) {
          fail(413, 'Attachment exceeds API download limit');
          return;
        }
        chunks.push(chunk);
      });

      readStream.on('end', () => {
        if (responseSent || res.headersSent) {
          return;
        }
        responseSent = true;
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
  const handleAttachmentList = async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const userId = await authenticateApiRequest(req);
      const boardId = req.params.boardId;
      const swimlaneId = req.params.swimlaneId;
      const listId = req.params.listId;
      const cardId = req.params.cardId;

      // Check permissions
      const board = await ReactiveCache.getBoard(boardId);
      if (!board || !board.hasMember(userId)) {
        return sendErrorResponse(res, 403, 'You do not have permission to access this board');
      }

      // If cardId is provided, verify it belongs to the board
      if (cardId && cardId !== 'null') {
        const card = await ReactiveCache.getCard(cardId);
        if (!card || card.boardId !== boardId) {
          return sendErrorResponse(res, 404, 'Card not found or does not belong to the specified board');
        }
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

      sendJsonResponse(res, 200, {
        success: true,
        attachments: attachmentList,
        count: attachmentList.length
      });
    } catch (error) {
      sendErrorResponse(res, 401, error.message);
    }
  };

  WebApp.handlers.use('/api/attachment/list/:boardId', handleAttachmentList);
  WebApp.handlers.use('/api/attachment/list/:boardId/:swimlaneId', handleAttachmentList);
  WebApp.handlers.use('/api/attachment/list/:boardId/:swimlaneId/:listId', handleAttachmentList);
  WebApp.handlers.use('/api/attachment/list/:boardId/:swimlaneId/:listId/:cardId', handleAttachmentList);
// Board attachments endpoint (legacy)
WebApp.handlers.use('/api/boards/:boardId/attachments', async (req, res, next) => {
  if (req.method !== 'GET') {
    return next();
  }
  try {
    const userId = await authenticateApiRequest(req);
    const boardId = req.params.boardId;
    const board = await ReactiveCache.getBoard(boardId);
    if (!board || !board.hasMember(userId)) {
      return sendErrorResponse(res, 403, 'You do not have permission to access this board');
    }
    const query = { 'meta.boardId': boardId };
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
    sendJsonResponse(res, 200, { success: true, attachments: attachmentList, count: attachmentList.length });
  } catch (error) {
    sendErrorResponse(res, 401, error.message);
  }
});

  // Copy attachment endpoint
  WebApp.handlers.use('/api/attachment/copy', async (req, res, next) => {
    if (req.method !== 'POST') {
      return next();
    }

    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        sendErrorResponse(res, 408, 'Request timeout');
      }
    }, 30000);

    try {
      const userId = await authenticateApiRequest(req);

      // A copy creates a new attachment, so honour the admin API upload limits.
      const {
        apiUploadBlocked,
        effectiveApiUploadMaxBytes,
      } = await getApiTransferLimits();

      if (apiUploadBlocked) {
        clearTimeout(timeout);
        return sendErrorResponse(res, 403, 'API uploads are disabled by administrator');
      }

      let body = '';
      let bodyComplete = false;

      req.on('data', chunk => {
        body += chunk.toString();
        if (body.length > 10 * 1024 * 1024) { // 10MB limit for metadata
          req.connection.destroy();
          clearTimeout(timeout);
        }
      });

      req.on('end', async () => {
        if (bodyComplete) return;
        bodyComplete = true;
        clearTimeout(timeout);

        try {
          const data = JSON.parse(body);
          const { attachmentId, targetBoardId, targetSwimlaneId, targetListId, targetCardId } = data;

          // Get source attachment
          const sourceAttachment = await ReactiveCache.getAttachment(attachmentId);
          if (!sourceAttachment) {
            return sendErrorResponse(res, 404, 'Source attachment not found');
          }

          // Check source permissions (reading the source needs membership)
          const sourceBoard = await ReactiveCache.getBoard(sourceAttachment.meta.boardId);
          if (!sourceBoard || !sourceBoard.hasMember(userId)) {
            return sendErrorResponse(res, 403, 'You do not have permission to access the source attachment');
          }

          // Check target permissions: writing the copy needs write access.
          const targetBoard = await ReactiveCache.getBoard(targetBoardId);
          if (!targetBoard || !(await userHasBoardWriteAccess(targetBoard, userId))) {
            return sendErrorResponse(res, 403, 'You do not have permission to modify the target card');
          }

          // Verify that the target card belongs to the target board
          const targetCard = await ReactiveCache.getCard(targetCardId);
          if (!targetCard) {
            return sendErrorResponse(res, 404, 'Target card not found');
          }

          if (targetCard.boardId !== targetBoardId) {
            return sendErrorResponse(res, 400, 'Target card does not belong to the specified board');
          }

          // Verify that the target swimlaneId and listId match the card's actual swimlane and list
          if (targetCard.swimlaneId !== targetSwimlaneId) {
            return sendErrorResponse(res, 400, 'Target swimlane ID does not match the card\'s swimlane');
          }

          if (targetCard.listId !== targetListId) {
            return sendErrorResponse(res, 400, 'Target list ID does not match the card\'s list');
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

          readStream.on('end', async () => {
            try {
              const fileBuffer = Buffer.concat(chunks);
              if (fileBuffer.length > effectiveApiUploadMaxBytes) {
                return sendErrorResponse(res, 413, 'Attachment exceeds API upload limit');
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

      req.on('error', (error) => {
        clearTimeout(timeout);
        if (!res.headersSent) {
          console.error('Request error:', error);
          sendErrorResponse(res, 400, 'Request error');
        }
      });
    } catch (error) {
      clearTimeout(timeout);
      sendErrorResponse(res, 401, error.message);
    }
  });

  // Move attachment endpoint
  WebApp.handlers.use('/api/attachment/move', async (req, res, next) => {
    if (req.method !== 'POST') {
      return next();
    }

    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        sendErrorResponse(res, 408, 'Request timeout');
      }
    }, 30000);

    try {
      const userId = await authenticateApiRequest(req);

      let body = '';
      let bodyComplete = false;

      req.on('data', chunk => {
        body += chunk.toString();
        if (body.length > 10 * 1024 * 1024) {
          req.connection.destroy();
          clearTimeout(timeout);
        }
      });

      req.on('end', async () => {
        if (bodyComplete) return;
        bodyComplete = true;
        clearTimeout(timeout);

        try {
          const data = JSON.parse(body);
          const { attachmentId, targetBoardId, targetSwimlaneId, targetListId, targetCardId } = data;

          // Get source attachment
          const sourceAttachment = await ReactiveCache.getAttachment(attachmentId);
          if (!sourceAttachment) {
            return sendErrorResponse(res, 404, 'Source attachment not found');
          }

          // Check source permissions: a move removes the attachment from the
          // source board, so it requires write access there.
          const sourceBoard = await ReactiveCache.getBoard(sourceAttachment.meta.boardId);
          if (!sourceBoard || !(await userHasBoardWriteAccess(sourceBoard, userId))) {
            return sendErrorResponse(res, 403, 'You do not have permission to access the source attachment');
          }

          // Check target permissions: a move adds the attachment to the target
          // board, so it requires write access there too.
          const targetBoard = await ReactiveCache.getBoard(targetBoardId);
          if (!targetBoard || !(await userHasBoardWriteAccess(targetBoard, userId))) {
            return sendErrorResponse(res, 403, 'You do not have permission to modify the target card');
          }

          // Verify that the target card belongs to the target board
          const targetCard = await ReactiveCache.getCard(targetCardId);
          if (!targetCard) {
            return sendErrorResponse(res, 404, 'Target card not found');
          }

          if (targetCard.boardId !== targetBoardId) {
            return sendErrorResponse(res, 400, 'Target card does not belong to the specified board');
          }

          // Verify that the target swimlaneId and listId match the card's actual swimlane and list
          if (targetCard.swimlaneId !== targetSwimlaneId) {
            return sendErrorResponse(res, 400, 'Target swimlane ID does not match the card\'s swimlane');
          }

          if (targetCard.listId !== targetListId) {
            return sendErrorResponse(res, 400, 'Target list ID does not match the card\'s list');
          }

          // Check if target board allows attachments
          if (!targetBoard.allowsAttachments) {
            return sendErrorResponse(res, 403, 'Attachments are not allowed on the target board');
          }

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

      req.on('error', (error) => {
        clearTimeout(timeout);
        if (!res.headersSent) {
          console.error('Request error:', error);
          sendErrorResponse(res, 400, 'Request error');
        }
      });
    } catch (error) {
      clearTimeout(timeout);
      sendErrorResponse(res, 401, error.message);
    }
  });

  // Delete attachment endpoint
  WebApp.handlers.use('/api/attachment/delete/:attachmentId', async (req, res, next) => {
    if (req.method !== 'DELETE') {
      return next();
    }

    try {
      const userId = await authenticateApiRequest(req);
      const attachmentId = req.params.attachmentId;

      // Get attachment
      const attachment = await ReactiveCache.getAttachment(attachmentId);
      if (!attachment) {
        return sendErrorResponse(res, 404, 'Attachment not found');
      }

      // Check permissions: deleting requires write access, not just membership.
      const board = await ReactiveCache.getBoard(attachment.meta.boardId);
      if (!board || !(await userHasBoardWriteAccess(board, userId))) {
        return sendErrorResponse(res, 403, 'You do not have permission to delete this attachment');
      }

      // Delete attachment
      await Attachments.removeAsync(attachmentId);

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
  WebApp.handlers.use('/api/attachment/info/:attachmentId', async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const userId = await authenticateApiRequest(req);
      const attachmentId = req.params.attachmentId;

      // Get attachment
      const attachment = await ReactiveCache.getAttachment(attachmentId);
      if (!attachment) {
        return sendErrorResponse(res, 404, 'Attachment not found');
      }

      // Check permissions
      const board = await ReactiveCache.getBoard(attachment.meta.boardId);
      if (!board || !board.hasMember(userId)) {
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

export {
  authenticateApiRequest,
  findOrCreateHeaderLoginUser,
  isTrustedHeaderLoginSource,
};
