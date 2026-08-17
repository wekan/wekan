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

console.log(`\nnoIncompleteRegExpEscaping: ${passed} tests passed`);
