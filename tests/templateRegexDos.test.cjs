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
  // Concatenated, not a template literal: `\${` there is an escape CodeQL
  // reads as a useless regular-expression escape (code scanning alert #548).
  const long = '${"regex":"' + 'a'.repeat(MAX_TEMPLATE_REGEX + 1) + '","replace":""}';
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

test('negative: no template literal escapes ${ (CodeQL #548, js/useless-regexp-character-escape)', () => {
  // Parsed, not grepped: only a real template literal's own text counts, so a
  // comment or a string that merely mentions the shape is not a hit.
  const fs = require('node:fs');
  const path = require('node:path');
  const acorn = require('acorn');
  const walkAst = require('acorn-walk');
  const root = path.join(__dirname, '..');
  const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (['node_modules', '_build', '.build', 'playwright-report', 'test-results'].includes(entry.name)) return [];
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : /\.(c|m)?js$/.test(entry.name) ? [full] : [];
  });
  const offenders = [];
  for (const file of ['client', 'models', 'server', 'imports', 'config', 'tests', 'releases'].flatMap(dir => walk(path.join(root, dir)))) {
    const source = fs.readFileSync(file, 'utf8');
    if (!source.includes('\\${')) continue;
    let ast;
    try {
      ast = acorn.parse(source, { ecmaVersion: 'latest', sourceType: 'module', allowHashBang: true,
        allowReturnOutsideFunction: true, allowAwaitOutsideFunction: true });
    } catch { continue; }
    // Only where the text is regex material: a template directive, a RegExp,
    // a replace/match, a regex literal. A shell script quoted in a template
    // literal needs `\${` and is not a regular expression.
    const regexish = raw => /regex|RegExp|\.replace\(|\.match\(|\/[gimsuy]*,/.test(raw);
    walkAst.full(ast, node => {
      if (node.type === 'TemplateElement' && node.value.raw.includes('\\${') && regexish(node.value.raw)) {
        offenders.push(path.relative(root, file));
      }
    });
  }
  assert.deepEqual(offenders, []);
});
