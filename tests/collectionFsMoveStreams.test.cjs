'use strict';

// Moving files to or from the old CollectionFS storage streams them chunk by
// chunk instead of reading each whole file into memory (#6745).
// Run: node tests/collectionFsMoveStreams.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

const store = read('models/lib/collectionFsStore.js');
const move = read('server/attachmentBulkMove.js');

// Out of CollectionFS: the GridFS download stream is piped to the new file.
assert.match(store, /export function openCollectionFsStream\(item\) \{[\s\S]*?bucket\.openDownloadStream\(gridFsId\)[\s\S]*?return stream\.pipe\(out\);/);
assert.match(move, /stream: openCollectionFsStream\(item\),/);
assert.match(move, /info\.stream\.pipe\(out\);/);
// Into CollectionFS: the storage read stream is piped into the GridFS upload.
assert.match(store, /if \(source && typeof source\.pipe === 'function'\) \{[\s\S]*?source\.pipe\(uploadStream\);/);
assert.match(move, /\}, openStrategyStream\(strategy\)\);/);
// Negative: no whole-file buffering is left on either path.
assert.doesNotMatch(store, /Buffer\.concat|readCollectionFsBuffer/);
assert.doesNotMatch(move, /readStrategyBuffer|createMeteorFilesDocFromBuffer|writeFileSync\(fullPath|Buffer\.concat\(chunks\)/);
console.log('collectionFsMoveStreams: 7 checks passed');
