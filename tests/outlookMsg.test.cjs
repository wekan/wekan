'use strict';
// Outlook's .msg ([MS-CFB] holding [MS-OXMSG]): read into the messages the
// mail import makes cards of, with their attachments, and a board written
// as .eml files (models/lib/outlookMsgFormat.js, server/lib/microsoftArchives.js).
// The .msg files here are written by a small Compound File writer below,
// with small streams in the mini stream and large ones in FAT chains, as
// Outlook writes them.
// Run: node --test tests/outlookMsg.test.cjs
const test = require('node:test');
// The export boundary's HTML sanitizer at its strictest: every tag removed,
// to a fixed point (tests/tagStrippingFixedPoint.test.cjs).
function stripEveryTag(value) {
  let out = value;
  let prev;
  do {
    prev = out;
    out = out.replace(/<[^>]*>/g, '');
  } while (out !== prev);
  return out;
}
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { zipSync, strToU8 } = require('fflate');

let msg;
let mail;
test.before(async () => {
  msg = await import('../models/lib/outlookMsgFormat.js');
  mail = await import('../models/lib/mailFormat.js');
});

// ---- a Compound File writer: { name: Uint8Array | { storage children } } ----
const SECTOR = 512;
const MINI = 64;
const END = 0xfffffffe;
const NONE = 0xffffffff;
function writeCompoundFile(tree) {
  const entries = [{ name: 'Root Entry', type: 5, children: [] }];
  const add = (node, parent) => {
    for (const [name, value] of Object.entries(node)) {
      const entry = value instanceof Uint8Array ? { name, type: 2, data: value } : { name, type: 1, children: [] };
      entries.push(entry);
      entries[parent].children.push(entries.length - 1);
      if (entry.type === 1) add(value, entries.length - 1);
    }
  };
  add(tree, 0);
  // Mini stream: streams under 4096 bytes, in 64-byte mini sectors.
  const mini = [];
  const miniFat = [];
  const big = [];
  for (const e of entries.filter(x => x.type === 2)) {
    if (e.data.length < 4096) {
      e.start = e.data.length ? miniFat.length : END;
      const n = Math.ceil(e.data.length / MINI);
      for (let i = 0; i < n; i += 1) miniFat.push(i === n - 1 ? END : miniFat.length + 1);
      const padded = new Uint8Array(n * MINI); padded.set(e.data); mini.push(padded);
    } else big.push(e);
  }
  const ministream = Buffer.concat(mini.map(b => Buffer.from(b)));
  const dir = Buffer.alloc(Math.ceil(entries.length / 4) * SECTOR);
  const miniFatBuf = Buffer.alloc(Math.ceil(miniFat.length * 4 / SECTOR) * SECTOR, 0xff);
  miniFat.forEach((v, i) => miniFatBuf.writeUInt32LE(v, i * 4));
  const blobs = [{ key: 'dir', data: dir }, { key: 'minifat', data: miniFatBuf }, { key: 'mini', data: ministream },
    ...big.map(e => ({ key: e, data: Buffer.from(e.data) }))];
  const sectorsOf = b => Math.ceil(b.length / SECTOR);
  const dataSectors = blobs.reduce((n, b) => n + sectorsOf(b.data), 0);
  let fatSectors = 1;
  while (fatSectors * (SECTOR / 4) < fatSectors + dataSectors) fatSectors += 1;
  const fat = new Array(fatSectors * (SECTOR / 4)).fill(NONE);
  for (let i = 0; i < fatSectors; i += 1) fat[i] = 0xfffffffd;
  let next = fatSectors;
  const startOf = new Map();
  for (const b of blobs) {
    const n = sectorsOf(b.data);
    startOf.set(b.key, n ? next : END);
    for (let i = 0; i < n; i += 1) fat[next + i] = i === n - 1 ? END : next + i + 1;
    next += n;
  }
  const root = entries[0];
  root.start = startOf.get('mini'); root.size = ministream.length;
  for (const e of big) e.start = startOf.get(e);
  // Children as a chain of right siblings: a valid (if unbalanced) tree.
  entries.forEach(e => { e.left = NONE; e.right = NONE; e.child = NONE; });
  entries.forEach(e => {
    if (!e.children) return;
    e.child = e.children.length ? e.children[0] : NONE;
    e.children.forEach((id, i) => { entries[id].right = i + 1 < e.children.length ? e.children[i + 1] : NONE; });
  });
  entries.forEach((e, i) => {
    const at = i * 128;
    const name = Buffer.from(`${e.name}\0`, 'utf16le');
    name.copy(dir, at);
    dir.writeUInt16LE(name.length, at + 64);
    dir[at + 66] = e.type; dir[at + 67] = 1;
    dir.writeUInt32LE(e.left, at + 68); dir.writeUInt32LE(e.right, at + 72); dir.writeUInt32LE(e.child, at + 76);
    dir.writeUInt32LE(e.type === 1 ? 0 : (e.start ?? END), at + 116);
    dir.writeUInt32LE(e.type === 5 ? e.size : e.type === 2 ? e.data.length : 0, at + 120);
  });
  for (let i = entries.length; i < dir.length / 128; i += 1) {
    dir.writeUInt32LE(NONE, i * 128 + 68); dir.writeUInt32LE(NONE, i * 128 + 72); dir.writeUInt32LE(NONE, i * 128 + 76);
  }
  const header = Buffer.alloc(SECTOR);
  Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]).copy(header);
  header.writeUInt16LE(0x3e, 0x18); header.writeUInt16LE(3, 0x1a); header.writeUInt16LE(0xfffe, 0x1c);
  header.writeUInt16LE(9, 0x1e); header.writeUInt16LE(6, 0x20);
  header.writeUInt32LE(fatSectors, 0x2c); header.writeUInt32LE(startOf.get('dir'), 0x30);
  header.writeUInt32LE(4096, 0x38); header.writeUInt32LE(miniFat.length ? startOf.get('minifat') : END, 0x3c);
  header.writeUInt32LE(Math.ceil(miniFat.length * 4 / SECTOR), 0x40); header.writeUInt32LE(END, 0x44);
  for (let i = 0; i < 109; i += 1) header.writeUInt32LE(i < fatSectors ? i : NONE, 0x4c + i * 4);
  const fatBuf = Buffer.alloc(fatSectors * SECTOR);
  fat.forEach((v, i) => fatBuf.writeUInt32LE(v >>> 0, i * 4));
  const body = Buffer.concat(blobs.map(b => { const out = Buffer.alloc(sectorsOf(b.data) * SECTOR); b.data.copy(out); return out; }));
  return new Uint8Array(Buffer.concat([header, fatBuf, body]));
}

