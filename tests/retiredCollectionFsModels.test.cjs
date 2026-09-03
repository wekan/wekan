'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const tracked = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' })
  .trim().split('\n');

console.log('retiredCollectionFsModels:');

assert.ok(!fs.existsSync(path.join(root, 'models/attachments_old.js.disabled')));
assert.ok(!fs.existsSync(path.join(root, 'models/avatars_old.js.disabled')));
console.log('  ok - retired CollectionFS model implementations are absent');

const applicationSources = tracked.filter(file =>
  /^(client|server|imports|models)\//.test(file) && /\.(js|mjs|jade|css)$/.test(file) &&
  fs.existsSync(path.join(root, file)));
for (const file of applicationSources) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  assert.ok(!/attachments_old|avatars_old|AttachmentsOld|AvatarsOld/.test(source),
    `${file} must not load a retired model`);
}
console.log('  ok - no application entry point names a retired model');

for (const file of [
  'models/lib/attachmentBackwardCompatibility.js',
  'server/publications/legacyAttachments.js',
  'server/routes/legacyAttachments.js',
]) {
  assert.ok(fs.existsSync(path.join(root, file)), `${file} keeps legacy reads available`);
}
console.log('  ok - supported legacy attachment reads remain active');

console.log('\nretiredCollectionFsModels: 3 tests passed');
