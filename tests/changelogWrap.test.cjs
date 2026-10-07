'use strict';
// releases/changelog-wrap.mjs fixes what changelogFormat.test.cjs reports as
// over-long lines, changing whitespace only.
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

(async () => {
  const { wrapChangelog } = await import(pathToFileURL(path.join(__dirname, '../releases/changelog-wrap.mjs')).href);
  const long = 'word '.repeat(40).trim();
  const input = [
    '# Upcoming WeKan ® release', '',
    `- ${long}`, `plain ${long}`,
    `<summary><a href="https://github.com/wekan/wekan/commit/abc">${long}</a>. Thanks to xet7.</summary>`,
    `- [link text](https://example.org) ${long}`,
    `**Languages updated:** ${long}`,
    '```', `code ${long}`, '```',
    `- ${'x '.repeat(38)}#6514 is an issue number, not a heading`,
    'This release fixes the following SECURITY ISSUES found by GitHub CodeQL code scanning:',
  ].join('\n');
  const out = wrapChangelog(input);
  const lines = out.split('\n');
  // Every changed line now fits; the exempt ones are untouched.
  for (const line of lines) {
    if (/https?:\/\/|^<summary>|^\*\*Languages updated|^code |^This release /.test(line)) continue;
    assert.ok(line.length <= 80, line);
  }
  assert.ok(lines.includes(`code ${long}`), 'fenced code is left alone');
  assert.ok(lines.includes('This release fixes the following SECURITY ISSUES found by GitHub CodeQL code scanning:'),
    'a subsection header stays one line');
  // Only whitespace changed.
  assert.equal(out.replace(/\s+/g, ' '), input.replace(/\s+/g, ' '));
  // A bullet continues two spaces in, and no wrapped line starts a heading.
  assert.match(out, /\n  word/);
  assert.ok(!lines.some(line => /^\s*#\d/.test(line)), 'never starts a line with #NNNN');
  // Idempotent.
  assert.equal(wrapChangelog(out), out);
  console.log('changelogWrap: 6 checks passed');
})().catch(error => { console.error(error); process.exit(1); });
