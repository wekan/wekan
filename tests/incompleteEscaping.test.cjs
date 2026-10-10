'use strict';

// CodeQL js/incomplete-sanitization: a backslash escape of some characters
// that leaves the backslash itself unescaped. A "\" already in the text then
// cancels the escape added after it, and the character comes through as
// syntax. WeKan had it in models/lib/planeFormat.js (alert 555, a Markdown
// link title) and tests/scrumViewHelpers.test.cjs (alert 560, a helper name
// put into a regular expression with only "$" escaped).
//
// Every `.replace(/X/g, '\\X')` that backslash-escapes a character other than
// the backslash must sit in an expression that also escapes the backslash -
// `.replace(/\\/g, '\\\\')` beside it, or a character class holding `\\`.
// Run: node tests/incompleteEscaping.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

// A single-character (or escaped single-character) pattern replaced by a
// string that starts with an escaped backslash.
const SINGLE_ESCAPE = /\.replace\(\/(\\?[^/[\\]|\\[^\\])\/g, (['"])\\\\/g;
// What makes it complete: the backslash escaped in the same statement.
const ESCAPES_BACKSLASH = /\.replace\(\/\\\\\/g, (['"])\\\\\\\\\1\)|\/\[[^\]/]*\\\\[^\]/]*\]\/g/;

function findings(source) {
  const lines = source.split('\n');
  const out = [];
  lines.forEach((line, index) => {
    if (/^\s*(\/\/|\*)/.test(line)) return;
    for (const match of line.matchAll(SINGLE_ESCAPE)) {
      if (match[1] === '\\\\') continue;
      // Sample code quoted in a test ("title.replace(...)") is text, not code.
      const before = line.slice(0, match.index);
      // Inside a template literal it is text too - unless it is in a ${...}
      // interpolation, which is code (the alert 560 line was).
      const inTemplate = (before.match(/`/g) || []).length % 2 === 1;
      const tail = before.slice(before.lastIndexOf('`') + 1);
      const interpolated = inTemplate && tail.lastIndexOf('${') > tail.lastIndexOf('}');
      if ((before.match(/(^|[^\\])"/g) || []).length % 2 === 1 || (inTemplate && !interpolated)) continue;
      // The statement: this line and the chained lines around it.
      const near = lines.slice(Math.max(0, index - 3), index + 4).join('\n');
      if (!ESCAPES_BACKSLASH.test(near)) out.push(`${index + 1}: ${line.trim()}`);
    }
  });
  return out;
}

console.log('incompleteEscaping:');

test('the shape is found, and a complete escape is not (negative and positive samples)', () => {
  assert.equal(findings("const x = name.replace(/\\$/g, '\\\\$');").length, 1, 'the scrumViewHelpers line');
  assert.equal(findings("title.replace(/]/g, '\\\\]');").length, 1, 'a title escape without backslash');
  assert.deepEqual(findings("title.replace(/\\\\/g, '\\\\\\\\').replace(/]/g, '\\\\]');"), [], 'backslash first');
  assert.deepEqual(findings([
    'return String(value)',
    "  .replace(/\\\\/g, '\\\\\\\\')",
    "  .replace(/;/g, '\\\\;')",
  ].join('\n')), [], 'a chain over several lines');
  assert.deepEqual(findings("text.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')"), [], 'a class with the backslash');
  assert.deepEqual(findings('const sample = "title.replace(/]/g, \'\\\\]\')";'), [], 'quoted sample code is not code');
  assert.equal(findings("new RegExp(`(^|x)${helper.replace(/\\$/g, '\\\\$')}`)").length, 1,
    'code in a template literal interpolation is code (alert 560)');
});

test('no WeKan source or test escapes characters but not the backslash', () => {
  const files = execFileSync('git', ['ls-files', 'models', 'server', 'client', 'imports', 'config', 'tests'], {
    cwd: ROOT, encoding: 'utf8',
  }).split('\n').filter(file => /\.(c|m)?js$/.test(file) && !file.includes('/node_modules/')
    && file !== 'tests/incompleteEscaping.test.cjs' && fs.existsSync(path.join(ROOT, file)));
  const offenders = [];
  for (const file of files) {
    for (const finding of findings(fs.readFileSync(path.join(ROOT, file), 'utf8'))) offenders.push(`${file}:${finding}`);
  }
  assert.deepEqual(offenders, []);
});

console.log(`\nincompleteEscaping: ${passed} tests passed`);
