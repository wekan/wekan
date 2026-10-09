'use strict';

// #6745: big attachments are streamed, never held whole in server memory where
// no limit requires it. Run: node tests/attachmentRangeStreaming.test.cjs
//
//  1. Range requests: the download route ignored Range and always sent the
//     whole file; it now streams just the requested bytes from fs, GridFS or
//     the cloud backend (models/lib/httpRange.js).
//  2. A file moved to S3/Azure/GCS was collected into ONE Buffer before its
//     upload (no cap); it is now spooled to a temporary file and uploaded as a
//     stream of known length.
//  3. The attachment copy endpoints read the whole source file and only then
//     compared it with the API limit; they now refuse an over-limit source
//     first and stop reading at the limit.
//  4. Migrating a legacy CollectionFS attachment read it into a Buffer - without
//     await, storing "[object Promise]"; it now streams it.
//  5. The board export appended every chunk with Buffer.concat - quadratic.
// tests/playwright/specs/attachment-range-streaming.e2e.js drives 1 over HTTP.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { parseRange, partialContentHeaders, ifRangeAllows } = require('../models/lib/httpRange.js');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('1. Range');

test('single ranges, open ranges and suffix ranges', () => {
  assert.deepStrictEqual(parseRange('bytes=0-99', 1000), { start: 0, end: 99 });
  assert.deepStrictEqual(parseRange('bytes=100-', 1000), { start: 100, end: 999 });
  assert.deepStrictEqual(parseRange('bytes=-10', 1000), { start: 990, end: 999 });
  assert.deepStrictEqual(parseRange('bytes=-5000', 1000), { start: 0, end: 999 });
  assert.deepStrictEqual(parseRange('bytes=990-5000', 1000), { start: 990, end: 999 }, 'end is clamped');
  assert.deepStrictEqual(parseRange('BYTES = 1 - 2', 10), { start: 1, end: 2 });
});

test('negative: unsatisfiable ranges', () => {
  assert.strictEqual(parseRange('bytes=1000-', 1000), 'unsatisfiable');
  assert.strictEqual(parseRange('bytes=5000-6000', 1000), 'unsatisfiable');
  assert.strictEqual(parseRange('bytes=-0', 1000), 'unsatisfiable');
  assert.strictEqual(parseRange('bytes=0-', 0), 'unsatisfiable');
});

test('negative: anything else is answered with the whole file', () => {
  for (const header of [undefined, '', 'bytes=', 'bytes=-', 'items=0-1', 'bytes=0-1,5-9',
    'bytes=9-1', 'bytes=a-b', 'bytes=0-1;x']) {
    assert.strictEqual(parseRange(header, 1000), null, String(header));
  }
  assert.strictEqual(parseRange('bytes=0-1', -1), null);
  assert.strictEqual(parseRange('bytes=0-1', NaN), null);
});

test('206 headers and If-Range', () => {
  assert.deepStrictEqual(partialContentHeaders({ start: 100, end: 199 }, 1000), {
    'Content-Range': 'bytes 100-199/1000', 'Content-Length': '100', 'Accept-Ranges': 'bytes',
  });
  assert.strictEqual(ifRangeAllows(undefined, '"a"'), true);
  assert.strictEqual(ifRangeAllows('"a"', '"a"'), true);
  assert.strictEqual(ifRangeAllows('"b"', '"a"'), false);
  assert.strictEqual(ifRangeAllows('Wed, 21 Oct 2015 07:28:00 GMT', '"a"'), false);
});

test('the download route and every storage strategy pass the range to the backend', () => {
  const route = read('server/routes/universalFileServer.js');
  assert.match(route, /range = parseRange\(req\.headers\.range, size\)/);
  assert.match(route, /res\.writeHead\(416, \{ 'Content-Range': `bytes \*\/\$\{size\}`/);
  assert.match(route, /strategy\.getReadStream\(range \|\| undefined\)/);
  assert.match(route, /res\.statusCode = 206;/);
  const strategies = read('models/lib/fileStoreStrategy.js');
  assert.match(strategies, /openDownloadStream\(gfsId, \{ start: range\.start, end: range\.end \+ 1 \}\)/);
  assert.match(strategies, /fs\.createReadStream\(chosen, \{ start: range\.start, end: range\.end \}\)/);
  assert.match(strategies, /getFileAsStream\(adapter\.bucketName, key, \.\.\.rangeArgs\)/);
});

console.log('2. cloud uploads');

test('a cloud upload is spooled to disk and streamed, never one Buffer', () => {
  const src = read('models/lib/fileStoreStrategy.js');
  const at = src.indexOf('getWriteStream(filePath) {', src.indexOf('getReadStream(range) {\n    const pass'));
  const body = src.slice(at, src.indexOf('waitUntilStored() {', at));
  assert.match(body, /fs\.createWriteStream\(spoolPath\)/);
  assert.match(body, /adapter\.storage\.addFileFromPath\(\{\s*origPath: spoolPath,/);
  assert.match(body, /options: cloudUploadOptions\(this\.provider, stat\.size\)/);
  assert.match(body, /\.then\(removeSpool\)/);
  // negative: no whole-file buffer remains
  assert.doesNotMatch(body, /Buffer\.concat|addFileFromBuffer|chunks\.push/);
  assert.match(src, /return provider === STORAGE_NAME_S3 \? \{ ContentLength: size \} : \{\};/);
});

console.log('3-5. copies, migration, export');

test('attachment copies refuse an over-limit source before reading it', () => {
  for (const rel of ['server/attachmentApi.js', 'server/routes/attachmentApi.js']) {
    const src = read(rel);
    const sizeCheck = src.indexOf('if (Number(sourceAttachment.size) > effectiveApiUploadMaxBytes)');
    const firstRead = src.indexOf("getFileStrategy(sourceAttachment, 'original');\n");
    assert.ok(sizeCheck > 0 && sizeCheck < firstRead, `${rel}: size checked before the read`);
    assert.match(src, /bytesRead \+= chunk\.length;\s*if \(bytesRead > effectiveApiUploadMaxBytes\)/);
  }
});

test('legacy attachment migration streams the file', () => {
  const src = read('server/migrations/migrateAttachments.js');
  assert.match(src, /const readStream = await getOldAttachmentStream\(attachmentId\);/);
  assert.match(src, /await addAttachmentFromStream\(readStream, \{/);
  assert.doesNotMatch(src.replace(/\/\/.*$/gm, ''), /getOldAttachmentDataBuffer\(/);
  assert.doesNotMatch(src.replace(/\/\/.*$/gm, ''), /new File\(\[fileData\]/);
});

test('the board export joins an attachment\'s chunks once', () => {
  const src = read('models/exporter.js');
  assert.doesNotMatch(src, /buffer = Buffer\.concat\(\[buffer, chunk\]\)/);
  assert.match(src, /callback\(null, Buffer\.concat\(chunks\)\.toString\('base64'\)\)/);
  assert.doesNotMatch(src, /tmpexport/);
});

console.log(`attachmentRangeStreaming: ${passed} passed`);
