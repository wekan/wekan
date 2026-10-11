'use strict';

// RouteBleed: GitHub CodeQL alert #434 found a value interpolated into a RegExp
// after only `/` was escaped. A backslash can neutralize that escape, and every other
// metacharacter remains active. This guard catches the whole source shape: a
// replace performed inline in a dynamically-built regular expression is either
// the complete, established escape or it must be replaced with literal matching.
// Run: node tests/noIncompleteRegExpEscaping.test.cjs

const assert = require('assert');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const JS = /\.(?:cjs|mjs|js)$/;
const SLASH_ONLY_ESCAPE = ".replace(/\\//g, '\\\\/')";

function sourceFiles() {
  return execFileSync('git', ['ls-files', '-z'], { cwd: ROOT })
    .toString()
    .split('\0')
    .filter(file => JS.test(file))
    .map(file => path.join(ROOT, file));
}

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

function incompleteInlineEscapes(source) {
  return source.split('\n').flatMap((line, index) => {
    return line.includes(SLASH_ONLY_ESCAPE) ? [index + 1] : [];
  });
}

test('no inline partial escape reaches a dynamic RegExp', () => {
  const offenders = [];
  for (const file of sourceFiles()) {
    if (file === __filename) continue;
    if (!fs.existsSync(file)) continue;
    for (const line of incompleteInlineEscapes(fs.readFileSync(file, 'utf8'))) {
      offenders.push(`${path.relative(ROOT, file)}:${line}`);
    }
  }
  assert.deepStrictEqual(offenders, [],
    `replace partial escaping or use literal matching:\n${offenders.join('\n')}`);
});

test('negative: the guard catches slash-only escaping with a backslash gap', () => {
  const bad = "const r = new RegExp(`${p.replace(/\\//g, '\\\\/')}`);";
  assert.deepStrictEqual(incompleteInlineEscapes(bad), [1]);
});

test('the established full metacharacter escape remains allowed', () => {
  const good = "const r = new RegExp(`${value.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}`);";
  assert.deepStrictEqual(incompleteInlineEscapes(good), []);
});

// GitHub CodeQL alerts #563 (js/incomplete-sanitization) and the test-file
// copies of it: `.replace('/', '%2F')` or `.replace('.', '\\.')` with a STRING
// pattern replaces only the first occurrence, so `@a/b/c` kept its second `/`
// and `'g++'.replace('+', '\\+')` left a live `+` that let `- g+` pass a guard.
// An escape is a regex with the g flag, the complete escapeRegExp, or no
// escaping at all (literal comparison). Minified vendor copies are not ours.
const FIRST_ONLY_ESCAPE = /\.replace\(\s*(['"])((?:\\.|(?!\1)[^\\]){1,4})\1\s*,\s*(['"`])(?:\\\\|%[0-9A-Fa-f]{2}|&#?\w+;)/;

// Files that quote the shape on purpose, as a sample for their own guard.
const FIRST_ONLY_SAMPLES = new Set([
  'tests/noIdentityReplacement.test.cjs', // CodeQL's own example, as a string
]);

function firstOnlyEscapes(source) {
  return source.split('\n').flatMap((line, index) => {
    if (/^\s*(?:\/\/|\*)/.test(line)) return [];
    return FIRST_ONLY_ESCAPE.test(line) ? [index + 1] : [];
  });
}

test('no string-pattern replace performs an escape (it would escape only the first one)', () => {
  const offenders = [];
  for (const file of sourceFiles()) {
    if (file === __filename || /\.min\.js$/.test(file)) continue;
    if (FIRST_ONLY_SAMPLES.has(path.relative(ROOT, file).split(path.sep).join('/'))) continue;
    if (!fs.existsSync(file)) continue;
    for (const line of firstOnlyEscapes(fs.readFileSync(file, 'utf8'))) {
      offenders.push(`${path.relative(ROOT, file)}:${line}`);
    }
  }
  assert.deepStrictEqual(offenders, [],
    `use a /g regex, the complete escapeRegExp, or literal matching:\n${offenders.join('\n')}`);
});

test('negative: the guard catches each first-only escape it was written for', () => {
  for (const bad of [
    "fetch(`${REGISTRY}/${name.replace('/', '%2F')}/${version}`);",
    "new RegExp(`${file.replace('.', '\\\\.')}`);",
    "new RegExp(term.replace('/', '\\\\/'));",
    'new RegExp(`- ${pkg.replace("+", "\\\\+")}`);',
    "html.replace('<', '&lt;');",
  ]) {
    assert.deepStrictEqual(firstOnlyEscapes(bad), [1], bad);
  }
  for (const good of [
    "name.replace(/\\//g, '%2F');",
    "parseFloat(v.replace(',', '.'));",
    "iso.replace('T', ' ');",
    "text.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&');",
  ]) {
    assert.deepStrictEqual(firstOnlyEscapes(good), [], good);
  }
});

console.log(`\nnoIncompleteRegExpEscaping: ${passed} tests passed`);
