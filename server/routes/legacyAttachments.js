import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { ReactiveCache } from '/imports/reactiveCache';
import { getAttachmentWithBackwardCompatibility, getOldAttachmentStream } from '/models/lib/attachmentBackwardCompatibility';

// Ensure this file is loaded
if (process.env.DEBUG === 'true') {
  console.log('Legacy attachments route loaded');
}

/**
 * Helper function to properly encode a filename for the Content-Disposition header
 * Removes invalid characters (control chars, newlines, etc.) that would break HTTP headers.
 * For non-ASCII filenames, uses RFC 5987 encoding to preserve the original filename.
 * This prevents ERR_INVALID_CHAR errors when filenames contain control characters.
 */
function sanitizeFilenameForHeader(filename) {
  if (!filename || typeof filename !== 'string') {
    return 'download';
  }

  // First, remove any control characters (0x00-0x1F, 0x7F) that would break HTTP headers
  // This includes newlines, carriage returns, tabs, and other control chars
  let sanitized = filename.replace(/[\x00-\x1F\x7F]/g, '');

  // If the filename is all ASCII printable characters (0x20-0x7E), use it directly
  if (/^[\x20-\x7E]*$/.test(sanitized)) {
    // Escape any quotes and backslashes in the filename
    sanitized = sanitized.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return sanitized;
  }

  // For non-ASCII filenames, provide a fallback and RFC 5987 encoded version
  const fallback = sanitized.replace(/[^\x20-\x7E]/g, '_').slice(0, 100) || 'download';
  const encoded = encodeURIComponent(sanitized);

  // Return special marker format that will be handled by buildContentDispositionHeader
  // Format: "fallback|RFC5987:encoded"
  return `${fallback}|RFC5987:${encoded}`;
}

/**
 * Helper function to build a complete Content-Disposition header value with RFC 5987 support
 * Handles the special format returned by sanitizeFilenameForHeader for non-ASCII filenames
 */
function buildContentDispositionHeader(disposition, sanitizedFilename) {
  if (sanitizedFilename.includes('|RFC5987:')) {
    const [fallback, encoded] = sanitizedFilename.split('|RFC5987:');
    return `${disposition}; filename="${fallback}"; filename*=UTF-8''${encoded}`;
  }
  return `${disposition}; filename="${sanitizedFilename}"`;
}

/**
 * Legacy attachment download route for CollectionFS compatibility
 * Handles downloads from old CollectionFS structure
 */

if (Meteor.isServer) {
  // Handle legacy attachment downloads
  WebApp.connectHandlers.use('/cfs/files/attachments', async (req, res, next) => {
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
      const board = await ReactiveCache.getBoard(attachment.meta.boardId);
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
      res.setHeader('Content-Disposition', buildContentDispositionHeader(disposition, sanitizeFilenameForHeader(attachment.name)));

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
