'use strict';

// Plain-Node guard for release-all.yml: the snap-launchpad job must flatten the
// repository to a single COMPLETE commit before `snapcraft remote-build`.
// Run: node tests/releaseSnapLaunchpadFlatten.test.cjs
//
// snapcraft remote-build pushes the project's git repository to git.launchpad.net
// and builds it there. It rejects a SHALLOW clone (hence the checkout is
// fetch-depth: 0), but WeKan's full history is large enough that the push times
// out or is refused mid-upload - "Could not push 'HEAD' to git.launchpad.net/...
// snapcraft-wekan-<hash>" after minutes, every retry (v10.55 riscv64, v10.64
// ppc64el). Re-initing the repo as ONE commit of the tagged tree keeps it
// COMPLETE (not shallow, so remote-build accepts it) while making the push the
// source tree rather than the whole history. This pins that the flatten is there,
// runs after the checkout and before the remote build, and really re-inits.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const workflow = fs.readFileSync(
  path.join(repoRoot, '.github/workflows/release-all.yml'), 'utf8',
);

function job(name) {
  const start = workflow.indexOf(`\n  ${name}:\n`);
  assert.notStrictEqual(start, -1, `release-all.yml has no ${name} job`);
  const rest = workflow.slice(start + 1);
  const next = rest.search(/\n  [a-z0-9-]+:\n/);
  return next === -1 ? rest : rest.slice(0, next);
}

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const body = job('snap-launchpad');

test('snap-launchpad flattens the repo to one complete commit', () => {
  // The flatten re-inits the repository (drops history, keeps the tree).
  assert.ok(/rm -rf \.git\s*[\s\S]{0,80}git init/.test(body),
    'snap-launchpad must rm -rf .git and git init to drop the history it does not need');
  assert.ok(/git add -A[\s\S]{0,200}git commit/.test(body),
    'the flatten must commit the current tree as one commit');
});

test('the flattened commit is deterministic so a re-run reconnects', () => {
  assert.ok(/snapshot_date="\$\(git show -s --format=%cI HEAD\)"/.test(body),
    'the tagged commit timestamp is captured before history is removed');
  assert.ok(/GIT_AUTHOR_DATE="\$snapshot_date" GIT_COMMITTER_DATE="\$snapshot_date"/.test(body),
    'author and committer dates are fixed, or every re-run submits a new recipe');
});

test('the flatten runs AFTER the checkout and BEFORE the remote build', () => {
  const coIdx = body.indexOf('actions/checkout@');
  const flattenIdx = body.search(/rm -rf \.git/);
  // The actual invocation (with its flag), not the comment mentions of the name.
  const buildIdx = body.indexOf('snapcraft remote-build --launchpad-accept-public-upload');
  assert.ok(coIdx !== -1 && flattenIdx !== -1 && buildIdx !== -1,
    'snap-launchpad must have a checkout, a flatten, and a remote-build');
  assert.ok(coIdx < flattenIdx,
    'the flatten must come after the checkout (it operates on the checked-out tree)');
  assert.ok(flattenIdx < buildIdx,
    'the flatten must come before snapcraft remote-build, or the push still carries the full history');
});

test('the checkout is still full-depth (remote-build rejects a shallow clone)', () => {
  // The flatten needs a real repo to re-init; and a shallow checkout is what
  // remote-build rejected in the first place. fetch-depth: 0 must remain.
  assert.ok(/fetch-depth:\s*0/.test(body),
    'the checkout must stay fetch-depth: 0 - a shallow clone is what remote-build rejects');
});

console.log(`\nreleaseSnapLaunchpadFlatten: all ${passed} tests passed`);
