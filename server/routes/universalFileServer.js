/**
 * Universal File Server
 * Ensures all attachments and avatars are always visible regardless of ROOT_URL and PORT settings
 * Handles both new Meteor-Files and legacy CollectionFS file serving
 */

import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { ReactiveCache } from '/imports/reactiveCache';
import { Accounts } from 'meteor/accounts-base';
import Attachments from '/models/attachments';
import AttachmentStorageSettings from '/models/attachmentStorageSettings';
import { STORAGE_NAME_GRIDFS } from '/models/lib/fileStoreConstants';
import { fileStoreStrategyFactory as attachmentStoreFactory } from '/models/attachments.server';
import Avatars from '/models/avatars';
import { fileStoreStrategyFactory as avatarStoreFactory } from '/models/avatars.server';
const { sanitizeDownloadFileName } = require('/imports/lib/fileNameDisplay');
import Boards from '/models/boards';
import { getAttachmentWithBackwardCompatibility, getOldAttachmentStream } from '/models/lib/attachmentBackwardCompatibility';
import fs from 'fs';
import path from 'path';

function parseNonNegativeInt(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
}

async function getAttachmentDownloadLimitSettings() {
  const fallbackMaxBytes = parseNonNegativeInt(process.env.ATTACHMENT_API_MAX_DOWNLOAD_BYTES, 0);

  try {
    const settings = await AttachmentStorageSettings.findOneAsync({});
    const blocked = settings?.limitSettings?.attachmentsDownloadBlocked === true;
    const configuredLimit = settings?.limitSettings?.attachmentsDownloadMaxBytes;
    if (Number.isFinite(configuredLimit) && configuredLimit >= 0) {
      return {
        blocked,
        maxBytes: configuredLimit,
      };
    }

    // Backward compatibility: if no dedicated value exists, reuse API download limit when present.
    const apiDownloadFallback = settings?.limitSettings?.apiDownloadMaxBytes;
    if (Number.isFinite(apiDownloadFallback) && apiDownloadFallback >= 0) {
      return {
        blocked,
        maxBytes: apiDownloadFallback,
      };
    }

    return {
      blocked,
      maxBytes: fallbackMaxBytes,
    };
  } catch (error) {
    if (process.env.DEBUG === 'true') {
      console.warn('Could not load attachment download limit from settings:', error);
    }
  }

  return {
    blocked: false,
    maxBytes: fallbackMaxBytes,
  };
}

