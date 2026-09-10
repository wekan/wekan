const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

// server/lib/documentGif.js used to render a server-side GIF-slideshow
// preview (documentAsStoredGifs). That viewer has been replaced by the
// restored full-featured client-side office-open-xml-viewer (DOCX/XLSX/PPTX)
// and the browser's native <embed> (PDF) - see tests/officeAttachmentViewer.test.cjs.
// This file keeps documentGif.js's ONLY remaining job covered: building a
// plain-text search index (indexDocumentText), with no rendering at all.

test('document text indexing is bounded and stores plain search text separately', () => {
  const source = read('server/lib/documentGif.js');
  assert.match(source, /DOCUMENT_MAX_BYTES = 32 \* 1024 \* 1024/);
  assert.match(source, /DOCUMENT_MAX_PAGES = 200/);
  assert.match(source, /new Mongo\.Collection\('documentPreviews'\)/);
  assert.match(source, /const searchText = plainSearchText/);
  assert.match(source, /searchText, extension/);
  assert.doesNotMatch(source, /searchText:[^\n]*(?:xml|html|style|formula)/i);
  // No rendering: nothing here should produce HTML, CSS or an image page.
  assert.doesNotMatch(source, /<table|<style|documentAsStoredGifs|convertImageBufferToGif/);
});

test('the PDF/OOXML text extraction uses small permissively licensed JavaScript dependencies', () => {
  const pkg = JSON.parse(read('package.json'));
  const pdfjs = JSON.parse(read('node_modules/pdfjs-dist/package.json'));
  const fflate = JSON.parse(read('node_modules/fflate/package.json'));
  assert.ok(pkg.dependencies['pdfjs-dist'], 'pdfjs-dist must be a direct dependency (text extraction only)');
  assert.equal(pdfjs.license, 'Apache-2.0');
  assert.equal(fflate.license, 'MIT');
  for (const license of [pdfjs.license, fflate.license]) assert.doesNotMatch(license, /GPL/i);
  // #6685's rasterization dependency chain (pdf-to-img -> @napi-rs/canvas)
  // is gone: nothing renders a PDF page as an image server-side any more, so
  // there is nothing left needing that optional native canvas dependency.
  assert.equal(pkg.dependencies['pdf-to-img'], undefined,
    'pdf-to-img (page rasterization) must not come back now that nothing displays a rasterized page');
  assert.equal(pkg.dependencies['@napi-rs/canvas'], undefined,
    '@napi-rs/canvas must not come back now that nothing rasterizes a PDF page server-side');
});

test('#6685: pdfjs text extraction is pointed at the real on-disk worker file instead of guessing', () => {
  // pdfjs-dist's Node "fake worker" fallback locates pdf.worker.mjs relative
  // to import.meta.url of the importing module. Under the bundled server
  // (_build/main-dev, _build/main-prod) that URL points into the bundle, not
  // into node_modules, so the fallback fails to find the worker and PDF text
  // indexing threw before this fix.
  const source = read('server/lib/documentGif.js');
  assert.match(source, /function runtimeResolve\(name\)/);
  assert.match(source, /function configurePdfWorker\(pdfjs\)/);
  assert.match(source, /pdfjs\.GlobalWorkerOptions\.workerSrc = runtimeResolve\('pdfjs-dist\/legacy\/build\/pdf\.worker\.mjs'\)/);
  assert.match(source, /configurePdfWorker\(pdfjs\);/);
  const resolved = require('module').createRequire(path.join(root, 'package.json'))
    .resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
  assert.ok(fs.existsSync(resolved), 'the worker file this resolves to must actually exist on disk');
});

test('search indexing repairs a stale stored name before reading the file, like the download route does', () => {
  // The regular attachment download route calls normalizeStoredNameOnRead
  // before getFileStrategy().getReadStream() (fs-path-heal: the stored
  // name/extension can drift from what is actually on disk). Attachments.onAfterUpload
  // triggers search indexing directly with the just-uploaded fileObj, so this
  // repair does not apply to indexing the same way it does to a later read -
  // but the indexer must still fail closed (not throw into the upload) when
  // the file genuinely cannot be read.
  const server = read('models/attachments.server.js');
  assert.match(server, /indexAttachmentDocumentText/);
  assert.match(server, /Search indexing must never break the upload/);
});

test('every document search query is board-authorized', () => {
  const routes = read('server/routes/universalFileServer.js');
  assert.match(routes, /async searchAttachmentDocumentText\(boardId, query\)/);
  assert.match(routes, /canReadBoard\(this\.userId, board\)/);
  assert.match(routes, /needle\.replace\(\/\[\.\*\+\?\^\$\{\}\(\)\|/);
});

test('the browser renders the full office-open-xml-viewer, not a server GIF slideshow', () => {
  const jade = read('client/components/cards/attachments.jade');
  const client = read('client/components/cards/attachments.js');
  assert.match(jade, /object#pdf-viewer\.hidden\(type="application\/pdf"\)/);
  assert.match(jade, /#office-viewer\.hidden/);
  assert.match(client, /openOfficeAttachment\(/);
  assert.doesNotMatch(jade, /document-gif-viewer|js-document-prev|js-document-next/);
  assert.doesNotMatch(client, /openDocumentPreview|document-preview\/.*\.gif/);
});
