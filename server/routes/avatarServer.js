/**
 * Avatar File Server
 * Handles serving avatar files from the /cdn/storage/avatars/ path
 */

import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { ReactiveCache } from '/imports/reactiveCache';
import Avatars from '/models/avatars';
import { fileStoreStrategyFactory } from '/models/lib/fileStoreStrategy';
import fs from 'fs';
import path from 'path';

if (Meteor.isServer) {
  // Handle avatar file downloads
  WebApp.connectHandlers.use('/cdn/storage/avatars/([^/]+)', (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const fileName = req.params[0];

      if (!fileName) {
        res.writeHead(400);
        res.end('Invalid avatar file name');
        return;
      }

      // Extract file ID from filename (format: fileId-original-filename)
      const fileId = fileName.split('-original-')[0];

      if (!fileId) {
        res.writeHead(400);
        res.end('Invalid avatar file format');
        return;
      }

      // Get avatar file from database
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

      // Get file strategy
      const strategy = fileStoreStrategyFactory.getFileStrategy(avatar, 'original');
      const readStream = strategy.getReadStream();

      if (!readStream) {
        res.writeHead(404);
        res.end('Avatar file not found in storage');
        return;
      }

      // Set appropriate headers
      res.setHeader('Content-Type', avatar.type || 'image/jpeg');
      res.setHeader('Content-Length', avatar.size || 0);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      res.setHeader('ETag', `"${avatar._id}"`);

      // Handle conditional requests
      const ifNoneMatch = req.headers['if-none-match'];
      if (ifNoneMatch && ifNoneMatch === `"${avatar._id}"`) {
        res.writeHead(304);
        res.end();
        return;
      }

      // Stream the file
      res.writeHead(200);
      readStream.pipe(res);

      readStream.on('error', (error) => {
        console.error('Avatar stream error:', error);
        if (!res.headersSent) {
          res.writeHead(500);
          res.end('Error reading avatar file');
        }
      });

    } catch (error) {
      console.error('Avatar server error:', error);
      if (!res.headersSent) {
        res.writeHead(500);
        res.end('Internal server error');
      }
    }
  });

  // Handle legacy avatar URLs (from CollectionFS)
  WebApp.connectHandlers.use('/cfs/files/avatars/([^/]+)', (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const fileName = req.params[0];

      // Redirect to new avatar URL format
      const newUrl = `/cdn/storage/avatars/${fileName}`;
      res.writeHead(301, { 'Location': newUrl });
      res.end();

    } catch (error) {
      console.error('Legacy avatar redirect error:', error);
      res.writeHead(500);
      res.end('Internal server error');
    }
  });

  console.log('Avatar server routes initialized');
}
