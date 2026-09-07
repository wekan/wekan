import crypto from 'crypto';
import path from 'path';
import { createRequire } from 'module';
import { Mongo } from 'meteor/mongo';
import { boundedStreamBuffer, convertImageBufferToGif, gifCacheKey, storeGeneratedGif } from './imageGif';

export const DOCUMENT_MAX_BYTES = 32 * 1024 * 1024;
export const DOCUMENT_MAX_PAGES = 200;
export const DOCUMENT_MAX_TEXT = 2 * 1024 * 1024;
const inProgress = new Map();
export const DocumentPreviews = new Mongo.Collection('documentPreviews');

function runtimeRequire(name) {
  return createRequire(path.join(process.cwd(), 'package.json'))(name);
}

function decodeXml(value) {
  return String(value || '').replace(/<[^>]+>/g, ' ').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

function plainSearchText(value) {
  return String(value || '').normalize('NFKC').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ').trim().slice(0, DOCUMENT_MAX_TEXT);
}

function htmlEscape(value) {
  return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function safeRgb(value) {
  const match = String(value || '').match(/^(?:[0-9A-Fa-f]{2})?([0-9A-Fa-f]{6})$/);
  return match ? `#${match[1].toUpperCase()}` : '';
}

function xlsxStyles(xml) {
  const fontBlock = /<fonts\b[^>]*>([\s\S]*?)<\/fonts>/.exec(xml)?.[1] || '';
  const fillBlock = /<fills\b[^>]*>([\s\S]*?)<\/fills>/.exec(xml)?.[1] || '';
  const xfBlock = /<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/.exec(xml)?.[1] || '';
  const fonts = [...fontBlock.matchAll(/<font\b[\s\S]*?<\/font>/g)].map(match => ({
    bold: /<b(?:\s|\/|>)/.test(match[0]), italic: /<i(?:\s|\/|>)/.test(match[0]),
    color: safeRgb(/<color\b[^>]*rgb="([^"]+)"/.exec(match[0])?.[1]),
  }));
  const fills = [...fillBlock.matchAll(/<fill\b[\s\S]*?<\/fill>/g)].map(match =>
    safeRgb(/<fgColor\b[^>]*rgb="([^"]+)"/.exec(match[0])?.[1]));
  return [...xfBlock.matchAll(/<xf\b[^>]*(?:\/>|>[\s\S]*?<\/xf>)/g)].map(match => {
    const font = fonts[Number(/fontId="(\d+)"/.exec(match[0])?.[1])] || {};
    const fill = fills[Number(/fillId="(\d+)"/.exec(match[0])?.[1])] || '';
    const align = /horizontal="(left|center|right)"/.exec(match[0])?.[1] || '';
    const css = [];
    if (font.bold) css.push('font-weight:bold');
    if (font.italic) css.push('font-style:italic');
    if (font.color) css.push(`color:${font.color}`);
    if (fill) css.push(`background-color:${fill}`);
    if (align) css.push(`text-align:${align}`);
    return css.join(';');
  });
}

function xlsxPage(xml, sharedStrings, styles) {
  const withoutFormulas = xml.replace(/<f\b[\s\S]*?<\/f>/g, '');
  const rows = [...withoutFormulas.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)].slice(0, 10000);
  const text = [];
  const htmlRows = rows.map(row => {
    const cells = [...row[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)].slice(0, 1000);
    return `<tr>${cells.map(cell => {
      const raw = /<v>([\s\S]*?)<\/v>/.exec(cell[2])?.[1] || decodeXml(cell[2]);
      const value = /\bt="s"/.test(cell[1]) ? (sharedStrings[Number(raw)] || '') : decodeXml(raw);
      text.push(value);
      const style = styles[Number(/\bs="(\d+)"/.exec(cell[1])?.[1])] || '';
      return `<td${style ? ` style="${style}"` : ''}>${htmlEscape(value)}</td>`;
    }).join('')}</tr>`;
  }).join('');
  return { text: text.join(' '), html: `<table border="1" cellspacing="0" cellpadding="4">${htmlRows}</table>`, images: [] };
}

