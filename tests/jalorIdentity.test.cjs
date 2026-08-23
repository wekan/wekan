'use strict';

// The Jalor identity: one source for the product's name, marks that are
// generated from one drawing, and the upstream attribution left intact.
//
// The last of those is the one worth a test. Rebranding a fork is a good way to
// quietly remove somebody else's copyright, and the MIT licence WeKan is
// published under does not allow that. The brand is Jalor; the licence, the
// copyright and the record of where the code came from stay WeKan's.
//
// Run: node tests/jalorIdentity.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(root, rel));

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('jalorIdentity:');

test('one place decides what the product is called', () => {
  const helper = read('models/lib/productName.js');
  assert.ok(/return 'Jalor';/.test(helper), 'the default is Jalor');
  // And the surfaces that show a brand go through it, or through the same
  // literal, rather than each carrying its own idea of the name.
  const { productNameOrDefault } = require('../models/lib/productName.js');
  assert.strictEqual(productNameOrDefault(''), 'Jalor');
  assert.strictEqual(productNameOrDefault('Tableaux de la DSI'), 'Tableaux de la DSI',
    "an administrator's own Product name still wins");
});

test('the brand a template shows comes from that helper', () => {
  const helpers = read('client/config/blazeHelpers.js');
  assert.ok(/productNameOrDefault/.test(helpers) && /registerHelper\('productName'/.test(helpers),
    'a global `productName` Blaze helper resolves it');
  // The sign-in page uses it. Reading `currentSetting.productName` directly
  // renders nothing on an instance where nobody set one.
  const layouts = read('client/components/main/layouts.jade');
  assert.ok(/h1\.jalor-auth-name \{\{productName\}\}/.test(layouts),
    'the sign-in masthead shows the product name');
  assert.ok(/jalor-tagline/.test(layouts), 'with the tagline under it');
});

test('the tagline is a translated string, in every language file', () => {
  const dir = path.join(root, 'imports/i18n/data');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.i18n.json'));
  const missing = files.filter(f => {
    const doc = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    return typeof doc['jalor-tagline'] !== 'string' || !doc['jalor-tagline'];
  });
  assert.deepStrictEqual(missing, [], 'these have no jalor-tagline');
  const fr = JSON.parse(read('imports/i18n/data/fr.i18n.json'));
  assert.strictEqual(fr['jalor-tagline'], 'Gestion collaborative des tâches');
});

test('the marks are Jalor, and they are generated from one drawing', () => {
  for (const f of ['public/jalor-mark.svg', 'public/jalor-logo.svg',
    'public/jalor-logo-header.svg', 'public/jalor-pinned-tab.svg']) {
    assert.ok(exists(f), `${f} is missing`);
  }
  // The generator rasterises the mark; the two must describe the same bars or
  // the favicon stops being the logo.
  const svg = read('public/jalor-mark.svg');
  const gen = read('scripts/generate-jalor-icons.mjs');
  const bars = [...gen.matchAll(/\{ x: (\d+), y: (\d+), w: (\d+), h: (\d+) \}/g)]
    .map(m => m.slice(1).map(Number));
  assert.strictEqual(bars.length, 3, 'three bars - the jalons');
  for (const [x, y, w, h] of bars) {
    const rect = new RegExp(`<rect x="${x}" y="${y}" width="${w}" height="${h}"`);
    assert.ok(rect.test(svg), `public/jalor-mark.svg has no bar at ${x},${y} ${w}x${h}`);
  }
  // Bleu France, the DSFR's primary, in both.
  assert.ok(svg.includes('#000091'));
  assert.ok(gen.includes('0x91'), 'the generator paints the same blue');
});

test('the generated icon set is there and is real PNG / ICO', () => {
  const icons = ['favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png',
    'android-chrome-192x192.png', 'android-chrome-512x512.png', 'maskable_icon.png',
    'monochrome-icon-512x512.png', 'mstile-150x150.png'];
  for (const name of icons) {
    const buf = fs.readFileSync(path.join(root, 'public', name));
    assert.strictEqual(buf.slice(0, 8).toString('hex'), '89504e470d0a1a0a', `${name} is not a PNG`);
    assert.ok(buf.readUInt32BE(16) > 0 && buf.readUInt32BE(20) > 0, `${name} has no size`);
  }
  const ico = fs.readFileSync(path.join(root, 'public/favicon.ico'));
  assert.strictEqual(ico.readUInt16LE(0), 0);
  assert.strictEqual(ico.readUInt16LE(2), 1, 'favicon.ico is an icon file');
  assert.ok(ico.readUInt16LE(4) >= 3, 'with at least three sizes in it');
});

test('the head, the manifest and the header bar all say Jalor', () => {
  const head = read('imports/lib/customHeadDefaults.js');
  assert.ok(/content="Jalor"/.test(head), 'apple-mobile-web-app-title / application-name');
  assert.ok(/"name": "Jalor"/.test(head) && /"short_name": "Jalor"/.test(head));
  assert.ok(/content="#000091"/.test(head), 'theme-color is Bleu France');
  assert.ok(!/wekan-logo/.test(head), 'the manifest icon is no longer the WeKan logo');

  const manifest = JSON.parse(read('public/site.webmanifest.default'));
  assert.strictEqual(manifest.name, 'Jalor');
  assert.strictEqual(manifest.theme_color, '#000091');
  assert.strictEqual(manifest.lang, 'fr');

  const layouts = read('client/components/main/layouts.jade');
  assert.ok(/content="Jalor"/.test(layouts));
  assert.ok(!/wekan-logo\.svg/.test(layouts), 'the sign-in page no longer shows the WeKan logo');

  const header = read('client/components/main/header.jade');
  assert.ok(/jalor-logo-header\.svg/.test(header), 'the header bar shows the Jalor mark');

  assert.ok(/'Jalor'/.test(read('server/lib/customHeadRender.js')),
    'and the server-rendered <title> falls back to Jalor');
});

// --- attribution -------------------------------------------------------------

test('WeKan keeps its licence and its copyright', () => {
  const licence = read('LICENSE');
  assert.ok(/MIT/i.test(licence), 'the MIT licence is still here');
  // The copyright line, verbatim. The MIT licence requires it to travel with
  // every copy, and a rebranded fork is exactly where it gets lost.
  assert.ok(/Copyright \(c\) Lauri Ojansivu/.test(licence),
    "the upstream author's copyright notice must stay exactly as it is");
  assert.ok(/The above copyright notice and this permission notice shall be included/
    .test(licence), 'and the condition that requires it');
});

test('the README presents Jalor as a fork, and says whose', () => {
  const readme = read('README.md');
  assert.ok(/^# Jalor/m.test(readme), 'it presents Jalor');
  assert.ok(/WeKan/.test(readme) && /fork/i.test(readme),
    'and says it is a fork of WeKan');
  assert.ok(/github\.com\/wekan\/wekan/.test(readme), 'with a link upstream');
  assert.ok(/MIT/.test(readme), 'and names the licence');
});

test('nothing renamed WeKan out of the places it is a fact, not a brand', () => {
  // A blanket search-and-replace is the failure this guards against. These are
  // references to the upstream project or to its data formats, and they have to
  // survive rebranding.
  assert.ok(/wekan/.test(read('package.json')), 'the repository metadata still points upstream');
  assert.ok(fs.existsSync(path.join(root, 'imports/i18n/data/en.i18n.json')));
  const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
  assert.ok(Object.keys(en).some(k => k.includes('wekan')),
    'the import feature still knows about WeKan export files');
  assert.ok(read('CHANGELOG.md').includes('WeKan'), "upstream's changelog is kept");
});

console.log(`\njalorIdentity: ${passed} tests passed`);
