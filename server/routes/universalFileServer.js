/**
 * Universal File Server
 * Ensures all attachments and avatars are always visible regardless of ROOT_URL and PORT settings
 * Handles both new Meteor-Files and legacy CollectionFS file serving
 */

import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { ReactiveCache } from '/imports/reactiveCache';
import Attachments from '/models/attachments';
import Avatars from '/models/avatars';
import { fileStoreStrategyFactory } from '/models/lib/fileStoreStrategy';
import { getAttachmentWithBackwardCompatibility, getOldAttachmentStream } from '/models/lib/attachmentBackwardCompatibility';
import fs from 'fs';
import path from 'path';

if (Meteor.isServer) {
  console.log('Universal file server initializing...');

  /**
   * Helper function to set appropriate headers for file serving
   */
  function setFileHeaders(res, fileObj, isAttachment = false) {
    // Set content type
    res.setHeader('Content-Type', fileObj.type || (isAttachment ? 'application/octet-stream' : 'image/jpeg'));
    
    // Set content length
    res.setHeader('Content-Length', fileObj.size || 0);
    
    // Set cache headers
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.setHeader('ETag', `"${fileObj._id}"`);
    
    // Set security headers for attachments
    if (isAttachment) {
      const isSvgFile = fileObj.name && fileObj.name.toLowerCase().endsWith('.svg');
      const disposition = isSvgFile ? 'attachment' : 'inline';
      res.setHeader('Content-Disposition', `${disposition}; filename="${fileObj.name}"`);
      
      // Add security headers for SVG files
      if (isSvgFile) {
        res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'none'; object-src 'none';");
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
      }
    }
  }

  /**
   * Helper function to handle conditional requests
   */
  function handleConditionalRequest(req, res, fileObj) {
    const ifNoneMatch = req.headers['if-none-match'];
    if (ifNoneMatch && ifNoneMatch === `"${fileObj._id}"`) {
      res.writeHead(304);
      res.end();
      return true;
    }
    return false;
  }

  /**
   * Helper function to stream file with error handling
   */
  function streamFile(res, readStream, fileObj) {
    readStream.on('error', (error) => {
      console.error('File stream error:', error);
      if (!res.headersSent) {
        res.writeHead(500);
        res.end('Error reading file');
      }
    });

    readStream.on('end', () => {
      if (!res.headersSent) {
        res.writeHead(200);
      }
    });

    readStream.pipe(res);
  }

  // ============================================================================
  // NEW METEOR-FILES ROUTES (URL-agnostic)
  // ============================================================================

  /**
   * Serve attachments from new Meteor-Files structure
   * Route: /cdn/storage/attachments/{fileId} or /cdn/storage/attachments/{fileId}/original/{filename}
   */
  WebApp.connectHandlers.use('/cdn/storage/attachments/([^/]+)(?:/original/[^/]+)?', (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const fileId = req.params[0];
      
      if (!fileId) {
        res.writeHead(400);
        res.end('Invalid attachment file ID');
        return;
      }

      // Get attachment from database
      const attachment = ReactiveCache.getAttachment(fileId);
      if (!attachment) {
        res.writeHead(404);
        res.end('Attachment not found');
        return;
      }

      // Check permissions
      const board = ReactiveCache.getBoard(attachment.meta.boardId);
      if (!board) {
        res.writeHead(404);
        res.end('Board not found');
        return;
      }

      // Check if user has permission to download
      const userId = Meteor.userId();
      if (!board.isPublic() && (!userId || !board.hasMember(userId))) {
        res.writeHead(403);
        res.end('Access denied');
        return;
      }

      // Handle conditional requests
      if (handleConditionalRequest(req, res, attachment)) {
        return;
      }

      // Get file strategy and stream
      const strategy = fileStoreStrategyFactory.getFileStrategy(attachment, 'original');
      const readStream = strategy.getReadStream();

      if (!readStream) {
        res.writeHead(404);
        res.end('Attachment file not found in storage');
        return;
      }

      // Set headers and stream file
      setFileHeaders(res, attachment, true);
      streamFile(res, readStream, attachment);

    } catch (error) {
      console.error('Attachment server error:', error);
      if (!res.headersSent) {
        res.writeHead(500);
        res.end('Internal server error');
      }
    }
  });

  /**
   * Serve avatars from new Meteor-Files structure
   * Route: /cdn/storage/avatars/{fileId} or /cdn/storage/avatars/{fileId}/original/{filename}
   */
  WebApp.connectHandlers.use('/cdn/storage/avatars/([^/]+)(?:/original/[^/]+)?', (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const fileId = req.params[0];
      
      if (!fileId) {
        res.writeHead(400);
        res.end('Invalid avatar file ID');
        return;
      }

      // Get avatar from database
      const avatar = ReactiveCache.getAvatar(fileId);
      if (!avatar) {
        res.writeHead(404);
        res.end('Avatar not found');
        return;
      }

      // Check if user has permission to view this avatar
      // For avatars, we allow viewing by any logged-in user
      const userId = Meteor.userId();
      if (!userId) {
        res.writeHead(401);
        res.end('Authentication required');
        return;
      }

      // Handle conditional requests
      if (handleConditionalRequest(req, res, avatar)) {
        return;
      }

      // Get file strategy and stream
      const strategy = fileStoreStrategyFactory.getFileStrategy(avatar, 'original');
      const readStream = strategy.getReadStream();

      if (!readStream) {
        res.writeHead(404);
        res.end('Avatar file not found in storage');
        return;
      }

      // Set headers and stream file
      setFileHeaders(res, avatar, false);
      streamFile(res, readStream, avatar);

    } catch (error) {
      console.error('Avatar server error:', error);
      if (!res.headersSent) {
        res.writeHead(500);
        res.end('Internal server error');
      }
    }
  });

  // ============================================================================
  // LEGACY COLLECTIONFS ROUTES (Backward compatibility)
  // ============================================================================

  /**
   * Serve legacy attachments from CollectionFS structure
   * Route: /cfs/files/attachments/{attachmentId}
   */
  WebApp.connectHandlers.use('/cfs/files/attachments/([^/]+)', (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const attachmentId = req.params[0];
      
      if (!attachmentId) {
        res.writeHead(400);
        res.end('Invalid attachment ID');
        return;
      }

      // Try to get attachment with backward compatibility
      const attachment = getAttachmentWithBackwardCompatibility(attachmentId);
      if (!attachment) {
        res.writeHead(404);
        res.end('Attachment not found');
        return;
      }

      // Check permissions
      const board = ReactiveCache.getBoard(attachment.meta.boardId);
      if (!board) {
        res.writeHead(404);
        res.end('Board not found');
        return;
      }

      // Check if user has permission to download
      const userId = Meteor.userId();
      if (!board.isPublic() && (!userId || !board.hasMember(userId))) {
        res.writeHead(403);
        res.end('Access denied');
        return;
      }

      // Handle conditional requests
      if (handleConditionalRequest(req, res, attachment)) {
        return;
      }

      // For legacy attachments, try to get GridFS stream
      const fileStream = getOldAttachmentStream(attachmentId);
      if (fileStream) {
        setFileHeaders(res, attachment, true);
        streamFile(res, fileStream, attachment);
      } else {
        res.writeHead(404);
        res.end('Legacy attachment file not found in GridFS');
      }

    } catch (error) {
      console.error('Legacy attachment server error:', error);
      if (!res.headersSent) {
        res.writeHead(500);
        res.end('Internal server error');
      }
    }
  });

  /**
   * Serve legacy avatars from CollectionFS structure
   * Route: /cfs/files/avatars/{avatarId}
   */
  WebApp.connectHandlers.use('/cfs/files/avatars/([^/]+)', (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const avatarId = req.params[0];
      
      if (!avatarId) {
        res.writeHead(400);
        res.end('Invalid avatar ID');
        return;
      }

      // Try to get avatar from database (new structure first)
      let avatar = ReactiveCache.getAvatar(avatarId);
      
      // If not found in new structure, try to handle legacy format
      if (!avatar) {
        // For legacy avatars, we might need to handle different ID formats
        // This is a fallback for old CollectionFS avatars
        res.writeHead(404);
        res.end('Avatar not found');
        return;
      }

      // Check if user has permission to view this avatar
      const userId = Meteor.userId();
      if (!userId) {
        res.writeHead(401);
        res.end('Authentication required');
        return;
      }

      // Handle conditional requests
      if (handleConditionalRequest(req, res, avatar)) {
        return;
      }

      // Get file strategy and stream
      const strategy = fileStoreStrategyFactory.getFileStrategy(avatar, 'original');
      const readStream = strategy.getReadStream();

      if (!readStream) {
        res.writeHead(404);
        res.end('Avatar file not found in storage');
        return;
      }

      // Set headers and stream file
      setFileHeaders(res, avatar, false);
      streamFile(res, readStream, avatar);

    } catch (error) {
      console.error('Legacy avatar server error:', error);
      if (!res.headersSent) {
        res.writeHead(500);
        res.end('Internal server error');
      }
    }
  });

  // ============================================================================
  // ALTERNATIVE ROUTES (For different URL patterns)
  // ============================================================================

  /**
   * Alternative attachment route for different URL patterns
   * Route: /attachments/{fileId}
   */
  WebApp.connectHandlers.use('/attachments/([^/]+)', (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    // Redirect to standard route
    const fileId = req.params[0];
    const newUrl = `/cdn/storage/attachments/${fileId}`;
    res.writeHead(301, { 'Location': newUrl });
    res.end();
  });

  /**
   * Alternative avatar route for different URL patterns
   * Route: /avatars/{fileId}
   */
  WebApp.connectHandlers.use('/avatars/([^/]+)', (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    // Redirect to standard route
    const fileId = req.params[0];
    const newUrl = `/cdn/storage/avatars/${fileId}`;
    res.writeHead(301, { 'Location': newUrl });
    res.end();
  });

  console.log('Universal file server initialized successfully');
}
