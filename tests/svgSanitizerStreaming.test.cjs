'use strict';

// SVG of any size is sanitized whole, streaming (models/lib/svgSanitizer.js):
// on upload (models/lib/sanitizeSvg.js sanitizeSvgFile), on validation
// (svgFileIsClean) and on every serve (server/lib/svgResponse.js). The regular
// expressions it replaced read a file whole, stopped at a size, and saw nothing
// in UTF-16 or behind a character reference. These tests drive the real
// tokenizer: every byte offset a payload can be split at, payloads tens of
// megabytes into a file, bounded memory, and the encodings.
// Run: node tests/svgSanitizerStreaming.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { Readable, Writable } = require('stream');
const { pipeline } = require('stream/promises');

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const {
  createSvgSanitizer, createSvgSanitizeStream, sanitizeSvgString, attributeIsDangerous,
} = require('../models/lib/svgSanitizer.js');

const tmpRoot = path.join(root, '.tools', 'tmp');
fs.mkdirSync(tmpRoot, { recursive: true });
const tmpDir = fs.mkdtempSync(path.join(tmpRoot, 'svg-stream-'));

let passed = 0;
async function test(name, fn) { await fn(); passed += 1; console.log('  ok -', name); }

// Everything that must never survive, in every form a browser accepts.
const DANGER = [
  /<script/i, /<\/script\b[^>]*>/i, /\son[a-z]+\s*=/i, /javascript:/i, /&#106;avascript/i, /vbscript:/i,
  /<!DOCTYPE/i, /<!ENTITY/i, /foreignObject/i, /<iframe/i, /<embed/i, /<object/i,
  /<set\b/i, /<animate/i, /xml-stylesheet/i, /@import/i, /expression\(/i,
];
const assertClean = (out, label) => {
  for (const re of DANGER) assert.doesNotMatch(out, re, `${label}: ${re}`);
};

const EVIL = '<?xml version="1.0"?>\n'
  + '<!DOCTYPE svg [<!ENTITY lol "lol"><!ENTITY lol2 "&lol;&lol;&lol;">]>\n'
  + '<?xml-stylesheet href="x.css"?>\n'
  + '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)" width="10" height="10">'
  + '<script type="text/javascript"><![CDATA[ if (a < b) alert(document.cookie) ]]></script>'
  + '<a href="&#106;avascript:alert(2)" xlink:href="java&#x09;script:alert(3)"><rect width="10" height="10"/></a>'
  + '<foreignObject><iframe src="https://example.com"></iframe></foreignObject>'
  + '<set attributeName="href" to="javascript:alert(4)"/>'
  + '<animate attributeName="href" values="javascript:alert(5)"/>'
  + '<style>@import url(evil.css);</style>'
  + '<rect style="background:url(javascript:alert(6))" ONCLICK="x()"/>'
  + '<path d="M0 0L10 10" stroke="black"/>'
  + '</svg>';

async function streamThrough(chunks) {
  const out = [];
  const s = createSvgSanitizeStream();
  await pipeline(Readable.from(chunks), s, new Writable({ write(c, e, cb) { out.push(Buffer.from(c)); cb(); } }));
  return { body: Buffer.concat(out), changed: s.changed, removed: s.removed };
}

(async () => {
  console.log('svgSanitizerStreaming:');

  await test('a hostile SVG keeps its image and loses every active construct', async () => {
    const { content, changed, removed } = sanitizeSvgString(EVIL);
    assert.strictEqual(changed, true);
    assertClean(content, 'whole');
    assert.match(content, /<path d="M0 0L10 10" stroke="black"\/>/);
    assert.match(content, /<rect width="10" height="10"\/>/);
    assert.match(content, /^<\?xml version="1.0"\?>/, 'the XML declaration stays');
    assert.match(removed, /<script/i, 'the log is told what was removed');
  });

  await test('split at EVERY offset into two chunks, the output is the same as whole', async () => {
    const whole = sanitizeSvgString(EVIL).content;
    const bytes = Buffer.from(EVIL, 'latin1');
    for (let i = 1; i < bytes.length; i += 1) {
      const { body, changed } = await streamThrough([bytes.subarray(0, i), bytes.subarray(i)]);
      assert.strictEqual(body.toString('latin1'), whole, `split at ${i}`);
      assert.strictEqual(changed, true);
    }
  });

  await test('one byte at a time, and random chunkings, give the same output', async () => {
    const whole = sanitizeSvgString(EVIL).content;
    const bytes = Buffer.from(EVIL, 'latin1');
    const single = [];
    for (let i = 0; i < bytes.length; i += 1) single.push(bytes.subarray(i, i + 1));
    assert.strictEqual((await streamThrough(single)).body.toString('latin1'), whole);
    let seed = 7;
    const rnd = n => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
    for (let run = 0; run < 200; run += 1) {
      const chunks = [];
      for (let i = 0; i < bytes.length;) { const n = 1 + rnd(40); chunks.push(bytes.subarray(i, i + n)); i += n; }
      assert.strictEqual((await streamThrough(chunks)).body.toString('latin1'), whole, `run ${run}`);
    }
  });

  await test('a clean SVG passes byte for byte, UTF-8 included, and is not "changed"', async () => {
    const clean = Buffer.from('<?xml version="1.0" encoding="UTF-8"?>\n<!-- piirros -->\n'
      + '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">'
      + '<style>.a{fill:#f00}</style><text>Ääkköset ✓ 漢字</text><a href="https://wekan.fi/"><circle r="2"/></a>'
      + '<image xlink:href="data:image/png;base64,iVBORw0KGgo="/><![CDATA[ <script> is text here ]]></svg>', 'utf8');
    const { body, changed } = await streamThrough([clean.subarray(0, 50), clean.subarray(50)]);
    assert.strictEqual(changed, false);
    assert.ok(body.equals(clean), 'unchanged bytes');
  });

  await test('a 128 MB SVG with payloads at the start, in the middle and at the end is sanitized whole, in bounded memory', async () => {
    const file = path.join(tmpDir, 'big.svg');
    const out = path.join(tmpDir, 'big.out.svg');
    const fd = fs.openSync(file, 'w');
    fs.writeSync(fd, '<svg xmlns="http://www.w3.org/2000/svg" onload="a()"><script>start()</script>');
    const block = '<path d="' + 'L1 2 '.repeat(54000) + '"/>\n'; // a 256 KB tag
    for (let i = 0; i < 512; i += 1) {
      fs.writeSync(fd, block);
      if (i === 256) fs.writeSync(fd, '<a href="javascript:middle()"><rect onclick="m()"/></a><foreignObject><b>x</b></foreignObject>');
    }
    fs.writeSync(fd, '<scr' + 'ipt>end()</script><rect/></svg>');
    fs.closeSync(fd);
    const size = fs.statSync(file).size;
    assert.ok(size > 128 * 1024 * 1024);

    if (global.gc) global.gc();
    const before = process.memoryUsage().rss;
    let peak = before;
    const timer = setInterval(() => { peak = Math.max(peak, process.memoryUsage().rss); }, 20);
    const started = Date.now();
    const s = createSvgSanitizeStream();
    await pipeline(fs.createReadStream(file), s, fs.createWriteStream(out));
    clearInterval(timer);
    const ms = Date.now() - started;

    assert.strictEqual(s.changed, true);
    const text = fs.readFileSync(out, 'latin1');
    assertClean(text, 'big');
    assert.strictEqual(text.split('<path d="').length - 1, 512, 'every path kept');
    assert.ok(text.endsWith('<rect/></svg>'));
    assert.match(text, /<a><rect\/><\/a>/, 'the middle link and handler lost their scripts, kept their shapes');
    // Never held whole: memory grows by less than the file's size - what the
    // tokenizer holds is a tag or so, the rest is garbage not yet collected.
    assert.ok(peak - before < size * 0.75, `memory grew ${Math.round((peak - before) / 1048576)} MB`);
    console.log(`    (${Math.round(size / 1048576)} MB in ${ms} ms, rss +${Math.round((peak - before) / 1048576)} MB)`);
  });

  await test('UTF-16 (both byte orders, with or without a BOM) is read, sanitized, and is not hidden from it', async () => {
    const src = '<?xml version="1.0" encoding="UTF-16"?><svg onload="x()"><script>y()</script><text>Ää</text></svg>';
    const le = Buffer.from(src, 'utf16le');
    const be = Buffer.from(le); be.swap16();
    for (const [label, buf] of [
      ['le+bom', Buffer.concat([Buffer.from([0xff, 0xfe]), le])],
      ['be+bom', Buffer.concat([Buffer.from([0xfe, 0xff]), be])],
      ['le', le], ['be', be],
    ]) {
      const { body, changed } = await streamThrough([buf.subarray(0, 3), buf.subarray(3, 9), buf.subarray(9)]);
      const text = body.toString('utf8');
      assert.strictEqual(changed, true, label);
      assertClean(text, label);
      assert.match(text, /<text>Ää<\/text>/, `${label}: written as UTF-8`);
      assert.doesNotMatch(text, /UTF-16/, `${label}: no declaration naming the wrong encoding`);
    }
    const cleanLe = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from('<svg><text>ok</text></svg>', 'utf16le')]);
    assert.strictEqual((await streamThrough([cleanLe])).changed, false, 'a clean UTF-16 file is not an attempt');
  });

  await test('a tag or a sheet too long to check is dropped, not passed through unchecked', async () => {
    const s = createSvgSanitizer({ maxMarkup: 64 });
    const out = s.push(`<svg><rect ${'x'.repeat(100)} onload="a()"/><style>${'a{}'.repeat(40)}@import url(x)</style><circle/></svg>`) + s.end();
    assert.strictEqual(s.changed, true);
    assert.doesNotMatch(out, /onload|@import|xxxx/);
    assert.match(out, /<circle\/><\/svg>$/);
  });

  await test('scripts hidden by character references, control characters or case are found', async () => {
    for (const v of ['&#106;avascript:x', '&#x6A;avascript:x', 'jav&#9;ascript:x', ' JaVaScRiPt:x', 'java\u0000script:x',
      'javascript&colon;x', 'vbscript:x', 'data:text/html,<script>']) {
      assert.ok(attributeIsDangerous('href', v), v);
    }
    assert.ok(attributeIsDangerous('xlink:href', 'javascript:x'));
    assert.ok(attributeIsDangerous('OnMouseOver', 'x'));
    assert.ok(!attributeIsDangerous('href', 'https://wekan.fi/'));
    assert.ok(!attributeIsDangerous('href', 'data:image/png;base64,AAAA'));
    assert.ok(!attributeIsDangerous('fill', 'url(#gradient)'));
  });

  await test('an XML loop, external entity and unfinished markup at the end are removed', async () => {
    const bomb = '<?xml version="1.0"?><!DOCTYPE lolz [<!ENTITY lol "lol"><!ELEMENT lolz (#PCDATA)>'
      + '<!ENTITY lol1 "&lol;&lol;&lol;&lol;&lol;"><!ENTITY xxe SYSTEM "file:///etc/passwd">]><svg>&lol1;&xxe;</svg><script';
    const { content, changed } = sanitizeSvgString(bomb);
    assert.strictEqual(changed, true);
    assertClean(content, 'bomb');
    assert.doesNotMatch(content, /SYSTEM|passwd|<script/i);
  });

  await test('upload: sanitizeSvgFile rewrites a hostile file in place, leaves a clean one untouched; svgFileIsClean agrees', async () => {
    // models/lib/sanitizeSvg.js, without Meteor: its import lines are swapped
    // for the server they assume.
    const vm = require('vm');
    const src = read('models/lib/sanitizeSvg.js')
      .replace(/^import \{ Meteor \} from 'meteor\/meteor';$/m, "const Meteor = { isServer: true };")
      .replace(/^import fs from 'fs';$/m, "const fs = require('fs');")
      .replace(/^export (async )?function /gm, (all, a) => `${a || ''}function `);
    const mod = { exports: {} };
    const req = r => require(r === './svgSanitizer' ? path.join(root, 'models/lib/svgSanitizer.js') : r);
    vm.runInNewContext(`${src}\nmodule.exports = { sanitizeSvgFile, svgFileIsClean, isSvgFile };`, { module: mod, require: req, console, Buffer, process });
    const { sanitizeSvgFile, svgFileIsClean } = mod.exports;

    const evil = path.join(tmpDir, 'evil.svg');
    fs.writeFileSync(evil, EVIL);
    assert.strictEqual(await svgFileIsClean(evil), false);
    const size = await sanitizeSvgFile(evil);
    assert.strictEqual(size, fs.statSync(evil).size);
    assertClean(fs.readFileSync(evil, 'latin1'), 'rewritten');
    assert.strictEqual(await svgFileIsClean(evil), true, 'validation accepts what upload produced');
    assert.deepStrictEqual(fs.readdirSync(tmpDir).filter(f => f.includes('.sanitizing-')), [], 'no temp file left');

    const clean = path.join(tmpDir, 'clean.svg');
    fs.writeFileSync(clean, '<svg><circle r="1"/></svg>');
    const mtime = fs.statSync(clean).mtimeMs;
    assert.strictEqual(await sanitizeSvgFile(clean), null);
    assert.strictEqual(fs.statSync(clean).mtimeMs, mtime, 'a clean file is not rewritten');
    assert.strictEqual(await svgFileIsClean(path.join(tmpDir, 'missing.svg')), false, 'negative: unreadable is not clean');
  });

  await test('negative: the whole tree sanitizes SVG through the streaming tokenizer, nowhere by a whole-file read', async () => {
    // The regex sanitizer read files whole (readFileSync) and gave up on large
    // ones; the validation scan rejected every SVG over its megabyte. Neither
    // shape may come back anywhere.
    const svgLib = read('models/lib/sanitizeSvg.js');
    assert.match(svgLib, /createSvgSanitizeStream/);
    assert.doesNotMatch(svgLib, /readFileSync|writeFileSync|sanitizeSvgFileSync/);
    assert.match(read('models/lib/sanitizeUploadedFile.js'), /await sanitizeSvgFile\(/);
    for (const f of ['models/attachments.server.js', 'models/avatars.server.js']) {
      assert.match(read(f), /await sanitizeUploadedFileExploits\(fileObj\)/, `${f}: the async sanitizer is awaited`);
    }
    assert.doesNotMatch(read('models/lib/fileStoreStrategy.js'), /(^|[^\w.])(?<!await )sanitizeUploadedFileExploits\(fileObj\)/m,
      'fileStoreStrategy.js: every call is awaited');
    const validation = read('models/fileValidation.js');
    const svgBranch = validation.indexOf("mime === 'image/svg+xml'");
    assert.ok(svgBranch !== -1 && svgBranch < validation.indexOf('await readTextHead(filePath)'), 'SVG is checked whole before the head-limited scan');
    assert.match(validation, /svgFileIsClean\(filePath\)/);
    assert.match(read('server/lib/svgResponse.js'), /pipeline\(readStream, sanitizer, res\)/);

    // No file anywhere else implements its own SVG sanitizing.
    const offenders = [];
    (function walk(dir) {
      for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
        if (['node_modules', '.tools', '_build', '.build', '.git', 'tests', 'public', 'packages'].includes(e.name)) continue;
        const rel = dir ? `${dir}/${e.name}` : e.name;
        if (e.isDirectory()) walk(rel);
        else if (/\.(c|m)?js$/.test(e.name) && !['models/lib/svgSanitizer.js', 'models/lib/sanitizeSvg.js'].includes(rel)) {
          const s = fs.readFileSync(path.join(root, rel), 'utf8');
          if (/\.replace\(\s*\/<script[\s\S]{0,40}<\\\/script>/i.test(s) && /svg/i.test(s)) offenders.push(rel);
        }
      }
    })('');
    assert.deepStrictEqual(offenders, [], 'SVG sanitized by a regular expression outside svgSanitizer.js');
  });

  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log(`svgSanitizerStreaming: ${passed} passed`);
})().catch(e => { fs.rmSync(tmpDir, { recursive: true, force: true }); console.error(e); process.exit(1); });
