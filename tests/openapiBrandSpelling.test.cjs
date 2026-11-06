'use strict';

// The name is WeKan in the REST API documentation.
// Run: node tests/openapiBrandSpelling.test.cjs
//
// The API pages on wekan.fi (api/v<version>/index.html) are Redoc pages built
// from public/api/wekan.yml, which openapi/generate_openapi.py writes from its
// own header text and the models' JSDoc. Those said "Wekan REST API",
// "extend Wekan", "a production Wekan server" and "in the Wekan board", so
// every release published API pages that wekan.fi's
// tests/brand-spelling.test.cjs rejects (v12.95, v12.96 and v12.97 did). This
// checks every source of that text, and the generated file.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

// The same shape wekan.fi's check uses: the name, not part of an address, a
// path, a word or a flag.
const WRONG = /(?<![\w./@:#%&?=+-])(?:Wekan|WEKAN)(?!\w|\.\w|[/@:])/g;

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

function offending(text) {
  return text.split('\n')
    .map((line, i) => ({ line, n: i + 1 }))
    .filter(({ line }) => { WRONG.lastIndex = 0; return WRONG.test(line); });
}

test('the pattern finds the wrong spellings and leaves addresses alone', () => {
  for (const bad of ['title: Wekan REST API', 'extend WEKAN with ease']) {
    assert.strictEqual(offending(bad).length, 1, bad);
  }
  for (const ok of ['title: WeKan REST API', 'https://github.com/wekan/wekan',
    'public/api/wekan.yml', 'snap install wekan', 'Wekan/models']) {
    assert.strictEqual(offending(ok).length, 0, ok);
  }
});

test('the generated public/api/wekan.yml spells the name WeKan', () => {
  const hits = offending(read('public/api/wekan.yml'));
  assert.deepStrictEqual(hits.map(h => `wekan.yml:${h.n}: ${h.line.trim()}`), []);
  assert.match(read('public/api/wekan.yml'), /^ {2}title: WeKan REST API$/m);
});

test('the built public/api/wekan.html spells the name WeKan', () => {
  // releases/release-website.sh copies this file to wekan.fi as
  // api/v<version>/index.html, so what it says is what the site shows. The
  // v12.99 version bump rebuilt it before the generator was fixed. Redoc's
  // data-text attribute and the search index are not shown text; the visible
  // text and the JSON Redoc rebuilds the page from are.
  const html = read('public/api/wekan.html')
    .replace(/data-text="[^"]*"/g, '')
    .replace(/"searchIndex":\{[\s\S]*$/, '');
  const hits = [];
  WRONG.lastIndex = 0;
  for (let m; (m = WRONG.exec(html));) {
    hits.push(html.slice(Math.max(0, m.index - 30), m.index + 30));
  }
  assert.deepStrictEqual(hits, []);
});

test('the generator header spells the name WeKan', () => {
  const generator = read('openapi/generate_openapi.py');
  const start = generator.indexOf("print('''swagger: '2.0'");
  assert.notStrictEqual(start, -1, 'generator header not found');
  const header = generator.slice(start, generator.indexOf("'''", start + 10));
  assert.deepStrictEqual(offending(header).map(h => h.line.trim()), []);
  assert.match(header, /title: WeKan REST API/);
});

test('no model JSDoc the generator reads spells the name Wekan', () => {
  const found = [];
  for (const dir of ['models', 'server/models']) {
    const abs = path.join(repoRoot, dir);
    if (!fs.existsSync(abs)) continue;
    for (const file of fs.readdirSync(abs).filter(f => f.endsWith('.js'))) {
      const text = fs.readFileSync(path.join(abs, file), 'utf8');
      // Only JSDoc blocks: /** ... */ is what becomes an API description.
      for (const block of text.match(/\/\*\*[\s\S]*?\*\//g) || []) {
        for (const h of offending(block)) found.push(`${dir}/${file}: ${h.line.trim()}`);
      }
    }
  }
  assert.deepStrictEqual(found, []);
});

console.log(`\n${passed} passed`);
