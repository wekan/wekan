'use strict';

// The Unicode PDF writer reads each picture only when it draws it and writes
// the document to a stream as it is made, so a board of pictures is one
// picture in memory at a time (#6745). Runs the real writer and PDFKit.
// Run: node tests/pdfLazyImages.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');
const { Writable } = require('node:stream');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

// The two modules as plain ES modules, their WeKan paths pointed at the files.
async function loadWriter() {
  const dir = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'pdf-lazy-'));
  fs.writeFileSync(path.join(dir, 'pdfDocument.mjs'), read('models/lib/pdfDocument.js'));
  fs.writeFileSync(path.join(dir, 'buildUnicodePdf.mjs'), read('models/server/buildUnicodePdf.js')
    .replace("import PDFDocument from 'pdfkit';", `import { createRequire } from 'node:module'; const PDFDocument = createRequire(${JSON.stringify(path.join(ROOT, 'package.json'))})('pdfkit');`)
    .replace("from '/models/lib/pdfDocument';", "from './pdfDocument.mjs';"));
  const mod = await import(path.join(dir, 'buildUnicodePdf.mjs'));
  return { ...mod, dir };
}

// A 2x2 PNG.
function png() {
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32 ? zlib.crc32(Buffer.concat([Buffer.from(type), data])) : 0);
    return Buffer.concat([len, Buffer.from(type), data, crc]);
  };
  const ihdr = Buffer.from([0, 0, 0, 2, 0, 0, 0, 2, 8, 2, 0, 0, 0]);
  const raw = Buffer.from([0, 255, 0, 0, 0, 255, 0, 0, 0, 0, 255, 255, 255, 0]);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

async function main() {
  const fontDir = path.join(ROOT, 'private/fonts/unifont');
  const fonts = {
    main: fs.readFileSync(path.join(fontDir, fs.readdirSync(fontDir).find(f => /^unifont-.*\.otf$/.test(f)))),
    upper: fs.readFileSync(path.join(fontDir, fs.readdirSync(fontDir).find(f => /^unifont_upper-.*\.otf$/.test(f)))),
  };
  const { buildUnicodePdf, dir } = await loadWriter();
  try {
    // Each picture is read when its row is drawn, one after another.
    const order = [];
    let inFlight = 0;
    let maxInFlight = 0;
    const image = name => ({ name, type: 'image/png', load: async () => {
      inFlight += 1; maxInFlight = Math.max(maxInFlight, inFlight);
      order.push(name);
      await new Promise(r => setTimeout(r, 5));
      inFlight -= 1;
      return name === 'broken' ? null : png();
    } });
    const lines = ['Pictures', { imageRow: [image('a'), image('b'), image('broken')], imageCaptions: ['a', 'b', 'broken'] },
      { imageRow: [image('c')], imageCaptions: ['c'] }];
    const chunks = [];
    const out = new Writable({ write(chunk, enc, done) { chunks.push(chunk); done(); } });
    const result = await buildUnicodePdf(lines, fonts, { output: out });
    assert.equal(result, null, 'written to the stream, not returned');
    const pdf = Buffer.concat(chunks).toString('latin1');
    assert.match(pdf, /^%PDF-/);
    assert.match(pdf, /%%EOF\s*$/);
    assert.deepEqual(order, ['a', 'b', 'broken', 'c'], 'every picture read, in the order drawn');
    assert.equal(maxInFlight, 1, 'one picture read at a time');
    assert.equal((pdf.match(/\/Subtype \/Image/g) || []).length, 3, 'the three readable ones embedded; the broken one is only named');
    // Without an output stream, the whole document as before.
    const whole = await buildUnicodePdf(['Hello'], fonts);
    assert.ok(Buffer.isBuffer(whole) && whole.toString('latin1').startsWith('%PDF-'));
    console.log('  ok - pictures are read lazily, one at a time, into a streamed document');

    // The exporter gives loaders, not bytes, and sends from a temporary file
    // with the base-font fallback kept.
    const exporter = read('models/server/ExporterCardPDF.js');
    assert.match(exporter, /load: async \(\) => \{/);
    assert.doesNotMatch(exporter.slice(exporter.indexOf('async function attachmentImages'), exporter.indexOf('async function sendPdf')), /data,\n/);
    assert.match(exporter, /await buildUnicodePdf\(lines, await unicodeFonts\(\), \{ output: fs\.createWriteStream\(tempPath\) \}\);/);
    assert.match(exporter, /const pdf = buildPdfBuffer\(lines\);/, 'the fallback stays');
    assert.equal((exporter.match(/await sendPdf\(res, lines,/g) || []).length, 2, 'card and board PDFs');
    console.log('  ok - the card and board PDF exports send through it');
    console.log('\npdfLazyImages: 2 checks passed');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

main().catch(error => { console.error(error); process.exit(1); });
