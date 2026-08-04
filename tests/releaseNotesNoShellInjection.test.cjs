'use strict';

// Plain-Node guard against shell injection when composing release notes.
// Run: node tests/releaseNotesNoShellInjection.test.cjs
//
// release-all.yml builds the GitHub Release body from the newest CHANGELOG.md
// section (`needs.prepare.outputs.changelog`). That text is arbitrary markdown —
// every `code` span is a backtick. If it is interpolated into a `run:` script as
// inline `${{ needs.prepare.outputs.changelog }}`, GitHub substitutes it into the
// shell SOURCE before bash parses it, so a backtick runs as a command: the v10.59
// release job died with "Incorrect: command not found",
// "loginFailureDecision.js: Permission denied", … and published nothing. The
// value must instead reach the script through the ENVIRONMENT (`env: CHANGELOG:
// ${{ … }}` then `"$CHANGELOG"`), where the shell treats it as data and never
// parses its backticks, `$( )`, or quotes.
//
// This pins that `outputs.changelog` is only ever consumed as an `env:`
// assignment, never inline inside a run: script.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const wfDir = path.join(repoRoot, '.github/workflows');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

const files = fs
  .readdirSync(wfDir)
  .filter((f) => /\.ya?ml$/.test(f))
  .map((f) => path.join('.github/workflows', f));

// The only safe shape for consuming the changelog output: an env assignment,
// e.g. `          CHANGELOG: ${{ needs.prepare.outputs.changelog }}`. Anything
// else - printf, echo, a bare line inside a run: block - is the injection.
const ENV_ASSIGN = /^\s*[A-Za-z_][A-Za-z0-9_]*:\s*\$\{\{[^}]*\.outputs\.changelog[^}]*\}\}\s*$/;
const USES_CHANGELOG = /\.outputs\.changelog/;

test('a release workflow exists to check', () => {
  assert.ok(
    files.some((f) => /release-all/.test(f)),
    'expected a release-all workflow',
  );
});

test('outputs.changelog is only ever consumed through env:, never inline in a script', () => {
  const offenders = [];
  for (const rel of files) {
    const lines = fs.readFileSync(path.join(repoRoot, rel), 'utf8').split('\n');
    lines.forEach((line, i) => {
      if (!USES_CHANGELOG.test(line)) return;
      if (ENV_ASSIGN.test(line)) return; // the safe form
      offenders.push(`${rel}:${i + 1}: ${line.trim()}`);
    });
  }
  assert.deepStrictEqual(
    offenders,
    [],
    `changelog interpolated where a backtick would run as a command:\n${offenders.join('\n')}`,
  );
});

test('every step that reads the changelog into a script uses "$CHANGELOG", not ${{ }}', () => {
  // Wherever a script writes the changelog into release-notes.md, it must
  // reference the environment variable, so the safe env: path is actually used.
  for (const rel of files) {
    const text = fs.readFileSync(path.join(repoRoot, rel), 'utf8');
    // A printf/echo that pipes the changelog into the notes must use "$CHANGELOG".
    const badPrintf = /printf[^\n]*\$\{\{[^}]*\.outputs\.changelog/;
    assert.ok(
      !badPrintf.test(text),
      `${rel}: a printf feeds \${{ …changelog }} straight into the shell; use "$CHANGELOG" from env instead`,
    );
  }
});

console.log(`\nreleaseNotesNoShellInjection: all ${passed} tests passed`);
