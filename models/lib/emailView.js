'use strict';

// Board View / Email (#794): the pure parts - which cards a folder holds, the
// search, and what may be sent. No Meteor, so tests/emailView.test.cjs runs
// them with plain Node; the server (server/emailView.js) and the client
// (client/components/boards/emailView.js) share them.

// The page index id (models/lib/reportPageIndex.js) of this view's table.
const EMAIL_VIEW_PAGE_ID = 'board-email-view';
const ID = /^[A-Za-z0-9_-]{1,64}$/;
const MAX_RECIPIENTS = 20;
const MAX_SUBJECT = 255;
const MAX_TEXT = 100000;
// A plain address, no display name, no spaces, no CR/LF: what a header can
// not be split by.
const ADDRESS = /^[^\s@<>(),;:"\\[\]]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/;

// 'inbox' | 'sent' | 'all' | 'list:<id>' | 'label:<id>' -> { kind, id }.
// Anything else is the Inbox.
function parseFolder(folder) {
  const text = String(folder || '');
  if (text === 'sent' || text === 'all' || text === 'inbox') return { kind: text, id: null };
  const [kind, id] = text.split(':');
  if ((kind === 'list' || kind === 'label') && ID.test(id || '')) return { kind, id };
  return { kind: 'inbox', id: null };
}

// The Mongo selector for a folder. Archived cards are never mail.
function emailFolderSelector(boardId, folder, { inboxListId = null } = {}) {
  const { kind, id } = parseFolder(folder);
  const base = { boardId, archived: false, type: { $nin: ['template-container'] } };
  switch (kind) {
    case 'sent': return { ...base, 'email.direction': 'out' };
    case 'all': return { ...base, email: { $exists: true } };
    case 'list': return { ...base, listId: id };
    case 'label': return { ...base, labelIds: id };
    default:
      // The Inbox is what ARRIVES in the email list: a message this view sent
      // is in Sent, as in Gmail.
      return { ...base, listId: inboxListId || '__none__', 'email.direction': { $ne: 'out' } };
  }
}

const escapeRegex = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Search the subject, body and sender, case-insensitively, as plain text.
function emailSearchSelector(search) {
  const text = String(search || '').trim().slice(0, 200);
  if (!text) return {};
  const re = { $regex: escapeRegex(text), $options: 'i' };
  return { $or: [{ title: re }, { description: re }, { 'email.from.address': re }, { 'email.from.name': re }] };
}

function cleanAddresses(list) {
  const out = [];
  for (const raw of Array.isArray(list) ? list : []) {
    for (const part of String(raw || '').split(/[,;]/)) {
      const address = part.trim();
      if (!address) continue;
      if (!ADDRESS.test(address)) throw new Error('email-view-invalid-address');
      if (!out.includes(address.toLowerCase())) out.push(address.toLowerCase());
    }
  }
  return out;
}

// What a compose form may send. Throws an i18n error key.
function cleanOutgoingEmail({ to, cc, subject, text } = {}) {
  const toList = cleanAddresses(to);
  const ccList = cleanAddresses(cc).filter(a => !toList.includes(a));
  if (!toList.length) throw new Error('email-view-no-recipient');
  if (toList.length + ccList.length > MAX_RECIPIENTS) throw new Error('email-view-too-many-recipients');
  const cleanSubject = String(subject || '').replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, MAX_SUBJECT);
  if (!cleanSubject) throw new Error('email-view-no-subject');
  return { to: toList, cc: ccList, subject: cleanSubject, text: String(text || '').slice(0, MAX_TEXT) };
}

// A row's one-line preview, Gmail-style: subject - start of the body.
function snippet(description, max = 120) {
  const line = String(description || '').replace(/^From: .*\n+/, '').replace(/\s+/g, ' ').trim();
  return line.length > max ? `${line.slice(0, max - 1)}…` : line;
}

// The message's text for the row's preview, rendered as Markdown like the
// rest of WeKan (the viewer applies the Admin Panel's security settings): the
// e-mail's From line left out, and only its start - cut at a line end, never
// inside a link or a tag the way a character count cuts it. The row shows
// two lines of it (emailView.css).
function previewMarkdown(description, maxLines = 8, maxLength = 2000) {
  const text = String(description || '').replace(/^From: .*\n+/, '').trim();
  const lines = text.split('\n').slice(0, maxLines);
  let out = '';
  for (const line of lines) {
    if (out.length + line.length + 1 > maxLength) break;
    out += (out ? '\n' : '') + line;
  }
  return out;
}

// What one Email view page request is, the same on the server and the client,
// so each request's page index has its own id (models/lib/reportPageIndex.js).
function emailViewPageArgs(boardId, options = {}) {
  return [boardId, String(options.folder || ''), Math.max(1, Math.floor(options.page || 1)), String(options.search || '')];
}

module.exports = {
  previewMarkdown,
  EMAIL_VIEW_PAGE_ID,
  emailViewPageArgs,
  MAX_RECIPIENTS,
  parseFolder,
  emailFolderSelector,
  emailSearchSelector,
  cleanOutgoingEmail,
  snippet,
};
