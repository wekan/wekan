'use strict';

// Guard: the card menu's QR code (#2015) is a correct QR Code.
// Run: node tests/qrCode.test.cjs
//
// models/lib/qrCode.js is WeKan's own encoder (byte mode, level M, versions
// 1-10), so the code is drawn in the browser and the card link is sent to no
// outside service. Its output is checked against an independent encoder:
// qrcode-svg, which Meteor's accounts-2fa ships for its 2FA QR codes. Two
// correct encoders may pick different masks (the penalty rules leave ties), so
// the matrix has to equal the reference's under the SAME mask - every module.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { encodeQr, qrSvg, versionFor } = require('../models/lib/qrCode.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log(`ok - ${name}`); }

function findReference() {
  const root = path.join(__dirname, '..', '.tools', '.meteor', 'packages', 'accounts-2fa');
  if (!fs.existsSync(root)) return null;
  for (const dir of fs.readdirSync(root)) {
    const file = path.join(root, dir, 'npm', 'node_modules', 'qrcode-svg', 'lib', 'qrcode.js');
    if (fs.existsSync(file)) return require(file);
  }
  return null;
}

const samples = [
  'a',
  'https://wekan.example.com/b/AbCdEfGhIjKlMnOpQ/my-board/XyZ123abcDEF456gh',
  'https://boards.example.org/b/aaaaaaaaaaaaaaaaa/kanban-sprint-planning-2026/bbbbbbbbbbbbbbbbb',
  `https://example.com/b/${'x'.repeat(17)}/${'työ-taulu-'.repeat(8)}/${'y'.repeat(17)}`,
  'z'.repeat(200),
];

const QRCode = findReference();
if (QRCode) {
  for (const text of samples) {
    test(`same modules as qrcode-svg for ${text.length} chars`, () => {
      const bytes = new TextEncoder().encode(text).length;
      const ref = new QRCode({ content: text, ecl: 'M', padding: 0 });
      const refModules = ref.qrcode.modules;
      // qrcode-svg prefixes non-ASCII text with a UTF-8 byte-order mark;
      // WeKan does not (scanners read plain UTF-8), so compare like for like.
      const same = /^[\x00-\x7f]*$/.test(text) ? text : `\ufeff${text}`;
      const mine = encodeQr(same, { mask: 0 });
      assert.strictEqual(refModules.length, mine.size, `version for ${bytes} bytes`);
      const matches = [0, 1, 2, 3, 4, 5, 6, 7].some(mask => {
        const m = encodeQr(same, { mask }).modules;
        return m.every((row, r) => row.every((v, c) => v === refModules[r][c]));
      });
      assert.ok(matches, 'no mask reproduces the reference matrix');
    });
  }
} else {
  console.log('# skip - qrcode-svg reference not installed under .tools/.meteor');
}

test('every module is decided (no null left) and the size fits the version', () => {
  for (const text of samples) {
    const code = encodeQr(text);
    assert.strictEqual(code.size, code.version * 4 + 17);
    for (const row of code.modules) for (const v of row) assert.strictEqual(typeof v, 'boolean');
  }
});

test('the smallest version is chosen', () => {
  assert.strictEqual(versionFor(14), 1);
  assert.strictEqual(versionFor(15), 2);
  assert.strictEqual(versionFor(213), 10);
});

test('negative: too long for version 10 gives null and an empty SVG', () => {
  assert.strictEqual(versionFor(214), 0);
  assert.strictEqual(encodeQr('z'.repeat(214)), null);
  assert.strictEqual(qrSvg('z'.repeat(214)), '');
});

test('negative: the SVG escapes its label and loads nothing external', () => {
  const svg = qrSvg('https://example.com/b/1/x/2', { label: '<script>"&' });
  assert.ok(svg.includes('aria-label="&lt;script&gt;&quot;&amp;"'));
  assert.ok(!/<script|href=|xlink|<image/i.test(svg));
});

test('negative: no card QR code is fetched from an outside QR service', () => {
  const roots = ['client', 'models', 'server'];
  const offenders = [];
  const walk = dir => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(js|jade|html)$/.test(e.name) && /chart\.googleapis|api\.qrserver|quickchart\.io\/qr/i.test(fs.readFileSync(p, 'utf8'))) offenders.push(p);
    }
  };
  for (const r of roots) walk(path.join(__dirname, '..', r));
  assert.deepStrictEqual(offenders, []);
});

test('the card menu offers it, as an image drawn in the browser (UI wiring)', () => {
  const jade = fs.readFileSync(path.join(__dirname, '..', 'client/components/cards/cardDetails.jade'), 'utf8');
  const js = fs.readFileSync(path.join(__dirname, '..', 'client/components/cards/cardDetails.js'), 'utf8');
  assert.match(jade, /a\.js-card-qr-code\n\s+i\.fa\.fa-qrcode/);
  assert.match(jade, /template\(name="cardQrCodePopup"\)[\s\S]*img\.card-qr-code-image\(src="\{\{qrDataUri\}\}"/);
  assert.match(js, /'click \.js-card-qr-code': Popup\.open\('cardQrCode'\)/);
  assert.match(js, /data:image\/svg\+xml;base64,\$\{window\.btoa\(svg\)\}/);
  // negative: no raw-HTML injection of the SVG into the page
  assert.doesNotMatch(jade.slice(jade.indexOf('template(name="cardQrCodePopup")')), /\{\{\{/);
});

console.log(`# ${passed} passed`);
