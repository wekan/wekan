import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { getUserIdFromRequest } from '/server/lib/requestUser';
import { mayReadBoardAttachment } from '/server/lib/assignedOnlyAttachments';
import { ReactiveCache } from '/imports/reactiveCache';
import { getAttachmentWithBackwardCompatibility, getOldAttachmentStream } from '/models/lib/attachmentBackwardCompatibility';
import { canReadBoard } from '/models/lib/boardVisibility';
const { fileResponsePolicy, fileNameIsBrowserExecutable } = require('/models/lib/fileResponseSafety');
import { sanitizeFilenameForHeader, buildContentDispositionHeader } from '/server/lib/contentDisposition';

// Ensure this file is loaded
if (process.env.DEBUG === 'true') {
  console.log('Legacy attachments route loaded');
}

/**
 * Legacy attachment download route for CollectionFS compatibility
 * Handles downloads from old CollectionFS structure
 */

if (Meteor.isServer) {
  // Handle legacy attachment downloads
  WebApp.handlers.use('/cfs/files/attachments', async (req, res, next) => {
    // Downloads only: other methods reached this duplicate route after the
    // universal file server passed them on (CacheBleed sibling, 2026-10-02).
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    const attachmentId = req.url.split('/').pop();

    if (!attachmentId) {
      res.writeHead(404);
      res.end('Attachment not found');
      return;
    }

    try {
      // Try to get attachment with backward compatibility
      const attachment = await getAttachmentWithBackwardCompatibility(attachmentId);

      if (!attachment) {
        res.writeHead(404);
        res.end('Attachment not found');
        return;
      }

      // Check permissions
      const board = await ReactiveCache.getBoard(attachment.meta.boardId);
      if (!board) {
        res.writeHead(404);
        res.end('Board not found');
        return;
      }

      // Check if user has permission to download
      // From the REQUEST, not Meteor.userId(): this is a WebApp handler, where
      // that throws rather than returning null (see server/lib/requestUser.js).
      const userId = await getUserIdFromRequest(req);
      // Membership is not enough: an assigned-only member reads only their
      // own cards' files (AssignedBleed, GHSA-3cgr-47wm-9cc9).
      if (!canReadBoard(userId, board) ||
          !(await mayReadBoardAttachment(board, userId, attachment, 'legacy-attachments:download'))) {
        res.writeHead(403);
        res.end('Access denied');
        return;
      }

      // Set appropriate headers
      res.setHeader('Content-Length', attachment.size || 0);
      // CacheBleed: served after an access check, so never shared-cacheable.
      require('/models/lib/fileCacheHeaders').setPrivateFileCacheHeaders(res);

      // Treat every browser-executable MIME type like SVG: serve it as an
      // opaque download under a sandbox, regardless of untrusted stored type.
      // LegacyAttachBleed (GHSA-xcxp-hx9w-q5q9): by NAME too, for every
      // browser-executable extension - not only .svg - as models/lib/httpStream.js does.
      const policy = fileResponsePolicy(attachment.type, fileNameIsBrowserExecutable(attachment.name));
      res.setHeader('Content-Type', policy.contentType);
      res.setHeader('Content-Disposition', buildContentDispositionHeader('attachment', sanitizeFilenameForHeader(attachment.name)));
      for (const [name, value] of Object.entries(policy.headers)) {
        res.setHeader(name, value);
      }

      // Get GridFS stream for legacy attachment
      const fileStream = await getOldAttachmentStream(attachmentId);
      // An SVG is sent whole and sanitized - this route always serves a
      // download, and a saved file opened from the disk must run nothing either.
      if (fileStream && require('/server/lib/svgResponse').isSvg(attachment.type, attachment.name)) {
        await require('/server/lib/svgResponse').sendInlineSvg(res, fileStream, {
          download: true, fileName: attachment.name,
          downloadHeaders: () => {},
        });
        return;
      }
      if (fileStream) {
        res.writeHead(200);
        fileStream.pipe(res);
      } else {
        res.writeHead(404);
        res.end('File not found in GridFS');
      }

    } catch (error) {
      console.error('Error serving legacy attachment:', error);
      res.writeHead(500);
      res.end('Internal server error');
    }
  });
}
