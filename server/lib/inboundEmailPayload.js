'use strict';

// One message shape for every way an email reaches WeKan (#794, #2414):
//
//   { from: { name, address }, to: [address], cc: [address],
//     deliveredTo: [address], subject, text, html, messageId,
//     inReplyTo: [id], references: [id],
//     attachments: [{ filename, contentType, content: Buffer }] }
//
// From:
//   - a mail provider's inbound-parse webhook, already split into fields -
//     Mailgun Routes (`sender`, `recipient`, `body-plain`, `attachment-N`),
//     SendGrid Inbound Parse (`from`, `to`, `envelope`, `text`, `html`,
//     `attachmentN`), Postmark (`FromFull`, `ToFull`, `OriginalRecipient`,
//     `TextBody`, `HtmlBody`, `Attachments` in base64) - fromProviderFields();
//   - a whole message (SendGrid's "raw" mode, a relay posting
//     message/rfc822, an IMAP mailbox) parsed by mailparser's simpleParser -
//     fromParsedMail().
//
// Pure: no Meteor, no parsing of its own, so tests/emailToCard.test.cjs runs
// it with plain Node.

const { bareAddress } = require('./inboundBoardAddress');

const str = value => (typeof value === 'string' ? value : '');

function first(fields, names) {
  for (const name of names) {
    const value = fields && fields[name];
    if (typeof value === 'string' && value) return value;
  }
  return '';
}

// "Ann <a@x>" -> { name: 'Ann', address: 'a@x' }
function parseFrom(value) {
  const text = str(value).trim();
  if (!text) return { name: '', address: '' };
  const address = bareAddress(text);
  const angle = text.indexOf('<');
  const name = angle > 0 ? text.slice(0, angle).trim().replace(/^"|"$/g, '') : '';
  return { name, address };
}

function addressList(value) {
  const out = [];
  const add = item => {
    if (!item) return;
    if (Array.isArray(item)) { item.forEach(add); return; }
    if (typeof item === 'object') { add(item.address || item.Email || item.email); return; }
    for (const part of String(item).split(',')) {
      const address = bareAddress(part);
      if (address && !out.includes(address)) out.push(address);
    }
  };
  add(value);
  return out;
}

// "<a@x> <b@y>" (References, In-Reply-To) -> ['<a@x>', '<b@y>']
function messageIds(value) {
  if (Array.isArray(value)) return value.flatMap(messageIds);
  return typeof value === 'string' ? (value.match(/<[^<>\s]+>/g) || []) : [];
}

// Postmark sends other headers as [{ Name, Value }].
function headerField(fields, name) {
  const list = Array.isArray(fields.Headers) ? fields.Headers : [];
  const hit = list.find(h => h && String(h.Name).toLowerCase() === name.toLowerCase());
  return hit ? str(hit.Value) : '';
}

// SendGrid's `envelope` is a JSON string: { "to": [...], "from": "..." }.
function envelopeTo(value) {
  if (typeof value !== 'string' || !value) return [];
  try {
    const parsed = JSON.parse(value);
    return addressList(parsed && parsed.to);
  } catch (e) {
    return [];
  }
}

// The headers a provider passes along, as a Map of lower-case name -> value,
// for telling a bounce or an auto-reply from an ordinary email
// (models/lib/emailBounce.js): Mailgun's `message-headers` ([[name, value]]),
// SendGrid's `headers` (the raw header block), Postmark's `Headers`.
function providerHeaders(fields) {
  const map = new Map();
  const put = (name, value) => { if (name) map.set(String(name).toLowerCase(), String(value || '')); };
  try {
    const mg = typeof fields['message-headers'] === 'string' ? JSON.parse(fields['message-headers']) : fields['message-headers'];
    if (Array.isArray(mg)) mg.forEach(pair => Array.isArray(pair) && put(pair[0], pair[1]));
  } catch (e) { /* not JSON: ignored */ }
  if (typeof fields.headers === 'string') {
    for (const line of fields.headers.replace(/\r?\n[ \t]+/g, ' ').split(/\r?\n/)) {
      const at = line.indexOf(':');
      if (at > 0) put(line.slice(0, at).trim(), line.slice(at + 1).trim());
    }
  }
  if (Array.isArray(fields.Headers)) fields.Headers.forEach(h => h && put(h.Name, h.Value));
  return map;
}