const u16 = text => new Uint8Array(Buffer.from(`${text}`, 'utf16le'));
const prop = (id, text) => [`__substg1.0_${id}001F`, u16(text)];
// The fixed properties: a 32-byte header (8 for a recipient), 16 bytes each.
const fixed = (headerSize, props) => {
  const out = Buffer.alloc(headerSize + props.length * 16);
  props.forEach(([tag, low, high], i) => {
    out.writeUInt32LE(tag, headerSize + i * 16); out.writeUInt32LE(6, headerSize + i * 16 + 4);
    out.writeUInt32LE(low >>> 0, headerSize + i * 16 + 8); out.writeUInt32LE(high >>> 0, headerSize + i * 16 + 12);
  });
  return new Uint8Array(out);
};
const filetime = iso => {
  const ticks = (BigInt(Date.parse(iso)) + 11644473600000n) * 10000n;
  return [Number(ticks & 0xffffffffn), Number(ticks >> 32n)];
};

function sampleMsg({ subject = 'Quarterly plan', id = '<plan@contoso.com>', inReplyTo = '', big = 6000 } = {}) {
  const [low, high] = filetime('2026-11-20T09:30:00.000Z');
  const attachment = new Uint8Array(big).map((_, i) => i % 251);
  return writeCompoundFile({
    '__properties_version1.0': fixed(32, [[0x00390040, low, high]]),
    ...Object.fromEntries([prop('0037', subject), prop('0C1A', 'Megan Bowen'), prop('5D01', 'Megan@Contoso.com'),
      prop('1000', 'Here is the plan.\r\nComments welcome.'), prop('1035', id), ...(inReplyTo ? [prop('1042', inReplyTo)] : [])]),
    '__recip_version1.0_#00000000': { '__properties_version1.0': fixed(8, [[0x0c150003, 1, 0]]),
      ...Object.fromEntries([prop('3001', 'Alex Wilber'), prop('39FE', 'alex@contoso.com')]) },
    '__recip_version1.0_#00000001': { '__properties_version1.0': fixed(8, [[0x0c150003, 2, 0]]),
      ...Object.fromEntries([prop('3001', 'Lee Gu'), prop('3003', 'lee@contoso.com')]) },
    '__attach_version1.0_#00000000': { ...Object.fromEntries([prop('3707', 'plan.xlsx')]), '__substg1.0_37010102': attachment },
    '__attach_version1.0_#00000001': { ...Object.fromEntries([prop('3707', 'notes.txt')]), '__substg1.0_37010102': new Uint8Array(Buffer.from('short')) },
    '__attach_version1.0_#00000002': { ...Object.fromEntries([prop('3707', 'Forwarded.msg')]), '__substg1.0_3701000D': {} },
  });
}

