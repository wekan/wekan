// Microsoft Outlook's .msg files, read in plain JavaScript without
// dependencies so tests/outlookMsg.test.cjs runs it in Node, and a board
// written as .eml files Outlook opens.
//
// A .msg is a Compound File Binary file ([MS-CFB]): a little file system of
// storages and streams in 512- or 4096-byte sectors, chained by a FAT, with
// streams under 4096 bytes in a mini stream of 64-byte sectors. The message
// ([MS-OXMSG]) is its root storage:
//   __substg1.0_PPPPTTTT       a property: PPPP its id, TTTT its type
//                              (001F UTF-16LE text, 001E 8-bit text, 0102
//                              binary)
//   __properties_version1.0    the fixed-size properties, 16 bytes each
//                              (a time is a FILETIME, 100 ns since 1601)
//   __recip_version1.0_#N      a storage per recipient: 3001 name, 39FE SMTP
//                              address, 3003 address, 0C15 type (1 To, 2 Cc)
//   __attach_version1.0_#N     a storage per attachment: 3707 long file name,
//                              3704 short name, 3701 the data
// and the message's own: 0037 subject, 1000 plain body, 1013 HTML body,
// 0C1A / 5D01 / 0C1F the sender's name, SMTP address and address, 1035 the
// Message-ID, 1042 In-Reply-To, 1039 References, 0039 when it was sent and
// 0E06 when it arrived.
//
// Each .msg becomes the message object models/lib/mailFormat.js
// parseMailMessages reads (threads, Board View / Email), with its attachments
// as files of the card. An attachment that is itself a message (an embedded
// .msg) has no file data and is reported.

import { mailMessagesOf } from './mailFormat.js';

export const MAX_MSG_BYTES = 64 * 1024 * 1024;
export const MAX_MSG_ATTACHMENT_BYTES = 32 * 1024 * 1024;
const SIGNATURE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
const END = 0xfffffffe;
const FREE = 0xffffffff;
const NOSTREAM = 0xffffffff;

export const isMsg = bytes => bytes && bytes.length >= 512 && SIGNATURE.every((b, i) => bytes[i] === b);

// ------------------------------------------------------------- [MS-CFB] ---

export function readCompoundFile(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input || []);
  if (!isMsg(bytes)) throw new Error('Not an Outlook .msg file: it is not a Compound File');
  if (bytes.length > MAX_MSG_BYTES) throw new Error(`An Outlook .msg file is read up to ${MAX_MSG_BYTES / 1024 / 1024} MB`);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const u16 = at => view.getUint16(at, true);
  const u32 = at => (at + 4 <= bytes.length ? view.getUint32(at, true) : END);
  const sectorSize = 1 << u16(0x1e);
  const miniSize = 1 << u16(0x20);
  if (sectorSize !== 512 && sectorSize !== 4096) throw new Error('Not an Outlook .msg file: its sector size is not 512 or 4096');
  const cutoff = u32(0x38);
  const sectors = Math.ceil(bytes.length / sectorSize) - 1;
  const offset = n => (n + 1) * sectorSize;

  // The FAT's sectors: 109 in the header, the rest in a chain of DIFAT sectors.
  const fatSectors = [];
  for (let i = 0; i < 109; i += 1) { const s = u32(0x4c + i * 4); if (s < sectors) fatSectors.push(s); }
  let difat = u32(0x44);
  for (let guard = 0; difat < sectors && guard < sectors; guard += 1) {
    const per = sectorSize / 4 - 1;
    for (let i = 0; i < per; i += 1) { const s = u32(offset(difat) + i * 4); if (s < sectors) fatSectors.push(s); }
    difat = u32(offset(difat) + per * 4);
  }
  const fat = [];
  for (const s of fatSectors) for (let i = 0; i < sectorSize / 4; i += 1) fat.push(u32(offset(s) + i * 4));
  const chain = (start, table) => {
    const out = [];
    const seen = new Set();
    for (let s = start; s !== END && s !== FREE && s < table.length; s = table[s]) {
      if (seen.has(s)) throw new Error('The Outlook .msg file is damaged: a sector chain loops');
      seen.add(s);
      out.push(s);
    }
    return out;
  };
  const readChain = (start, size) => {
    const out = new Uint8Array(Math.max(0, size));
    let at = 0;
    for (const s of chain(start, fat)) {
      if (at >= size) break;
      const take = Math.min(sectorSize, size - at, bytes.length - offset(s));
      if (take <= 0) break;
      out.set(bytes.subarray(offset(s), offset(s) + take), at);
      at += take;
    }
    return out.subarray(0, at);
  };

  // The directory: 128-byte entries in the chain from the header.
  const dirChain = chain(u32(0x30), fat);
  const entries = [];
  for (const s of dirChain) {
    for (let i = 0; i < sectorSize / 128; i += 1) {
      const at = offset(s) + i * 128;
      if (at + 128 > bytes.length) break;
      const nameLength = Math.min(64, u16(at + 64));
      let name = '';
      for (let c = 0; c + 2 < nameLength; c += 2) name += String.fromCharCode(u16(at + c));
      entries.push({ name, type: bytes[at + 66], left: u32(at + 68), right: u32(at + 72), child: u32(at + 76),
        start: u32(at + 116), size: u32(at + 120) });
    }
  }
  const root = entries[0];
  if (!root || root.type !== 5) throw new Error('The Outlook .msg file is damaged: no root entry');
  const miniFat = [];
  for (const s of chain(u32(0x3c), fat)) for (let i = 0; i < sectorSize / 4; i += 1) miniFat.push(u32(offset(s) + i * 4));
  const ministream = readChain(root.start, root.size);
  const readMini = (start, size) => {
    const out = new Uint8Array(Math.max(0, size));
    let at = 0;
    for (const s of chain(start, miniFat)) {
      if (at >= size) break;
      const take = Math.min(miniSize, size - at, ministream.length - s * miniSize);
      if (take <= 0) break;
      out.set(ministream.subarray(s * miniSize, s * miniSize + take), at);
      at += take;
    }
    return out.subarray(0, at);
  };
  const read = entry => (entry.size < cutoff ? readMini(entry.start, entry.size) : readChain(entry.start, entry.size));

  // A storage's children: the red-black tree under its child entry.
  const childrenOf = entry => {
    const out = [];
    const seen = new Set();
    const stack = [entry.child];
    while (stack.length) {
      const id = stack.pop();
      if (id === NOSTREAM || id >= entries.length || seen.has(id)) continue;
      seen.add(id);
      const e = entries[id];
      out.push(e);
      stack.push(e.left, e.right);
    }
    return out;
  };
  const storage = entry => {
    const node = { streams: new Map(), storages: new Map() };
    for (const child of childrenOf(entry)) {
      if (child.type === 2) node.streams.set(child.name, child);
      else if (child.type === 1) node.storages.set(child.name, child);
    }
    node.read = name => (node.streams.has(name) ? read(node.streams.get(name)) : null);
    node.open = name => (node.storages.has(name) ? storage(node.storages.get(name)) : null);
    return node;
  };
  return storage(root);
}

