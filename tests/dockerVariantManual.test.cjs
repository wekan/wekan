'use strict';

// Guard for publishing the variant Docker images (wekanteam/wekan-gantt-gpl,
// wekanteam/wekan-ondra). Run: node tests/dockerVariantManual.test.cjs
//
// Two things must stay true, and both are decisions rather than details:
//
//   * this WORKFLOW is manual. It is `workflow_dispatch` only: a push, tag or
//     schedule trigger sneaking in would turn "republish that one now" into
//     "republish it on every push", which is not what it is for.
//
//     It is no longer the only way the variants get published. The release now
//     tags wekan-ondra and wekan-gantt-gpl on all three registries in the same
//     build as wekan itself (tests/releaseVariantImages.test.cjs), because a
//     variant that is published by hand is a variant that is a release or three
//     behind. This workflow stays for republishing one out of band - a registry
//     that was down, a repository created after the fact - which is exactly the
//     job that wants a human to start it.
//   * it RETAGS rather than rebuilds. The variant repositories are byte-identical
//     to wekan/wekan apart from the snap name, so the image is the same image;
//     `docker buildx imagetools create` copies the manifest, which keeps the
//     digests and all five architectures. A rebuild could differ from the
//     release it claims to be, and would cost a half-hour emulated build.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

const workflow = read('.github/workflows/docker-variant.yml');
const script = read('releases/docker-publish-variant.sh');
const releaseAll = read('.github/workflows/release-all.yml');

// A comment is not code.
const code = text => text.split('\n').filter(l => !/^\s*#/.test(l)).join('\n');

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ok -', name);
  } catch (err) {
    console.error(`  FAIL - ${name}\n    ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('dockerVariantManual:');

test('the variant image workflow can only be started by hand', () => {
  const triggers = code(workflow).slice(code(workflow).indexOf('\non:'),
    code(workflow).indexOf('\npermissions:'));
  assert.ok(/workflow_dispatch:/.test(triggers), 'workflow_dispatch is the trigger');
  for (const automatic of ['push:', 'schedule:', 'pull_request:', 'release:', 'workflow_run:']) {
    assert.ok(!triggers.includes(automatic),
      `${automatic} would make it automatic, and it must not be`);
  }
});

test('release-all.yml publishes the variant images itself', () => {
  // This assertion used to be the opposite: the release published only
  // wekanteam/wekan and the variants waited for someone to dispatch the
  // workflow above. That was the decision until the variants were asked to be
  // automatic, and it is the reason the guard changed rather than the code -
  // publishing by hand is how wekan-ondra ends up naming a version whose image
  // is older than it says.
  for (const variant of ['wekan-gantt-gpl', 'wekan-ondra']) {
    const pushed = code(releaseAll).split('\n')
      .filter(l => /^\s*-t /.test(l) && l.includes(variant));
    assert.ok(pushed.length >= 6,
      `release-all.yml must tag ${variant} on all three registries, `
      + `version and latest; found ${pushed.length} tag lines`);
  }
});

test('it retags the released manifest instead of rebuilding', () => {
  for (const [what, text] of [['the workflow', workflow], ['the script', script]]) {
    assert.ok(/docker buildx imagetools create/.test(text),
      `${what} copies the manifest`);
    assert.ok(!/docker buildx build/.test(code(text)),
      `${what} must not rebuild - the image is the same image`);
    assert.ok(/wekanteam\/wekan:v\$/.test(text),
      `${what} takes wekanteam/wekan of that version as the source`);
  }
});

test('a variant tag can never cover fewer architectures than wekan does', () => {
  const arches = ['linux/amd64', 'linux/arm64', 'linux/ppc64le', 'linux/s390x', 'linux/riscv64'];
  for (const [what, text] of [['the workflow', workflow], ['the script', script]]) {
    for (const arch of arches) {
      assert.ok(text.includes(arch), `${what} names ${arch}`);
    }
    // Checked on BOTH sides: the source before the retag, and the result after
    // it - "pushed" is not the same as "pushed with every platform".
    const inspects = text.match(/imagetools inspect/g) || [];
    assert.ok(inspects.length >= 2,
      `${what} inspects the source AND the pushed tag`);
  }
});

test('the credential is checked before anything is pushed', () => {
  // Comments first, as usual: the header explains the retag long before any of
  // it runs, so the ORDER has to be read from the code.
  const body = code(workflow);
  const first = body.indexOf('DOCKERHUB_AUTH');
  const push = body.indexOf('imagetools create');
  assert.ok(first > 0 && first < push,
    'DOCKERHUB_AUTH is decoded and logged in with at the top, so a bad token '
    + 'names itself instead of failing inside a push');
  assert.ok(/was REJECTED by docker\.io/.test(workflow),
    'and says so in one line when the registry refuses it');
});

console.log(`\n${passed} tests passed`);