test('a .msg is read: subject, sender, recipients, time, ids, body and attachments', () => {
  const m = msg.readOutlookMsg(sampleMsg());
  assert.strictEqual(m.subject, 'Quarterly plan');
  assert.deepStrictEqual(m.from, { name: 'Megan Bowen', address: 'megan@contoso.com' });
  assert.deepStrictEqual(m.to, [{ name: 'Alex Wilber', address: 'alex@contoso.com' }]);
  assert.deepStrictEqual(m.cc, [{ name: 'Lee Gu', address: 'lee@contoso.com' }]);
  assert.strictEqual(m.date, '2026-11-20T09:30:00.000Z');
  assert.strictEqual(m.messageId, '<plan@contoso.com>');
  assert.strictEqual(m.text, 'Here is the plan.\r\nComments welcome.');
  assert.deepStrictEqual(m.files.map(f => f.name), ['plan.xlsx', 'notes.txt']);
  // The large one came through FAT sectors, the small one the mini stream.
  assert.strictEqual(Buffer.from(m.files[0].file, 'base64').length, 6000);
  assert.strictEqual(Buffer.from(m.files[0].file, 'base64')[300], 300 % 251);
  assert.strictEqual(Buffer.from(m.files[1].file, 'base64').toString(), 'short');
  // An embedded message has no file data: counted, not imported.
  assert.strictEqual(m.attachments, 1);
});

test('messages become mail cards, threads by their ids, attachments on the card', () => {
  const first = msg.readOutlookMsg(sampleMsg());
  const reply = msg.readOutlookMsg(sampleMsg({ subject: 'RE: Quarterly plan', id: '<re@contoso.com>', inReplyTo: '<plan@contoso.com>', big: 10 }));
  const board = mail.parseMailMessages([first, reply], { name: 'Imported Outlook mail' });
  assert.strictEqual(board.tasks.length, 1);
  const card = board.tasks[0];
  assert.strictEqual(card.title, 'Quarterly plan');
  assert.strictEqual(card.email.from.address, 'megan@contoso.com');
  assert.deepStrictEqual(card.email.to, ['alex@contoso.com']);
  assert.strictEqual(card.comments.length, 1);
  assert.deepStrictEqual(card.attachments.map(a => a.name), ['plan.xlsx', 'notes.txt', 'plan.xlsx', 'notes.txt']);
  assert.ok(board.unsupported.some(u => /2 mail attachment/.test(u.reason)));
});

test('a .zip of .msg and .eml files, and one .msg as bytes, are read on the server', async () => {
  const { readOutlookMessages } = require('../server/lib/microsoftArchives');
  const eml = 'From: Lee Gu <lee@contoso.com>\r\nTo: megan@contoso.com\r\nSubject: Lunch\r\nMessage-ID: <lunch@contoso.com>\r\nDate: Fri, 20 Nov 2026 11:00:00 +0000\r\n\r\nAt noon?\r\n';
  const zipBase64 = Buffer.from(zipSync({ 'mail/plan.msg': sampleMsg(), 'mail/lunch.eml': strToU8(eml), '__MACOSX/._plan.msg': strToU8('x') })).toString('base64');
  const messages = await readOutlookMessages({ zipBase64 });
  assert.deepStrictEqual(messages.map(m => m.subject).sort(), ['Lunch', 'Quarterly plan']);
  const one = await readOutlookMessages({ binaryBase64: Buffer.from(sampleMsg()).toString('base64') });
  assert.strictEqual(one[0].subject, 'Quarterly plan');
});