// ----------------------------------------------------------- [MS-OXMSG] ---

const utf16 = data => {
  let out = '';
  for (let i = 0; i + 1 < data.length; i += 2) out += String.fromCharCode(data[i] | (data[i + 1] << 8));
  return out.replace(/\u0000+$/, '');
};
const ascii = data => new TextDecoder('utf-8').decode(data).replace(/\u0000+$/, '');
const hex4 = n => n.toString(16).toUpperCase().padStart(4, '0');

function stringProp(node, id) {
  const unicode = node.read(`__substg1.0_${hex4(id)}001F`);
  if (unicode) return utf16(unicode);
  const eight = node.read(`__substg1.0_${hex4(id)}001E`);
  return eight ? ascii(eight) : '';
}
const binaryProp = (node, id) => node.read(`__substg1.0_${hex4(id)}0102`);

// The fixed-size properties: { id: { type, low, high } }.
function fixedProps(node, headerSize) {
  const data = node.read('__properties_version1.0');
  const out = new Map();
  if (!data) return out;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  for (let at = headerSize; at + 16 <= data.length; at += 16) {
    const tag = view.getUint32(at, true);
    out.set(tag >>> 16, { type: tag & 0xffff, low: view.getUint32(at + 8, true), high: view.getUint32(at + 12, true) });
  }
  return out;
}
// A FILETIME as an ISO string.
const filetime = prop => {
  if (!prop || prop.type !== 0x0040) return '';
  const ms = (prop.high * 4294967296 + prop.low) / 10000 - 11644473600000;
  const date = new Date(ms);
  return Number.isNaN(date.getTime()) || ms <= 0 ? '' : date.toISOString();
};

// Each removal until nothing changes: removing one tag can splice the text
// around it into another ("<<b>b>").
const htmlToText = html => {
  let out = String(html || '');
  let prev;
  do {
    prev = out;
    out = out.replace(/<(head|style|script)\b[\s\S]*?<\/\1\s*>/gi, '');
  } while (out !== prev);
  out = out.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|tr|h[1-6])\s*>/gi, '\n');
  do {
    prev = out;
    out = out.replace(/<[^>]*>/g, '');
  } while (out !== prev);
  return htmlEntities(out);
};
const htmlEntities = text => text
  .replace(/&nbsp;/gi, ' ').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
  .replace(/&amp;/gi, '&')
  .replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

