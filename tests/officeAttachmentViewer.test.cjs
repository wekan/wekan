'use strict';
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('server document preview:');
const server = read('server/lib/documentGif.js');
const routes = read('server/routes/universalFileServer.js');
const client = read('client/components/cards/attachments.js');
const jade = read('client/components/cards/attachments.jade');
const pkg = JSON.parse(read('package.json'));
test('the large browser OOXML viewer is no longer shipped', () => {
  assert.ok(!pkg.dependencies['@wekan/office-open-xml-viewer']);
  assert.doesNotMatch(client, /openOfficeAttachment|officePreview/);
  assert.doesNotMatch(jade, /office-viewer/);
});
test('PDF no longer relies on a browser PDF object', () => {
  assert.doesNotMatch(jade, /pdf-viewer|application\/pdf/);
  assert.match(client, /case \(kind\.isPDF\):[\s\S]{0,160}openDocumentPreview/);
});
test('PDF and OOXML use the same bounded server representation', () => {
  assert.match(server, /\['pdf', 'docx', 'xlsx', 'pptx'\]/);
  assert.match(server, /DOCUMENT_MAX_BYTES/);
  assert.match(server, /DOCUMENT_MAX_PAGES/);
  assert.match(server, /searchText/);
  assert.match(server, /convertImageBufferToGif/);
});
test('Excel becomes a safe HTML table with allowlisted styles', () => {
  assert.match(server, /<table border="1" cellspacing="0" cellpadding="4">/);
  for (const style of ['font-weight', 'font-style', 'color', 'background-color', 'text-align']) {
    assert.ok(server.includes(style), `${style} is supported`);
  }
  assert.match(client, /ALLOWED_TAGS: \['table', 'tbody', 'tr', 'td'\]/);
});
test('HTML4 page navigation and GIF images are permission checked', () => {
  assert.match(routes, /document-preview\/:fileId\/:page\.html/);
  assert.match(routes, /document-preview\/:fileId\/:page\.gif/);
  assert.match(routes, /const attachment = await authorizedDocument\(req\)/);
});
console.log(`officeAttachmentViewer: ${passed} tests passed`);
