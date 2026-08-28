/**
 * Avatar File Server
 * Handles serving avatar files from the /cdn/storage/avatars/ path
 */

import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { getUserIdFromRequest, parseQuery } from '/server/lib/requestUser';
import { ReactiveCache } from '/imports/reactiveCache';
import Avatars from '/models/avatars';
import { fileStoreStrategyFactory } from '/models/avatars.server';
import { getOldAttachmentData, getOldAttachmentStream } from '/models/lib/attachmentBackwardCompatibility';
const { fileResponsePolicy } = require('/models/lib/fileResponseSafety');

function setAvatarResponseHeaders(res, type) {
  const policy = fileResponsePolicy(type || 'image/jpeg');
  res.setHeader('Content-Type', policy.contentType);
  for (const [name, value] of Object.entries(policy.headers)) {
    res.setHeader(name, value);
  }
  if (policy.forceDownload) {
    res.setHeader('Content-Disposition', 'attachment');
  }
}

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
  setAvatarResponseHeaders(res, legacy.type);
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

// May a caller who is NOT signed in see this avatar?
//
// Only on a public board, and only for somebody who is on it. The client appends
// ?boardId= to every avatar URL it renders for exactly this case - see the
// avatarUrl helper in client/components/users/userAvatar.js, whose own comment
// says "so public viewers can access avatars on public boards" - and this route
// ignored the parameter, so a public board showed the missing-picture icon to
// every visitor who was not logged in.
//
// The board has to be named AND public AND actually have the avatar's owner on
// it. Without that last part, naming any public board would unlock any avatar on
// the instance, which is not what a public board publishes.
async function avatarIsOnAPublicBoard(req, avatar) {
  const boardId = parseQuery(req).boardId;
  if (!boardId || !avatar || !avatar.userId) {
    return false;
  }
  const board = await ReactiveCache.getBoard(boardId);
  return !!(board && board.isPublic() && board.hasMember(avatar.userId));
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
    // For avatars, we allow viewing by any logged-in user.
    //
    // Resolved FROM THE REQUEST. This was `Meteor.userId()`, which reads the
    // current DDP invocation's environment - it exists in a method or a
    // publication and not in a WebApp handler, where it THROWS
    // ("Meteor.userId can only be invoked in method calls or publications").
    // The catch at the bottom of this handler turned that into a 500, so no
    // avatar served through this route ever reached anybody, and it looked like
    // a broken image rather than broken authentication. That is what a 6.x
    // upgrade shows as lost profile pictures: `/cfs/files/avatars/<id>` is
    // redirected here, and here is where it died - the migrated file itself was
    // fine.
    const userId = await getUserIdFromRequest(req);
    if (!userId && !(await avatarIsOnAPublicBoard(req, avatar))) {
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
    setAvatarResponseHeaders(res, avatar.type);
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

    // Not a legacy avatar — redirect to the new avatar URL format, KEEPING the
    // query string. A redirect that drops it drops ?boardId=, which is how a
    // visitor who is not signed in is allowed to see an avatar on a public board
    // at all - and this is the redirect every migrated 6.x avatar URL goes
    // through, so losing it there would 401 exactly the installs this fixes.
    const query = (req.url || '').split('?')[1];
    const newUrl = `/cdn/storage/avatars/${fileName}${query ? `?${query}` : ''}`;
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
