const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../releases/translations/fill-translations.mjs'), 'utf8');
const start = source.indexOf('const isInvariantSource =');
const end = source.indexOf('// Keys added in English', start);
assert.ok(start >= 0 && end > start);
const isInvariantSource = vm.runInNewContext(source.slice(start, end) + '; isInvariantSource');
for (const name of ['MongoDB', 'MongoDB CollectionFS', 'MongoDB Meteor-Files', 'MongoDB Compact', 'S3', 'S3/MinIO', 'Azure Blob', 'Azure Blob Storage']) {
  assert.equal(isInvariantSource(name), true, name);
}
const english = require('../imports/i18n/data/en.i18n.json');
for (const key of ['MongoDB_version', 'MongoDB_storage_engine', 'MongoDB_Oplog_enabled', 'mongodb-gridfs-storage', 's3-file-id', 's3-minio-storage-description', 's3-disabled', 's3-enabled', 's3-secret-key-required', 's3-settings-saved']) {
  assert.equal(isInvariantSource(english[key]), false, key);
}
for (const prose of ['MongoDB connection failed', 'S3 credentials required', 'Azure Blob upload failed']) {
  assert.equal(isInvariantSource(prose), false, prose);
}
console.log('translationTechnicalNameExemptions: exact names preserved; descriptive prose remains translatable');

for (const word of ['by', 'is', 'if', 'do', 'or', 'No', 'To', 'At', 'Me', 'of', 'as', '%1 of %2', 'to #']) {
  assert.equal(isInvariantSource(word), false, word);
}
const shortStart = source.indexOf('const SHORT_TECHNICAL_VALUES =');
const shortEnd = source.indexOf('// Blockly', shortStart);
const symbols = vm.runInNewContext(source.slice(shortStart, shortEnd) + '; SHORT_TECHNICAL_VALUES');
for (const [key, value] of Object.entries(symbols)) assert.equal(english[key], value, key);
assert.equal(symbols['attachment-limit-unit-gb'], 'GB');
assert.equal(symbols['blockly-MATH_CONSTANT_PI_ARIA'], 'pi');
assert.equal(symbols['r-is'], undefined);
assert.equal(symbols['blockly-CONTROLS_IF_MSG_IF'], undefined);
