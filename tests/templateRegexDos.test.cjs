'use strict';

// Guard: ReDoS in string-template custom fields (2026-10-02). A board member
// writes the ${"regex":...} format; another writes the value. On the server -
// rule e-mails format card details - a catastrophic pattern stopped the one
// event loop for every user. Pattern and value are capped, and the server
// runs the regex under a time limit.
// Run: node tests/templateRegexDos.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const { formatStringTemplate, MAX_TEMPLATE_REGEX } = require('../models/lib/customFieldStringTemplate');
const { boundedRegexReplace } = require('../server/lib/boundedRegex');
const evil = '${"regex":"(a+)+$","replace":""}';

test('the reported pattern returns within the time limit on the server', () => {
  const started = Date.now();
  const out = formatStringTemplate(['a'.repeat(40) + '!'], evil, '', {}, { regexReplace: boundedRegexReplace });
  assert.ok(Date.now() - started < 2000, `took ${Date.now() - started} ms`);
  assert.equal(out, evil, 'the token stays visible when the regex is stopped');
});

test('ordinary templates still format (negative)', () => {
  assert.equal(formatStringTemplate(['AB-12'], '${"regex":"-","replace":" "}', '', {}, { regexReplace: boundedRegexReplace }), 'AB 12');
  assert.equal(formatStringTemplate(['x'], '%{value} on %{card.title}', '', { 'card.title': 'Card' }), 'x on Card');
});

test('an over-long pattern or value is not run at all', () => {
  const long = `\${"regex":"${'a'.repeat(MAX_TEMPLATE_REGEX + 1)}","replace":""}`;
  let ran = false;
  formatStringTemplate(['a'], long, '', {}, { regexReplace: () => { ran = true; return ''; } });
  formatStringTemplate(['a'.repeat(10001)], '${"regex":"a","replace":""}', '', {}, { regexReplace: () => { ran = true; return ''; } });
  assert.equal(ran, false);
});

test('negative: the server formats templates only with the bounded runner', () => {
  const walk = dir => fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap(e => {
    if (e.name === 'tests' || e.name.startsWith('_build') || e.name === 'node_modules') return [];
    const rel = `${dir}/${e.name}`;
    return e.isDirectory() ? walk(rel) : (rel.endsWith('.js') ? [rel] : []);
  });
  for (const file of walk('server')) {
    const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const calls = (src.match(/formatStringTemplate\(/g) || []).length;
    if (!calls) continue;
    assert.equal((src.match(/regexReplace: boundedRegexReplace/g) || []).length, calls, file);
  }
});
