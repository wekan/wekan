import { WebApp } from 'meteor/webapp';
import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp';
import { TrelloCreator } from '/models/trelloCreator';
import { assertImportEnabled } from '/models/lib/importExportSecurity';
import { validateImportSourceShape } from '/models/lib/importSourceShape';
import { secureTransfer } from '/server/lib/secureTransfer';
import {
  resolveCreds,
  inlineAttachments,
  inlineBoardBackground,
  inlineMemberAvatars,
  inlineStickers,
} from '/server/trelloApiImport';

// Server-side import of a Trello ".zip" package produced by the Trello Card
// Attachments Downloader. The browser POSTs the raw .zip over HTTP (not over the
// DDP WebSocket — embedding attachment bytes in a Meteor method overflows the
// WebSocket frame, kills the connection and makes Meteor retry forever). Here we
// extract the zip with zip-bomb guards and stream each attachment straight into
// the Default storage via the existing TrelloCreator writeAsync path.

// --- zip-bomb / abuse guards -------------------------------------------------
const MAX_ZIP_BYTES = 200 * 1024 * 1024; // 200 MB compressed upload cap
const MAX_TOTAL_UNCOMPRESSED = 1024 * 1024 * 1024; // 1 GB total uncompressed
const MAX_ENTRIES = 5000; // maximum number of files inside the zip
const MAX_FILE_BYTES = 100 * 1024 * 1024; // 100 MB per extracted file

function parseCookies(req) {
  const out = {};
  const header = req.headers && req.headers.cookie;
  if (!header) return out;
  header.split(';').forEach(part => {
    const idx = part.indexOf('=');
    if (idx < 0) return;
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  });
  return out;
}

function extractLoginToken(req) {
  const authz = req.headers && (req.headers.authorization || req.headers.Authorization);
  if (authz && typeof authz === 'string') {
    const m = authz.match(/^Bearer\s+(.+)$/i);
    if (m && m[1]) return m[1].trim();
  }
  const xAuth = req.headers && (req.headers['x-auth-token'] || req.headers['X-Auth-Token']);
  if (xAuth && typeof xAuth === 'string') return xAuth.trim();
  const cookies = parseCookies(req);
  if (cookies.meteor_login_token) return cookies.meteor_login_token.trim();
  if (cookies.wekan_login_token) return cookies.wekan_login_token.trim();
  return null;
}

async function getUserIdFromToken(rawToken) {
  if (!rawToken || typeof rawToken !== 'string' || rawToken.length < 10) return null;
  try {
    const user = await require('/server/lib/activeUser').activeUserByToken(rawToken, 'importTrelloZip');
    return user ? user._id : null;
  } catch (e) {
    return null;
  }
}

// Reject zip entries with dangerous paths. Even though we never write using a
// zip entry's path (attachments are stored via writeAsync, which generates its
// own unique storage id, so nothing on disk is ever overwritten), we still
// refuse absolute paths, parent-directory traversal (`..`), backslashes,
// Windows drive letters and null bytes as defence-in-depth against a tampered
// or malicious .zip.
function isUnsafeEntryPath(p) {
  if (!p) return false;
  if (p.includes('\0')) return true;
  if (p.includes('\\')) return true; // backslash separators / Windows paths
  if (p.startsWith('/')) return true; // absolute path
  if (/^[a-zA-Z]:/.test(p)) return true; // drive letter (C:\…)
  if (p.split('/').some(seg => seg === '..')) return true; // parent traversal
  return false;
}

function sanitizeBoardDirName(name) {
  const forbidden = [
    '/', '\0', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '+', '=',
    '{', '}', '[', ']', ',', ';', "'", '"', '<', '>', '?', '`', '~', '|',
  ];
  let s = String(name || '');
  for (const c of forbidden) s = s.split(c).join('');
  return s.trim().toLowerCase();
}

// Collect logical attachments (unique by Trello id) of a board.
function collectLogicalAttachments(data) {
  const logical = new Map();
  const collect = att => {
    if (!att) return;
    if (att.url && att.name === att.url) return; // attached link, not a file
    const id = att.id || att._id || att.fileName || att.name;
    if (!id) return;
    if (!logical.has(id)) {
      logical.set(id, { fileName: att.fileName || att.name, occ: [] });
    }
    logical.get(id).occ.push(att);
  };
  (data.cards || []).forEach(card => (card.attachments || []).forEach(collect));
  (data.actions || []).forEach(action => {
    if (action.type === 'addAttachmentToCard') {
      collect(action.data && action.data.attachment);
    }
  });
  return logical;
}