test('export: a card and its comments as .eml files Outlook opens, which the import reads back', async () => {
  const built = msg.formatOutlookEml({ items: [{ cardId: 'c1', title: 'Quarterly plan', description: 'Here is the plan.',
    creator: 'megan', createdAt: '2026-11-20T09:30:00.000Z', labels: [],
    comments: [{ text: 'Looks good.', author: 'alex', date: '2026-11-20T10:00:00.000Z' }] }] });
  const files = msg.outlookArchiveFiles(built);
  const names = Object.keys(files);
  assert.deepStrictEqual(names, ['0001-Quarterly-plan.eml', '0002-Quarterly-plan.eml']);
  const first = files[names[0]];
  assert.ok(!/^From /.test(first), 'an .eml has no mbox "From " line');
  assert.match(first, /\r\nSubject: Quarterly plan\r\n/);
  const { decodeMail } = require('../server/lib/mailImport');
  const back = mail.parseMailMessages([...await decodeMail(first), ...await decodeMail(files[names[1]])]);
  assert.strictEqual(back.tasks.length, 1);
  assert.strictEqual(back.tasks[0].title, 'Quarterly plan');
  assert.strictEqual(back.tasks[0].comments[0].text, 'Looks good.');
});

test('negative: the export boundary cannot take the messages apart - they are written after it', async () => {
  // The boundary passes every string that looks like markup through the HTML
  // sanitizer; a sanitizer that removes every tag stands in for it here.
  const { sanitizeTransferValue } = await import('../models/lib/importExportBoundary.js');
  const built = msg.formatOutlookEml({ items: [{ cardId: 'c1', title: 'Plan', description: 'Text', creator: 'megan',
    createdAt: '2026-11-20T09:30:00.000Z', labels: [], comments: [{ text: 'Reply', author: 'alex' }] }] });
  const checked = sanitizeTransferValue(built, { direction: 'export', sanitizeHtml: stripEveryTag });
  assert.deepStrictEqual(checked.warnings, [], 'nothing in the document is markup');
  const files = Object.values(msg.outlookArchiveFiles(checked.value));
  assert.match(files[0], /\r\nMessage-ID: <c1@wekan\.invalid>\r\n/);
  assert.match(files[1], /\r\nIn-Reply-To: <c1@wekan\.invalid>\r\n/);
});

test('negative: what is not a Compound File, or whose sector chain loops, is refused', () => {
  assert.throws(() => msg.readOutlookMsg(new Uint8Array(Buffer.from('From: x\r\n\r\nnot a msg'.padEnd(600)))), /not a Compound File/);
  const looped = Buffer.from(sampleMsg());
  // The directory's first sector points to itself in the FAT.
  const dirSector = looped.readUInt32LE(0x30);
  looped.writeUInt32LE(dirSector, 512 + dirSector * 4);
  assert.throws(() => msg.readOutlookMsg(new Uint8Array(looped)), /loops/);
  assert.strictEqual(msg.isMsg(new Uint8Array(10)), false);
  // Only the names formatOutlookEml writes reach the zip.
  // Only formatOutlookEml's cards are written, under names it makes.
  assert.deepStrictEqual(msg.outlookArchiveFiles({ files: { '../evil.eml': 'x' } }), {});
  assert.deepStrictEqual(Object.keys(msg.outlookArchiveFiles({ outlook: true, items: [{ title: '../../evil', cardId: 'x' }] })), ['0001-evil.eml']);
});

test('the import reads .msg as bytes and the source is wired end to end', () => {
  const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
  assert.match(read('models/lib/importSources.js'), /key: 'outlook'[^\n]*files: \['\.msg', '\.zip'\]/);
  assert.match(read('server/lib/importUploadSource.js'), /return \{ binaryFile: file \}/);
  assert.match(read('server/lib/messageImports.js'), /case 'outlook':[\s\S]*readOutlookMessages/);
});
