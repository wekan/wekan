'use strict';
// Import uploads streamed to the local disk a part at a time
// (server/lib/importUpload.js), with the free space checked before and while
// they are written (server/lib/importDiskSpace.js), and read back by the
// source's own way (server/lib/importUploadSource.js).
// Run: node --test tests/importUpload.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { PassThrough } = require('node:stream');
const upload = require('../server/lib/importUpload');
const space = require('../server/lib/importDiskSpace');

const root = path.join(process.env.TMPDIR || os.tmpdir(), `wekan-import-upload-${process.pid}`);
test.after(() => fs.rmSync(root, { recursive: true, force: true }));

// A request: a stream with headers, fed in chunks.
function request(chunks, { length } = {}) {
  const req = new PassThrough();
  req.headers = length === undefined ? {} : { 'content-length': String(length) };
  setImmediate(async () => {
    for (const chunk of chunks) {
      if (chunk === 'ABORT') { req.emit('aborted'); return; }
      req.write(chunk);
      await new Promise(r => setImmediate(r));
    }
    req.end();
  });
  return req;
}
const files = dir => (fs.existsSync(dir) ? fs.readdirSync(dir) : []);

test('a file arrives a part at a time, is kept for its sender, and only for them', async () => {
  const dir = path.join(root, 'ok');
  const chunks = [Buffer.alloc(1000, 1), Buffer.alloc(2000, 2), Buffer.alloc(500, 3)];
  const { uploadId, size, file } = await upload.receiveUpload(request(chunks, { length: 3500 }),
    { userId: 'u1', source: 'mail', dir, room: async () => 1e9 });
  assert.strictEqual(size, 3500);
  assert.strictEqual(fs.statSync(file).size, 3500);
  assert.ok(upload.takeUpload(uploadId, 'u1', 'mail'));
  // Negative: another user, another source or a made-up id finds nothing.
  assert.strictEqual(upload.takeUpload(uploadId, 'u2', 'mail'), null);
  assert.strictEqual(upload.takeUpload(uploadId, 'u1', 'slack'), null);
  assert.strictEqual(upload.takeUpload('../../etc/passwd', 'u1', 'mail'), null);
  await upload.removeUpload(uploadId);
  assert.deepStrictEqual(files(dir), []);
  assert.strictEqual(upload.takeUpload(uploadId, 'u1', 'mail'), null);
});

test('negative: over the limit, announced or streamed, and nothing is left behind', async () => {
  const dir = path.join(root, 'limit');
  await assert.rejects(upload.receiveUpload(request([Buffer.alloc(10)], { length: 5000 }),
    { userId: 'u1', source: 'mail', dir, limit: 4000, room: async () => 1e9 }), e => e.code === 'import-too-large');
  // No Content-Length: refused at the byte past the limit.
  await assert.rejects(upload.receiveUpload(request([Buffer.alloc(3000), Buffer.alloc(3000)]),
    { userId: 'u1', source: 'mail', dir, limit: 4000, room: async () => 1e9 }), e => e.code === 'import-too-large');
  await new Promise(r => setTimeout(r, 20));
  assert.deepStrictEqual(files(dir), []);
});

test('negative: no room on the disk, before it starts or while it is written', async () => {
  const dir = path.join(root, 'full');
  await assert.rejects(upload.receiveUpload(request([Buffer.alloc(10)], { length: 5000 }),
    { userId: 'u1', source: 'mail', dir, room: async () => 4000 }), e => e.code === 'import-disk-full');
  // Room for the start only: the check while writing refuses it, the partial file goes.
  let left = 1500;
  const room = async () => { const now = left; left = 0; return now; };
  await assert.rejects(upload.receiveUpload(request([Buffer.alloc(1000), Buffer.alloc(1000), Buffer.alloc(1000)]),
    { userId: 'u1', source: 'mail', dir, room }), e => e.code === 'import-disk-full');
  await new Promise(r => setTimeout(r, 20));
  assert.deepStrictEqual(files(dir), []);
  // An interrupted upload is removed too.
  await assert.rejects(upload.receiveUpload(request([Buffer.alloc(100), 'ABORT']),
    { userId: 'u1', source: 'mail', dir, room: async () => 1e9 }), e => e.code === 'import-upload-aborted');
  await new Promise(r => setTimeout(r, 20));
  assert.deepStrictEqual(files(dir), []);
});

