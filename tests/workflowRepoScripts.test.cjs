'use strict';

// A workflow step that runs a script from THIS repository can only run it if the
// repository is there, at the path that job checked it out to.
// Run: node tests/workflowRepoScripts.test.cjs
//
// The v10.88 release found both halves of that the hard way, in one run:
//
//   bash: /home/runner/work/wekan/wekan/releases/apt-install.sh: No such file or directory
//   bash: D:\a\wekan\wekan/releases/npm-retry.sh: No such file or directory
//
// The first is build-extra-arches, whose "Install dependencies" was the FIRST
// step of the job - before actions/checkout, which is fine when the step is a
// plain `apt-get install` and fatal the moment it becomes a repo script. The
// second is the Windows jobs, which check the repository out to `path: src`, so
// $GITHUB_WORKSPACE/releases is a directory that does not exist there.
//
// Seven jobs failed on it. This suite is the cheap version of finding that out:
// it reads every workflow and reports a step that calls releases/<something>.sh
// before its job has a checkout, or through a prefix that does not match where
// that job put the repository.

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const repoRoot = path.resolve(__dirname, '..');
const dir = path.join(repoRoot, '.github/workflows');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('workflowRepoScripts:');

// `releases/foo.sh`, `bash "$GITHUB_WORKSPACE/releases/foo.sh"`, `./wekan/releases/foo.sh`.
// NOT https://…/releases/latest, which is the GitHub API and not a file here.
const SCRIPT = /(?:^|[\s"'(])((?:[^\s"']*\/)?releases\/[\w./-]+\.(?:sh|mjs|py))/gm;

// A line reader rather than a YAML parser: js-yaml is not a dependency of this
// repo, and what is needed here is only "which steps does this job have, in
// order, and what does each one run" - which these files spell at fixed indents.
function jobs() {
  const out = [];
  for (const file of fs.readdirSync(dir).filter(f => /\.ya?ml$/.test(f))) {
    const lines = fs.readFileSync(path.join(dir, file), 'utf8').split('\n');
    let job = null;
    let step = null;
    for (const line of lines) {
      const jobStart = /^  ([A-Za-z0-9_-]+):\s*$/.exec(line);
      if (jobStart && !/^   /.test(line)) {
        job = { file, name: jobStart[1], steps: [] };
        out.push(job);
        step = null;
        continue;
      }
      if (!job) continue;
      if (/^      - /.test(line)) {                 // a new step
        step = { text: line };
        job.steps.push(step);
        continue;
      }
      // Anything indented deeper belongs to the step that is open.
      if (step && /^        /.test(line)) step.text += '\n' + line;
      else if (/^\S/.test(line)) { job = null; step = null; }   // left the jobs block
    }
  }
  return out;
}

const stepName = step => (/- (?:name|uses):\s*(.+)/.exec(step.text) || [, '?'])[1].trim();

function checkoutOf(steps) {
  for (let i = 0; i < steps.length; i++) {
    if (/uses:\s*actions\/checkout/.test(steps[i].text)) {
      const m = /\n\s+path:\s*(\S+)/.exec(steps[i].text);
      return { at: i, path: m ? m[1] : null };
    }
  }
  return null;
}

test('no step runs a repo script before its job checks the repo out', () => {
  const bad = [];
  for (const job of jobs()) {
    const co = checkoutOf(job.steps);
    job.steps.forEach((step, i) => {
      const run = step.text;
      if (!SCRIPT.test(run)) { SCRIPT.lastIndex = 0; return; }
      SCRIPT.lastIndex = 0;
      // A URL is not a file: https://api.github.com/repos/wekan/wekan/releases/latest
      const real = run.split('\n').some(l => /(^|[\s"'(])(\.?\/?[\w.${}/-]*\/)?releases\/[\w./-]+\.(sh|mjs|py)/.test(l)
        && !/https?:\/\//.test(l));
      if (!real) return;
      if (!co || i < co.at) {
        bad.push(`${job.file}:${job.name} step ${i} "${stepName(step)}" `
          + (co ? `runs a repo script before the checkout at step ${co.at}` : 'runs a repo script and the job never checks out'));
      }
    });
  }
  assert.deepStrictEqual(bad, [],
    'the script is not on disk yet - the step fails with "No such file or directory"');
});

test('a job that checks out to a subdirectory addresses the scripts there', () => {
  // The Windows jobs use `path: src` and the UCS job `path: univention`, because
  // they check out other repositories beside this one. $GITHUB_WORKSPACE is then
  // the PARENT of the checkout, and $GITHUB_WORKSPACE/releases does not exist.
  const bad = [];
  for (const job of jobs()) {
    const co = checkoutOf(job.steps);
    if (!co || !co.path) continue;
    job.steps.forEach((step, i) => {
      const run = step.text;
      if (/\$\{?GITHUB_WORKSPACE\}?\/releases\//.test(run)) {
        bad.push(`${job.file}:${job.name} step ${i} "${stepName(step)}" uses `
          + `$GITHUB_WORKSPACE/releases but the checkout is at ${co.path}/`);
      }
    });
  }
  assert.deepStrictEqual(bad, [], 'use <checkout path>/releases/... in those jobs');
});

test('the helper scripts the release depends on are executable files here', () => {
  // A path that is right and a file that is missing look the same at runtime.
  const named = new Set();
  for (const job of jobs()) {
    for (const step of job.steps) {
      const run = step.text;
      let m;
      SCRIPT.lastIndex = 0;
      while ((m = SCRIPT.exec(run)) !== null) {
        const p = m[1].replace(/^.*?releases\//, 'releases/');
        if (!/^releases\//.test(p)) continue;
        if (/[${}*]/.test(p)) continue;      // built from a variable at runtime
        named.add(p);
      }
    }
  }
  const missing = [...named].filter(p => !fs.existsSync(path.join(repoRoot, p)));
  assert.deepStrictEqual(missing, [], 'a workflow names a script that is not in the repo');
  assert.ok(named.has('releases/apt-install.sh') && named.has('releases/fetch.sh')
    && named.has('releases/npm-retry.sh'),
    'and the three that wait out an outage are actually used');
});

console.log(`\nworkflowRepoScripts: ${passed} tests passed`);
