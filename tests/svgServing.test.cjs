'use strict';

// SVG is uploaded and shown as an image again (maintainer decision 2026-10-25,
// with #6802): an attachment, a card cover, a board background, an avatar. It
// was refused after JVN#74210258 (stored XSS). Safe because every uploaded SVG
// is sanitized before it is stored, and sanitized AGAIN, whole, on every route
// that serves one, under a Content-Security-Policy with no script and `sandbox`
// (server/lib/svgResponse.js).
// Run: node tests/svgServing.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const Module = require('module');
const { Readable } = require('stream');

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

// The real sanitizer, without Meteor: its two imports are not used by
// sanitizeSvgContent.
const sanitizerSource = read('models/lib/sanitizeSvg.js')
  .replace(/^import .*;$/gm, '')
  .replace(/^export function /gm, 'function ');
const sandbox = { module: { exports: {} }, console };
vm.runInNewContext(`${sanitizerSource}\nmodule.exports = { sanitizeSvgContent };`, sandbox);
const sanitizeSvg = sandbox.module.exports;
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request === '/models/lib/sanitizeSvg') return 'svg-sanitizer-shim';
  return originalResolve.call(this, request, ...rest);
};
require.cache['svg-sanitizer-shim'] = { id: 'svg-sanitizer-shim', filename: 'svg-sanitizer-shim', loaded: true, exports: sanitizeSvg };
const svgResponse = require('../server/lib/svgResponse.js');

function fakeRes() {
  const headers = {};
  const chunks = [];
  return {
    headers, chunks, statusCode: 0, headersSent: false,
    setHeader(k, v) { headers[k.toLowerCase()] = String(v); },
    removeHeader(k) { delete headers[k.toLowerCase()]; },
    write(c) { chunks.push(Buffer.from(c)); },
    end(c) { if (c) chunks.push(Buffer.from(c)); this.ended = true; },
    on() {}, once() {}, emit() {}, writable: true,
    body() { return Buffer.concat(chunks).toString('utf8'); },
  };
}

const EVIL = `<?xml version="1.0"?>
<!DOCTYPE svg [<!ENTITY lol "lol"><!ENTITY lol2 "&lol;&lol;">]>
<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)" width="10" height="10">
  <script>alert(document.cookie)</script>
  <a href="javascript:alert(2)"><rect width="10" height="10" fill="red"/></a>
  <foreignObject><iframe src="https://example.com"></iframe></foreignObject>
  <path d="M0 0L10 10" stroke="black"/>
</svg>`;

let passed = 0;
async function test(name, fn) { await fn(); passed += 1; console.log('  ok -', name); }

