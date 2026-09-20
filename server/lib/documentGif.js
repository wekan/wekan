import crypto from 'crypto';
import path from 'path';
import { createRequire } from 'module';
import { Mongo } from 'meteor/mongo';
import { boundedStreamBuffer, gifCacheKey } from './imageGif';

export const DOCUMENT_MAX_BYTES = 32 * 1024 * 1024;
export const DOCUMENT_MAX_PAGES = 200;
export const DOCUMENT_MAX_TEXT = 2 * 1024 * 1024;
const inProgress = new Map();
// Search index only: one row per attachment holding the extracted plain
// text used by searchAttachmentDocumentText. The viewer itself (DOCX/XLSX/
// PPTX via office-open-xml-viewer, PDF via the native <embed>) no longer
// reads this collection - it exists purely so attachment contents are
// searchable from the card search box.
export const DocumentPreviews = new Mongo.Collection('documentPreviews');

// Meteor runs release bundles from programs/server and installs application
// dependencies in npm/node_modules. Start resolution there; Node also searches
// the parent's node_modules, which supports a source checkout without npm/.
function runtimeRequire(name) {
  return createRequire(path.join(process.cwd(), 'npm', 'package.json'))(name);
}

function runtimeResolve(name) {
  return createRequire(path.join(process.cwd(), 'npm', 'package.json')).resolve(name);
}

// pdfjs-dist's Node "fake worker" fallback locates pdf.worker.mjs relative to
// import.meta.url of the module that imported it. Under the bundled server
// (_build/main-dev, _build/main-prod) that URL points into the bundle, not
// into node_modules, so the fallback looks for the worker beside the bundled
// server.cjs and fails: "Cannot find module
// '.../_build/main-dev/pdf.worker.mjs'" - which used to surface as a bare 415
// on every PDF text-index attempt. Point GlobalWorkerOptions at the real
// on-disk file via Node's own module resolution (the same runtimeRequire
// trick already used for fflate) so pdfjs never falls back to guessing.
let pdfWorkerConfigured = false;
function configurePdfWorker(pdfjs) {
  if (pdfWorkerConfigured) return;
  pdfWorkerConfigured = true;
  try {
    pdfjs.GlobalWorkerOptions.workerSrc = runtimeResolve('pdfjs-dist/legacy/build/pdf.worker.mjs');
  } catch (error) {
    console.error('Could not resolve pdf.worker.mjs, PDF search indexing will fail:', error);
  }
}

function decodeXml(value) {
  return String(value || '').replace(/<[^>]+>/g, ' ').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

function plainSearchText(value) {
  // Strip C0 control characters (U+0000-U+001F) except the whitespace ones
  // (\t \n \r, handled by the collapse below) plus DEL (U+007F), written
  // as explicit \x escapes rather than raw control bytes: the raw-byte form
  // CodeQL flagged (js/overly-large-range) is visually indistinguishable
  // between adjacent control characters in an editor/diff, so a boundary
  // could silently shift without anyone noticing. \x escapes make the exact
  // range verifiable at a glance and are byte-for-byte equivalent.
  return String(value || '').normalize('NFKC')
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '')
    .replace(/\s+/g, ' ').trim().slice(0, DOCUMENT_MAX_TEXT);
}

// Extracts only the plain text needed for the search index - no HTML, no
// styles, no embedded media. The full-featured viewer (office-open-xml-viewer)
// renders the actual document client-side from the original file.
async function officeSearchText(input, extension) {
  const { Unzip, UnzipInflate } = runtimeRequire('fflate');
  const entries = await new Promise((resolve, reject) => {
    const result = new Map();
    let count = 0;
    let total = 0;
    let active = 0;
    let pushed = false;
    let failed = false;
    const finish = () => { if (pushed && active === 0 && !failed) resolve(result); };
    const unzip = new Unzip(file => {
      count += 1;
      if (count > 2048) { failed = true; reject(new Error('Document archive has too many entries')); return; }
      const wanted = file.name === 'word/document.xml' ||
        file.name === 'xl/sharedStrings.xml' ||
        /^ppt\/slides\/slide\d+\.xml$/.test(file.name) ||
        /^xl\/worksheets\/sheet\d+\.xml$/.test(file.name);
      if (!wanted) return;
      if (Number.isFinite(file.originalSize) && file.originalSize > DOCUMENT_MAX_TEXT) {
        failed = true; reject(new Error('Document archive entry exceeds limit')); return;
      }
      active += 1;
      const chunks = [];
      let length = 0;
      file.ondata = (error, data, final) => {
        if (failed) return;
        if (error) { failed = true; reject(error); return; }
        length += data.length;
        total += data.length;
        if (length > DOCUMENT_MAX_TEXT || total > 96 * 1024 * 1024) {
          failed = true; file.terminate(); reject(new Error('Document expanded data exceeds limit')); return;
        }
        chunks.push(Buffer.from(data));
        if (final) {
          result.set(file.name, Buffer.concat(chunks, length));
          active -= 1;
          finish();
        }
      };
      file.start();
    });
    unzip.register(UnzipInflate);
    try { unzip.push(new Uint8Array(input), true); pushed = true; finish(); }
    catch (error) { failed = true; reject(error); }
  });
  const names = [...entries.keys()];
  let selected;
  if (extension === 'docx') selected = names.filter(name => name === 'word/document.xml');
  else if (extension === 'pptx') selected = names.filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name));
  else selected = names.filter(name => /^xl\/worksheets\/sheet\d+\.xml$/.test(name));
  selected.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  if (!selected.length) throw new Error('Document has no readable parts');
  const parts = [];
  const sharedStringsXml = entries.get('xl/sharedStrings.xml')?.toString('utf8') || '';
  const sharedStrings = [...sharedStringsXml.matchAll(/<si\b[\s\S]*?<\/si>/g)]
    .map(match => decodeXml(match[0]));
  for (const name of selected.slice(0, DOCUMENT_MAX_PAGES)) {
    const xml = entries.get(name).toString('utf8');
    if (xml.length > DOCUMENT_MAX_TEXT) throw new Error('Document part text exceeds limit');
    if (extension === 'xlsx') {
      const withoutFormulas = xml.replace(/<f\b[\s\S]*?<\/f>/g, '');
      for (const cell of withoutFormulas.matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
        const raw = /<v>([\s\S]*?)<\/v>/.exec(cell[2])?.[1] || decodeXml(cell[2]);
        parts.push(/\bt="s"/.test(cell[1]) ? (sharedStrings[Number(raw)] || '') : decodeXml(raw));
      }
    } else {
      parts.push(decodeXml(xml));
    }
    if (parts.join(' ').length >= DOCUMENT_MAX_TEXT) break;
  }
  return parts.join(' ');
}

