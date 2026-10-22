'use strict';

// The installed pdfjs-dist, called the way server/lib/documentGif.js's
// pdfSearchText() calls it - the legacy build, the real worker file, the
// package's own standard fonts and CMaps, getDocument/getPage/getTextContent
// and destroy() on the LOADING TASK - on a PDF with known text. A pdfjs-dist
// update that moves any of those fails here instead of in attachment search.
// pdfjs-dist went 6.2.108 -> 6.4.299.
// Run: node tests/pdfjsTextRuntime.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// A one-page PDF with the text "WeKan attachment search", with a correct xref.
function tinyPdf(text) {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    null,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  const stream = `BT /F1 18 Tf 20 70 Td (${text}) Tj ET`;
  objects[3] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  let out = '%PDF-1.4\n';
  const offsets = [];
  objects.forEach((body, i) => { offsets.push(out.length); out += `${i + 1} 0 obj\n${body}\nendobj\n`; });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const o of offsets) out += `${String(o).padStart(10, '0')} 00000 n \n`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}

(async () => {
  const src = read('server/lib/documentGif.js');
  // The calls this test makes are the calls documentGif.js makes.
  for (const shape of [
    "import('pdfjs-dist/legacy/build/pdf.mjs')",
    "runtimeResolve('pdfjs-dist/legacy/build/pdf.worker.mjs')",
    "pdfjsAssetPath('standard_fonts')", "pdfjsAssetPath('cmaps')",
    'await textPage.getTextContent()', 'await loadingTask.destroy()',
  ]) assert.ok(src.includes(shape), `documentGif.js no longer uses ${shape}; update this test with it`);

  const pkg = path.dirname(require.resolve('pdfjs-dist/package.json'));
  const pdfjs = await import(pathToFileURL(path.join(pkg, 'legacy/build/pdf.mjs')).href);
  pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(path.join(pkg, 'legacy/build/pdf.worker.mjs')).href;
  for (const dir of ['standard_fonts', 'cmaps']) assert.ok(fs.statSync(path.join(pkg, dir)).isDirectory(), `${dir}/ ships with pdfjs-dist`);

  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(tinyPdf('WeKan attachment search')),
    isEvalSupported: false,
    standardFontDataUrl: path.join(pkg, 'standard_fonts') + path.sep,
    cMapUrl: path.join(pkg, 'cmaps') + path.sep,
    cMapPacked: true,
    verbosity: 0,
  });
  const doc = await loadingTask.promise;
  try {
    assert.strictEqual(doc.numPages, 1);
    const page = await doc.getPage(1);
    const content = await page.getTextContent();
    assert.match(content.items.map(item => item.str || '').join(' '), /WeKan attachment search/);
  } finally {
    await loadingTask.destroy();
  }
  console.log('  ok - pdfjs-dist extracts the text of a PDF the way documentGif.js asks');

  // Negative: a file that is not a PDF is refused, not read as empty text.
  const bad = pdfjs.getDocument({ data: new Uint8Array(Buffer.from('not a pdf at all')), verbosity: 0 });
  await assert.rejects(bad.promise);
  await bad.destroy();
  console.log('  ok - a file that is not a PDF is refused (negative)');
  console.log('\n2 passed');
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