// fields: the parsed form or JSON body. files: multipart file parts as
// [{ fieldname, filename, contentType, content }].
function fromProviderFields(fields = {}, files = []) {
  const fromFull = fields.FromFull && typeof fields.FromFull === 'object'
    ? { name: str(fields.FromFull.Name), address: str(fields.FromFull.Email) } : null;
  const attachments = [];
  for (const file of Array.isArray(files) ? files : []) {
    if (file && Buffer.isBuffer(file.content) && file.filename) {
      attachments.push({ filename: file.filename, contentType: file.contentType || 'application/octet-stream', content: file.content });
    }
  }
  // Postmark sends attachments inline, base64.
  if (Array.isArray(fields.Attachments)) {
    for (const a of fields.Attachments) {
      if (a && typeof a.Content === 'string' && a.Name) {
        attachments.push({ filename: str(a.Name), contentType: str(a.ContentType) || 'application/octet-stream', content: Buffer.from(a.Content, 'base64') });
      }
    }
  }
  return {
    from: fromFull || parseFrom(first(fields, ['from', 'From', 'sender', 'Sender'])),
    to: addressList(fields.ToFull || first(fields, ['to', 'To'])),
    cc: addressList(fields.CcFull || first(fields, ['cc', 'Cc'])),
    deliveredTo: [
      ...addressList(first(fields, ['recipient', 'Recipient', 'OriginalRecipient'])),
      ...envelopeTo(fields.envelope),
    ].filter((a, i, all) => all.indexOf(a) === i),
    subject: first(fields, ['subject', 'Subject']),
    text: first(fields, ['text', 'Text', 'TextBody', 'body-plain', 'stripped-text']),
    html: first(fields, ['html', 'Html', 'HtmlBody', 'body-html', 'stripped-html']),
    messageId: first(fields, ['Message-Id', 'message-id', 'MessageID', 'MessageId']),
    inReplyTo: messageIds(first(fields, ['In-Reply-To', 'in-reply-to']) || headerField(fields, 'In-Reply-To')),
    references: messageIds(first(fields, ['References', 'references']) || headerField(fields, 'References')),
    headers: providerHeaders(fields),
    deliveryStatus: '',
    attachments,
  };
}

// mailparser's simpleParser result.
function fromParsedMail(mail = {}) {
  const header = name => {
    const h = mail.headers && typeof mail.headers.get === 'function' ? mail.headers.get(name) : undefined;
    if (!h) return [];
    if (typeof h === 'object' && !Array.isArray(h)) return addressList(h.value || h.text);
    return addressList(h);
  };
  const fromValue = mail.from && Array.isArray(mail.from.value) && mail.from.value[0];
  return {
    from: fromValue ? { name: str(fromValue.name), address: str(fromValue.address) } : { name: '', address: '' },
    to: addressList(mail.to && (Array.isArray(mail.to) ? mail.to.map(t => t.value) : mail.to.value)),
    cc: addressList(mail.cc && (Array.isArray(mail.cc) ? mail.cc.map(t => t.value) : mail.cc.value)),
    deliveredTo: [...header('delivered-to'), ...header('x-original-to'), ...header('envelope-to')]
      .filter((a, i, all) => all.indexOf(a) === i),
    subject: str(mail.subject),
    text: str(mail.text),
    html: typeof mail.html === 'string' ? mail.html : '',
    messageId: str(mail.messageId),
    inReplyTo: messageIds(mail.inReplyTo),
    references: messageIds(mail.references),
    headers: mail.headers instanceof Map ? mail.headers : new Map(),
    // A delivery status notification's machine-readable part (RFC 3464).
    deliveryStatus: (Array.isArray(mail.attachments) ? mail.attachments : [])
      .filter(a => a && /^message\/(delivery-status|global-delivery-status)$/i.test(a.contentType || '') && Buffer.isBuffer(a.content))
      .map(a => a.content.toString('utf8')).join('\n\n'),
    attachments: (Array.isArray(mail.attachments) ? mail.attachments : [])
      .filter(a => a && Buffer.isBuffer(a.content) && a.filename && a.contentDisposition !== 'inline')
      .map(a => ({ filename: a.filename, contentType: a.contentType || 'application/octet-stream', content: a.content })),
  };
}

module.exports = { fromProviderFields, fromParsedMail, parseFrom, addressList, messageIds };