test('the free space is measured on the real file system, and the limit read from the setting', async () => {
  const free = await space.freeBytes(path.join(root, 'not', 'made', 'yet'));
  assert.ok(free === null || free > 0, 'measured by the nearest existing directory');
  assert.strictEqual(space.reserveBytes({ IMPORT_DISK_RESERVE_MB: '10' }), 10 * 1024 * 1024);
  assert.strictEqual(space.reserveBytes({}), space.DEFAULT_RESERVE);
  assert.strictEqual(space.importLimitBytes({ importMaxMegabytes: 5 }), 5 * 1024 * 1024);
  for (const none of [{}, { importMaxMegabytes: 0 }, { importMaxMegabytes: -1 }, null]) {
    assert.strictEqual(space.importLimitBytes(none), 0, 'no limit');
  }
  await assert.rejects(space.assertRoom(root, Number.MAX_SAFE_INTEGER), e => e.code === 'import-disk-full');
});

test('an upload is read the way its source reads: a zip from disk, mail a message at a time, JSON parsed', async () => {
  const { uploadedImportValue } = require('../server/lib/importUploadSource');
  const { zipSync, strToU8 } = require('fflate');
  const dir = path.join(root, 'read');
  const send = async (source, bytes) => (await upload.receiveUpload(request([Buffer.from(bytes)], { length: bytes.length }),
    { userId: 'u1', source, dir, room: async () => 1e9 })).uploadId;
  const zipId = await send('slack', zipSync({ 'channels.json': strToU8('[]') }));
  const zip = await uploadedImportValue(zipId, 'u1', 'slack', { spec: { zipSend: 'zip' } });
  assert.ok(typeof zip.zipFile === 'string' && zip.inflateLimit >= 0 && zip.maxBytes === 0);
  const mailId = await send('mail', Buffer.from('From x\nSubject: a\n\nb\n'));
  assert.ok(typeof (await uploadedImportValue(mailId, 'u1', 'mail', { spec: {} })).mboxFile === 'string');
  const jsonId = await send('telegram', Buffer.from('﻿{"messages":[]}'));
  assert.deepStrictEqual(await uploadedImportValue(jsonId, 'u1', 'telegram', { spec: { send: 'json' } }), { messages: [] });
  const badId = await send('telegram', Buffer.from('{nope'));
  await assert.rejects(uploadedImportValue(badId, 'u1', 'telegram', { spec: { send: 'json' } }), e => e.code === 'invalid-import-format');
  await assert.rejects(uploadedImportValue(jsonId, 'someone-else', 'telegram', { spec: {} }), e => e.code === 'import-upload-not-found');
  for (const id of [zipId, mailId, jsonId, badId]) await upload.removeUpload(id);
});

test('a mailbox on disk and a zip on disk are read without the whole file in memory', async () => {
  const { decodeMailStream } = require('../server/lib/mailImport');
  const { Readable } = require('node:stream');
  const lines = ['From a', 'From: A <a@example.com>', 'Subject: one', '', 'x', 'From b', 'From: B <b@example.com>', 'Subject: two', '', '>From escaped', ''];
  const { messages } = await decodeMailStream(Readable.from(lines.map(l => `${l}\n`)));
  assert.deepStrictEqual(messages.map(m => m.subject), ['one', 'two']);
  assert.match(messages[1].text, /^From escaped/);
  const src = fs.readFileSync(path.join(__dirname, '..', 'server/lib/zipSource.js'), 'utf8');
  assert.match(src, /unzipper\.Open\.file\(source\.file\)/, 'a zip on disk is opened from the file');
  assert.doesNotMatch(src.slice(src.indexOf("typeof source.file === 'string'"), src.indexOf('if (!Buffer.isBuffer(source)')), /readFile/,
    'and never read into a Buffer first');
});

