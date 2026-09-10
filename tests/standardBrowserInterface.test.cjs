'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('page startup uses the standard Meteor browser interface', () => {
  assert.match(read('server/imports.js'), /import '\/server\/modernBrowsers'/);
  assert.match(read('config/router.js'), /FlowRouter\.route/);
  assert.doesNotMatch(read('server/imports.js'), /legacyHtml4|legacyOmi/);
  assert.doesNotMatch(read('server/routes/universalFileServer.js'), /\/legacy-html4\//);
  for (const file of ['server/legacyHtml4.js', 'imports/lib/legacyHtml4.js',
    'public/legacy-html4.css', 'server/lib/legacyHtml4Session.js']) {
    assert.equal(fs.existsSync(path.join(root, file)), false, file);
  }
});

test('retained image features use the independent GIF utilities', () => {
  // server/lib/documentGif.js still uses the shared GIF utilities to build the
  // search index (bounded reads, cache keys) even though document PREVIEW is
  // now the restored office-open-xml-viewer / native <embed>, not a GIF
  // slideshow - so universalFileServer.js no longer needs imageGif itself.
  assert.match(read('server/lib/documentGif.js'), /[/.]imageGif'/);
  for (const file of ['server/lib/documentGif.js',
    'server/routes/universalFileServer.js']) {
    assert.doesNotMatch(read(file), /legacyHtml4Gif|omiGifCacheKey/);
  }
  assert.doesNotMatch(read('server/imports.js'), /import '\/server\/brandingImages'/);
  assert.equal(fs.existsSync(path.join(root, 'server/brandingImages.js')), false);
  assert.match(read('server/routes/universalFileServer.js'), /export async function indexAttachmentDocumentText/);
});
