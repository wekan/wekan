'use strict';

// The two WeKan variants - wekan-ondra and wekan-gantt-gpl - are the same image
// as wekan itself: those repositories are byte-identical to wekan/wekan apart
// from the snap `name:` in snapcraft.yaml. Publishing them used to be a manual
// workflow run; every release now tags them on all three registries in its own
// build.
// Run: node tests/releaseVariantImages.test.cjs
//
// The reason this suite exists is the SECOND half of that: a tag that was pushed
// is not the same as a tag anybody can pull. ghcr.io/wekan/ferretdb was pushed
// for weeks while being private, and nothing noticed until Artifact Hub mailed:
//
//   error scanning image ghcr.io/wekan/ferretdb:latest: image not found
//
// For a user that is ImagePullBackOff. Every check the release made until now
// used the release's own credentials, which a private image passes.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const workflow = fs.readFileSync(path.join(repoRoot, '.github/workflows/release-all.yml'), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('releaseVariantImages:');

const VARIANTS = ['wekan-ondra', 'wekan-gantt-gpl'];
const REGISTRIES = [
  ['ghcr.io/wekan/', 'GHCR'],
  ['quay.io/wekan/', 'Quay'],
  ['wekanteam/', 'Docker Hub'],
];

test('every variant is tagged on every registry, in the release build', () => {
  const build = workflow.slice(workflow.indexOf('docker buildx build'),
    workflow.indexOf('--push', workflow.indexOf('docker buildx build')));
  for (const [prefix, label] of REGISTRIES) {
    for (const variant of VARIANTS) {
      assert.ok(build.includes(`-t ${prefix}${variant}:v\${VERSION}`),
        `${label}: ${variant} has no version tag in the release build`);
      assert.ok(build.includes(`-t ${prefix}${variant}:latest`),
        `${label}: ${variant} has no latest tag`);
    }
  }
});

test('they are in the SAME build as wekan, which is what keeps them identical', () => {
  // A second build - even of the same source - can differ. Retagging the manifest
  // (docker-variant.yml) or tagging in the same build are the two ways to be sure;
  // this is the second, and it must not quietly become a separate build step.
  //
  // The docker JOB only: the release also builds ghcr.io/wekan/wekan-exapp in the
  // nextcloud job, which is a different product with its own Dockerfile.
  const jobAt = workflow.indexOf('\n  docker:');
  const nextJob = workflow.indexOf('\n  snap', jobAt);
  const job = workflow.slice(jobAt, nextJob > jobAt ? nextJob : undefined);
  const builds = (job.replace(/^\s*#.*$/gm, '').match(/docker buildx build/g) || []).length;
  assert.strictEqual(builds, 1,
    'the docker job must build the image once; a second build there is a second '
    + 'chance for the variants to differ from the release they name');
  const wekanTags = (job.match(/-t \S*wekan:/g) || []).length;
  assert.ok(wekanTags >= 3, 'and wekan itself is still tagged on all three registries');
});

test('every pushed tag is verified as pullable by a STRANGER, not by the pusher', () => {
  const at = workflow.indexOf('Verify every pushed tag can be pulled ANONYMOUSLY');
  assert.notStrictEqual(at, -1, 'the anonymous check has to exist');
  const step = workflow.slice(at, at + 4000);
  for (const [prefix] of REGISTRIES) {
    for (const variant of VARIANTS) {
      assert.ok(step.includes(`${prefix}${variant}:v\${VERSION}`),
        `${prefix}${variant} is pushed but never checked anonymously`);
    }
  }
  assert.ok(/token/.test(step) && /manifests/.test(step),
    'it has to fetch a pull token and ask for the manifest - that is what "as a '
    + 'stranger" means');
  assert.ok(/401\|403\|404/.test(step), 'a refusal is a failure');
  assert.ok(/rc=1/.test(step), 'and it fails the job');
});

test('a registry that cannot be REACHED is a warning, never a failure (negative)', () => {
  const at = workflow.indexOf('Verify every pushed tag can be pulled ANONYMOUSLY');
  const step = workflow.slice(at, at + 4000);
  assert.ok(/000\)\s*echo "::warning/.test(step.replace(/\n\s*/g, ' ')) || /000/.test(step),
    'an unreachable registry must not fail a release that is otherwise fine');
  assert.ok(/for attempt in 1 2/.test(step),
    'and it retries once before believing the network');
});

test('the first push to a new Quay repository is explained, not just failed', () => {
  // Quay creates a repository PRIVATE. wekanteam/wekan-ondra and
  // quay.io/wekan/wekan-ondra do not exist yet, so the first release to run this
  // WILL trip the check - and the log has to say that this is expected and what
  // to click, or it reads as a broken release.
  const at = workflow.indexOf('Verify every pushed tag can be pulled ANONYMOUSLY');
  const step = workflow.slice(at, at + 4000);
  assert.ok(/EXPECTED THE FIRST TIME/.test(step));
  assert.ok(/Repository Visibility/.test(step), 'with the Quay setting named');
  assert.ok(/organizations\/wekan\/settings\/packages/.test(step),
    'and the GHCR org policy, which is what greyed the setting out for ferretdb');
  assert.ok(/nothing needs rebuilding/i.test(step),
    'and that re-running is cheap: the image is already pushed');
});

test('the docs say the same thing as the workflow', () => {
  const doc = fs.readFileSync(
    path.join(repoRoot, 'docs/Design/Autoupdate/Snap-Ondra-Gantt.md'), 'utf8');
  assert.ok(/all three registries/i.test(doc), 'the split by registry is gone');
  assert.ok(/Quay\s*\n?\*?\*?private/i.test(doc) || /\*\*Quay\s*\n?private\*\*/i.test(doc)
    || /Quay[\s\S]{0,40}private/i.test(doc),
    'including the visibility trap the first push walks into');
  assert.ok(/byte-identical/.test(doc),
    'and the condition the whole arrangement rests on');
  const variant = fs.readFileSync(
    path.join(repoRoot, '.github/workflows/docker-variant.yml'), 'utf8');
  assert.ok(/A RELEASE NO LONGER NEEDS THIS/.test(variant),
    'the manual workflow must say it is no longer part of a release, or somebody '
    + 'runs it after every release for nothing');
});

console.log(`\nreleaseVariantImages: ${passed} tests passed`);
