'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Readable } = require('node:stream');
const test = require('node:test');

const root = path.join(__dirname, '..');
const {
  ZIP_LIMITS,
  boundedEntryStream,
  declaredSize,
  safeArchivePath,
} = require('../server/lib/wekanZipArchive');

test('WeKan ZIP paths accept only portable relative file names', () => {
  assert.equal(safeArchivePath('wekan.json'), true);
  assert.equal(safeArchivePath('attachments/abc-report.txt'), true);
  for (const attack of [
    '../outside', 'attachments/../outside', '/etc/passwd',
    'C:\\Windows\\file', 'attachments\\file', 'a\0b', './wekan.json',
  ]) assert.equal(safeArchivePath(attack), false, attack);
});

test('WeKan ZIP limits are finite positive integers', () => {
  for (const value of Object.values(ZIP_LIMITS)) {
    assert.equal(Number.isSafeInteger(value) && value > 0, true);
  }
  assert.equal(declaredSize({ vars: { uncompressedSize: 123 } }), 123);
  assert.equal(declaredSize({ vars: { uncompressedSize: -1 } }), 0);
});

test('attachment streams enforce their actual expanded byte limit', async () => {
  const entry = { stream: () => Readable.from([Buffer.alloc(4), Buffer.alloc(4)]) };
  const stream = boundedEntryStream(entry, 6);
  await assert.rejects(async () => {
    for await (const chunk of stream) void chunk;
  }, /import-zip-file-too-large/);
});

test('the shared reader bounds metadata before inflating archive entries', () => {
  const source = fs.readFileSync(path.join(root, 'server/lib/wekanZipArchive.js'), 'utf8');
  assert.match(source, /files\.length > ZIP_LIMITS\.entries/);
  assert.match(source, /total > ZIP_LIMITS\.totalBytes/);
  assert.match(source, /declaredSize\(entry\) > ZIP_LIMITS\.documentBytes/);
  assert.match(source, /bytes\.length > ZIP_LIMITS\.documentBytes/);
  assert.match(source, /actualTotal > ZIP_LIMITS\.totalBytes/);
  assert.match(source, /attachmentEntries\.has\(id\)/);
});
