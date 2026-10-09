'use strict';

// Cloning a board streams each attachment from the source board's storage
// into the copy, instead of building the board's export with every file as
// base64 in memory (#6745). Run: node tests/cloneBoardStreamsAttachments.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

const src = read('models/import.js');
const clone = src.slice(src.indexOf('async cloneBoard(sourceBoardId, currentBoardId)'));

assert.match(clone, /new Exporter\(sourceBoardId, undefined, \{ excludeAttachments: true \}\)/,
  'the clone document carries attachment rows, not their bytes');
assert.doesNotMatch(clone.slice(0, clone.indexOf('\n  },\n')), /new Exporter\(sourceBoardId\);/,
  'negative: no export of the board with every file as base64');
assert.match(clone, /creator\.attachmentStream = attachment => \{[\s\S]*?getFileStrategy\(fileObj, 'original'\)\.getReadStream\(\)/,
  'each file streams from the source storage');
assert.match(clone, /Attachments\.collection\.find\(\{ 'meta\.boardId': sourceBoardId \}\)\.fetchAsync\(\)/,
  'the source files are looked up once, not per attachment');
// The importer writes a stream it is given through the shared helper, held to
// the upload limit.
assert.match(read('models/wekanCreator.js'), /const stream = !att\.file && this\.attachmentStream \? this\.attachmentStream\(att\) : null;/);
console.log('cloneBoardStreamsAttachments: 5 checks passed');
