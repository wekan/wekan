'use strict';

const crypto = require('node:crypto');

const MAX_EMAIL_TITLE_LENGTH = 1000;
const MAX_EMAIL_BODY_LENGTH = 100000;
const MAX_EMAIL_ATTACHMENTS = 10;
const MAX_EMAIL_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const EMAIL_INBOX_TOKEN_BYTES = 32;

const BLOCKED_ATTACHMENT_TYPES = new Set([
  'application/javascript',
  'application/x-javascript',
  'image/svg+xml',
  'text/html',
]);

const BLOCKED_ATTACHMENT_EXTENSIONS = new Set([
  '.app',
  '.bat',
  '.cmd',
  '.com',
  '.exe',
  '.html',
  '.hta',
  '.js',
  '.jse',
  '.mjs',
  '.msi',
  '.ps1',
  '.scr',
  '.sh',
  '.svg',
  '.vbs',
  '.wsf',
]);

function normalizeEmailAddress(value) {
  const email = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!email || email.length > 320) return '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '';
  return email;
}

function normalizeAllowedSenders(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(normalizeEmailAddress).filter(Boolean))].slice(0, 50);
}

function userEmailAddresses(user) {
  return (user && Array.isArray(user.emails) ? user.emails : [])
    .map(email => normalizeEmailAddress(email && email.address))
    .filter(Boolean);
}

function senderIsAllowed(user, sender) {
  const normalized = normalizeEmailAddress(sender);
  if (!normalized) return false;
  const configured = normalizeAllowedSenders(
    user && user.profile && user.profile.personalInboxEmailAllowedSenders,
  );
  const allowed = configured.length ? configured : userEmailAddresses(user);
  return allowed.includes(normalized);
}

function generateEmailInboxToken() {
  return crypto.randomBytes(EMAIL_INBOX_TOKEN_BYTES).toString('base64url');
}

function hashEmailInboxToken(token) {
  const raw = typeof token === 'string' ? token.trim() : '';
  if (!raw) return '';
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function constantTimeEqual(left, right) {
  const a = Buffer.from(String(left || ''), 'utf8');
  const b = Buffer.from(String(right || ''), 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function verifyEmailInboxToken(user, token) {
  const expected = user && user.profile && user.profile.personalInboxEmailTokenHash;
  if (typeof expected !== 'string' || expected.length !== 64) return false;
  const actual = hashEmailInboxToken(token);
  return constantTimeEqual(actual, expected);
}

function extensionOf(name) {
  const match = String(name || '').toLowerCase().match(/(\.[^.]+)$/);
  return match ? match[1] : '';
}

function normalizeEmailAttachment(attachment) {
  if (!attachment || typeof attachment !== 'object') return null;
  const name = typeof attachment.name === 'string' ? attachment.name.trim() : '';
  if (
    !name ||
    name.length > 255 ||
    name.includes('/') ||
    name.includes('\\') ||
    name.includes('\0')
  ) {
    return null;
  }
  const contentType = typeof attachment.contentType === 'string'
    ? attachment.contentType.trim().toLowerCase()
    : 'application/octet-stream';
  if (!contentType || contentType.length > 100 || BLOCKED_ATTACHMENT_TYPES.has(contentType)) {
    return null;
  }
  if (BLOCKED_ATTACHMENT_EXTENSIONS.has(extensionOf(name))) return null;
  const size = Number(attachment.size);
  if (!Number.isSafeInteger(size) || size < 0 || size > MAX_EMAIL_ATTACHMENT_BYTES) {
    return null;
  }
  return { name, contentType, size };
}

function normalizeEmailAttachments(value) {
  if (value === undefined || value === null) return { valid: true, attachments: [] };
  if (!Array.isArray(value) || value.length > MAX_EMAIL_ATTACHMENTS) {
    return { valid: false, error: 'personal-inbox-email-attachment-limit' };
  }
  const attachments = [];
  for (const attachment of value) {
    const normalized = normalizeEmailAttachment(attachment);
    if (!normalized) {
      return { valid: false, error: 'personal-inbox-email-attachment-unsafe' };
    }
    attachments.push(normalized);
  }
  return { valid: true, attachments };
}

function normalizeEmailInboxPayload(payload) {
  const body = payload && typeof payload === 'object' ? payload : {};
  const sender = normalizeEmailAddress(body.sender || body.from);
  if (!sender) return { valid: false, error: 'personal-inbox-email-sender-required' };

  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  const html = typeof body.html === 'string' ? body.html.trim() : '';
  const title = (subject || text.split(/\r?\n/).find(Boolean) || 'Email capture')
    .slice(0, MAX_EMAIL_TITLE_LENGTH);
  if (!title.trim()) return { valid: false, error: 'personal-inbox-title-required' };

  const attachmentResult = normalizeEmailAttachments(body.attachments);
  if (!attachmentResult.valid) return attachmentResult;

  return {
    valid: true,
    email: {
      userId: typeof body.userId === 'string' ? body.userId.trim() : '',
      sender,
      title: title.trim(),
      text: text.slice(0, MAX_EMAIL_BODY_LENGTH),
      htmlLength: html.length,
      messageId: typeof body.messageId === 'string' ? body.messageId.trim().slice(0, 255) : '',
      sourceUrl: typeof body.sourceUrl === 'string' ? body.sourceUrl : '',
      attachments: attachmentResult.attachments,
    },
  };
}

function emailCaptureDescription(email) {
  const lines = [
    `Captured from email sender: ${email.sender}`,
  ];
  if (email.messageId) lines.push(`Message-Id: ${email.messageId}`);
  if (email.text) {
    lines.push('', email.text);
  }
  if (email.attachments.length) {
    lines.push('', 'Attachments checked by the server:');
    email.attachments.forEach(attachment => {
      lines.push(`- ${attachment.name} (${attachment.contentType}, ${attachment.size} bytes)`);
    });
  }
  if (email.htmlLength && !email.text) {
    lines.push('', `HTML body received (${email.htmlLength} bytes); plain text was not supplied.`);
  }
  return lines.join('\n').slice(0, MAX_EMAIL_BODY_LENGTH);
}

module.exports = {
  MAX_EMAIL_ATTACHMENTS,
  MAX_EMAIL_ATTACHMENT_BYTES,
  normalizeEmailAddress,
  normalizeAllowedSenders,
  userEmailAddresses,
  senderIsAllowed,
  generateEmailInboxToken,
  hashEmailInboxToken,
  verifyEmailInboxToken,
  normalizeEmailAttachment,
  normalizeEmailAttachments,
  normalizeEmailInboxPayload,
  emailCaptureDescription,
};
