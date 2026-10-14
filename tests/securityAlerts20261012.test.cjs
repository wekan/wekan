'use strict';

// GitHub CodeQL alerts 565-568, raised on the merge of #6761. Each is pinned as
// a SHAPE across the tree, not only at the line that was reported.
//   565 js/redos: releases/prune-unreachable-npm.mjs - tests/pruneUnreachableNpm.test.cjs
//   566 js/bad-tag-filter: a case-sensitive <script> pattern in a test
//   569 js/bad-tag-filter: an end-tag pattern `<\/script\s*>` that misses
//       `</script foo="bar">`, which a browser still accepts as the end tag
//   567, 568 js/bad-code-sanitization: file paths spliced into generated code
//       with JSON.stringify, in a test and in the i18n loader the test drives
//   584 js/bad-tag-filter: `/<img|<script|<b>/` in accountEmailHtml.test.cjs -
//       the 566 shape again; that test now checks an allow-list of tags
//   585 js/incomplete-hostname-regexp: an address made into a RegExp in the
//       same test; pinned as any regex literal with an unescaped `.` in a host
// Run: node tests/securityAlerts20261012.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const acorn = require('acorn');
const walk = require('acorn-walk');

const ROOT = path.join(__dirname, '..');
const loader = require('../npm-packages/meteor-i18n-server-loader');

const VENDORED = /\.min\.js$|^packages\/wekan-(?:fontawesome|fullcalendar)\/|^npm-packages\/[^/]+\/(?:dist|lib|test)\//;
const sources = () => execFileSync('git', ['ls-files', '-z'], { cwd: ROOT }).toString().split('\0')
  .filter((f) => /\.(?:c|m)?js$/.test(f) && !VENDORED.test(f) && fs.existsSync(path.join(ROOT, f)));

function regexLiterals(file) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  if (!/script|iframe|style|textarea|title/i.test(src)) return [];
  let ast;
  try {
    ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'module', allowHashBang: true,
      allowReturnOutsideFunction: true, allowAwaitOutsideFunction: true, locations: true });
  } catch (e) { return []; }
  const found = [];
  walk.full(ast, (n) => { if (n.regex) found.push({ ...n.regex, line: n.loc.start.line }); });
  return found;
}

// A pattern that looks for an executable or hiding tag must match it in any
// case: HTML tag names are case-insensitive, so <SCRIPT> is a script.
const TAG = /<\\?\/?(?:script|noscript|iframe)\b/i;
const caseSensitiveTag = (re) => TAG.test(re.pattern) && !re.flags.includes('i');

test('566: no pattern for a script, noscript or iframe tag is case-sensitive', () => {
  const offenders = [];
  for (const file of sources()) {
    for (const re of regexLiterals(file)) if (caseSensitiveTag(re)) offenders.push(`${file}:${re.line} /${re.pattern}/${re.flags}`);
  }
  assert.deepEqual(offenders, []);
  assert.equal(caseSensitiveTag({ pattern: '<script>([\\s\\S]*?)<\\/script>', flags: '' }), true, 'the reported pattern is caught');
  assert.equal(caseSensitiveTag({ pattern: '<script\\b[^>]*>([\\s\\S]*?)<\\/script\\b[^>]*>', flags: 'gi' }), false);
  assert.equal(caseSensitiveTag({ pattern: '<table|<style', flags: '' }), false, 'other tags are not this rule');
});

// An END tag is ended by the first `>`, whatever sits before it: browsers take
// `</script foo="bar">` and `</script\t\n bar>` as the end of the script (a parse
// error, but rendered). So a pattern for one must allow anything but `>` up to
// it - `<\/script\b[^>]*>` - never `<\/script>` or `<\/script\s*>`.
const END_TAG = /<\\\/(?:script|noscript|style|iframe|textarea|title)(?!\\b\[\^>\]\*>|\[\^>\]\*>)/i;
const looseEndTag = (re) => END_TAG.test(re.pattern);

test('569: every end-tag pattern for script, noscript, style, iframe, textarea or title allows attributes', () => {
  const offenders = [];
  for (const file of sources()) {
    for (const re of regexLiterals(file)) if (looseEndTag(re)) offenders.push(`${file}:${re.line} /${re.pattern}/${re.flags}`);
  }
  assert.deepEqual(offenders, []);
  assert.equal(looseEndTag({ pattern: '<script\\b[^>]*>([\\s\\S]*?)<\\/script\\s*>' }), true, 'the reported pattern is caught');
  assert.equal(looseEndTag({ pattern: '<style[^>]*>.*?<\\/style>' }), true, 'and the bare form');
  assert.equal(looseEndTag({ pattern: '<script\\b[^>]*>([\\s\\S]*?)<\\/script\\b[^>]*>' }), false);
  assert.equal(looseEndTag({ pattern: '<\\/noscript[^>]*>' }), false);
});

