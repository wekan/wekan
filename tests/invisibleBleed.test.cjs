'use strict';

// Guard: InvisibleBleed (2023) - an HTML comment in a card description was
// invisible when rendered, so text could be hidden from readers. The fix
// makes the comment markers visible. It used String.replace with a string
// pattern, which replaces only the FIRST occurrence, so a second comment
// stayed hidden (found 2026-10-02).
// Run: node tests/invisibleBleed.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');
const src = read('packages/markdown/src/template-integration.js');

test('every HTML comment is made visible, not only the first', () => {
  const line = src.split('\n').find(l => l.includes('const renderedMarkdown = Markdown.render(textWithCardLinks)'));
  assert.ok(line, 'the render line');
  const chain = line.slice(line.indexOf(')') + 1, line.lastIndexOf(';'));
  // eslint-disable-next-line no-new-func
  const apply = new Function('html', `return html${chain};`);
  const out = apply('<p>shown</p><!-- first --><p>more</p><!-- SECRET hidden instruction -->');
  assert.equal((out.match(/&lt;!--/g) || []).length, 2);
  assert.equal((out.match(/--&gt;/g) || []).length, 2);
  assert.doesNotMatch(out, /<!--/, 'no comment is left for the browser to hide');
});

test('negative: no first-only comment replacement anywhere', () => {
  const walk = dir => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap(e => {
    if (e.name === 'node_modules' || e.name.startsWith('_build') || e.name.startsWith('.') || e.name === 'tests') return [];
    const rel = `${dir}/${e.name}`;
    return e.isDirectory() ? walk(rel) : (/\.(c|m)?js$/.test(rel) ? [rel] : []);
  });
  const offenders = ['client', 'packages/markdown', 'models', 'server', 'imports'].flatMap(walk)
    .filter(file => /\.replace\(\s*(['"])(<!--|-->)\1/.test(read(file)));
  assert.deepEqual(offenders, []);
});
