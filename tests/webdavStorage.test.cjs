'use strict';

// #687: WebDAV attachment storage (Nextcloud Files).
// Run: node tests/webdavStorage.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const w = require('../models/lib/webdavStorage.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const ep = 'https://cloud.example/remote.php/dav/files/wekan/';

// Positive.
assert.equal(w.webdavObjectUrl(ep, 'wekan', 'attachments/a b#1.png'), 'https://cloud.example/remote.php/dav/files/wekan/wekan/attachments/a%20b%231.png', 'each segment encoded');
assert.deepEqual(w.webdavCollectionUrls(ep, 'wekan', 'attachments/x/a.png'), [
  'https://cloud.example/remote.php/dav/files/wekan/wekan/',
  'https://cloud.example/remote.php/dav/files/wekan/wekan/attachments/',
  'https://cloud.example/remote.php/dav/files/wekan/wekan/attachments/x/',
], 'the folders to make, outermost first');
assert.equal(w.validWebdavConfig({ endpoint: ep, bucket: 'wekan' }), null);
console.log('  ok - object and folder addresses');

// Negative.
assert.throws(() => w.webdavObjectUrl(ep, 'wekan', '../../etc/passwd'), /invalid WebDAV path/, 'no climbing out of the folder');
assert.throws(() => w.webdavObjectUrl(ep, '..', 'a'), /invalid WebDAV path/);
for (const endpoint of ['', 'ftp://cloud.example/', 'https://u:p@cloud.example/', 'nonsense']) {
  assert.notEqual(w.validWebdavConfig({ endpoint, bucket: 'wekan' }), null, endpoint);
}
assert.notEqual(w.validWebdavConfig({ endpoint: ep }), null, 'a folder is needed');
console.log('  ok - path climbing and bad endpoints refused');

// Wiring: a cloud provider like S3, its password a secret.
assert.match(read('models/lib/fileStoreConstants.js'), /CLOUD_STORAGE_NAMES = \[STORAGE_NAME_S3, STORAGE_NAME_AZURE, STORAGE_NAME_GCS, STORAGE_NAME_WEBDAV\]/);
assert.match(read('models/lib/cloudStorage.js'), /case STORAGE_NAME_WEBDAV:[\s\S]{0,200}mod = require\('\/server\/lib\/webdavAdapter'\);/);
const settings = read('server/models/attachmentStorageSettings.js');
assert.match(settings, /\[STORAGE_NAME_WEBDAV\]: \['password'\],/, 'never published, kept when left blank');
assert.match(settings, /'storageConfig\.webdav\.password': 0,/);
const adapter = read('server/lib/webdavAdapter.js');
for (const m of ['addFileFromPath', 'addFileFromStream', 'getFileAsStream', 'removeFile', 'listFiles']) {
  assert.match(adapter, new RegExp(`async ${m}\\(`), m);
}
assert.match(adapter, /redirect: 'error'/, 'no redirects');
assert.match(read('client/components/settings/attachments.jade'), /else if isWebdavActive/);
console.log('  ok - the adapter interface, secret handling and the Admin Panel pane');
console.log('\nwebdavStorage: all tests passed');
