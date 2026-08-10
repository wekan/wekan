'use strict';

// Guard: every runner label any workflow asks for is one GitHub still offers.
// Run: node tests/workflowRunnerLabels.test.cjs
//
// A retired label does not fail the job - that is the whole problem. The job
// QUEUES, waiting for a runner that is never coming, and sits there until
// somebody cancels it by hand. In the v10.80 release run, build-mac-x64 asked
// for `macos-13`, which GitHub had retired; it queued for nearly two hours, was
// cancelled, and cancelling it cancelled the RUN - which SKIPPED the charts, ucs
// and nextcloud jobs, because a cancelled run skips every job that has not
// started yet. The chart for a released, published WeKan was never pushed, and
// nothing in the log said "macos-13 no longer exists". No release has ever
// carried a wekan-<version>-mac-x64.zip.
//
// So the label is checked here, where it costs a second, instead of being
// discovered as a two-hour queue during a release. Intel macOS did not go away -
// it was RENAMED: macos-15-intel and macos-26-intel. macos-14/15/26 without the
// suffix are Apple Silicon.
//
// This list is GitHub's hosted-runner set (docs.github.com "GitHub-hosted
// runners"). When GitHub adds an image, add the label here too - a label this
// file does not know is reported, because an unknown label and a retired one
// look exactly the same from the outside, and both queue forever.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const workflowDir = path.join(repoRoot, '.github/workflows');

// Currently offered GitHub-hosted labels.
const CURRENT = new Set([
  // Ubuntu x64 / arm64
  'ubuntu-latest', 'ubuntu-26.04', 'ubuntu-24.04', 'ubuntu-22.04', 'ubuntu-slim',
  'ubuntu-26.04-arm', 'ubuntu-24.04-arm', 'ubuntu-22.04-arm',
  // Windows x64 / arm64
  'windows-latest', 'windows-2025', 'windows-2025-vs2026', 'windows-2022',
  'windows-11-arm', 'windows-11-vs2026-arm',
  // macOS arm64, then macOS Intel
  'macos-latest', 'macos-26', 'macos-15', 'macos-14',
  'macos-26-intel', 'macos-15-intel',
]);

// Labels GitHub has REMOVED. Kept by name so the failure can say what replaced
// them rather than only "unknown label".
const RETIRED = new Map([
  ['macos-15-large', 'a larger-runner label, not available here'],
  ['macos-13', 'retired - Intel macOS is now macos-15-intel / macos-26-intel'],
  ['macos-13-xl', 'retired - Intel macOS is now macos-15-intel / macos-26-intel'],
  ['macos-12', 'retired - Intel macOS is now macos-15-intel / macos-26-intel'],
  ['macos-11', 'retired - Intel macOS is now macos-15-intel / macos-26-intel'],
  ['ubuntu-20.04', 'retired - use ubuntu-22.04 or newer'],
  ['ubuntu-18.04', 'retired - use ubuntu-22.04 or newer'],
  ['windows-2019', 'retired - use windows-2022 or newer'],
  ['windows-2016', 'retired - use windows-2022 or newer'],
]);

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// Every `runs-on:` in every workflow, and every matrix value one can expand to.
// A `runs-on: ${{ matrix.foo }}` is followed to the `foo:` entries of the matrix,
// which is where the real labels are - checking only the literal `runs-on:`
// lines would miss the arm64 and Intel-Mac legs entirely.
function collectLabels() {
  const found = [];
  for (const file of fs.readdirSync(workflowDir).filter(f => /\.ya?ml$/.test(f))) {
    const text = fs.readFileSync(path.join(workflowDir, file), 'utf8');
    text.split('\n').forEach((line, i) => {
      const where = `${file}:${i + 1}`;
      const direct = line.match(/^\s*runs-on:\s*(.+?)\s*$/);
      if (direct) {
        // Strip a trailing comment, and skip the expression forms - their real
        // values come from the matrix keys matched below.
        const value = direct[1].replace(/\s+#.*$/, '').replace(/^['"]|['"]$/g, '');
        if (!value.includes('${{') && value !== '' && !value.startsWith('[')) {
          found.push({ where, label: value });
        }
        return;
      }
      // Matrix entries that feed a runs-on, e.g. `runs_on: ubuntu-24.04-arm`
      // or `- runs_on: macos-15-intel`.
      const matrix = line.match(/^\s*-?\s*(?:runs_on|runner|runs-on-label):\s*(.+?)\s*$/);
      if (matrix) {
        const value = matrix[1].replace(/\s+#.*$/, '').replace(/^['"]|['"]$/g, '');
        if (!value.includes('${{') && value !== '') found.push({ where, label: value });
      }
    });
  }
  return found;
}

const labels = collectLabels();

test('workflows declare at least one runner label (the scan is not silently empty)', () => {
  assert.ok(labels.length >= 10,
    `expected to find runner labels across .github/workflows, found ${labels.length}`);
});

test('no workflow asks for a runner label GitHub has retired', () => {
  const dead = labels.filter(l => RETIRED.has(l.label));
  assert.deepStrictEqual(dead, [],
    'these runner labels are retired and will QUEUE FOREVER instead of failing:\n' +
    dead.map(d => `  ${d.where}: ${d.label} - ${RETIRED.get(d.label)}`).join('\n'));
});

test('every runner label is one GitHub currently offers', () => {
  const unknown = labels.filter(l => !CURRENT.has(l.label) && !RETIRED.has(l.label));
  assert.deepStrictEqual(unknown, [],
    'unknown runner label(s) - either GitHub added an image and CURRENT needs it, ' +
    'or this is a typo that will queue forever:\n' +
    unknown.map(u => `  ${u.where}: ${u.label}`).join('\n'));
});

test('build-mac-x64 asks for an Intel macOS runner, not an Apple Silicon one', () => {
  const workflow = fs.readFileSync(path.join(workflowDir, 'release-all.yml'), 'utf8');
  const start = workflow.indexOf('\n  build-mac-x64:\n');
  assert.notStrictEqual(start, -1, 'release-all.yml has no build-mac-x64 job');
  const rest = workflow.slice(start + 1);
  const next = rest.search(/\n  [a-z0-9-]+:\n/);
  const body = next === -1 ? rest : rest.slice(0, next);
  const m = body.match(/^\s*runs-on:\s*(\S+)/m);
  assert.ok(m, 'build-mac-x64 has no runs-on');
  assert.ok(/-intel$/.test(m[1]),
    `build-mac-x64 builds the x86_64 macOS bundle, so it needs an Intel runner ` +
    `(macos-15-intel / macos-26-intel); it asks for "${m[1]}", which is Apple Silicon`);
});

console.log(`\n${passed} passed`);
