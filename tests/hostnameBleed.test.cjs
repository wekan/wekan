'use strict';

// HostnameBleed (CodeQL alerts #435-#438): a hostname example used as a RegExp
// pattern must not silently turn its dots into wildcards. The original reports
// and the follow-up substring-sanitization reports were test-only, but a
// permissive regression test can claim that required security guidance is
// present when the exact hostname is not.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// Detect the CodeQL shape anywhere in tracked first-party JavaScript: a loop
// takes hostname-looking string literals and feeds its variable to RegExp.
function hostnameLoopRegexps(source) {
  const findings = [];
  const loops = /for\s*\(\s*const\s+([A-Za-z_$][\w$]*)\s+of\s+\[([\s\S]*?)\]\s*\)\s*\{([\s\S]*?)\}/g;
  for (const match of source.matchAll(loops)) {
    const [, variable, values, body] = match;
    const hostname = /['"][A-Za-z0-9-]+\.[A-Za-z0-9.-]+['"]/.test(values);
    const dynamicPattern = new RegExp(
      `new\\s+RegExp\\s*\\(\\s*${variable}\\s*\\)`).test(body);
    if (hostname && dynamicPattern) findings.push(variable);
  }
  return findings;
}

test('the guard recognizes the reported incomplete hostname pattern', () => {
  const vulnerable = `
    for (const literal of ['a.example.com', 'kanban.example.org']) {
      assert.match(text, new RegExp(literal));
    }`;
  assert.deepEqual(hostnameLoopRegexps(vulnerable), ['literal']);
});

test('literal hostname checks require exact dots (positive and negative)', () => {
  const value = 'Examples: a.example.com, kanban.example.org';
  const hostnames = value.replace(/^Examples:\s*/, '').split(/,\s*/);
  assert.deepEqual(hostnames, ['a.example.com', 'kanban.example.org']);

  const wildcardLookalikes =
    'Examples: aXexampleXcom, kanbanXexampleXorg'
      .replace(/^Examples:\s*/, '')
      .split(/,\s*/);
  assert.notDeepEqual(wildcardLookalikes, hostnames);
});

test('no tracked JavaScript constructs a RegExp from looped hostname literals', () => {
  const listed = spawnSync('git', ['ls-files', '-z'], {
    cwd: root, encoding: 'utf8',
  });
  assert.equal(listed.status, 0, listed.stderr);
  const findings = [];
  for (const relative of listed.stdout.split('\0').filter(Boolean)) {
    if (!/\.(?:cjs|mjs|js)$/.test(relative)) continue;
    // This suite deliberately contains the vulnerable fixture above to prove
    // the negative scanner fails on it; do not scan the scanner's own fixture.
    if (relative === 'tests/hostnameBleed.test.cjs') continue;
    const source = fs.readFileSync(path.join(root, relative), 'utf8');
    for (const variable of hostnameLoopRegexps(source)) {
      findings.push(`${relative}: new RegExp(${variable})`);
    }
  }
  assert.deepEqual(findings, []);
});

console.log(`\nhostnameBleed: ${passed} tests passed`);
