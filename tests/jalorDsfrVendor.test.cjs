'use strict';

// The vendored DSFR: what is copied, that it is copied UNCHANGED apart from the
// url() rewrite, and that the build knows not to resolve those urls.
//
// The point of vendoring rather than reimplementing is that "is this the real
// DSFR?" has a yes/no answer. This test is that answer: it re-reads the
// installed @gouvfr/dsfr package and holds the copy against it.
//
// Run: node tests/jalorDsfrVendor.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(root, rel));

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('jalorDsfrVendor:');

const pkgVersion = JSON.parse(read('package.json')).devDependencies['@gouvfr/dsfr'];
const distDir = path.join(root, 'node_modules/@gouvfr/dsfr/dist');
const haveDist = fs.existsSync(distDir);

test('the DSFR is a declared dependency, pinned to an exact version', () => {
  assert.ok(pkgVersion, 'package.json must declare @gouvfr/dsfr');
  assert.ok(/^\d+\.\d+\.\d+$/.test(pkgVersion),
    `pinned exactly, so the vendored copy and the package cannot drift: got ${pkgVersion}`);
  assert.strictEqual(read('public/dsfr/VERSION').split('\n')[0].trim(), pkgVersion,
    'public/dsfr/VERSION must be the version that was vendored');
});

test('its terms of use are accepted in the repository, not by an env var', () => {
  // @gouvfr/dsfr refuses to install without this. Keeping it as a FILE means
  // the acceptance is reviewable and travels with the checkout - including into
  // the Docker build, which would otherwise fail at npm install.
  assert.ok(exists('.dsfr.yml'), '.dsfr.yml records the acceptance');
  const yml = read('.dsfr.yml');
  assert.ok(/^\s*accept-license\s*:/m.test(yml), 'it declares accept-license');
  // The restriction is the part somebody deploying this has to know about.
  assert.ok(/restreint|RESTREINT/.test(yml),
    'and it says, in the file, that the DSFR is restricted-use');
  assert.ok(read('README.md').includes('DSFR'),
    'and the README mentions the DSFR');
  assert.ok(exists('docs/Jalor/DSFR.md'), 'with the detail in docs/Jalor/DSFR.md');
});

test('the vendored stylesheets are the published ones, url() apart', () => {
  if (!haveDist) {
    console.log('    (skipped: node_modules/@gouvfr/dsfr not installed)');
    return;
  }
  const published = fs.readFileSync(path.join(distDir, 'dsfr.min.css'), 'utf8');
  const vendored = read('client/jalor/vendor/dsfr.min.css');
  // Remove the banner the script inserts (after the @charset, which has to stay
  // first), then undo the only rewrite it makes: relative asset paths.
  const restored = vendored
    .replace(/\/\* DSFR [\s\S]*?\*\/\n/, '')
    .replace(/url\((["']?)\/dsfr\//g, 'url($1');
  // A plain strictEqual on 720 KB prints both files on failure. Compare, then
  // report the first difference.
  if (restored !== published) {
    let i = 0;
    while (i < restored.length && restored[i] === published[i]) i += 1;
    assert.fail('client/jalor/vendor/dsfr.min.css is not the published file with its '
      + 'asset paths repointed - re-run: node scripts/vendor-dsfr.mjs\n'
      + `  first difference at byte ${i}:\n`
      + `    vendored:  ...${restored.slice(Math.max(0, i - 40), i + 40)}...\n`
      + `    published: ...${published.slice(Math.max(0, i - 40), i + 40)}...`);
  }
  assert.ok(vendored.startsWith('@charset'),
    '@charset must stay the first thing in the file');
});

test('nothing in the vendored sheets points anywhere but /dsfr/', () => {
  for (const f of ['dsfr.min.css', 'dsfr.icons.css']) {
    const css = read(`client/jalor/vendor/${f}`);
    for (const m of css.matchAll(/url\(([^)]+)\)/g)) {
      const url = m[1].replace(/^["']|["']$/g, '');
      if (url.startsWith('data:')) continue;
      assert.ok(url.startsWith('/dsfr/'),
        `${f}: ${url.slice(0, 60)} must be served from /dsfr/, not resolved as a module`);
    }
  }
});

test('every asset those urls name is actually in public/dsfr', () => {
  const missing = [];
  for (const f of ['dsfr.min.css', 'dsfr.icons.css']) {
    for (const m of read(`client/jalor/vendor/${f}`).matchAll(/url\((\/dsfr\/[^)"']+)\)/g)) {
      const rel = `public${m[1]}`;
      if (!exists(rel)) missing.push(rel);
    }
  }
  assert.deepStrictEqual([...new Set(missing)], [],
    'the stylesheets ask for files that are not there - re-run: node scripts/vendor-dsfr.mjs');
});

test('Marianne is there, and it is what the layer asks for', () => {
  assert.ok(exists('public/dsfr/fonts/Marianne-Regular.woff2'));
  assert.ok(exists('public/dsfr/fonts/Marianne-Bold.woff2'));
  assert.ok(/--jalor-font:\s*"Marianne"/.test(read('client/jalor/jalor-tokens.css')),
    'the Jalor font token names Marianne first');
  assert.ok(/font-family:\s*var\(--jalor-font\)/.test(read('client/jalor/jalor-base.css')),
    'and the base layer applies it to body and to the form controls');
});

test('the licence travels with the copy', () => {
  assert.ok(exists('public/dsfr/DSFR-LICENSE.md'), 'the DSFR licence is vendored beside it');
  assert.ok(exists('public/dsfr/DSFR-CGU.md'), 'and its terms of use');
  // The upstream project's own licence is untouched: this fork owes it.
  assert.ok(read('LICENSE').length > 0, 'LICENSE is still there');
});

test('rspack is told not to resolve the vendored urls', () => {
  // Without this, css-loader resolves a root-relative url() through
  // resolve.roots and the build dies looking for <project>/dsfr/fonts/...
  const cfg = read('rspack.config.js');
  assert.ok(/client\/jalor\/vendor/.test(cfg),
    'rspack.config.js must carry a rule for client/jalor/vendor');
  assert.ok(/url:\s*false/.test(cfg), 'with css-loader url handling off');
  // ...and only for those. Everything else keeps the default.
  assert.ok(/exclude:\s*path\.resolve\(__dirname, 'client\/jalor\/vendor'\)/.test(cfg),
    'and a second rule excluding them, so the rest of the CSS is unaffected');
});

test('the vendored tree is generated, and says so', () => {
  assert.ok(exists('scripts/vendor-dsfr.mjs'), 'the script that writes it');
  for (const f of ['dsfr.min.css', 'dsfr.icons.css']) {
    const head = read(`client/jalor/vendor/${f}`).slice(0, 600);
    assert.ok(/DO NOT EDIT/.test(head) && /vendor-dsfr\.mjs/.test(head),
      `${f} must open with a banner naming the script that writes it`);
  }
  assert.ok(/re-run the script/.test(read('public/dsfr/VERSION')));
});

console.log(`\njalorDsfrVendor: ${passed} tests passed`);
