'use strict';

// wekan-ondra and wekan-gantt-gpl are SNAP names, and nothing else.
// Run: node tests/dockerNoVariantImages.test.cjs
//
// A snap name cannot be changed once people have it installed, which is the
// whole reason those two exist. As Docker images they were only ever a second
// name for the same image: the repositories are byte-identical to wekan/wekan
// apart from the snap `name:` in snapcraft.yaml, so `docker pull
// wekanteam/wekan` is, and always was, how you get them.
//
// They were published anyway - by hand for years, then by the release build for
// two versions - and it cost a release the right to fail in six new ways. Three
// registries times two names is six repositories, each with its own visibility
// and its own push permission, and v10.88 hit that an hour into an emulated
// build:
//
//   ERROR: failed to push quay.io/wekan/wekan-ondra:v10.88:
//     unauthorized: access to the requested resource is not authorized
//
// Quay grants push per repository and that one had just been created by the
// release itself. So they are not pushed at all now, and this suite is what
// keeps a helpful-looking `-t` from putting them back.
//
// The TAGS THAT EXIST are not deleted - ghcr.io/wekan/wekan-ondra up to v6.99.2,
// quay.io/wekan/wekan-gantt-gpl to v4.41, wekanteam/wekan-gantt-gpl to v5.62 -
// because deleting a published image breaks whoever pinned it. They stop
// gaining versions; that is all.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(repoRoot, f), 'utf8');
const workflow = read('.github/workflows/release-all.yml');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('dockerNoVariantImages:');

const VARIANTS = ['wekan-ondra', 'wekan-gantt-gpl'];

test('the release builds no variant image tag', () => {
  const tagged = workflow.split('\n')
    .filter(l => /^\s*-t /.test(l))
    .filter(l => VARIANTS.some(v => l.includes(v)));
  assert.deepStrictEqual(tagged, [],
    'a -t line here creates a repository on first push, with the registry\'s '
    + 'default visibility and no push permission of its own');
});

test('and does not verify, anonymously check or preflight one either', () => {
  // Those three loops are where the names would come back first: a check for an
  // image nobody pushes is a job that fails on a tag that was never made.
  for (const v of VARIANTS) {
    const lines = workflow.split('\n')
      .filter(l => l.includes(v) && /image in|anon_check|can_push|for image/.test(l));
    assert.deepStrictEqual(lines, [], `${v} must not appear in a registry check`);
  }
});

test('the tags are COMMENTED OUT, not deleted, with the reason beside them', () => {
  // A line that vanished is a line somebody re-adds next year. The -t lines stay
  // in the build step, commented, next to what it would cost to uncomment them.
  const build = workflow.slice(workflow.indexOf('docker buildx build \\',
    workflow.indexOf('name: Build and push multi-arch image')));
  const block = build.slice(0, build.indexOf('# Pushed is not the same'));
  assert.ok(/COMMENTED OUT ON PURPOSE/.test(block), 'the commented block is there');
  for (const v of VARIANTS) {
    assert.ok(new RegExp(`#   -t [^\\n]*${v}`).test(block),
      `${v}'s tag lines are kept as comments`);
  }
  assert.ok(/PUBLIC first/.test(block),
    'and what to do first if they are ever wanted back');
});

test('the manual workflow is still there for out-of-band work', () => {
  // It is workflow_dispatch only and publishes nothing by itself. Removing it
  // would be more than "do not push them in a release".
  for (const f of ['.github/workflows/docker-variant.yml',
    'releases/docker-publish-variant.sh']) {
    assert.ok(fs.existsSync(path.join(repoRoot, f)), `${f} stays`);
  }
  const variantWf = read('.github/workflows/docker-variant.yml');
  assert.ok(/workflow_dispatch:/.test(variantWf), 'started by hand, never automatically');
  for (const trigger of ['push:', 'schedule:', 'release:']) {
    assert.ok(!variantWf.includes(`\n  ${trigger}`), `${trigger} would make it automatic`);
  }
});

test('the SNAPS keep both names, which is the point (negative)', () => {
  // This is the guard against over-correcting: the variants exist as snaps, and
  // removing the Docker images must not take those with them.
  assert.ok(/SNAP_NAMES: wekan wekan-ondra wekan-gantt-gpl/.test(workflow),
    'the snap auth preflight still covers all three snap names');
  for (const v of VARIANTS) {
    assert.ok(new RegExp(`snapname: ${v}`).test(workflow),
      `${v} is still built and published as a snap`);
  }
});

test('the docs say the same thing', () => {
  const design = read('docs/Design/Autoupdate/Snap-Ondra-Gantt.md');
  assert.ok(/no Docker side/.test(design),
    'Snap-Ondra-Gantt.md must not still describe an automatic Docker publish');
  const platforms = read('docs/Platforms/FOSS/Container/Docker/CPU-platforms.md');
  assert.ok(/There are no variant images/.test(platforms),
    'and the Docker CPU-platforms page must not send anyone to a removed workflow');
  for (const doc of [design, platforms]) {
    assert.ok(/gaining versions/.test(doc),
      'both say the existing tags keep working, because deleting them breaks pins');
  }
});

console.log(`\ndockerNoVariantImages: ${passed} tests passed`);