test('569: the fixed end-tag pattern finds a script whose end tag carries junk (positive)', () => {
  const re = /<script\b[^>]*>([\s\S]*?)<\/script\b[^>]*>/gi;
  for (const end of ['</script>', '</script >', '</SCRIPT>', '</script foo="bar">', '</script\t\n bar>']) {
    const m = [...`<p>x</p><script>alert(1)${end}<p>y</p>`.matchAll(re)];
    assert.equal(m.length, 1, end);
    assert.equal(m[0][1], 'alert(1)', end);
  }
});

test('567/568: the i18n loader writes a literal that stays one literal', () => {
  const lit = loader.jsStringLiteral;
  for (const value of ['build-assets/i18n/fr.0123456789abcdef0123.json', '</script><script>alert(1)</script>',
    'line\u2028separator\u2029', 'quote" back\\slash']) {
    const out = lit(value);
    assert.doesNotMatch(out, /[<>\u2028\u2029]|\/script/i, out);
    assert.equal(vm.runInNewContext(out), value, 'and evaluates back to the same string');
  }
});

test('567/568: the loader refuses a file name that is not a dictionary name (negative)', () => {
  const run = (resourcePath) => loader.call({ resourcePath, emitFile() {} }, '{"a":"b"}');
  assert.match(run('/x/imports/i18n/data/pt-BR.i18n.json'), /Assets\.absoluteFilePath\("build-assets\\u002fi18n\\u002fpt-BR\.i18n\.[0-9a-f]{20}\.json"\)/);
  for (const bad of ["fr');process.exit(1);('.i18n.json", 'fr".i18n.json', 'f r.i18n.json', 'fr\u2028.i18n.json']) {
    assert.throws(() => run(`/x/${bad}`), /refusing translation file name/, bad);
  }
});

test('567/568: no source splices JSON.stringify into an import, require or asset path', () => {
  const shape = /(?:import|require|absoluteFilePath)\(\$\{JSON\.stringify\(/;
  const offenders = sources().filter((f) => shape.test(fs.readFileSync(path.join(ROOT, f), 'utf8'))
    && f !== 'tests/securityAlerts20261012.test.cjs');
  assert.deepEqual(offenders, [], 'pass the value as an argument or keep the generated source constant');
  assert.ok(shape.test('`exports.fr = () => import(${JSON.stringify(french)});`'), 'the reported shape is caught');
});

// 585: a dot in a regex is any character, so `/https:\/\/idp.example\//` also
// matches `idpXexample`. A host name in a pattern has its dots escaped.
const HOST_DOT = /[A-Za-z0-9-](?<!\\)\.(?:com|org|net|io|fi|example|test|local)(?![A-Za-z0-9])/;
function allRegexLiterals(file) {
  const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
  if (!HOST_DOT.test(src)) return [];
  let ast;
  try {
    ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'module', allowHashBang: true,
      allowReturnOutsideFunction: true, allowAwaitOutsideFunction: true, locations: true });
  } catch (e) { return []; }
  const found = [];
  walk.full(ast, (n) => { if (n.regex) found.push({ ...n.regex, line: n.loc.start.line }); });
  return found;
}

test('585: no regex literal leaves a host name\'s dot unescaped', () => {
  const offenders = [];
  for (const file of sources()) {
    for (const re of allRegexLiterals(file)) if (HOST_DOT.test(re.pattern)) offenders.push(`${file}:${re.line} /${re.pattern}/`);
  }
  assert.deepEqual(offenders, [], 'escape it: example\\.com');
  assert.ok(HOST_DOT.test('^https:\\/\\/idp.example\\/logout'), 'the shape is caught');
  assert.ok(!HOST_DOT.test('^https:\\/\\/idp\\.example\\/logout'), 'and the escaped form passes');
});

test('584/585: the reported test checks markup by allow-list and addresses as text', () => {
  const src = fs.readFileSync(path.join(ROOT, 'tests/accountEmailHtml.test.cjs'), 'utf8');
  assert.match(src, /const LAYOUT_TAGS = \['div', 'p', 'a', 'br'\];/);
  assert.match(src, /assert\.deepEqual\(foreignTags\(shouting\), \[\]/, 'upper-case tags are tried');
  assert.doesNotMatch(src, /new RegExp\(`<a href="\$\{url/, 'no RegExp made from the address');
});
