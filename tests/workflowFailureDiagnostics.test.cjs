'use strict';

// Guard the minimum evidence every Actions failure must leave behind. GitHub
// identifies a failed action by its step name and prints a run block before
// executing it; explicit exits additionally need an error annotation. A timeout
// turns a hung external command into a bounded, named failure instead of a job a
// maintainer eventually has to cancel without knowing whether it was still alive.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const directory = path.join(root, '.github', 'workflows');
const files = fs.readdirSync(directory)
  .filter(file => /\.ya?ml$/.test(file) && !file.endsWith('.disabled'));

let passed = 0;
function test(name, run) {
  run();
  passed++;
  console.log('  ok -', name);
}

function jobs(source) {
  const start = source.indexOf('\njobs:\n');
  if (start === -1) return [];
  const body = source.slice(start + '\njobs:\n'.length);
  const headers = [...body.matchAll(/^  ([a-zA-Z0-9_-]+):\n/gm)];
  return headers.map((match, index) => ({
    name: match[1],
    body: body.slice(match.index,
      headers[index + 1] ? headers[index + 1].index : body.length),
  }));
}

console.log('workflowFailureDiagnostics:');

test('every shell command runs in an explicitly named step', () => {
  const unnamed = [];
  for (const file of files) {
    const lines = fs.readFileSync(path.join(directory, file), 'utf8').split('\n');
    for (let line = 0; line < lines.length; line++) {
      if (!/^\s+- run:/.test(lines[line])) continue;
      if (!/^\s*- name:/.test(lines[line - 1] || '')) {
        unnamed.push(`${file}:${line + 1}`);
      }
    }
  }
  assert.deepEqual(unnamed, [],
    `a failed command would have no useful step name: ${unnamed.join(', ')}`);
});

test('every directly executed job has a timeout', () => {
  const unbounded = [];
  for (const file of files) {
    const source = fs.readFileSync(path.join(directory, file), 'utf8');
    for (const job of jobs(source)) {
      // Reusable-workflow calls cannot have timeout-minutes in GitHub Actions.
      if (/^    uses:/m.test(job.body)) continue;
      if (!/^    timeout-minutes:\s*\d+/m.test(job.body)) {
        unbounded.push(`${file}:${job.name}`);
      }
    }
  }
  assert.deepEqual(unbounded, [],
    `these jobs can hang without a bounded failure: ${unbounded.join(', ')}`);
});

test('every explicit nonzero exit has a nearby error annotation', () => {
  const silent = [];
  for (const file of files) {
    const lines = fs.readFileSync(path.join(directory, file), 'utf8').split('\n');
    for (let line = 0; line < lines.length; line++) {
      if (!/\bexit\s+[1-9]\b/.test(lines[line]) || /^\s*#/.test(lines[line])) continue;
      const context = lines.slice(Math.max(0, line - 5), line + 2).join('\n');
      if (!context.includes('::error::')) silent.push(`${file}:${line + 1}`);
    }
  }
  assert.deepEqual(silent, [],
    `these exits hide their reason in a generic exit code: ${silent.join(', ')}`);
});

test('tolerated job failures still print a final result', () => {
  const hidden = [];
  for (const file of files) {
    const source = fs.readFileSync(path.join(directory, file), 'utf8');
    for (const job of jobs(source)) {
      if (!/^    continue-on-error:\s*true/m.test(job.body)) continue;
      if (!/- name: Job result/.test(job.body)) hidden.push(`${file}:${job.name}`);
    }
  }
  assert.deepEqual(hidden, [],
    `continue-on-error would hide these failed jobs: ${hidden.join(', ')}`);
});

console.log(`workflowFailureDiagnostics: ${passed} passed`);
