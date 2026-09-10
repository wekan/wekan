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

test('#6685: @napi-rs/canvas is a direct dependency, not left to the optional-deps install', () => {
  // pdf-to-img rasterizes PDF pages through pdfjs-dist's optionalDependency
  // @napi-rs/canvas. A Docker/Snap build that skips optional dependencies (or
  // lacks a prebuilt binary for its target architecture) then throws on the
  // very first PDF preview, surfacing as a bare 415. Pinning it directly
  // ensures it is installed the same way every other required dependency is.
  const pkg = JSON.parse(read('package.json'));
  const pdfjs = JSON.parse(read('node_modules/pdfjs-dist/package.json'));
  assert.ok(pkg.dependencies['@napi-rs/canvas'], '@napi-rs/canvas must be a direct dependency');
  assert.ok(
    pdfjs.optionalDependencies && '@napi-rs/canvas' in pdfjs.optionalDependencies,
    'pdfjs-dist must still declare @napi-rs/canvas as optional (sanity check that this pin is still needed)',
  );
});

test('#6685: PDF preview falls back to text-only pages when rasterization is unavailable', () => {
  const source = read('server/lib/documentGif.js');
  assert.match(source, /async function rasterizePdf\(input\)/);
  assert.match(source, /return null;/);
  // The text extraction path (pdfjs-dist's getTextContent) must run
  // regardless of whether rasterization succeeded, so a missing/broken
  // @napi-rs/canvas degrades the preview to text instead of failing it.
  assert.match(source, /const pageCount = document \? document\.length : textDocument\.numPages;/);
  assert.match(source, /if \(document\) entry\.image = await document\.getPage\(page\);/);
  // A genuinely oversized PDF must still be refused even without rasterization.
  assert.match(source, /if \(!document && pageCount > DOCUMENT_MAX_PAGES\)/);
});

test('#6685: document preview routes log the real error instead of only returning a bare 415', () => {
  const routes = read('server/routes/universalFileServer.js');
  const catchBlocks = routes.match(/catch \(error\) \{\s*console\.error\([^)]*Document preview[^)]*\);\s*res\.writeHead\(415\);/g) || [];
  assert.equal(catchBlocks.length, 3,
    'each of the three /document-preview/* handlers must log the caught error before returning 415');
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