(async () => {
  console.log('svgServing:');

  await test('an SVG is served whole, sanitized, inline, under a script-free sandbox', async () => {
    const res = fakeRes();
    let logged = null;
    const sent = await svgResponse.sendInlineSvg(res, Readable.from([Buffer.from(EVIL)]), { onSanitized: t => { logged = t; } });
    assert.strictEqual(sent, true);
    const body = res.body();
    for (const bad of [/<script/i, /onload\s*=/i, /javascript:/i, /<!DOCTYPE/i, /<!ENTITY/i, /foreignObject/i, /<iframe/i]) {
      assert.doesNotMatch(body, bad, `removed: ${bad}`);
    }
    assert.match(body, /<path d="M0 0L10 10"/, 'the image itself stays');
    assert.strictEqual(res.headers['content-type'], 'image/svg+xml');
    assert.strictEqual(res.headers['content-disposition'], 'inline');
    assert.match(res.headers['content-security-policy'], /default-src 'none'/);
    assert.match(res.headers['content-security-policy'], /\bsandbox\b/);
    assert.doesNotMatch(res.headers['content-security-policy'], /script-src|allow-scripts/);
    assert.strictEqual(res.headers['x-content-type-options'], 'nosniff');
    assert.strictEqual(res.headers['content-length'], String(Buffer.byteLength(body)));
    assert.ok(logged && /<script/.test(logged), 'the attempt is reported with what was removed');
  });

  await test('a download is sanitized too, and a range is never applied to an SVG', async () => {
    const res = fakeRes();
    res.setHeader('Content-Range', 'bytes 0-9/100');
    await svgResponse.sendInlineSvg(res, Readable.from([Buffer.from(EVIL)]), { download: true, fileName: 'a.svg' });
    assert.doesNotMatch(res.body(), /<script/i);
    assert.strictEqual(res.headers['content-type'], 'application/octet-stream');
    assert.match(res.headers['content-disposition'], /^attachment; filename="a\.svg"/);
    assert.strictEqual(res.headers['content-range'], undefined);
    assert.match(read('server/routes/universalFileServer.js'), /attachment\?\.meta\?\.source !== 'legacy' && !svgResponse\.isSvg\(attachment\.type, attachment\.name\)/);
  });

  await test('negative: an SVG too large to sanitize whole stays a sandboxed download', async () => {
    const res = fakeRes();
    let downloadHeaders = false;
    const big = Buffer.alloc(svgResponse.SVG_INLINE_MAX_BYTES + 10, 0x20);
    const sent = await svgResponse.sendInlineSvg(res, Readable.from([big.subarray(0, 4), big.subarray(4)]), {
      downloadHeaders: r => { downloadHeaders = true; r.setHeader('Content-Type', 'application/octet-stream'); r.setHeader('Content-Security-Policy', "default-src 'none'; sandbox;"); },
    });
    assert.strictEqual(sent, false);
    assert.ok(downloadHeaders);
    assert.strictEqual(res.headers['content-type'], 'application/octet-stream', 'never image/svg+xml unsanitized');
  });

  await test('isSvg by type or by name, and nothing else', async () => {
    assert.ok(svgResponse.isSvg('image/svg+xml; charset=utf-8', 'x'));
    assert.ok(svgResponse.isSvg('application/octet-stream', 'Drawing.SVG'));
    assert.ok(!svgResponse.isSvg('image/png', 'a.png'));
    assert.ok(!svgResponse.isSvg('', 'a.svg.png'));
  });

  await test('uploads are no longer refused, and are sanitized before they are validated', async () => {
    for (const f of ['models/attachments.js', 'models/avatars.js']) {
      assert.doesNotMatch(read(f), /SVG files are not allowed/, f);
    }
    for (const f of ['models/attachments.server.js', 'models/avatars.server.js']) {
      const s = read(f);
      assert.ok(s.indexOf('sanitizeUploadedFileExploits(fileObj)') !== -1, f);
      assert.ok(s.indexOf('sanitizeUploadedFileExploits(fileObj)') < s.indexOf('isFileValid(fileObj'), `${f}: sanitized before validated`);
    }
  });

  await test('negative: no route in the tree sends file bytes without the SVG path', async () => {
    // Every file-serving module that pipes stored bytes to a response decides
    // SVG first, through svgResponse - a new route that forgets would serve an
    // unsanitized SVG.
    const files = [
      ...fs.readdirSync(path.join(root, 'server/routes')).filter(f => f.endsWith('.js')).map(f => `server/routes/${f}`),
      'models/lib/httpStream.js',
    ];
    for (const f of files) {
      const s = read(f);
      if (!/(readStream|fileStream|stream|legacy\.stream)\.pipe\((res|http\.response)\)|streamFile\(res,/.test(s)) continue;
      if (!/attachments|avatars|getReadStream|getOldAttachmentStream/.test(s)) continue;
      assert.match(s, /svgResponse/, `${f} serves files but never decides SVG through svgResponse`);
    }
    // ...and image/svg+xml is only ever sent as a content type by svgResponse.
    const offenders = [];
    (function walk(dir) {
      for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
        if (['node_modules', '.tools', '_build', '.build', 'tests', '.git'].includes(e.name)) continue;
        const rel = `${dir}/${e.name}`;
        if (e.isDirectory()) walk(rel);
        else if (/\.(c|m)?js$/.test(e.name) && rel !== 'server/lib/svgResponse.js') {
          if (/setHeader\(\s*['"]Content-Type['"]\s*,\s*['"]image\/svg\+xml/.test(fs.readFileSync(path.join(root, rel), 'utf8'))) offenders.push(rel);
        }
      }
    })('server');
    assert.deepStrictEqual(offenders, []);
  });

  console.log(`svgServing: ${passed} passed`);
})().catch(e => { console.error(e); process.exit(1); });