// pdfjs-dist's own asset directories (glyph widths for the 14 standard PDF
// fonts, and CJK character maps) are plain files inside the installed
// package, not something fetched over HTTP. Without standardFontDataUrl it
// only warns and falls back to a built-in approximation, but resolving the
// real path costs nothing and avoids that warning (and the character-map
// fallback for CJK text) on every single PDF indexed.
function pdfjsAssetPath(sub) {
  const pkgPath = runtimeResolve('pdfjs-dist/package.json');
  return path.join(path.dirname(pkgPath), sub) + path.sep;
}

async function pdfSearchText(input) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  configurePdfWorker(pdfjs);
  // getDocument() returns a PDFDocumentLoadingTask, not the document itself -
  // destroy() lives on the LOADING TASK; the PDFDocumentProxy its .promise
  // resolves to has no destroy() of its own ("textDocument.destroy is not a
  // function" when the two were conflated).
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(input),
    isEvalSupported: false,
    standardFontDataUrl: pdfjsAssetPath('standard_fonts'),
    cMapUrl: pdfjsAssetPath('cmaps'),
    cMapPacked: true,
  });
  const textDocument = await loadingTask.promise;
  if (textDocument.numPages > DOCUMENT_MAX_PAGES) { await loadingTask.destroy(); throw new Error('PDF has too many pages'); }
  const parts = [];
  try {
    for (let page = 1; page <= textDocument.numPages; page += 1) {
      const textPage = await textDocument.getPage(page);
      const content = await textPage.getTextContent();
      parts.push(content.items.map(item => item.str || '').join(' '));
      if (parts.join(' ').length >= DOCUMENT_MAX_TEXT) break;
    }
  } finally { await loadingTask.destroy(); }
  return parts.join(' ');
}

// Indexes an attachment's text content for search only. Does not rasterize
// pages or generate any preview image - the viewer renders the original
// file directly (office-open-xml-viewer for DOCX/XLSX/PPTX, the browser's
// native PDF viewer for PDF).
export async function indexDocumentText(fileObj, options) {
  const extension = String(fileObj?.extension || fileObj?.name?.split('.').pop() || '').toLowerCase();
  if (!['pdf', 'docx', 'xlsx', 'pptx'].includes(extension)) throw new Error('Unsupported document type');
  const cacheKey = gifCacheKey(fileObj);
  const cached = await DocumentPreviews.findOneAsync({ attachmentId: fileObj._id, cacheKey });
  if (cached) return cached;
  const key = String(fileObj._id);
  if (inProgress.has(key)) return inProgress.get(key);
  const work = (async () => {
    const strategy = options.factory.getFileStrategy(fileObj, 'original');
    const input = await boundedStreamBuffer(strategy.getReadStream(), DOCUMENT_MAX_BYTES);
    const rawText = extension === 'pdf' ? await pdfSearchText(input) : await officeSearchText(input, extension);
    // Deliberately separate from presentation: this contains plain text only,
    // with no XML, HTML, style, formula or image data.
    const searchText = plainSearchText(rawText);
    const manifest = { attachmentId: fileObj._id, boardId: fileObj.meta?.boardId,
      cardId: fileObj.meta?.cardId, cacheKey, searchText, extension, generatedAt: new Date() };
    await DocumentPreviews.removeAsync({ attachmentId: fileObj._id });
    await DocumentPreviews.insertAsync(manifest);
    return manifest;
  })().finally(() => inProgress.delete(key));
  inProgress.set(key, work);
  return work;
}
