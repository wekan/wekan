'use strict';

// Guard: the GitHub Actions workflow reader of the GitHub organization import
// (models/lib/workflowYaml.js) reads real workflow files exactly as a full YAML
// library does, and refuses what it does not understand.
// Run: node tests/workflowYaml.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { parseWorkflowYaml, WorkflowYamlError } = require('../models/lib/workflowYaml.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log(`ok - ${name}`); }
const ROOT = path.join(__dirname, '..');

// js-yaml is a development dependency only (never in the bundle): the
// independent reference for the files below.
let jsYaml = null;
try { jsYaml = require('js-yaml'); } catch (e) { /* not installed */ }

function workflowFiles() {
  const dirs = ['.github/workflows', '.tools/gitea/.github/workflows', '.tools/git-bug/.github/workflows',
    '.tools/FerretDB/.github/workflows', '.tools/node-patches/.github/workflows'];
  return dirs.flatMap((dir) => {
    const abs = path.join(ROOT, dir);
    return fs.existsSync(abs) ? fs.readdirSync(abs).filter(f => /\.ya?ml$/.test(f)).map(f => path.join(abs, f)) : [];
  });
}

if (jsYaml) {
  test('every workflow file here reads the same as js-yaml (anchors refused)', () => {
    const files = workflowFiles();
    assert.ok(files.length >= 10, `only ${files.length} workflow files found`);
    let compared = 0;
    for (const file of files) {
      const text = fs.readFileSync(file, 'utf8');
      // js-yaml's default schema reads on: as a key, the same as GitHub.
      const expected = jsYaml.load(text);
      if (/^\s*[^#\n]*[&*][A-Za-z_]/m.test(text) && /:\s*[&*][A-Za-z]/.test(text)) {
        assert.throws(() => parseWorkflowYaml(text), WorkflowYamlError, file);
        continue;
      }
      assert.deepStrictEqual(parseWorkflowYaml(text), expected, path.relative(ROOT, file));
      compared += 1;
    }
    console.log(`#   ${compared} of ${files.length} files compared`);
  });
} else {
  console.log('# skip - js-yaml (dev dependency) not installed');
}

test('the shapes workflows use', () => {
  const doc = parseWorkflowYaml(`
name: Triage   # a comment
"on":
  issues:
    types: [opened, labeled]
  schedule:
    - cron: '0 3 * * 1'
jobs:
  triage:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/labeler@v5
      with:
        repo-token: "\${{ secrets.GITHUB_TOKEN }}"
    - name: Say hi
      run: |
        echo "hi # not a comment"
        echo done
    - run: >-
        folded
        line
`);
  assert.deepStrictEqual(doc, {
    name: 'Triage',
    on: { issues: { types: ['opened', 'labeled'] }, schedule: [{ cron: '0 3 * * 1' }] },
    jobs: { triage: { 'runs-on': 'ubuntu-latest', steps: [
      { uses: 'actions/labeler@v5', with: { 'repo-token': '${{ secrets.GITHUB_TOKEN }}' } },
      { name: 'Say hi', run: 'echo "hi # not a comment"\necho done\n' },
      { run: 'folded line' },
    ] } },
  });
  assert.deepStrictEqual(parseWorkflowYaml('on: [push, issues]'), { on: ['push', 'issues'] });
  assert.deepStrictEqual(parseWorkflowYaml('a: {b: 1, c: [x, "y z"]}'), { a: { b: 1, c: ['x', 'y z'] } });
});

test('negative: anchors, aliases, tags, tabs, duplicates and bad indentation are refused', () => {
  for (const bad of ['a: &x 1\nb: *x', 'a: !!str 1', 'a:\n\tb: 1', 'a: 1\na: 2', 'a: 1\n  b: 2', '--- \na: 1\n---\nb: 2', 'a: "open']) {
    assert.throws(() => parseWorkflowYaml(bad), WorkflowYamlError, JSON.stringify(bad));
  }
});

console.log(`# ${passed} passed`);
