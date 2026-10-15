'use strict';

// GitHub Actions hardening (Qlty / zizmor, 2026-10-15). The workflows build and
// publish every release, so a hole in one is a hole in what users download:
//
//   template-injection    ${{ ... }} pasted into a `run:` script is expanded
//                         BEFORE the shell sees it, so a crafted input, tag or
//                         output becomes shell code. Values reach scripts
//                         through `env:` instead.
//   unpinned-uses         an action referenced by a tag runs whatever that tag
//                         points at next time. Every action is pinned to a
//                         commit, its version in a comment for Dependabot.
//   excessive-permissions a workflow-level write grant gives it to every job.
//                         Workflows grant read; a job that writes says so.
//   artipacked            actions/checkout leaves the token in .git/config for
//                         every later step. Only the jobs that push keep it.
//
// Static checks always run. With zizmor at .tools/sec-venv/bin/zizmor (or
// ZIZMOR=...), the same four audits are also run for real.
// Run: node tests/workflowHardening.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const yaml = require('js-yaml');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, '.github/workflows');
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log(`ok - ${name}`); };

const workflows = fs.readdirSync(DIR).filter(f => /\.ya?ml$/.test(f))
  .map(f => ({ file: f, text: fs.readFileSync(path.join(DIR, f), 'utf8') }))
  .map(w => ({ ...w, doc: yaml.load(w.text) }));

// Jobs that push with the checkout's own credentials, directly or through the
// release scripts they run. Each keeps persist-credentials; nothing else may.
const PUSHING_JOBS = {
  'release-all.yml': ['bump', 'prepare', 'website', 'charts', 'snap-native', 'snap-launchpad', 'snap-variants'],
  'release-all-missing.yml': ['charts'],
  'update-ondra-gantt-repos.yml': ['update'],
};

const steps = () => workflows.flatMap(w => Object.entries(w.doc.jobs || {})
  .flatMap(([job, j]) => (j.steps || []).map((step, i) => ({ file: w.file, job, i, step }))));

test('the scan sees the release workflows', () => {
  const files = workflows.map(w => w.file);
  for (const f of ['release-all.yml', 'release-all-missing.yml', 'windows.yml', 'AppImage.yml']) assert.ok(files.includes(f), f);
  assert.ok(steps().length > 300, `${steps().length} steps`);
});

test('negative: no ${{ }} expression is pasted into a run script', () => {
  const offenders = steps().filter(s => typeof s.step.run === 'string')
    .flatMap(s => s.step.run.split('\n')
      .filter(line => line.includes('${{') && !/^\s*#/.test(line))
      .map(line => `${s.file} ${s.job}#${s.i}: ${line.trim()}`));
  assert.deepEqual(offenders, []);
});

test('every action is pinned to a commit, with its version alongside', () => {
  const offenders = [];
  for (const w of workflows) {
    for (const m of w.text.matchAll(/^\s*-?\s*uses:\s*(\S+)(.*)$/gm)) {
      const ref = m[1];
      if (ref.startsWith('./')) continue;                    // a workflow of this repository
      if (!/@[0-9a-f]{40}$/.test(ref)) offenders.push(`${w.file}: ${ref}`);
    }
  }
  assert.deepEqual(offenders, []);
  // The pins made here carry the version Dependabot reads (# vX.Y.Z).
  const commented = workflows.flatMap(w => [...w.text.matchAll(/uses:\s*actions\/checkout@[0-9a-f]{40}( # v\d+\.\d+\.\d+)?/g)]);
  assert.ok(commented.length > 0 && commented.every(m => m[1]), 'actions/checkout pins say their version');
});

test('negative: no workflow grants write at the workflow level', () => {
  const offenders = [];
  for (const w of workflows) {
    // With one job, a workflow-level grant IS that job's grant (zizmor agrees).
    if (Object.keys(w.doc.jobs || {}).length === 1) continue;
    const p = w.doc.permissions;
    if (p === 'write-all') offenders.push(`${w.file}: write-all`);
    if (p && typeof p === 'object') {
      for (const [scope, level] of Object.entries(p)) if (level === 'write') offenders.push(`${w.file}: ${scope}: write`);
    }
  }
  assert.deepEqual(offenders, []);
  // ...and the jobs that write still have it, where it is used.
  const ra = workflows.find(w => w.file === 'release-all.yml').doc.jobs;
  for (const job of ['bump', 'prepare', 'release', 'build-amd64', 'snap-native', 'release-notes']) {
    assert.equal(ra[job].permissions && ra[job].permissions.contents, 'write', `release-all ${job}`);
  }
  const missing = workflows.find(w => w.file === 'release-all-missing.yml').doc.jobs;
  assert.equal(missing.recover.permissions.actions, 'write', 'recover re-runs failed jobs (gh run rerun)');
});

test('negative: only the pushing jobs keep checkout credentials', () => {
  const offenders = [];
  for (const s of steps()) {
    if (!/^actions\/checkout@/.test(String(s.step.uses || ''))) continue;
    const keeps = !s.step.with || String(s.step.with['persist-credentials']) !== 'false';
    const pushes = (PUSHING_JOBS[s.file] || []).includes(s.job);
    if (keeps && !pushes) offenders.push(`${s.file} ${s.job}#${s.i}`);
  }
  assert.deepEqual(offenders, []);
  // Every listed job still exists: a stale entry would hide nothing.
  for (const [file, jobs] of Object.entries(PUSHING_JOBS)) {
    const doc = workflows.find(w => w.file === file).doc;
    for (const job of jobs) assert.ok(doc.jobs[job], `${file} ${job}`);
  }
});

test('with zizmor: none of the four audits fires outside the pushing jobs', () => {
  const zizmor = process.env.ZIZMOR || path.join(ROOT, '.tools/sec-venv/bin/zizmor');
  if (!fs.existsSync(zizmor)) { console.log('  (skipped: no zizmor; set ZIZMOR or install it into .tools/sec-venv)'); return; }
  const r = spawnSync(zizmor, ['--offline', '--format', 'json', '.github/'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20 });
  const findings = JSON.parse(r.stdout || '[]');
  const watched = new Set(['template-injection', 'unpinned-uses', 'excessive-permissions', 'artipacked']);
  const left = findings.filter(f => watched.has(f.ident)).map(f => {
    const loc = f.locations[0];
    return `${f.ident} ${loc.symbolic.key.Local.verbatim_path}:${loc.concrete.location.start_point.row + 1}`;
  });
  const unexpected = left.filter(l => !l.startsWith('artipacked '));
  assert.deepEqual(unexpected, []);
  // The artipacked ones left are exactly the pushing jobs' checkouts.
  const pushingCheckouts = steps().filter(s => /^actions\/checkout@/.test(String(s.step.uses || '')) &&
    (PUSHING_JOBS[s.file] || []).includes(s.job)).length;
  assert.equal(left.length, pushingCheckouts, left.join('\n'));
});

console.log(`# ${passed} passed`);