if (Meteor.isServer) {
  console.log('Universal file server initializing...');

  /**
   * Helper function to set appropriate headers for file serving
   */
  function setFileHeaders(res, fileObj, isAttachment = false) {
    // Decide safe serving strategy
    const nameLower = (fileObj.name || '').toLowerCase();
    const typeLower = (fileObj.type || '').toLowerCase();
    const isPdfByExt = nameLower.endsWith('.pdf');

    // Define dangerous types that must never be served inline
    const dangerousTypes = new Set([
      'text/html',
      'application/xhtml+xml',
      'image/svg+xml',
      'text/xml',
      'application/xml',
      'application/javascript',
      'text/javascript'
    ]);

    // Define safe types that can be served inline for viewing
    const safeInlineTypes = new Set([
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/avif',
      'image/bmp',
      'video/mp4',
      'video/webm',
      'video/ogg',
      'audio/mpeg',
      'audio/mp3',
      'audio/ogg',
      'audio/wav',
      'audio/webm',
      'text/plain',
      'application/json'
    ]);

    const isSvg = nameLower.endsWith('.svg') || typeLower === 'image/svg+xml';
  const isDangerous = dangerousTypes.has(typeLower) || isSvg;
  // Consider PDF safe inline by extension if type is missing/mis-set
  const isSafeInline = safeInlineTypes.has(typeLower) || (isAttachment && isPdfByExt);

    // Always send strong caching and integrity headers
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    res.setHeader('ETag', `"${fileObj._id}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Set content length when available
    if (fileObj.size) {
      res.setHeader('Content-Length', fileObj.size);
    }

    if (isAttachment) {
      // Attachments: dangerous types forced to download, safe types can be inline
      if (isDangerous) {
        // SECURITY: Force download for dangerous types to prevent XSS
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', buildContentDispositionHeader('attachment', sanitizeFilenameForHeader(fileObj.name)));
        res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox;");
        res.setHeader('X-Frame-Options', 'DENY');
      } else if (isSafeInline) {
        // Safe types: serve inline with proper type and restrictive CSP
        // If the file is a PDF by extension but type is wrong/missing, correct it
        const finalType = (isPdfByExt && typeLower !== 'application/pdf') ? 'application/pdf' : (typeLower || 'application/octet-stream');
        res.setHeader('Content-Type', finalType);
        res.setHeader('Content-Disposition', buildContentDispositionHeader('inline', sanitizeFilenameForHeader(fileObj.name)));
        // Restrictive CSP for safe types - allow media/img/object for viewer embeds, no scripts
        res.setHeader('Content-Security-Policy', "default-src 'none'; object-src 'self'; media-src 'self'; img-src 'self'; style-src 'unsafe-inline';");
      } else {
        // Unknown types: force download as fallback
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', buildContentDispositionHeader('attachment', sanitizeFilenameForHeader(fileObj.name)));
        res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox;");
      }
    } else {
      // Avatars: allow inline images, but never serve SVG inline
      if (isSvg || isDangerous) {
        // Serve potentially dangerous avatar types as downloads instead
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', buildContentDispositionHeader('attachment', sanitizeFilenameForHeader(fileObj.name)));
        res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox;");
        res.setHeader('X-Frame-Options', 'DENY');
      } else {
        // For typical image avatars, use provided type if present, otherwise fall back to a safe generic image type
        res.setHeader('Content-Type', typeLower || 'image/jpeg');
        res.setHeader('Content-Disposition', buildContentDispositionHeader('inline', sanitizeFilenameForHeader(fileObj.name)));
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
   * Extract first path segment (file id) from request URL.
   * Works whether req.url is the full path or already trimmed by the mount path.
   */
  function extractFirstIdFromUrl(req, mountPrefix) {
    // Strip query string
    let urlPath = (req.url || '').split('?')[0];
    // If url still contains the mount prefix, remove it
    if (mountPrefix && urlPath.startsWith(mountPrefix)) {
      urlPath = urlPath.slice(mountPrefix.length);
    }
    // Ensure leading slash removed for splitting
    if (urlPath.startsWith('/')) {
      urlPath = urlPath.slice(1);
    }
    const parts = urlPath.split('/').filter(Boolean);
    return parts[0] || null;
  }

  /**
   * Check if the request explicitly asks to download the file
   * Recognizes ?download=true or ?download=1 (case-insensitive for key)
   */
  function isDownloadRequested(req) {
    const q = (req.url || '').split('?')[1] || '';
    if (!q) return false;
    const pairs = q.split('&');
    for (const p of pairs) {
      const [rawK, rawV] = p.split('=');
      const k = decodeURIComponent((rawK || '').trim()).toLowerCase();
      const v = decodeURIComponent((rawV || '').trim());
      if (k === 'download' && (v === '' || v === 'true' || v === '1')) {
        return true;
      }
    }
    return false;
  }

  /**
   * Determine if an avatar request is authorized
   * Rules:
   *  - If a boardId query is provided and that board is public -> allow
   *  - Else if requester is authenticated (valid token) -> allow
   *  - Else if avatar's owner belongs to at least one public board -> allow
   *  - Otherwise -> deny
   */
  async function isAuthorizedForAvatar(req, avatar) {
    try {
      if (!avatar) return false;

      // Sandstorm already gated grain access; trust the platform (see isSandstormRequest).
      if (isSandstormRequest(req)) return true;

      // 1) Check explicit board context via query
      const q = parseQuery(req);
      const boardId = q.boardId || q.board || q.b;
      if (boardId) {
        const board = await ReactiveCache.getBoard(boardId);
        if (board && board.isPublic && board.isPublic()) return true;

        // If private board is specified, require membership of requester
        const token = extractLoginToken(req);
        const user = token ? await getUserFromToken(token) : null;
        if (user && board && board.hasMember && board.hasMember(user._id)) return true;
        return false;
      }

      // 2) Authenticated request without explicit board context
      const token = extractLoginToken(req);
      const user = token ? await getUserFromToken(token) : null;
      if (user) return true;

      // 3) Allow if avatar owner is on any public board (so avatars are public only when on public boards)
      // Use a lightweight query against Boards
      const found =
        Boards &&
        (await Boards.findOneAsync(
          { permission: 'public', 'members.userId': avatar.userId },
          { fields: { _id: 1 } },
        ));
      return !!found;
    } catch (e) {
      if (process.env.DEBUG === 'true') {
        console.warn('Avatar authorization check failed:', e);
      }
      return false;
    }
  }

  /**
   * Parse cookies from request headers into an object map
   */
  function parseCookies(req) {
    const header = req.headers && req.headers.cookie;
    const out = {};
    if (!header) return out;
    const parts = header.split(';');
    for (const part of parts) {
      const idx = part.indexOf('=');
      if (idx === -1) continue;
      const k = decodeURIComponent(part.slice(0, idx).trim());
      const v = decodeURIComponent(part.slice(idx + 1).trim());
      out[k] = v;
    }
    return out;
  }

  /**
   * Get query parameters as a simple object
   */
  function parseQuery(req) {
    const out = {};
    const q = (req.url || '').split('?')[1] || '';
    if (!q) return out;
    const pairs = q.split('&');
    for (const p of pairs) {
      if (!p) continue;
      const [rawK, rawV] = p.split('=');
      const k = decodeURIComponent((rawK || '').trim());
      const v = decodeURIComponent((rawV || '').trim());
      if (k) out[k] = v;
    }
    return out;
  }

  /**
   * Extract a login token from Authorization header, query param, or cookie
   * Supported sources (priority order):
   * - Authorization: Bearer <token>
   * - X-Auth-Token header
   * - authToken query parameter
   * - meteor_login_token or wekan_login_token cookie
   */
  function extractLoginToken(req) {
    // Authorization: Bearer <token>
    const authz = req.headers && (req.headers.authorization || req.headers.Authorization);
    if (authz && typeof authz === 'string') {
      const m = authz.match(/^Bearer\s+(.+)$/i);
      if (m && m[1]) return m[1].trim();
    }

    // X-Auth-Token
    const xAuth = req.headers && (req.headers['x-auth-token'] || req.headers['X-Auth-Token']);
    if (xAuth && typeof xAuth === 'string') return xAuth.trim();

    // Query parameter
    const q = parseQuery(req);
    if (q.authToken && typeof q.authToken === 'string') return q.authToken.trim();

    // Cookies
    const cookies = parseCookies(req);
    if (cookies.meteor_login_token) return cookies.meteor_login_token.trim();
    if (cookies.wekan_login_token) return cookies.wekan_login_token.trim();

    return null;
  }

  /**
   * On Sandstorm, grain access is already gated by the Sandstorm platform: every
   * request that reaches WeKan has been authorized by Sandstorm and carries the
   * bridge-injected X-Sandstorm-User-Id header. There is no Meteor login token or
   * cookie in that model (auth is via connection.setUserId() + X-Sandstorm-*
   * headers), so the token-based board/avatar authorization below would always
   * fail with 403 and images (attachment thumbnails, minicard covers, slideshow)
   * would break. Trust the platform: an X-Sandstorm-User-Id header means an
   * authenticated grain user. Thanks to xet7.
   */
  function isSandstormRequest(req) {
    return !!(
      Meteor.settings &&
      Meteor.settings.public &&
      Meteor.settings.public.sandstorm &&
      req &&
      req.headers &&
      req.headers['x-sandstorm-user-id']
    );
  }

  /**
   * Resolve a user from a raw login token string
   */
  async function getUserFromToken(rawToken) {
    try {
      if (!rawToken || typeof rawToken !== 'string' || rawToken.length < 10) return null;
      const hashed = Accounts._hashLoginToken(rawToken);
      return await Meteor.users.findOneAsync(
        { 'services.resume.loginTokens.hashedToken': hashed },
        { fields: { _id: 1 } },
      );
    } catch (e) {
      // In case accounts-base is not available or any error occurs
      if (process.env.DEBUG === 'true') {
        console.warn('Token resolution error:', e);
      }
      return null;
    }
  }

  /**
   * Authorization helper for board-bound files
   * - Public boards: allow
   * - Private boards: require valid user who is a member
   */
  async function isAuthorizedForBoard(req, board) {
    try {
      if (!board) return false;
      // Sandstorm already gated grain access; trust the platform (see isSandstormRequest).
      if (isSandstormRequest(req)) return true;
      if (board.isPublic && board.isPublic()) return true;
      const token = extractLoginToken(req);
      const user = token ? await getUserFromToken(token) : null;
      return !!(user && board.hasMember && board.hasMember(user._id));
    } catch (e) {
      if (process.env.DEBUG === 'true') {
        console.warn('Authorization check failed:', e);
      }
      return false;
    }
  }

  /**
   * Helper function to properly encode a filename for the Content-Disposition header.
   * Removes invalid characters (control chars, newlines, etc.) that would break HTTP headers.
   * For non-ASCII filenames, uses RFC 5987 encoding to preserve the original filename.
   * This prevents ERR_INVALID_CHAR errors when filenames contain control characters.
   *
   * Example:
   * - ASCII filename: sanitizeFilenameForHeader('test.txt') => 'test.txt'
   * - Non-ASCII: sanitizeFilenameForHeader('現有檔案.odt') => 'file.odt'; filename*=UTF-8''%E7%8F%BE%E6%9C%89%E6%AA%94%E6%A1%88.odt
   * - Control chars: sanitizeFilenameForHeader('test\nfile.txt') => 'testfile.txt'
   */
  function sanitizeFilenameForHeader(filename) {
    if (!filename || typeof filename !== 'string') {
      return 'download';
    }

    // Decode a URL-encoded name and REMOVE all invisible/format characters (incl.
    // control chars, zero-width, bidi, BOM) so the downloaded file gets a clean,
    // unambiguous name — matching how filenames are shown in the UI.
    let sanitized = sanitizeDownloadFileName(filename);

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
  WebApp.handlers.use('/cdn/storage/attachments', async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const fileId = extractFirstIdFromUrl(req, '/cdn/storage/attachments');

      if (!fileId) {
        res.writeHead(400);
        res.end('Invalid attachment file ID');
        return;
      }

      // Get attachment from database with backward compatibility
      const attachment = await getAttachmentWithBackwardCompatibility(fileId);
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

      // Enforce cookie/header/query-based auth for private boards
      const authorized = await isAuthorizedForBoard(req, board);
      if (!authorized) {
        res.writeHead(403);
        res.end('Access denied');
        return;
      }

      // Handle conditional requests
      if (handleConditionalRequest(req, res, attachment)) {
        return;
      }

      const attachmentDownloadLimits = await getAttachmentDownloadLimitSettings();
      if (attachmentDownloadLimits.blocked) {
        res.writeHead(403);
        res.end('Attachment downloads are disabled by administrator');
        return;
      }

      if (Number.isFinite(attachmentDownloadLimits.maxBytes)
        && attachmentDownloadLimits.maxBytes > 0
        && Number.isFinite(attachment.size)
        && attachment.size > attachmentDownloadLimits.maxBytes) {
        res.writeHead(413);
        res.end('Attachment exceeds download limit');
        return;
      }

      // Enforce the per-storage "Read" flag configured in
      // Admin Panel / Attachments. The file is served only when reading from
      // the storage backend it currently lives in is enabled.
      const storageSettings = await AttachmentStorageSettings.findOneAsync({});
      if (storageSettings) {
        let storageName;
        if (attachment?.meta?.source === 'legacy') {
          // Legacy CollectionFS files live in MongoDB GridFS.
          storageName = STORAGE_NAME_GRIDFS;
        } else {
          const probeStrategy = attachmentStoreFactory.getFileStrategy(attachment, 'original');
          storageName = probeStrategy && probeStrategy.getStorageName
            ? probeStrategy.getStorageName()
            : null;
        }
        if (storageName && !storageSettings.isStorageReadEnabled(storageName)) {
          res.writeHead(403);
          res.end('Reading from this storage backend is disabled by administrator');
          return;
        }
      }

      // Choose proper streaming based on source
      let readStream;
      if (attachment?.meta?.source === 'legacy') {
        // Legacy CollectionFS GridFS stream
        readStream = await getOldAttachmentStream(fileId);
      } else {
        // New Meteor-Files storage
        const strategy = attachmentStoreFactory.getFileStrategy(attachment, 'original');
        readStream = strategy.getReadStream();
      }

      if (!readStream) {
        res.writeHead(404);
        res.end('Attachment file not found in storage');
        return;
      }

      // Set headers and stream file
      if (isDownloadRequested(req)) {
        // Force download if requested via query param
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        res.setHeader('ETag', `"${attachment._id}"`);
        if (attachment.size) res.setHeader('Content-Length', attachment.size);
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', buildContentDispositionHeader('attachment', sanitizeFilenameForHeader(attachment.name)));
        res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox;");
      } else {
        setFileHeaders(res, attachment, true);
      }
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
  WebApp.handlers.use('/cdn/storage/avatars', async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const fileId = extractFirstIdFromUrl(req, '/cdn/storage/avatars');

      if (!fileId) {
        res.writeHead(400);
        res.end('Invalid avatar file ID');
        return;
      }

      // Get avatar from database
      const avatar = await ReactiveCache.getAvatar(fileId);
      if (!avatar) {
        res.writeHead(404);
        res.end('Avatar not found');
        return;
      }

      // Enforce visibility: avatars are public only in the context of public boards
      if (!(await isAuthorizedForAvatar(req, avatar))) {
        res.writeHead(403);
        res.end('Access denied');
        return;
      }

      // Handle conditional requests
      if (handleConditionalRequest(req, res, avatar)) {
        return;
      }

      // Get file strategy and stream
  const strategy = avatarStoreFactory.getFileStrategy(avatar, 'original');
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
  WebApp.handlers.use('/cfs/files/attachments', async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const attachmentId = extractFirstIdFromUrl(req, '/cfs/files/attachments');

      if (!attachmentId) {
        res.writeHead(400);
        res.end('Invalid attachment ID');
        return;
      }

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

      // Enforce cookie/header/query-based auth for private boards
      if (!(await isAuthorizedForBoard(req, board))) {
        res.writeHead(403);
        res.end('Access denied');
        return;
      }

      // Handle conditional requests
      if (handleConditionalRequest(req, res, attachment)) {
        return;
      }

      // For legacy attachments, try to get GridFS stream
  const fileStream = await getOldAttachmentStream(attachmentId);
      if (fileStream) {
        if (isDownloadRequested(req)) {
          // Force download if requested
          res.setHeader('Cache-Control', 'public, max-age=31536000');
          res.setHeader('ETag', `"${attachment._id}"`);
          if (attachment.size) res.setHeader('Content-Length', attachment.size);
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.setHeader('Content-Type', 'application/octet-stream');
          res.setHeader('Content-Disposition', buildContentDispositionHeader('attachment', sanitizeFilenameForHeader(attachment.name)));
          res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox;");
        } else {
          setFileHeaders(res, attachment, true);
        }
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
  WebApp.handlers.use('/cfs/files/avatars', async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const avatarId = extractFirstIdFromUrl(req, '/cfs/files/avatars');

      if (!avatarId) {
        res.writeHead(400);
        res.end('Invalid avatar ID');
        return;
      }

      // Try to get avatar from database (new structure first)
      let avatar = await ReactiveCache.getAvatar(avatarId);

      // If not found in new structure, try to handle legacy format
      if (!avatar) {
        // For legacy avatars, we might need to handle different ID formats
        // This is a fallback for old CollectionFS avatars
        res.writeHead(404);
        res.end('Avatar not found');
        return;
      }

      // Enforce visibility for legacy avatars as well
      if (!(await isAuthorizedForAvatar(req, avatar))) {
        res.writeHead(403);
        res.end('Access denied');
        return;
      }

      // Handle conditional requests
      if (handleConditionalRequest(req, res, avatar)) {
        return;
      }

      // Get file strategy and stream
  const strategy = avatarStoreFactory.getFileStrategy(avatar, 'original');
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
  WebApp.handlers.use('/attachments', (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const fileId = extractFirstIdFromUrl(req, '/attachments');
    if (!fileId) {
      // No file ID — let Meteor serve the SPA (e.g. the admin /attachments settings page).
      // Without this check a direct GET to /attachments redirected to /cdn/storage/attachments/null.
      return next();
    }

    // Use absolute URL so the redirect is correct under sub-URL (ROOT_URL with path prefix) deployments
    const newUrl = Meteor.absoluteUrl(`cdn/storage/attachments/${fileId}`);
    res.writeHead(301, { 'Location': newUrl });
    res.end();
  });

  /**
   * Alternative avatar route for different URL patterns
   * Route: /avatars/{fileId}
   */
  WebApp.handlers.use('/avatars', (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const fileId = extractFirstIdFromUrl(req, '/avatars');
    if (!fileId) {
      return next();
    }

    // Use absolute URL so the redirect is correct under sub-URL deployments
    const newUrl = Meteor.absoluteUrl(`cdn/storage/avatars/${fileId}`);
    res.writeHead(301, { 'Location': newUrl });
    res.end();
  });

  console.log('Universal file server initialized successfully');
}
