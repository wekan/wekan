'use strict';

// SVG is uploaded and shown as an image again (maintainer decision 2026-10-25,
// with #6802): an attachment, a card cover, a board background, an avatar. It
// was refused after JVN#74210258 (stored XSS). Safe because every uploaded SVG
// is sanitized before it is stored, and sanitized AGAIN, whole and streaming, on
// every route that serves one, under a Content-Security-Policy with no script and `sandbox`
// (server/lib/svgResponse.js).
// Run: node tests/svgServing.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const Module = require('module');
const { Readable, Writable } = require('stream');

const root = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

// The real sanitizer: server/lib/svgResponse.js requires it by its Meteor
// absolute path.
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request === '/models/lib/svgSanitizer') return path.join(root, 'models/lib/svgSanitizer.js');
  return originalResolve.call(this, request, ...rest);
};
const svgResponse = require('../server/lib/svgResponse.js');

// A response: a real Writable, so it can be piped to, with the header API.
function fakeRes() {
  const headers = {};
  const chunks = [];
  const res = new Writable({ write(c, enc, cb) { chunks.push(Buffer.from(c)); cb(); } });
  Object.assign(res, {
    headers, chunks, statusCode: 0, headersSent: false,
    setHeader(k, v) { headers[k.toLowerCase()] = String(v); },
    removeHeader(k) { delete headers[k.toLowerCase()]; },
    body() { return Buffer.concat(chunks).toString('utf8'); },
  });
  return res;
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
    assert.strictEqual(res.headers['content-length'], undefined, 'streamed: the length is not known up front');
    assert.ok(logged && /<script/i.test(logged), 'the attempt is reported with what was removed');
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

  await test('an SVG of any size is shown sanitized - no size falls back to an unsanitized download', async () => {
    // 20 MB of path data, a script past the old 8 MB cap, split across chunks.
    const res = fakeRes();
    const path20 = Buffer.alloc(20 * 1024 * 1024, 'L1 1 ');
    const chunks = [Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><path d="'), path20, Buffer.from('"/><scr'), Buffer.from('ipt>alert(1)</script><rect/></svg>')];
    let logged = null;
    const sent = await svgResponse.sendInlineSvg(res, Readable.from(chunks), { onSanitized: t => { logged = t; } });
    assert.strictEqual(sent, true);
    const body = res.body();
    assert.strictEqual(res.headers['content-type'], 'image/svg+xml');
    assert.doesNotMatch(body.slice(-200), /<script|alert/i);
    assert.ok(body.endsWith('"/><rect/></svg>'));
    assert.ok(body.length > 20 * 1024 * 1024);
    assert.ok(logged && /<script/i.test(logged));
    assert.doesNotMatch(read('server/lib/svgResponse.js'), /SVG_INLINE_MAX_BYTES|readCapped|downloadHeaders\(/, 'no size cap, no unsanitized fallback');
  });

  await test('negative: a stream error ends the response short, never with unsanitized bytes', async () => {
    const res = fakeRes();
    const broken = new Readable({ read() {} });
    const sending = svgResponse.sendInlineSvg(res, broken, {});
    broken.push(Buffer.from('<svg><rect/>'));
    broken.destroy(new Error('storage gone'));
    assert.strictEqual(await sending, false);
    assert.doesNotMatch(res.body(), /<script/i);
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
