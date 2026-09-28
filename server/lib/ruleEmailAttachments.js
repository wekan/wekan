'use strict';

// Keep immutable mail commands comfortably below MongoDB's document limit,
// including base64 expansion. Never persist a path, URL or live stream.
const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;
const MAX_ATTACHMENTS = 100;
const MAX_ATTACHMENT_READ_MS = 30000;
function validateRuleEmailAttachments(attachments) {
  if (!Array.isArray(attachments) || attachments.length > MAX_ATTACHMENTS) throw new Error('rule-email-attachments-invalid');
  let total = 0;
  for (const item of attachments) {
    if (!item || Object.keys(item).sort().join(',') !== 'content,contentType,encoding,filename' ||
        typeof item.filename !== 'string' || !item.filename || item.filename.length > 255 || /[\\/\r\n\0]/.test(item.filename) ||
        typeof item.contentType !== 'string' || !/^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/i.test(item.contentType) ||
        item.encoding !== 'base64' || typeof item.content !== 'string' ||
        item.content.length > Math.ceil(MAX_ATTACHMENT_BYTES / 3) * 4 ||
        Buffer.from(item.content, 'base64').toString('base64') !== item.content) throw new Error('rule-email-attachments-invalid');
    total += Buffer.byteLength(item.content, 'base64');
    if (total > MAX_ATTACHMENT_BYTES) throw new Error('rule-email-attachments-too-large');
  }
  return attachments;
}

// files must already be scoped to the authorized card's live attachments.
// The storage adapter owns backend selection (filesystem/GridFS/S3/etc.).
async function snapshotRuleEmailAttachments(files, openStream, { timeoutMs = MAX_ATTACHMENT_READ_MS } = {}) {
  if (!Array.isArray(files) || files.length > MAX_ATTACHMENTS) throw new Error('rule-email-too-many-attachments');
  const result = [];
  let total = 0;
  for (const file of files) {
    const stream = await openStream(file);
    if (!stream || typeof stream[Symbol.asyncIterator] !== 'function' || typeof stream.destroy !== 'function') {
      throw new Error('rule-email-attachment-unavailable');
    }
    const timer = setTimeout(() => stream.destroy(new Error('rule-email-attachment-timeout')), timeoutMs);
    const chunks = [];
    try {
      for await (const chunk of stream) {
        const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        total += bytes.length;
        if (total > MAX_ATTACHMENT_BYTES) throw new Error('rule-email-attachments-too-large');
        chunks.push(bytes);
      }
    } finally {
      clearTimeout(timer);
      stream.destroy();
    }
    const filename = String(file.name || 'attachment').split(/[\\/]/).pop().replace(/[\r\n\0]/g, '').slice(0, 255) || 'attachment';
    const contentType = typeof file.type === 'string' && /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/i.test(file.type)
      ? file.type : 'application/octet-stream';
    result.push({ filename, contentType, encoding: 'base64', content: Buffer.concat(chunks).toString('base64') });
  }
  return validateRuleEmailAttachments(result);
}
module.exports = { snapshotRuleEmailAttachments, validateRuleEmailAttachments, MAX_ATTACHMENT_BYTES, MAX_ATTACHMENTS };
