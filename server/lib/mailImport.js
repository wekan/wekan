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
// The HTML is parsed (htmlparser2) and its text nodes read, a line break at
// each block's end; script, style and the like are skipped as elements, so no
// pattern ever strips markup and nothing of the markup is kept.
const SKIPPED = new Set(['script', 'style', 'noscript', 'template', 'head', 'title', 'iframe', 'object']);
const BLOCK_ENDS = new Set(['p', 'div', 'li', 'tr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'table', 'ul', 'ol']);
function htmlText(html) {
  const { parseDocument } = require('htmlparser2');
  const doc = parseDocument(String(html || '').slice(0, MAX_TEXT * 10), { decodeEntities: true });
  let out = '';
  const walk = nodes => {
    for (const node of nodes || []) {
      if (node.type === 'text') out += node.data.replace(/\s+/g, ' ');
      else if (node.type === 'tag' || node.type === 'script' || node.type === 'style') {
        const name = String(node.name || '').toLowerCase();
        if (SKIPPED.has(name) || node.type !== 'tag') continue;
        if (name === 'br') { out += '\n'; continue; }
        walk(node.children);
        if (BLOCK_ENDS.has(name)) out += '\n';
      }
    }
  };
  walk(doc.children);
  return out.split('\n').map(line => line.trim()).join('\n').replace(/\n{3,}/g, '\n\n').trim();
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

// The messages of an mbox read from a stream a line at a time - a file on
// disk or a zip entry - so a mailbox of any size is never in memory whole:
// one message at a time is, up to MAX_MESSAGE_BYTES (a larger one is skipped
// and counted). At most MAX_MAIL_MESSAGES are kept.
async function decodeMailStream(stream, { maxMessages = require('../../models/lib/mboxSplit').MAX_MAIL_MESSAGES } = {}) {
  const readline = require('readline');
  const lines = readline.createInterface({ input: stream, crlfDelay: Infinity });
  const out = [];
  let current = null;
  let size = 0;
  let skipped = 0;
  let first = true;
  let single = false;
  const flush = async () => {
    if (current && current.length && out.length < maxMessages) {
      if (size > MAX_MESSAGE_BYTES) skipped += 1;
      else {
        const message = await decodeMessage(current.join('\n'));
        if (message) out.push(message);
      }
    }
    current = [];
    size = 0;
  };
  for await (const line of lines) {
    if (first) {
      first = false;
      single = !/^From /.test(line.replace(/^\uFEFF/, ''));
      if (single) { current = [line]; size = line.length + 1; continue; }
    }
    if (!single && /^From /.test(line)) {
      await flush();
      if (out.length >= maxMessages) break;
      continue;
    }
    if (!current) current = [];
    if (size <= MAX_MESSAGE_BYTES) current.push(/^>+From /.test(line) ? line.slice(1) : line);
    size += line.length + 1;
  }
  await flush();
  lines.close();
  return { messages: out, skipped };
}

async function decodeMailFile(file) {
  const fs = require('fs');
  return decodeMailStream(fs.createReadStream(file));
}

module.exports = { decodeMail, decodeMessage, decodeMailStream, decodeMailFile, htmlText, MAX_MESSAGE_BYTES };