test('the route, the method and the page are wired to it', () => {
  const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
  const route = read('server/routes/importUpload.js');
  assert.match(route, /WebApp\.handlers\.use\('\/api\/import\/upload'/);
  assert.match(route, /getUserIdFromRequest\(req\)/);
  assert.match(route, /assertImportEnabled\(\)/);
  assert.match(route, /importLimitBytes\(/);
  assert.match(read('server/imports.js'), /import '\/server\/routes\/importUpload';/);
  const importJs = read('models/import.js');
  assert.match(importJs, /check\(data\.uploadId, Match\.Maybe/);
  assert.ok(importJs.indexOf('check(data.uploadId') < importJs.indexOf('await assertMayCreateBoardOnServer'), 'checked before the first await');
  assert.match(importJs, /uploadedImportValue\(uploadId, this\.userId, importSource/);
  const page = read('client/components/import/import.js');
  assert.match(page, /fetch\(`\/api\/import\/upload\/\$\{encodeURIComponent\(source\)\}`/);
  assert.match(page, /body: file,/, 'the File itself is the body: the browser streams it');
  assert.doesNotMatch(page.slice(page.indexOf('async function postImportUpload'), page.indexOf('// A WeKan .zip export')), /arrayBuffer|readAsDataURL|btoa/);
});

test('Admin Panel / Settings / Security sets the largest import; empty is no limit', () => {
  const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
  assert.match(read('client/components/settings/adminProblems.jade'), /input\.js-import-max-megabytes\(type="number" min="0"/);
  const js = read('client/components/settings/adminProblems.js');
  assert.match(js, /'change \.js-import-max-megabytes'/);
  assert.match(js, /\{ \$unset: \{ importMaxMegabytes: '' \} \}/, 'an empty or zero value removes the limit');
  assert.match(read('models/settings.js'), /importMaxMegabytes: \{\s*type: Number,\s*optional: true,\s*min: 0,/);
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  for (const key of ['import-max-megabytes', 'import-max-megabytes-none', 'import-max-megabytes-description',
    'import-disk-full', 'import-too-large', 'import-upload-not-found', 'import-upload-failed', 'import-upload-aborted']) {
    assert.strictEqual(typeof en[key], 'string', key);
  }
});

test('WeKan\'s own .zip and Trello\'s package use the same upload, limit and disk check', () => {
  const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
  const zip = read('models/importZip.js');
  assert.match(zip, /receiveUpload\(req, \{ userId: 'import-zip', source: 'wekan', limit \}\)/);
  assert.match(zip, /importLimitBytes\(await Settings\.findOneAsync/);
  assert.match(zip, /message === 'import-disk-full' \? 507/);
  assert.doesNotMatch(zip, /5 \* 1024 \* 1024 \* 1024/, 'no fixed 5 GB cap: the limit, else the free space');
  const trello = read('server/routes/importTrelloZip.js');
  assert.match(trello, /receiveUpload\(req, \{ userId, source: 'trello', limit \}\)/);
  assert.match(trello, /importZipFile\(upload\.file, userId, membersMode, inflate\)/);
  assert.doesNotMatch(trello, /const MAX_ZIP_BYTES = 200/, 'no fixed 200 MB cap');
  assert.match(trello, /await removeUpload\(upload\.uploadId\)/, 'the upload is removed once imported');
});

test('a Mattermost export on disk is read a line at a time; a text past one string is refused', async () => {
  const { uploadedImportValue, MAX_TEXT_BYTES } = require('../server/lib/importUploadSource');
  const dir = path.join(root, 'lines');
  const jsonl = '{"type":"version","version":1}\n\n{"type":"team","team":{"name":"t"}}\n';
  const id = (await upload.receiveUpload(request([Buffer.from(jsonl)], { length: jsonl.length }),
    { userId: 'u1', source: 'mattermost', dir, room: async () => 1e9 })).uploadId;
  const value = await uploadedImportValue(id, 'u1', 'mattermost', { spec: { send: 'text' } });
  assert.deepStrictEqual(value, { jsonLines: [{ type: 'version', version: 1 }, { type: 'team', team: { name: 't' } }] });
  const { parseMattermostBulk } = await import('../models/lib/chatExportFormats.js');
  assert.throws(() => parseMattermostBulk({ jsonLines: [{ type: 'team', team: {} }] }), /no version line/);
  await upload.removeUpload(id);
  const bad = '{"type":"version"}\nnot json\n';
  const badId = (await upload.receiveUpload(request([Buffer.from(bad)], { length: bad.length }),
    { userId: 'u1', source: 'mattermost', dir, room: async () => 1e9 })).uploadId;
  await assert.rejects(uploadedImportValue(badId, 'u1', 'mattermost', { spec: { send: 'text' } }), /Line 2 is not JSON/);
  await upload.removeUpload(badId);
  assert.ok(MAX_TEXT_BYTES <= 256 * 1024 * 1024, 'under what one JavaScript string can hold');
});
