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
      res.setHeader('Content-Disposition', `attachment; filename="${attachment.name}"`);

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