// Run a function with the given user as the current Meteor user so that
// Meteor.userId() inside the creator resolves correctly (same pattern as
// server/rulesHelper.js). HTTP handlers have no method invocation context.
function runAsUser(userId, fn) {
  if (
    DDP._CurrentMethodInvocation &&
    typeof DDP._CurrentMethodInvocation.withValue === 'function'
  ) {
    return DDP._CurrentMethodInvocation.withValue({ userId, isSimulation: false }, fn);
  }
  return fn();
}

// Import a single Trello board (from the .json file or the pasted textarea),
// honoring the member mapping the user chose in the map-members step. No
// attachment bytes are present here (a .json export has none); attachments come
// from the .zip path instead.
async function importSingleBoard(payload, userId) {
  let board = payload && payload.board;
  validateImportSourceShape('trello', board);
  board = secureTransfer(board, { direction: 'import', source: 'import:trello-http', userId });
  const membersMapping = (payload && payload.membersMapping) || {};

  // A .json export has no attachment bytes (and often no stickers). If the user
  // has saved Trello API credentials, use them to download the attachments,
  // board background image, member avatars and card stickers from Trello
  // (best-effort: a failed download must not abort the import).
  const creds = await resolveCreds(userId, '', '');
  if (creds && creds.key && creds.token) {
    try {
      await inlineAttachments(board, creds.key, creds.token);
    } catch (e) {
      /* best-effort */
    }
    try {
      await inlineBoardBackground(board, creds.key, creds.token);
    } catch (e) {
      /* best-effort */
    }
    try {
      await inlineMemberAvatars(board, membersMapping, creds.key, creds.token);
    } catch (e) {
      /* best-effort */
    }
    try {
      await inlineStickers(board, creds.key, creds.token);
    } catch (e) {
      /* best-effort */
    }
  }

  const creator = new TrelloCreator({ membersMapping });
  const boardId = await runAsUser(userId, () => creator.create(board, null));
  return { boardIds: boardId ? [boardId] : [] };
}

