'use strict';
// Server-only: an mbox or .eml decoded with mailparser into the messages
// models/lib/mailFormat.js turns into a board. MIME, encoded words,
// quoted-printable, base64 and HTML-only messages are mailparser's.
//
// Bounded like the other uploads: the whole text first (MAX_MBOX_LENGTH), the
// number of messages (MAX_MAIL_MESSAGES), each message's size, and the text of
// each kept. Attachments are counted, not kept, and no part is written to disk.
const { simpleParser } = require('mailparser');
const { splitMbox } = require('../../models/lib/mboxSplit');

const MAX_MESSAGE_BYTES = 32 * 1024 * 1024;
const MAX_TEXT = 100000;

// The text of an HTML-only message: this mailparser gives no text for it.
// Block ends become line breaks, scripts and styles are dropped, and what is
// left is the document's text - never its markup.
function htmlText(html) {
  const { parseDocument, DomUtils } = require('htmlparser2');
  const marked = String(html || '').slice(0, MAX_TEXT * 10)
    .replace(/<(script|style)\b[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<br\s*\/?>|<\/(p|div|li|h[1-6]|tr|blockquote)\s*>/gi, '\n');
  return DomUtils.textContent(parseDocument(marked, { decodeEntities: true }))
    .replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

const people = value => {
  const list = value ? (Array.isArray(value) ? value : [value]) : [];
  return list.flatMap(group => (group && Array.isArray(group.value) ? group.value : []))
    .flatMap(person => (person.group ? person.group : [person]))
    .filter(person => person && person.address)
    .map(person => ({ name: person.name || '', address: person.address }));
};

async function decodeMessage(raw) {
  if (Buffer.byteLength(raw, 'utf8') > MAX_MESSAGE_BYTES) return null;
  const parsed = await simpleParser(raw, {
    skipHtmlToText: false, skipTextToHtml: true, skipImageLinks: true, maxHtmlLengthToParse: MAX_TEXT * 10,
  });
  const labels = parsed.headers && parsed.headers.get('x-gmail-labels');
  const references = parsed.references ? [].concat(parsed.references) : [];
  return {
    messageId: parsed.messageId || '',
    inReplyTo: parsed.inReplyTo || '',
    references,
    from: people(parsed.from)[0] || { name: '', address: '' },
    to: people(parsed.to),
    cc: people(parsed.cc),
    subject: parsed.subject || '',
    date: parsed.date ? parsed.date.toISOString() : undefined,
    text: String(parsed.text || (parsed.html ? htmlText(parsed.html) : '')).slice(0, MAX_TEXT),
    labels: typeof labels === 'string' ? labels.split(',').map(label => label.trim()).filter(Boolean) : [],
    attachments: Array.isArray(parsed.attachments) ? parsed.attachments.length : 0,
  };
}

// The decoded messages of an mbox or .eml text.
async function decodeMail(text) {
  const out = [];
  for (const raw of splitMbox(text)) {
    // eslint-disable-next-line no-await-in-loop
    const message = await decodeMessage(raw);
    if (message) out.push(message);
  }
  return out;
}

module.exports = { decodeMail, decodeMessage, htmlText, MAX_MESSAGE_BYTES };
