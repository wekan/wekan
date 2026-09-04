'use strict';

// Guards the Hall of Fame vulnerabilities IdentityBleed and PatternBleed, which
// are the same CodeQL finding twice - naming them here is what lets
// tests/securityRegressionCoverage.test.cjs confirm they still have a test.
//
// A string replacement that replaces something with itself does nothing, and it
// is almost never written on purpose - GitHub CodeQL reports it as
// js/identity-replacement (CWE-116), tagged both correctness and security.
//
// WeKan had one, in tests/releaseNodeSources.test.cjs:
//
//     new RegExp(`^\\s*${p.replace('-', '-')}\\)\\s+nodename=`, 'm')
//
// It reads as "escape the hyphen before putting this into a regex" and does
// nothing at all, so the value went in raw. A hyphen happens to be harmless
// outside a character class, which is why it never failed - but the guard it
// looked like was not there, and a platform name with a `.` or a `+` in it would
// have matched the wrong row or thrown. The usual cause of the shape is a
// mistyped backslash escape: '\"' is just '"', so replace(/"/g, '\"') is an
// identity replacement where '\\"' was meant.
//
// Code scanning finds these days later, on a push, in a web UI. This finds them
// in fifteen seconds, in the same run as everything else.
//
// Run: node tests/noIdentityReplacement.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// WeKan's own JavaScript. node_modules is other people's code, .meteor/.build
// are build outputs, and .tools holds separate repositories.
// '.claude' holds git WORKTREES (.claude/worktrees/<name>), each a full second
// checkout of this repository. Walking into one scans every source file twice
// and - because a worktree also contains a copy of THIS file - reports the
// deliberate samples at the bottom of it as real findings, from a path that is
// not the one the `__filename` check below can recognise. It is gitignored and
// is not this checkout's source, so it is not scanned.
const SKIP = new Set(['node_modules', '.git', '.claude', '.meteor', '.build', '.tools',
  'log', 'test-results', 'dist', 'coverage']);
const EXTENSIONS = ['.js', '.cjs', '.mjs', '.jsx', '.ts'];

function sources(dir = ROOT, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sources(full, out);
    else if (EXTENSIONS.includes(path.extname(entry.name))) out.push(full);
  }
  return out;
}

// `.replace('x', 'x')` / `.replace("x", "x")` / `.replaceAll(...)`: the same
// STRING literal on both sides. Only string-to-string, because a regex first
// argument with the same text can still differ in meaning (flags, escapes), and
// this must not report something that is fine.
// The two quote styles are separate alternatives rather than a backreference:
// a `"` inside a single-quoted literal is perfectly legal, and a character class
// that excluded BOTH quote characters could not match `replace('"', '\"')` -
// which is CodeQL's own example of this mistake, and the one shape a guard for
// it must not miss.
const IDENTITY = new RegExp(
  '\\.replace(?:All)?\\(\\s*' +
  "(?:'((?:[^'\\\\]|\\\\.)*)'|\"((?:[^\"\\\\]|\\\\.)*)\")" +
  '\\s*,\\s*' +
  "(?:'((?:[^'\\\\]|\\\\.)*)'|\"((?:[^\"\\\\]|\\\\.)*)\")" +
  '\\s*\\)',
  'g',
);

// Whichever of the two alternatives matched.
const sides = m => [m[1] !== undefined ? m[1] : m[2], m[3] !== undefined ? m[3] : m[4]];

// The two sides are compared as VALUES, not as source text. That is the whole
// point of CodeQL's own example: `raw.replace(/"/g, '\"')` looks like it escapes
// a quote, but `\"` in a string literal is an identity escape - the value is
// just `"` - so it replaces a quote with a quote. Comparing the raw text would
// call that different and miss exactly the mistake this is for.
function value(literal) {
  return literal.replace(/\\(u\{[0-9a-fA-F]+\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|.)/g, (all, esc) => {
    switch (esc) {
      case 'n': return '\n';
      case 't': return '\t';
      case 'r': return '\r';
      case 'b': return '\b';
      case 'f': return '\f';
      case 'v': return '\v';
      case '0': return '\0';
      default:
        // \x41, \u0041, \u{1F600} - resolve, so two spellings of one character
        // are not called different.
        if (/^x|^u/.test(esc)) {
          const hex = esc.replace(/^u\{|\}$|^[ux]/g, '');
          return String.fromCodePoint(parseInt(hex, 16));
        }
        // Anything else after a backslash is that character: the identity escape.
        return esc;
    }
  });
}

// Comments are stripped before scanning. This file and the one it was written
// for both QUOTE the bad line to explain it, and a guard that reports the
// sentence describing a bug as the bug is a guard that gets switched off.
function stripComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[^\n'"`]*\/\/.*$/gm, '');
}

console.log('noIdentityReplacement:');

test('no source file replaces a string with itself', () => {
  const found = [];
  for (const file of sources()) {
    // This file holds deliberate examples of the shape, in the samples below.
    if (path.resolve(file) === path.resolve(__filename)) continue;
    const text = stripComments(fs.readFileSync(file, 'utf8'));
    for (const m of text.matchAll(IDENTITY)) {
      const [from, to] = sides(m);
      if (value(from) !== value(to)) continue;
      const line = text.slice(0, m.index).split('\n').length;
      found.push(`${path.relative(ROOT, file)}:${line}: ${m[0]}`);
    }
  }
  assert.deepStrictEqual(found, [],
    'this replacement does nothing. If it was meant to escape something, the '
    + 'replacement needs the escape doubled ("\\\\\\"" not "\\\\""); if it was '
    + 'meant to be a no-op, delete it rather than leave a line that looks like a '
    + 'guard');
});

test('the pattern really does catch the shape CodeQL reported (negative)', () => {
  // A guard for a class of typo is worth only what it detects, so check it
  // against the exact line that was in the tree, and against the escape mistake
  // CodeQL's own example gives.
  const samples = [
    `const re = new RegExp(\`^\\\\s*\${p.replace('-', '-')}\\\\)\`, 'm');`,
    `var escaped = raw.replace('"', '\\"');`,
    `s.replaceAll("ab", "ab")`,
  ];
  for (const sample of samples) {
    const hits = [...sample.matchAll(IDENTITY)]
      .filter(m => { const [f, t] = sides(m); return value(f) === value(t); });
    assert.strictEqual(hits.length, 1, `not detected: ${sample}`);
  }
});

test('and does not report a replacement that changes something', () => {
  // The other half: a guard that fires on working code gets switched off.
  const samples = [
    `s.replace('-', '_')`,
    `s.replace(/-/g, '-')`,                 // regex source, not a string literal
    `s.replace('a', 'b').replace('c', 'd')`,
    `escapeRegExp = str => str.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&')`,
  ];
  for (const sample of samples) {
    const hits = [...sample.matchAll(IDENTITY)]
      .filter(m => { const [f, t] = sides(m); return value(f) === value(t); });
    assert.deepStrictEqual(hits.map(h => h[0]), [], `false positive: ${sample}`);
  }
});

console.log(`\n${passed} tests passed`);
