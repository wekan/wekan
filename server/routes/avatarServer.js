/**
 * Avatar File Server
 * Handles serving avatar files from the /cdn/storage/avatars/ path
 */

import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { ReactiveCache } from '/imports/reactiveCache';
import Avatars from '/models/avatars';
import { fileStoreStrategyFactory } from '/models/avatars.server';
import { getOldAttachmentData, getOldAttachmentStream } from '/models/lib/attachmentBackwardCompatibility';

// Serve a legacy CollectionFS avatar (cfs.avatars.filerecord + cfs_gridfs.avatars
// bucket) in place, without migrating it. Returns true when it handled the
// response, false when there is no such legacy avatar.
async function serveLegacyAvatar(fileId, req, res) {
  const legacy = await getOldAttachmentData(fileId, 'avatars');
  if (!legacy) {
    return false;
  }
  const stream = await getOldAttachmentStream(fileId, 'avatars');
  if (!stream) {
    return false;
  }
  res.setHeader('Content-Type', legacy.type || 'image/jpeg');
  if (legacy.size) res.setHeader('Content-Length', legacy.size);
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  res.setHeader('ETag', `"${legacy._id}"`);
  const ifNoneMatch = req.headers['if-none-match'];
  if (ifNoneMatch && ifNoneMatch === `"${legacy._id}"`) {
    res.writeHead(304);
    res.end();
    return true;
  }
  res.writeHead(200);
  stream.pipe(res);
  stream.on('error', (error) => {
    console.error('Legacy avatar stream error:', error);
    if (!res.headersSent) {
      res.writeHead(500);
      res.end('Error reading avatar file');
    }
  });
  return true;
}

// Handle avatar file downloads
WebApp.handlers.use('/cdn/storage/avatars/:fileName', async (req, res, next) => {
  if (req.method !== 'GET') {
    return next();
  }

  try {
    const fileName = req.params.fileName;

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
    const avatar = await ReactiveCache.getAvatar(fileId);
    if (!avatar) {
      // Fall back to a legacy CollectionFS avatar (read in place).
      if (await serveLegacyAvatar(fileId, req, res)) {
        return;
      }
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

// Handle legacy avatar URLs (from CollectionFS). user.profile.avatarUrl for
// migrated-from-6.x installs is '/cfs/files/avatars/<filerecordId>', so serve
// the CollectionFS binary in place. If it isn't a legacy avatar, fall back to
// redirecting to the new URL format (e.g. for already-migrated avatars).
WebApp.handlers.use('/cfs/files/avatars/:fileName', async (req, res, next) => {
  if (req.method !== 'GET') {
    return next();
  }

  try {
    const fileName = req.params.fileName;
    // The legacy URL carries the filerecord _id directly; tolerate the
    // '<id>-original-<name>' form too.
    const fileId = fileName.split('-original-')[0] || fileName;

    if (await serveLegacyAvatar(fileId, req, res)) {
      return;
    }

    // Not a legacy avatar — redirect to the new avatar URL format.
    const newUrl = `/cdn/storage/avatars/${fileName}`;
    res.writeHead(301, { 'Location': newUrl });
    res.end();

  } catch (error) {
    console.error('Legacy avatar serve error:', error);
    if (!res.headersSent) {
      res.writeHead(500);
      res.end('Internal server error');
    }
  }
});

console.log('Avatar server routes initialized');
