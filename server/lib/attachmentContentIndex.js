// An attachment's SHA-256 and its search text, made and checked on the server.
// The decisions are models/lib/attachmentContent.js; this reads the file from
// the storage it is in (filesystem, GridFS, S3...), writes the results, and
// says in Admin Panel / Problems when a file is not what was stored.
// docs/Features/Cards/Attachments/Attachment-Search-And-Integrity.md
import { Meteor } from 'meteor/meteor';

const crypto = require('crypto');
const fs = require('fs');
const readline = require('readline');
const { Transform } = require('stream');
const lib = require('/models/lib/attachmentContent');

const MAX_CONCURRENT = 2;
let running = 0;
const waiting = [];
const inProgress = new Map();

async function slot() {
  if (running < MAX_CONCURRENT) { running += 1; return; }
  await new Promise(resolve => waiting.push(resolve));
  running += 1;
}
function release() {
  running -= 1;
  const next = waiting.shift();
  if (next) next();
}

const attachments = () => require('/models/attachments').default;
const factory = () => require('/models/attachments.server').fileStoreStrategyFactory;
const index = () => require('/server/lib/documentGif').DocumentPreviews;

function strategyOf(attachment) {
  return factory().getFileStrategy(attachment, 'original');
}

// A stream that passes the bytes on unchanged and hashes them: what a download
// sends is what is checked, with no second read of the file.
export function hashingTap() {
  const digest = crypto.createHash(lib.ALGORITHM);
  let size = 0;
  let finished = null;
  const result = new Promise(resolve => { finished = resolve; });
  const stream = new Transform({
    transform(chunk, encoding, callback) {
      digest.update(chunk);
      size += chunk.length;
      callback(null, chunk);
    },
    flush(callback) {
      finished({ value: digest.digest('hex'), size });
      callback();
    },
  });
  stream.on('close', () => finished(null));
  return { stream, result };
}

// The SHA-256 of the stored file, read from its storage.
export async function hashStoredFile(attachment) {
  const readStream = strategyOf(attachment).getReadStream();
  if (!readStream) throw new Error('the file is not in its storage');
  const digest = crypto.createHash(lib.ALGORITHM);
  let size = 0;
  for await (const chunk of readStream) {
    digest.update(chunk);
    size += chunk.length;
  }
  return { value: digest.digest('hex'), size };
}

async function readStart(attachment, maxBytes) {
  const readStream = strategyOf(attachment).getReadStream();
  if (!readStream) return Buffer.alloc(0);
  const chunks = [];
  let size = 0;
  try {
    for await (const chunk of readStream) {
      chunks.push(chunk);
      size += chunk.length;
      if (size >= maxBytes) break;
    }
  } finally {
    if (typeof readStream.destroy === 'function') readStream.destroy();
  }
  return Buffer.concat(chunks).subarray(0, maxBytes);
}

async function previewText(attachment) {
  const store = require('/server/lib/attachmentPreviewStore');
  const { attachmentRichKind } = require('/models/lib/attachmentKind');
  const preview = await store.ensurePreview(attachment, strategyOf(attachment), attachmentRichKind(attachment));
  const parts = [];
  let length = 0;
  const lines = readline.createInterface({ input: fs.createReadStream(preview.rows), crlfDelay: Infinity });
  try {
    for await (const line of lines) {
      let row = null;
      try { row = JSON.parse(line); } catch (e) { continue; }
      const text = lib.previewRowText(row);
      if (!text) continue;
      parts.push(text);
      length += text.length + 1;
      if (length >= lib.MAX_SEARCH_TEXT) break;
    }
  } finally {
    lines.close();
  }
  return parts.join(' ');
}

// The attachment's plain search text, or '' when it has none to give.
export async function extractSearchText(attachment) {
  const source = lib.searchTextSource(attachment);
  if (source === 'text') {
    const text = lib.decodeText(await readStart(attachment, lib.MAX_TEXT_READ));
    return lib.plainSearchText(text, { markup: lib.isMarkup(attachment) });
  }
  if (source === 'document') {
    const { indexDocumentText } = require('/server/lib/documentGif');
    const manifest = await indexDocumentText(attachment, { factory: factory(), collection: attachments().collection });
    return lib.plainSearchText(manifest && manifest.searchText);
  }
  if (source === 'preview') return lib.plainSearchText(await previewText(attachment));
  return '';
}

// Make (or make again) the attachment's hash and search text. `hash` is given
// when the bytes were just read anyway (a download), so the file is not read
// twice. Never throws: indexing must not break an upload or a download.
export function indexAttachmentContent(attachmentOrId, { hash = null } = {}) {
  const id = String(typeof attachmentOrId === 'string' ? attachmentOrId : attachmentOrId && attachmentOrId._id);
  if (!id || inProgress.has(id)) return inProgress.get(id) || Promise.resolve(null);
  const work = (async () => {
    await slot();
    try {
      const attachment = await attachments().collection.findOneAsync({ _id: id });
      if (!attachment || (attachment.meta && attachment.meta.source === 'legacy')) return null;
      const actual = hash || await hashStoredFile(attachment);
      const at = new Date();
      await attachments().collection.rawCollection().updateOne({ _id: id }, {
        $set: { contentHash: { algorithm: lib.ALGORITHM, value: actual.value, size: actual.size, at } },
      });
      let searchText = '';
      let error = null;
      try {
        searchText = await extractSearchText({ ...attachment, contentHash: { value: actual.value } });
      } catch (e) {
        error = (e && e.message) || String(e);
      }
      const meta = attachment.meta || {};
      await index().rawCollection().updateOne({ attachmentId: id }, {
        $set: { attachmentId: id, boardId: meta.boardId || null, cardId: meta.cardId || null, searchText,
          generatedAt: at, contentHash: actual.value, ...(error ? { error } : {}) },
        ...(error ? {} : { $unset: { error: '' } }),
      }, { upsert: true });
      return { hash: actual, searchText };
    } catch (e) {
      console.warn('attachment content index:', id, e && e.message);
      return null;
    } finally {
      release();
    }
  })().finally(() => inProgress.delete(id));
  inProgress.set(id, work);
  return work;
}

