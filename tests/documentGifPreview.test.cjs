const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('document conversion is bounded and stores plain search text separately', () => {
  const source = read('server/lib/documentGif.js');
  assert.match(source, /DOCUMENT_MAX_BYTES = 32 \* 1024 \* 1024/);
  assert.match(source, /DOCUMENT_MAX_PAGES = 200/);
  assert.match(source, /new Mongo\.Collection\('documentPreviews'\)/);
  assert.match(source, /const searchText = plainSearchText/);
  assert.match(source, /createRequire\(path\.join\(process\.cwd\(\), 'package\.json'\)\)/);
  assert.match(source, /searchText, extension/);
  assert.doesNotMatch(source, /searchText:[^\n]*(?:xml|html|style|formula)/i);
});

test('PDF and OOXML use small permissively licensed JavaScript dependencies', () => {
  const pkg = JSON.parse(read('package.json'));
  const pdf = JSON.parse(read('node_modules/pdf-to-img/package.json'));
  const pdfjs = JSON.parse(read('node_modules/pdfjs-dist/package.json'));
  const fflate = JSON.parse(read('node_modules/fflate/package.json'));
  assert.equal(pkg.dependencies['pdf-to-img'], '^7.0.0');
  assert.equal(pdf.license, 'MIT');
  assert.equal(pdfjs.license, 'Apache-2.0');
  assert.equal(fflate.license, 'MIT');
  for (const license of [pdf.license, pdfjs.license, fflate.license]) assert.doesNotMatch(license, /GPL/i);
});

test('every document preview read and search is board-authorized', () => {
  const routes = read('server/routes/universalFileServer.js');
  assert.match(routes, /authorizedDocument\(req\)/);
  assert.match(routes, /isAuthorizedForBoard\(req, board\)/);
  assert.match(routes, /async searchAttachmentDocumentText\(boardId, query\)/);
  assert.match(routes, /canReadBoard\(this\.userId, board\)/);
  assert.match(routes, /needle\.replace\(\/\[\.\*\+\?\^\$\{\}\(\)\|/);
});

test('the browser shows selectable text and only document images as GIF', () => {
  const jade = read('client/components/cards/attachments.jade');
  const client = read('client/components/cards/attachments.js');
  assert.match(jade, /pre\.document-page-text/);
  assert.match(jade, /js-document-prev/);
  assert.match(jade, /js-document-next/);
  assert.match(client, /text\.textContent = page\.text \|\| ''/);
  assert.match(client, /\/document-preview\/.*\/.*\.gif/);
});