const toBase64 = data => {
  if (typeof Buffer !== 'undefined') return Buffer.from(data.buffer, data.byteOffset, data.byteLength).toString('base64');
  let binary = '';
  for (let i = 0; i < data.length; i += 0x8000) binary += String.fromCharCode(...data.subarray(i, i + 0x8000));
  return btoa(binary); // eslint-disable-line no-undef
};
const address = (smtp, other) => {
  const a = String(smtp || '').trim() || String(other || '').trim();
  return /@/.test(a) ? a.toLowerCase() : '';
};
const ids = text => String(text || '').match(/<[^<>\s]+>/g) || [];

// One .msg as the message parseMailMessages reads, plus { files, skipped }.
export function readOutlookMsg(input) {
  const root = readCompoundFile(input);
  const props = fixedProps(root, 32);
  const htmlData = binaryProp(root, 0x1013);
  const html = htmlData ? ascii(htmlData) : stringProp(root, 0x1013);
  const text = stringProp(root, 0x1000) || htmlToText(html);
  const recipients = [];
  const files = [];
  let skipped = 0;
  for (const [name] of root.storages) {
    if (name.startsWith('__recip_version1.0_')) {
      const r = root.open(name);
      const kind = fixedProps(r, 8).get(0x0c15);
      recipients.push({ name: stringProp(r, 0x3001), address: address(stringProp(r, 0x39fe), stringProp(r, 0x3003)),
        type: kind ? kind.low : 1 });
    } else if (name.startsWith('__attach_version1.0_')) {
      const a = root.open(name);
      const data = binaryProp(a, 0x3701);
      const fileName = stringProp(a, 0x3707) || stringProp(a, 0x3704) || stringProp(a, 0x3001) || 'attachment';
      if (data && data.length <= MAX_MSG_ATTACHMENT_BYTES) files.push({ name: fileName, file: toBase64(data) });
      else skipped += 1;
    }
  }
  const references = ids(stringProp(root, 0x1039));
  // A recipient can be listed twice (Outlook keeps resolved and typed ones).
  const people = type => {
    const seen = new Set();
    return recipients.filter(r => r.type === type && r.address && !seen.has(r.address) && seen.add(r.address))
      .map(r => ({ name: r.name, address: r.address }));
  };
  return {
    subject: stringProp(root, 0x0037),
    from: { name: stringProp(root, 0x0c1a), address: address(stringProp(root, 0x5d01), stringProp(root, 0x0c1f)) },
    to: people(1),
    cc: people(2),
    date: filetime(props.get(0x0039)) || filetime(props.get(0x0e06)) || undefined,
    messageId: stringProp(root, 0x1035),
    inReplyTo: stringProp(root, 0x1042),
    references,
    text,
    files,
    attachments: skipped,
  };
}

// ------------------------------------------------------------------ export ---

const fileName = (title, n) => {
  const slug = String(title || '').normalize('NFKD').replace(/[^\w\s-]+/g, '').trim().replace(/\s+/g, '-').slice(0, 60);
  return `${String(n).padStart(4, '0')}-${slug || 'message'}.eml`;
};

// The board as .eml files, a card and each of its comments a message (the
// .mbox export's messages, models/lib/mailFormat.js, without the "From "
// line): Outlook opens an .eml, and it can be dragged into a folder there.
// Two steps, as for Vikunja's archive HTML: formatOutlookEml keeps the cards'
// plain values, which pass the export boundary; outlookArchiveFiles writes
// the messages from them after it. Written before it, the boundary's HTML
// sanitizer read "Message-ID: <c1@wekan.invalid>" as a tag and removed it.
const MAIL_FIELDS = ['cardId', 'title', 'description', 'creator', 'createdAt', 'dueAt', 'labels', 'comments', 'email'];
export function formatOutlookEml(collected = {}) {
  return { outlook: true, items: (collected.items || []).map(item => Object.fromEntries(MAIL_FIELDS
    .filter(key => item && item[key] !== undefined).map(key => [key, item[key]]))) };
}

// formatOutlookEml's cards as the .zip's .eml files: { 'NNNN-title.eml': text }.
export function outlookArchiveFiles(built = {}) {
  const files = {};
  if (!built || built.outlook !== true || !Array.isArray(built.items)) return files;
  let n = 0;
  for (const item of built.items) {
    if (!item || typeof item !== 'object') continue;
    for (const message of mailMessagesOf([item])) {
      n += 1;
      files[fileName(item.title, n)] = message.replace(/^From [^\n]*\n/, '').replace(/\n/g, '\r\n');
    }
  }
  return files;
}
