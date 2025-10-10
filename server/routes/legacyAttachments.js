import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { ReactiveCache } from '/imports/reactiveCache';
import { getAttachmentWithBackwardCompatibility, getOldAttachmentStream } from '/models/lib/attachmentBackwardCompatibility';

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
  WebApp.connectHandlers.use('/cfs/files/attachments', (req, res, next) => {
    const attachmentId = req.url.split('/').pop();

    if (!attachmentId) {
      res.writeHead(404);
      res.end('Attachment not found');
      return;
    }

    try {
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

      // Set appropriate headers
      res.setHeader('Content-Type', attachment.type || 'application/octet-stream');
      res.setHeader('Content-Length', attachment.size || 0);

      // Force attachment disposition for SVG files to prevent XSS attacks
      const isSvgFile = attachment.name && attachment.name.toLowerCase().endsWith('.svg');
      const disposition = isSvgFile ? 'attachment' : 'attachment'; // Always use attachment for legacy files
      res.setHeader('Content-Disposition', `${disposition}; filename="${attachment.name}"`);

      // Add security headers for SVG files
      if (isSvgFile) {
        res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'none'; object-src 'none';");
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
      }

      // Get GridFS stream for legacy attachment
      const fileStream = getOldAttachmentStream(attachmentId);
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
