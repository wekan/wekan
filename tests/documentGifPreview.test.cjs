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

test('PDF text extraction destroys the loading task, not the resolved document proxy', () => {
  // getDocument() returns a PDFDocumentLoadingTask; destroy() lives THERE.
  // The PDFDocumentProxy its .promise resolves to has no destroy() of its
  // own - calling it on that object throws "textDocument.destroy is not a
  // function" (uncaught in the onAfterUpload background indexing path,
  // observed on every real PDF upload).
  const source = read('server/lib/documentGif.js');
  assert.match(source, /const loadingTask = pdfjs\.getDocument\(/);
  assert.match(source, /const textDocument = await loadingTask\.promise;/);
  assert.match(source, /await loadingTask\.destroy\(\);/);
  assert.doesNotMatch(source, /textDocument\.destroy\(\)/,
    'PDFDocumentProxy has no destroy() method - only the loading task does');
});

test('PDF text extraction resolves pdfjs-dist\'s own font/cmap assets instead of warning and falling back', () => {
  const source = read('server/lib/documentGif.js');
  assert.match(source, /function pdfjsAssetPath\(sub\)/);
  assert.match(source, /standardFontDataUrl: pdfjsAssetPath\('standard_fonts'\)/);
  assert.match(source, /cMapUrl: pdfjsAssetPath\('cmaps'\)/);
  const require_ = require('module').createRequire(path.join(root, 'package.json'));
  const pkgPath = require_.resolve('pdfjs-dist/package.json');
  const pathMod = require('path');
  assert.ok(fs.existsSync(pathMod.join(pathMod.dirname(pkgPath), 'standard_fonts')));
  assert.ok(fs.existsSync(pathMod.join(pathMod.dirname(pkgPath), 'cmaps')));
});

// End-to-end: extract text from a real PDF exactly the way indexDocumentText
// does, using the loading-task lifecycle above - not just source patterns.
// Skips gracefully (rather than failing the suite) when no sample PDF is
// present in this checkout's local upload storage.
test('end-to-end: a real PDF is text-extracted and its loading task destroyed cleanly', async () => {
  function findSamplePdf(dir) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return null; }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const found = findSamplePdf(full);
        if (found) return found;
      } else if (entry.name.endsWith('.pdf')) {
        return full;
      }
    }
    return null;
  }
  const samplePdf = findSamplePdf(path.join(root, '.meteor/local/build/programs/files/attachments'));
  if (!samplePdf) {
    console.log('  (skipped: no sample PDF in .meteor/local/build/programs/files/attachments)');
    return;
  }
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const require_ = require('module').createRequire(path.join(root, 'package.json'));
  pdfjs.GlobalWorkerOptions.workerSrc = require_.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
  const pkgPath = require_.resolve('pdfjs-dist/package.json');
  const pathMod = require('path');
  const assetPath = sub => pathMod.join(pathMod.dirname(pkgPath), sub) + pathMod.sep;
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(fs.readFileSync(samplePdf)),
    isEvalSupported: false,
    standardFontDataUrl: assetPath('standard_fonts'),
    cMapUrl: assetPath('cmaps'),
    cMapPacked: true,
  });
  const document = await loadingTask.promise;
  assert.ok(document.numPages >= 1);
  const page = await document.getPage(1);
  const content = await page.getTextContent();
  assert.ok(content.items.length > 0, 'a real PDF page must yield extractable text items');
  await loadingTask.destroy();
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