// A new attachment: its hash and search text, and the "added" row of its card
// history carrying that hash.
export async function indexNewAttachment(attachmentId) {
  const result = await indexAttachmentContent(attachmentId);
  if (!result) return;
  try {
    const attachment = await attachments().collection.findOneAsync({ _id: attachmentId });
    if (!attachment) return;
    const meta = attachment.meta || {};
    const ChangeHistory = require('/models/changeHistory').default;
    // One "added" row per attachment. An upload already has one from
    // server/models/changeHistoryHooks.js, and a durable rule copy one from its
    // plan; a second row here showed the upload twice in the card history. The
    // hash is on the attachment itself (contentHash), so nothing is lost. This
    // row is written only for an attachment that has no "added" row - one the
    // hook skips, such as an import.
    if (require('/server/lib/syncRecordingScope').isSyncCopiedAttachment(attachmentId)) return;
    const added = await ChangeHistory.rawCollection().findOne(
      { entityType: 'attachment', entityId: attachmentId, changeType: 'added' }, { projection: { _id: 1 } });
    if (added) return;
    await ChangeHistory.record({
      boardId: meta.boardId || null, swimlaneId: meta.swimlaneId || null, listId: meta.listId || null,
      cardId: meta.cardId || null, entityType: 'attachment', entityId: attachment._id, group: 'lifecycle',
      changeType: 'added', previousContent: null,
      newContent: { deleted: false, name: attachment.name || '', contentHash: result.hash.value },
      userId: attachment.userId,
    });
  } catch (e) { /* history must never break an upload */ }
}

async function knownVersions(attachmentId) {
  const ChangeHistory = require('/models/changeHistory').default;
  const rows = await ChangeHistory.rawCollection().find(
    { entityType: 'attachment', entityId: attachmentId },
    { projection: { previousContent: 1, newContent: 1 } },
  ).limit(1000).toArray();
  return lib.knownHashes(rows);
}

// After an attachment was sent whole: store a missing hash and search text,
// accept a known earlier version, or warn about a file nothing explains.
export async function afterWholeRead(attachment, actual) {
  try {
    if (!attachment || !lib.wasWholeRead(attachment, actual)) return 'partial';
    const stored = lib.storedHash(attachment);
    const known = stored && stored.value !== actual.value ? await knownVersions(attachment._id) : [];
    const decision = lib.decideHash({ attachment, actual, known });
    if (decision === 'same') {
      const row = await index().rawCollection().findOne({ attachmentId: attachment._id, contentHash: actual.value },
        { projection: { _id: 1 } });
      if (!row) indexAttachmentContent(attachment, { hash: actual });
    } else if (decision === 'store' || decision === 'known-version') {
      indexAttachmentContent(attachment, { hash: actual });
    } else if (decision === 'mismatch') {
      try {
        require('/server/lib/securityLog').record({
          key: 'integrity.file', action: 'detected', source: 'attachment-read',
          detail: `attachment ${attachment._id} (${String(attachment.name || '').slice(0, 120)}) is not the file `
            + 'that was stored: its SHA-256 differs, and no earlier version in its card history has this hash',
        });
      } catch (e) { /* logging must never break serving */ }
    }
    return decision;
  } catch (e) {
    return 'error';
  }
}

// The cards of `cardIds` (already the caller's authorized scope) with a LIVE
// attachment whose search text matches `regex`. An index row is only a hint:
// the attachment itself must still be on that card and not deleted.
export async function attachmentTextCardIds({ cardIds, regex }) {
  if (!cardIds.length) return [];
  const rows = await index().rawCollection().find(
    { cardId: { $in: cardIds }, searchText: regex },
    { projection: { attachmentId: 1, cardId: 1 } },
  ).limit(5000).toArray();
  if (!rows.length) return [];
  const live = await attachments().collection.rawCollection().find(
    { _id: { $in: rows.map(r => r.attachmentId) }, deletedAt: null },
    { projection: { 'meta.cardId': 1 } },
  ).toArray();
  const allowed = new Set(cardIds);
  return [...new Set(live.map(a => a.meta && a.meta.cardId).filter(id => allowed.has(id)))];
}

if (Meteor.isServer) {
  Meteor.startup(async () => {
    try {
      await index().rawCollection().createIndex({ attachmentId: 1 });
      await index().rawCollection().createIndex({ cardId: 1 });
    } catch (e) { /* an index is an optimization */ }
  });
}
