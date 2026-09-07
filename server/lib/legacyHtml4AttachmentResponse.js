import Attachments from '/models/attachments';
import { Meteor } from 'meteor/meteor';
import AttachmentStorageSettings from '/models/attachmentStorageSettings';
import Boards from '/models/boards';
import { fileStoreStrategyFactory } from '/models/attachments.server';
import { STORAGE_NAME_FILESYSTEM, STORAGE_NAME_GRIDFS } from '/models/lib/fileStoreConstants';
import { correctedNameForStoredFile } from '/models/lib/fileTypeCorrection';
import { getAttachmentWithBackwardCompatibility, getOldAttachmentStream } from '/models/lib/attachmentBackwardCompatibility';
import { canReadBoard } from '/models/lib/boardVisibility';
import {
  attachmentAsStoredGif,
  boundedStreamBuffer,
  omiGifCacheKey,
} from '/server/lib/legacyHtml4Gif';
import { DocumentPreviews, documentAsStoredGifs } from '/server/lib/documentGif';
const { sanitizeDownloadFileName } = require('/imports/lib/fileNameDisplay');
const { fileResponsePolicy } = require('/models/lib/fileResponseSafety');
const { safeDocumentTableHtml } = require('/models/lib/documentPreviewTable');

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

export async function legacyHtml4DocumentPage({ userId, boardId, cardId,
  attachmentId, pageNumber }) {
  const attachment = await exactAuthorizedAttachment({
    userId, boardId, cardId, attachmentId,
  });
  const policy = await limits();
  rejectLimit(attachment, policy);
  const defaultStorage = policy.settings?.getDefaultStorage?.() || STORAGE_NAME_FILESYSTEM;
  const cached = await DocumentPreviews.findOneAsync({
    attachmentId: attachment._id,
    cacheKey: omiGifCacheKey(attachment),
  }, { fields: { _id: 1 } });
  if (!cached && policy.settings && !policy.settings.isStorageWriteEnabled(defaultStorage)) {
    const error = new Error('storage-disabled'); error.statusCode = 403; throw error;
  }
  const manifest = await documentAsStoredGifs(attachment, {
    factory: fileStoreStrategyFactory,
    collection: Attachments.collection,
    getDefaultStorage: async () => defaultStorage,
  });
  const number = Number(pageNumber);
  if (!Number.isSafeInteger(number) || number < 1 || number > manifest.pageCount) {
    const error = new Error('page-not-found'); error.statusCode = 404; throw error;
  }
  const page = manifest.pages.find(item => item.number === number);
  if (!page) { const error = new Error('page-not-found'); error.statusCode = 404; throw error; }
  const images = [];
  let responseBytes = 0;
  for (const item of page.images || []) {
    const strategy = fileStoreStrategyFactory.getFileStrategy(attachment, item.version);
    const storageName = strategy?.getStorageName?.();
    if (!strategy || (storageName && policy.settings
      && !policy.settings.isStorageReadEnabled(storageName))) {
      const error = new Error('storage-disabled'); error.statusCode = 403; throw error;
    }
    const gif = await boundedStreamBuffer(strategy.getReadStream(), 8 * 1024 * 1024);
    responseBytes += gif.length;
    if (responseBytes > 16 * 1024 * 1024) {
      const error = new Error('preview-too-large'); error.statusCode = 413; throw error;
    }
    images.push({ number: item.number,
      dataUrl: `data:image/gif;base64,${gif.toString('base64')}` });
  }
  return {
    attachmentId: attachment._id,
    name: attachment.name || '',
    number,
    pageCount: manifest.pageCount,
    text: String(page.text || ''),
    html: safeDocumentTableHtml(page.html),
    images,
  };
}
