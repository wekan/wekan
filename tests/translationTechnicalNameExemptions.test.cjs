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

// Latin color is a real shared word; never exempt changed source prose.
const latinSetLine = source.split('\n').find(line => line.startsWith('  la: new Set(')).trim();
const latinSetExpression = latinSetLine.slice('la: '.length).replace(/,$/, '');
for (const [value, expected] of [['Color', true], ['Choose a color', false]]) {
  const set = vm.runInNewContext(latinSetExpression, { en: { 'allboards.workspace-color': value } });
  assert.equal(set.has('allboards.workspace-color'), expected);
  assert.equal(set.has('allboards.workspaces'), false);
}

// Remove is also the Latin imperative; only this exact source/key pair is shared.
for (const [value, expected] of [['Remove', true], ['Remove all cards', false]]) {
  const shared = vm.runInNewContext(latinSetExpression, { en: { 'r-remove': value } });
  assert.equal(shared.has('r-remove'), expected);
}

// Latin selector is a shared noun, not an exemption for arbitrary search help.
for (const [value, expected] of [['selector', true], ['invalid selector', false]]) {
  const shared = vm.runInNewContext(latinSetExpression, { en: { 'predicate-selector': value } });
  assert.equal(shared.has('predicate-selector'), expected);
}

for (const [value, expected] of [['Color', true], ['Dependency color', false]]) {
  const shared = vm.runInNewContext(latinSetExpression, { en: { 'dependency-color': value } });
  assert.equal(shared.has('dependency-color'), expected);
}

for (const [value, expected] of [['Asia', true], ['Maps in Asia', false]]) {
  const shared = vm.runInNewContext(latinSetExpression, { en: { 'map-region-asia': value } });
  assert.equal(shared.has('map-region-asia'), expected);
}

for (const [value, expected] of [['Remove', true], ['Remove organization', false]]) {
  const shared = vm.runInNewContext(latinSetExpression, { en: { 'remove-btn': value } });
  assert.equal(shared.has('remove-btn'), expected);
}
