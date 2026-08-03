'use strict';

// Expressions a GitHub workflow is not allowed to contain.
//
// These are not style rules. Each one here makes GitHub REFUSE TO LOAD the
// workflow - "Invalid workflow file", no jobs, no log beyond the parse error -
// and a reusable workflow that will not load takes every workflow that CALLS it
// down with it. That is how one bad line stopped six TSC workflows and the run
// that called them, all at once, with nothing having been built.
//
// They are also invisible to a YAML parser: the file is perfectly good YAML.
// Only GitHub's expression evaluator rejects it, and only when the workflow is
// dispatched. So they are checked here instead.
//
// Run: node tests/workflowExpressions.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, '.github', 'workflows');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const files = fs.readdirSync(DIR)
  .filter(f => f.endsWith('.yml') || f.endsWith('.yaml'))
  .map(f => ({ name: f, lines: fs.readFileSync(path.join(DIR, f), 'utf8').split('\n') }));

console.log('workflowExpressions:');

test('there are workflows to check', () => {
  assert.ok(files.length > 0, 'no workflow files found');
});

test('no job-level `if:` reads the matrix context', () => {
  // THE ONE THAT BIT. GitHub exposes `matrix` to a job's runs-on, env, name,
  // container, services, continue-on-error, timeout-minutes, strategy and
  // steps - but NOT to `jobs.<id>.if`, which is evaluated before the matrix is
  // expanded. A workflow that tries answers
  //
  //   Unrecognized named-value: 'matrix'
  //
  // and does not load at all. It looks entirely reasonable, which is why it
  // was written five times in one sitting.
  //
  // What to do instead: put the decision in the job's `env:` (which CAN see
  // matrix) and give every step `if: ${{ env.WHATEVER == 'true' }}`, or filter
  // the matrix itself from a preceding job's output.
  //
  // A job-level `if:` is indented exactly four spaces; a step's is eight, and
  // a step's may read matrix freely.
  const bad = [];
  for (const { name, lines } of files) {
    lines.forEach((l, i) => {
      if (/^ {4}if:/.test(l) && /\bmatrix\./.test(l)) {
        bad.push(`${name}:${i + 1}`);
      }
    });
  }
  assert.deepStrictEqual(bad, [],
    'job-level if: cannot see matrix - move it to the job env and gate the steps');
});

test('no job-level `if:` reads the steps context either', () => {
  // Same shape of mistake: `steps` belongs to the job that ran them, so a
  // job's own condition cannot read it. Worth pinning beside the one above,
  // because the obvious fix for it - "use a first step and check its output" -
  // is exactly what tempts somebody to write this.
  const bad = [];
  for (const { name, lines } of files) {
    lines.forEach((l, i) => {
      if (/^ {4}if:/.test(l) && /\bsteps\./.test(l)) {
        bad.push(`${name}:${i + 1}`);
      }
    });
  }
  assert.deepStrictEqual(bad, [], 'job-level if: cannot see steps');
});

test('every ${{ }} in a workflow is closed', () => {
  // An unbalanced brace is the other error that stops a workflow loading and
  // that a YAML parser is perfectly happy with.
  //
  // Counting `${{` against `}}` does NOT work, and the first version of this
  // test failed on three real lines because of it: these workflows run docker
  // commands with Go templates - `--format '{{range .Manifest.Manifests}}...'`
  // - which are full of `}}` that close nothing of GitHub's. Strip the
  // complete expressions instead and see whether an opener is left over.
  const bad = [];
  for (const { name, lines } of files) {
    lines.forEach((l, i) => {
      if (/\$\{\{/.test(l.replace(/\$\{\{.*?\}\}/g, ''))) {
        bad.push(`${name}:${i + 1}: ${l.trim().slice(0, 60)}`);
      }
    });
  }
  assert.deepStrictEqual(bad, [], 'unbalanced ${{ }}');
});

test('a workflow that takes an `only` filter gates its steps on it', () => {
  // The filter exists so release-all-missing.yml can build one architecture
  // without building the rest. A workflow that declares the input and then
  // never consults it would quietly build everything - the failure that looks
  // like success.
  const bad = [];
  for (const { name, lines } of files) {
    const text = lines.join('\n');
    if (!/^ {6}only:$/m.test(text)) continue;
    if (!/BUILD_THIS|inputs\.only/.test(text.replace(/^ {6}only:[\s\S]*?type: string$/m, ''))) {
      bad.push(name);
    }
  }
  assert.deepStrictEqual(bad, [], 'workflows that declare `only` but never use it');
});

console.log(`workflowExpressions: ${passed} passed`);
