'use strict';

// Plain-Node guard on HOW the release notes reach the release job.
// Run: node tests/releaseNotesNoShellInjection.test.cjs
//
// release-all.yml builds the GitHub Release body from the newest CHANGELOG.md
// section. That text is arbitrary markdown, it is enormous, and each of the two
// obvious ways to hand it to a shell step has already broken a release:
//
//   1. INLINE `${{ needs.prepare.outputs.changelog }}` in a `run:` block.
//      GitHub substitutes it into the shell SOURCE before bash parses it, so
//      every `code` span's backtick runs as a command. v10.59 died with
//      "Incorrect: command not found", "loginFailureDecision.js: Permission
//      denied", … and published nothing.
//
//   2. THROUGH THE ENVIRONMENT - `env: CHANGELOG: ${{ … }}` then "$CHANGELOG".
//      That fixed the backticks and hit a harder wall: Linux caps a SINGLE
//      argv/envp string at MAX_ARG_STRLEN, 128 KiB, and the v10.92 notes were
//      172,458 characters. execve refused to start bash at all - "An error
//      occurred trying to start process '/usr/bin/bash' … Argument list too
//      long" - before a line of the step ran.
//
// The shape that has neither problem is FILE TO FILE: each job that needs the
// notes extracts them from its own checkout of CHANGELOG.md with
// releases/release-notes.sh, straight into release-notes.md. Only file paths are
// passed around, so there is no size limit and no shell ever parses the text.
//
// This pins that shape: no changelog job output, no changelog in an env:, no
// changelog interpolated into a script, and the extraction script is the thing
// every consumer uses.

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

const read = (rel) => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

test('a release workflow exists to check', () => {
  assert.ok(
    files.some((f) => /release-all/.test(f)),
    'expected a release-all workflow',
  );
});

test('the notes are never carried as a job output', () => {
  // 128 KiB is the ceiling for one environment string, and the notes are past
  // it, so an output nobody can safely consume is a trap for the next person.
  const offenders = [];
  for (const rel of files) {
    read(rel).split('\n').forEach((line, i) => {
      if (/\.outputs\.changelog/.test(line)) offenders.push(`${rel}:${i + 1}: ${line.trim()}`);
      if (/^\s*changelog:\s*\$\{\{/.test(line)) offenders.push(`${rel}:${i + 1}: ${line.trim()}`);
    });
  }
  assert.deepStrictEqual(
    offenders,
    [],
    `the release notes are passed as a job output again:\n${offenders.join('\n')}`,
  );
});

test('no step puts a whole CHANGELOG section into an environment variable', () => {
  // env: CHANGELOG: ${{ … }} is what made execve fail with E2BIG in v10.92.
  const offenders = [];
  for (const rel of files) {
    read(rel).split('\n').forEach((line, i) => {
      if (/^\s*CHANGELOG:\s*\$\{\{/.test(line)) offenders.push(`${rel}:${i + 1}: ${line.trim()}`);
    });
  }
  assert.deepStrictEqual(
    offenders,
    [],
    `a whole CHANGELOG section is back in env:, which execve refuses over 128 KiB:\n${offenders.join('\n')}`,
  );
});

test('the extraction script exists, and is what every consumer runs', () => {
  const script = path.join(repoRoot, 'releases/release-notes.sh');
  assert.ok(fs.existsSync(script), 'expected releases/release-notes.sh');
  const text = read('.github/workflows/release-all.yml');
  const uses = text.match(/releases\/release-notes\.sh/g) || [];
  // prepare validates, the release job composes, the rewrite job recomposes.
  assert.ok(
    uses.length >= 3,
    `expected release-notes.sh to be used by prepare, release and the notes rewrite; found ${uses.length}`,
  );
});

test('every step that writes the notes into release-notes.md reads them from the file', () => {
  const text = read('.github/workflows/release-all.yml');
  // The old shapes, in the exact forms that broke: a printf of the variable, and
  // an inline interpolation into the script.
  assert.ok(
    !/printf[^\n]*"\$CHANGELOG"/.test(text),
    'a step still pipes "$CHANGELOG" into the notes; read CHANGELOG.md with release-notes.sh instead',
  );
  assert.ok(
    !/>>\s*release-notes\.md[^\n]*\$\{\{/.test(text),
    'a step interpolates ${{ }} into the notes, where a backtick runs as a command',
  );
  // and what must be there instead
  assert.ok(
    /release-notes\.sh "\$VERSION" >> release-notes\.md/.test(text),
    'expected the notes to be appended from releases/release-notes.sh',
  );
});

test('release-notes.sh keeps the text out of the shell and fails loudly when there is none', () => {
  const sh = fs.readFileSync(path.join(repoRoot, 'releases/release-notes.sh'), 'utf8');
  assert.ok(/set -euo pipefail/.test(sh), 'expected set -euo pipefail');
  // The python must read the file itself and take its arguments from the
  // environment; a `version = "$VERSION"` substitution would put CHANGELOG-
  // adjacent text back into the heredoc the shell expands.
  assert.ok(/<<'PYEOF'/.test(sh), "expected a QUOTED heredoc, so the shell does not expand it");
  assert.ok(
    /os\.environ\["VERSION"\]/.test(sh) && /os\.environ\["CHANGELOG_FILE"\]/.test(sh),
    'expected the python to read VERSION and CHANGELOG_FILE from the environment',
  );
  assert.ok(
    /::error::release-notes:/.test(sh),
    'expected an ::error:: when the CHANGELOG has no section for this release',
  );
});

console.log(`\nreleaseNotesNoShellInjection: all ${passed} tests passed`);
