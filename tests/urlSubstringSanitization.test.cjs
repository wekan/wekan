'use strict';
// CodeQL js/incomplete-url-substring-sanitization (#531, #547): checking that a
// URL or host appears somewhere in a string passes for
// 'https://evil.example/?x=https://trello.com/app-key' and for
// 'https://trello.com.evil.example/' as well. Parse the URL and compare its
// host (and path). This suite keeps the substring form out of the whole tree -
// source and tests alike - and proves it recognises the line CodeQL reported.
// Run: node tests/urlSubstringSanitization.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');

// A literal that names a URL or a host: 'https://...', or 'name.tld[/...]'.
const LITERAL = String.raw`(['"\x60])((?:https?:\/\/)[^'"\x60]*|[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|org|net|io|fi|dev|app|cloud|ru|cz|de)(?:\/[^'"\x60]*)?)\1`;
const INCLUDES = new RegExp(String.raw`\.includes\(\s*${LITERAL}\s*\)`);
// indexOf/search only when the result is used as a yes/no check.
const INDEX_CHECK = new RegExp(String.raw`\.(?:indexOf|search)\(\s*${LITERAL}\s*\)\s*(?:!==?\s*-1|===?\s*-1|>=?\s*0|>\s*-1|<\s*0)`);

// A template literal with ${...} is not a constant, and CodeQL does not treat
// it as a host check either (an image reference with its version, say).
const constantOnly = line => line.replace(/\x60[^\x60]*\$\{[^\x60]*\x60/g, '``');
function offenders(source) {
  return source.split('\n').map((line, i) => ({ line, at: i + 1 }))
    .filter(({ line }) => !/^\s*(\/\/|\*|\/\*)/.test(line))
    .filter(({ line }) => INCLUDES.test(constantOnly(line)) || INDEX_CHECK.test(constantOnly(line)));
}

const SKIP = new Set(['node_modules', '.git', '.tools', '.build', '.meteor', 'packages', 'public', 'test-results', 'playwright-report']);
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (SKIP.has(entry.name) || entry.name.startsWith('_build')) return [];
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(file);
    return /\.(c|m)?jsx?$/.test(entry.name) ? [file] : [];
  });
}

test('the detector recognises the reported substring check and accepts the parsed form', () => {
  assert.equal(offenders("  assert.ok(locale['trello-api-key'].includes('https://trello.com/app-key'));").length, 1, '#547');
  assert.equal(offenders("  if (!url.includes('id.example.com')) fail();").length, 1, '#531');
  assert.equal(offenders("if (href.indexOf('https://github.com/') !== -1) ok();").length, 1);
  assert.equal(offenders("  assert.notStrictEqual(new URL(url).hostname, 'id.example.com');").length, 0);
  assert.equal(offenders("const at = body.indexOf('https://nodejs.org/dist');").length, 0, 'a position, not a check');
  assert.equal(offenders("  // a naive `!url.includes('id.example.com')` check").length, 0, 'comments explain the rule');
  assert.equal(offenders("assert.ok(chart.includes(`ghcr.io/wekan/wekan:v${version}`));").length, 0, 'not a constant');
  assert.equal(offenders("assert.ok(chart.includes(`ghcr.io/wekan/wekan:latest`));").length, 1, 'a constant template is one');
});

test('no URL or host is checked as a substring anywhere in the tree (negative)', () => {
  const found = [];
  // This file's own fixtures spell the pattern out on purpose.
  for (const file of walk(root).filter(f => f !== __filename)) {
    for (const { at, line } of offenders(fs.readFileSync(file, 'utf8'))) {
      found.push(`${path.relative(root, file)}:${at}: ${line.trim()}`);
    }
  }
  assert.deepEqual(found, []);
});

test('the reported test now parses the link and requires the real host and path', () => {
  const source = fs.readFileSync(path.join(root, 'tests/vietnameseBulgarianCompletion.test.cjs'), 'utf8');
  assert.match(source, /url\.hostname === 'trello\.com' && url\.pathname === '\/app-key'/);
  const check = text => (String(text).match(/https?:\/\/[^\s"'<>)\]]+/g) || [])
    .some(link => { const url = new URL(link.replace(/[.,;:]+$/, '')); return url.hostname === 'trello.com' && url.pathname === '/app-key'; });
  assert.equal(check('Klucz API Trello (z https://trello.com/app-key)'), true);
  assert.equal(check('https://evil.example/?x=https://trello.com/app-key'), false, 'in the query (negative)');
  assert.equal(check('https://trello.com.evil.example/app-key'), false, 'a lookalike host (negative)');
  assert.equal(check('https://evil.example/https://trello.com/app-key'), false, 'in the path (negative)');
});