// Read and import every board in the zip buffer, returning { boardIds, errors }.
async function importZipBuffer(buffer, userId) {
  const unzipper = require('unzipper');
  const zip = await unzipper.Open.buffer(buffer);

  // Enumerate entries and apply zip-bomb guards before decompressing anything.
  const jsonEntries = [];
  const fileEntries = [];
  let entryCount = 0;
  let totalUncompressed = 0;
  let unsafePath = false;
  for (const entry of zip.files) {
    const relativePath = entry.path;
    if (entry.type !== 'File') continue;
    if (isUnsafeEntryPath(relativePath)) {
      unsafePath = true;
      continue;
    }
    entryCount += 1;
    const declared = (entry.vars && entry.vars.uncompressedSize) || 0;
    totalUncompressed += declared;
    const parts = relativePath.split('/');
    const base = parts.pop();
    if (/\.json$/i.test(base)) {
      jsonEntries.push({ base, entry, declared });
    } else {
      fileEntries.push({ base, dirSegs: parts, entry, declared, used: false });
    }
  }
  if (unsafePath) throw new Error('import-trello-zip-unsafe-path');
  if (entryCount > MAX_ENTRIES) throw new Error('import-trello-zip-too-many-files');
  if (totalUncompressed > MAX_TOTAL_UNCOMPRESSED) {
    throw new Error('import-trello-zip-too-large');
  }
  if ([...jsonEntries, ...fileEntries].some(e => e.declared > MAX_FILE_BYTES)) {
    throw new Error('import-trello-zip-file-too-large');
  }

  // Parse JSON files that look like Trello board exports.
  const boards = [];
  for (const je of jsonEntries) {
    let data;
    try {
      data = JSON.parse((await je.entry.buffer()).toString('utf8'));
    } catch (e) {
      continue;
    }
    if (!data || typeof data !== 'object') continue;
    if (!data.name || !(data.cards || data.lists || data.actions)) continue;
    validateImportSourceShape('trello', data);
    boards.push(secureTransfer(data, { direction: 'import', source: 'import:trello-zip', userId }));
  }

  // Match each board's attachments from its board-name subfolder and inject the
  // bytes (base64) so TrelloCreator writes them to the Default storage.
  for (const data of boards) {
    const sanitized = sanitizeBoardDirName(data.name);
    let scoped = fileEntries.filter(
      e =>
        !e.used &&
        (e.dirSegs.some(seg => sanitizeBoardDirName(seg) === sanitized) ||
          sanitizeBoardDirName(e.base).startsWith(`${sanitized}_`)),
    );
    if (scoped.length === 0 && boards.length === 1) {
      scoped = fileEntries.filter(e => !e.used);
    }
    const findEntryFor = fileName => {
      if (!fileName) return null;
      let cand = scoped.find(e => !e.used && e.base === fileName);
      if (!cand) cand = scoped.find(e => !e.used && e.base.endsWith(`_${fileName}`));
      if (!cand) cand = scoped.find(e => !e.used && e.base.endsWith(fileName));
      return cand || null;
    };
    const logical = collectLogicalAttachments(data);
    for (const info of logical.values()) {
      const cand = findEntryFor(info.fileName);
      if (!cand) continue;
      cand.used = true;
      // Decompress and enforce the per-file size cap on the real output too.
      const bytes = await cand.entry.buffer();
      if (bytes.length > MAX_FILE_BYTES) continue;
      const b64 = bytes.toString('base64');
      info.occ.forEach(att => {
        att.file = b64;
      });
    }
  }

  if (!boards.length) throw new Error('import-trello-zip-no-boards');

  // Create each board with the uploader as the current user so ownership,
  // activities and attachment writes are attributed correctly.
  const boardIds = [];
  const errors = [];
  for (const board of boards) {
    try {
      const creator = new TrelloCreator({});
      const boardId = await runAsUser(userId, () => creator.create(board, null));
      if (boardId) boardIds.push(boardId);
    } catch (e) {
      errors.push({ board: board.name, error: (e && e.message) || 'import-failed' });
    }
  }
  return { boardIds, errors };
}

Meteor.startup(() => {
  WebApp.handlers.use('/import-trello', async (req, res) => {
    const sendJson = (code, obj) => {
      res.writeHead(code, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(obj));
    };

    if (req.method !== 'POST') {
      sendJson(405, { error: 'method-not-allowed' });
      return;
    }

    const userId = await getUserIdFromToken(extractLoginToken(req));
    if (!userId) {
      sendJson(401, { error: 'error-notAuthorized' });
      return;
    }

    try { await assertImportEnabled(); }
    catch (error) {
      sendJson(403, { error: error.error || 'import-disabled' });
      return;
    }

    const contentType = String(
      (req.headers && req.headers['content-type']) || '',
    ).toLowerCase();

    // Single board (.json file or pasted JSON). The global body-parser
    // middleware (server/apiMiddleware.js) has already consumed and parsed the
    // application/json body into req.body, so the request stream is finished —
    // we must read req.body here rather than stream it (streaming would hang
    // forever waiting for an 'end' that never fires).
    if (contentType.includes('application/json')) {
      try {
        const payload = req.body || {};
        const result = await importSingleBoard(payload, userId);
        sendJson(200, result);
      } catch (e) {
        sendJson(400, { error: (e && e.message) || 'import-trello-failed' });
      }
      return;
    }

    // A .zip package: the body-parser does not touch application/zip, so the
    // raw stream is intact. Read it into memory with a hard cap (first zip-bomb
    // guard: the compressed upload size).
    const chunks = [];
    let total = 0;
    let aborted = false;
    req.on('data', chunk => {
      if (aborted) return;
      total += chunk.length;
      if (total > MAX_ZIP_BYTES) {
        aborted = true;
        sendJson(413, { error: 'import-trello-zip-too-large' });
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('error', () => {
      if (!aborted) sendJson(400, { error: 'import-trello-zip-read-failed' });
      aborted = true;
    });
    req.on('end', async () => {
      if (aborted) return;
      try {
        const buffer = Buffer.concat(chunks);
        const result = await importZipBuffer(buffer, userId);
        sendJson(200, result);
      } catch (e) {
        sendJson(400, { error: (e && e.message) || 'import-trello-zip-failed' });
      }
    });
  });
});
