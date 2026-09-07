import Attachments from '/models/attachments';
import { Meteor } from 'meteor/meteor';
import AttachmentStorageSettings from '/models/attachmentStorageSettings';
import Boards from '/models/boards';
import { fileStoreStrategyFactory } from '/models/attachments.server';
import { STORAGE_NAME_FILESYSTEM, STORAGE_NAME_GRIDFS } from '/models/lib/fileStoreConstants';
import { correctedNameForStoredFile } from '/models/lib/fileTypeCorrection';
import { getAttachmentWithBackwardCompatibility, getOldAttachmentStream } from '/models/lib/attachmentBackwardCompatibility';
import { canReadBoard } from '/models/lib/boardVisibility';
import { attachmentAsStoredGif } from '/server/lib/legacyHtml4Gif';
const { sanitizeDownloadFileName } = require('/imports/lib/fileNameDisplay');
const { fileResponsePolicy } = require('/models/lib/fileResponseSafety');

function safeDisposition(disposition, name) {
  const cleaned = sanitizeDownloadFileName(name);
  const ascii = cleaned.replace(/[^\x20-\x7e]/g, '_') || 'download';
  const quoted = ascii.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `${disposition}; filename="${quoted}"; filename*=UTF-8''${encodeURIComponent(cleaned)}`;
}

function nonNegative(value, fallback = 0) {
  const number = Number.parseInt(value, 10);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

async function limits() {
  const fallback = nonNegative(process.env.ATTACHMENT_API_MAX_DOWNLOAD_BYTES, 0);
  const settings = await AttachmentStorageSettings.findOneAsync({});
  return {
    settings,
    blocked: settings?.limitSettings?.attachmentsDownloadBlocked === true,
    maxBytes: Number.isFinite(settings?.limitSettings?.attachmentsDownloadMaxBytes)
      ? settings.limitSettings.attachmentsDownloadMaxBytes
      : Number.isFinite(settings?.limitSettings?.apiDownloadMaxBytes)
        ? settings.limitSettings.apiDownloadMaxBytes : fallback,
  };
}

async function exactAuthorizedAttachment({ userId, boardId, cardId, attachmentId }) {
  const attachment = await getAttachmentWithBackwardCompatibility(String(attachmentId || ''));
  if (!attachment || attachment.meta?.boardId !== String(boardId || '')
    || attachment.meta?.cardId !== String(cardId || '')) throw new Error('forbidden');
  const board = await Boards.findOneAsync(String(boardId || ''));
  if (!board || !canReadBoard(userId, board)) throw new Error('forbidden');
  return attachment;
}

async function normalizeName(attachment) {
  const result = await correctedNameForStoredFile(attachment, fileStoreStrategyFactory);
  if (!result.changed) return;
  const originalName = attachment.name;
  const dot = result.name.lastIndexOf('.');
  const extension = dot > 0 ? result.name.slice(dot + 1).toLowerCase() : '';
  await Attachments.collection.updateAsync({ _id: attachment._id }, { $set: {
    name: result.name, extension, extensionWithDot: extension ? `.${extension}` : '',
  } });
  attachment.name = result.name;
  try {
    await require('/server/lib/filenameSanitizeLog').logFilenameSanitized({
      fileObj: attachment, source: 'fileRead',
      reasons: require('/models/lib/uploadFileName').sanitizationReasons(
        originalName, result.detectedMime || attachment.type, result.name),
      from: originalName, to: result.name,
    });
  } catch (_) { /* correction must not prevent an authorized read */ }
}

function rejectLimit(attachment, policy) {
  if (policy.blocked) {
    const error = new Error('blocked'); error.statusCode = 403; throw error;
  }
  if (policy.maxBytes > 0 && Number(attachment.size) > policy.maxBytes) {
    const error = new Error('too-large'); error.statusCode = 413; throw error;
  }
}

function harden(res) {
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
}

export async function serveLegacyHtml4Attachment({ res, userId, boardId, cardId,
  attachmentId, representation, adminOnly = false }) {
  let attachment;
  if (adminOnly) {
    const user = userId && await Meteor.users.findOneAsync(userId, {
      fields: { isAdmin: 1 },
    });
    if (!user?.isAdmin) throw new Error('forbidden');
    attachment = await getAttachmentWithBackwardCompatibility(String(attachmentId || ''));
    if (!attachment) { const error = new Error('missing'); error.statusCode = 404; throw error; }
  } else {
    attachment = await exactAuthorizedAttachment({ userId, boardId, cardId, attachmentId });
  }
  const policy = await limits();
  rejectLimit(attachment, policy);

  if (representation === 'gif') {
    const defaultStorage = policy.settings?.getDefaultStorage?.() || STORAGE_NAME_FILESYSTEM;
    if (policy.settings && !attachment.versions?.legacyHtml4Gif
      && !policy.settings.isStorageWriteEnabled(defaultStorage)) {
      const error = new Error('storage-disabled'); error.statusCode = 403; throw error;
    }
    const gif = await attachmentAsStoredGif(attachment, {
      factory: fileStoreStrategyFactory,
      collection: Attachments.collection,
      getDefaultStorage: async () => defaultStorage,
    });
    harden(res);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Content-Length', gif.length);
    res.setHeader('Content-Disposition', safeDisposition('inline', `${attachment._id}.gif`));
    res.end(gif);
    return;
  }

  await normalizeName(attachment);
  let stream;
  let storageName = STORAGE_NAME_GRIDFS;
  if (attachment.meta?.source === 'legacy') stream = await getOldAttachmentStream(attachment._id);
  else {
    const strategy = fileStoreStrategyFactory.getFileStrategy(attachment, 'original');
    storageName = strategy?.getStorageName?.();
    stream = strategy?.getReadStream?.();
  }
  if (storageName && policy.settings && !policy.settings.isStorageReadEnabled(storageName)) {
    const error = new Error('storage-disabled'); error.statusCode = 403; throw error;
  }
  if (!stream) { const error = new Error('missing'); error.statusCode = 404; throw error; }
  const responsePolicy = fileResponsePolicy(attachment.type, true);
  harden(res);
  res.statusCode = 200;
  res.setHeader('Content-Type', responsePolicy.contentType);
  res.setHeader('Content-Disposition', safeDisposition('attachment', attachment.name));
  if (attachment.size) res.setHeader('Content-Length', attachment.size);
  for (const [name, value] of Object.entries(responsePolicy.headers)) res.setHeader(name, value);
  stream.once('error', error => {
    if (!res.headersSent) { res.statusCode = 500; res.end('Attachment read failed.'); }
    else res.destroy(error);
  });
  stream.pipe(res);
}