async function officePages(input, extension) {
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
        file.name === 'xl/styles.xml' ||
        /^ppt\/slides\/slide\d+\.xml$/.test(file.name) ||
        /^xl\/worksheets\/sheet\d+\.xml$/.test(file.name) ||
        /^(word|ppt|xl)\/media\//.test(file.name);
      if (!wanted) return;
      const entryLimit = /\/media\//.test(file.name) ? DOCUMENT_MAX_BYTES : DOCUMENT_MAX_TEXT;
      if (Number.isFinite(file.originalSize) && file.originalSize > entryLimit) {
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
        if (length > entryLimit || total > 96 * 1024 * 1024) {
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
  if (!selected.length) throw new Error('Document has no renderable pages');
  const pages = [];
  const sharedStringsXml = entries.get('xl/sharedStrings.xml')?.toString('utf8') || '';
  const sharedStrings = [...sharedStringsXml.matchAll(/<si\b[\s\S]*?<\/si>/g)]
    .map(match => decodeXml(match[0]));
  const styles = xlsxStyles(entries.get('xl/styles.xml')?.toString('utf8') || '');
  for (const name of selected.slice(0, DOCUMENT_MAX_PAGES)) {
    const xml = entries.get(name).toString('utf8');
    if (xml.length > DOCUMENT_MAX_TEXT) throw new Error('Document page text exceeds limit');
    if (extension === 'docx') {
      const paragraphs = [...xml.matchAll(/<w:p\b[\s\S]*?<\/w:p>/g)].map(match => decodeXml(match[0]));
      for (let offset = 0; offset < paragraphs.length; offset += 45) {
        pages.push({ text: paragraphs.slice(offset, offset + 45).join('\n'), images: [] });
      }
    } else {
      if (extension === 'xlsx') {
        pages.push(xlsxPage(xml, sharedStrings, styles));
      } else {
        pages.push({ text: decodeXml(xml), images: [] });
      }
    }
    if (pages.length >= DOCUMENT_MAX_PAGES) break;
  }
  if (!pages.length) pages.push({ text: '', images: [] });
  // Embedded OOXML media is data, never executable markup. Convert each
  // decodable raster to GIF and associate it with the first logical page.
  const media = names.filter(name => /^(word|ppt|xl)\/media\//.test(name)).slice(0, 100);
  for (const name of media) {
    const bytes = entries.get(name);
    if (bytes.length <= DOCUMENT_MAX_BYTES) pages[0].images.push(bytes);
  }
  return pages;
}

async function renderPages(input, extension) {
  if (extension === 'pdf') {
    const { pdf } = await import('pdf-to-img');
    const document = await pdf(input, { scale: 1.5 });
    if (document.length > DOCUMENT_MAX_PAGES) { await document.destroy(); throw new Error('PDF has too many pages'); }
    const pages = [];
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const textDocument = await pdfjs.getDocument({ data: new Uint8Array(input), isEvalSupported: false }).promise;
    try {
      for (let page = 1; page <= document.length; page += 1) {
        const textPage = await textDocument.getPage(page);
        const content = await textPage.getTextContent();
        pages.push({ image: await document.getPage(page),
          text: content.items.map(item => item.str || '').join(' ').slice(0, DOCUMENT_MAX_TEXT), images: [] });
      }
    } finally { await document.destroy(); await textDocument.destroy(); }
    return pages;
  }
  return officePages(input, extension);
}

export async function documentAsStoredGifs(fileObj, options) {
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
    const rendered = await renderPages(input, extension);
    const pages = [];
    let imageNumber = 0;
    for (let index = 0; index < rendered.length; index += 1) {
      const source = rendered[index];
      const page = { number: index + 1, text: String(source.text || '').slice(0, DOCUMENT_MAX_TEXT),
        html: String(source.html || ''), images: [] };
      if (source.image) source.images.unshift(source.image);
      for (const image of source.images) {
        imageNumber += 1;
        const version = `documentGif${imageNumber}`;
        try {
          const gif = await convertImageBufferToGif(image);
          await storeGeneratedGif(fileObj, gif, { ...options, versionName: version });
          page.images.push({ version, number: imageNumber });
        } catch (_) { /* an unreadable embedded image does not hide the text */ }
      }
      pages.push(page);
    }
    // Deliberately separate from presentation: this contains plain text only,
    // with no XML, HTML, style, formula or image data.
    const searchText = plainSearchText(pages.map(page => page.text).join(' '));
    const manifest = { attachmentId: fileObj._id, boardId: fileObj.meta?.boardId,
      cardId: fileObj.meta?.cardId, cacheKey, pageCount: pages.length, pages,
      searchText, extension, generatedAt: new Date() };
    await DocumentPreviews.removeAsync({ attachmentId: fileObj._id });
    await DocumentPreviews.insertAsync(manifest);
    await options.collection.updateAsync({ _id: fileObj._id }, {
      $set: { 'meta.documentGif': { cacheKey, pages: pages.length, extension } },
    });
    return manifest;
  })().finally(() => inProgress.delete(key));
  inProgress.set(key, work);
  return work;
}
