'use strict';

// Plain-Node guard for release-all.yml: every native bundle ships a NAMED,
// CHECKSUMMED Node.js and FerretDB - never the runner's unnamed node.
// Run: node tests/releaseNodeVerified.test.cjs
//
// Two things went wrong before this guard existed, both surfacing as a release
// provenance table that said "no checksum published":
//
//   1. The four native bundles (amd64, arm64, win64, mac-arm64) shipped Node.js
//      with `cp $(command -v node)` - the runner's node. It has no published
//      checksum, so provenance could not name the exact build, and build-arm64
//      has no setup-node at all, so ubuntu-24.04-arm's DEFAULT node (22.x) went
//      into the arm64 bundle instead of the pinned Node 24 - silently.
//   2. FerretDB was downloaded without verifying the .sha256sum wekan/FerretDB
//      now publishes beside every binary.
//
// Now each native bundle downloads its Node.js through
// releases/embed-verified-node.sh and verifies it against the checksum the
// SOURCE published. WHICH source that is comes from
// releases/resolve-node-source.sh - official nodejs.org, then
// unofficial-builds.nodejs.org, then wekan/node-patches - and the order itself is
// pinned by tests/releaseNodeSources.test.cjs. What THIS file pins is the part
// that must hold whoever serves: a NAMED version, a VERIFIED download, and
// provenance that records where it actually came from rather than a hardcoded
// name. (It used to require the wekan/node fork by name; that fork is retired.)

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const workflow = fs.readFileSync(
  path.join(repoRoot, '.github/workflows/release-all.yml'), 'utf8',
);

// Slice out one job's text block: from its `  name:` line to the next job.
function job(name) {
  const start = workflow.indexOf(`\n  ${name}:\n`);
  assert.notStrictEqual(start, -1, `release-all.yml has no ${name} job`);
  const rest = workflow.slice(start + 1);
  const next = rest.search(/\n  [a-z0-9-]+:\n/);
  return next === -1 ? rest : rest.slice(0, next);
}

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// job -> the platform the bundle embeds a Node.js for. The helper takes either
// spelling (win64 or node-win64.exe); these are what the workflow passes.
const NATIVE = [
  { job: 'build-amd64',     asset: 'node-x64',       ferret: 'ferretdb-amd64' },
  { job: 'build-arm64',     asset: 'node-arm64',     ferret: 'ferretdb-arm64' },
  { job: 'build-win64',     asset: 'node-win64.exe', ferret: 'ferretdb-win64.exe' },
  { job: 'build-mac-arm64', asset: 'node-mac-arm64', ferret: 'ferretdb-mac-arm64' },
];

test('the verified-node helper resolves a source and verifies what it downloads', () => {
  const helper = fs.readFileSync(
    path.join(repoRoot, 'releases/embed-verified-node.sh'), 'utf8',
  );
  // It must not carry its own idea of where Node.js comes from.
  assert.ok(/resolve-node-source\.sh/.test(helper),
    'helper must ask resolve-node-source.sh which source serves this platform');
  assert.ok(!/github\.com\/wekan\/node\/releases\/download/.test(helper),
    'helper must not hardcode the retired wekan/node fork');
  // A mismatch must be fatal, not a warning it walks past - and there is no
  // "no checksum published, ship it anyway" path any more: the resolver only
  // returns a build it found a published checksum for.
  assert.ok(
    /does not match the SHA256[\s\S]*?exit 1/.test(helper),
    'helper must exit non-zero when the download does not match its published SHA256',
  );
  assert.ok(!/shipped UNVERIFIED/.test(helper),
    'helper must not have a path that ships an unverified Node.js');
  // The two shapes the three sources publish: an archive, and a bare binary.
  assert.ok(/tar\.xz\|tar\.gz\|tar\)/.test(helper) && /\bzip\)/.test(helper),
    'helper must unpack the tarball/zip nodejs.org and unofficial-builds publish');
  assert.ok(/\bbinary\)/.test(helper),
    'helper must also take the bare binary node-patches publishes');
  // It must hand the exact version, source and checksum back for provenance.
  for (const field of ['node_full=', 'node_from=', 'node_url=', 'node_sha256=']) {
    assert.ok(helper.includes(field),
      `helper must print ${field} for the caller to record`);
  }
  // And a platform NO source has is a skip the caller can act on, not a failure.
  assert.ok(/exit 3/.test(helper),
    'helper must exit 3 when no source has a Node.js for this platform');
});

for (const b of NATIVE) {
  test(`${b.job} embeds a verified ${b.asset}, not the runner's node`, () => {
    const body = job(b.job);
    // The shipped node comes from the helper, for this exact platform.
    const re = new RegExp(
      `embed-verified-node\\.sh\\s+\\S*node\\S*\\s+${b.asset.replace('.', '\\.')}\\s+"\\$NODE_VERSION"`,
    );
    assert.ok(re.test(body),
      `${b.job} must embed node via embed-verified-node.sh ${b.asset}`);
    // No copying the runner's node into the bundle any more.
    assert.ok(
      !/cp\s+(?:-L\s+)?"\$\(command -v node\)"/.test(body)
        && !/cp\s+"\$NODE_SRC"/.test(body),
      `${b.job} must not copy the runner's node ($(command -v node)/$NODE_SRC) into the bundle`,
    );
    // Provenance records the source the helper REPORTED. A hardcoded name is the
    // bug this replaces: every row said wekan/node whatever actually served, so
    // the table could not answer the one question it exists for.
    assert.ok(
      /record-provenance\.sh[\s\S]*?'Node\.js'\s+"\$\{(?:NODE_FROM|node_from):-\}"/.test(body),
      `${b.job} must record Node.js provenance with the source the embed reported`,
    );
    assert.ok(
      !/'Node\.js'[\s\S]{0,40}'wekan\/node'/.test(body),
      `${b.job} must not hardcode wekan/node as the Node.js source`,
    );
    assert.ok(
      !/'Node\.js'\s+'GitHub runner \(setup-node\)'/.test(body),
      `${b.job} must not record Node.js as coming from the runner`,
    );
  });

  test(`${b.job} verifies FerretDB against its published .sha256sum`, () => {
    const body = job(b.job);
    assert.ok(/\$\{FERRET_URL\}\.sha256sum/.test(body),
      `${b.job} must fetch the FerretDB .sha256sum`);
    // A mismatch must fail the build.
    assert.ok(
      /does not match its published SHA256[\s\S]*?exit 1/.test(body),
      `${b.job} must exit non-zero on a FerretDB checksum mismatch`,
    );
    // The verified value is carried to record-provenance.
    assert.ok(/'FerretDB'[\s\S]*?"\$\{(?:FERRET_SHA)[^}]*\}"/.test(body),
      `${b.job} must pass the verified FerretDB SHA to record-provenance`);
  });
}

test('build-arm64 no longer depends on the runner default node (the Node 22 bug)', () => {
  const body = job('build-arm64');
  assert.ok(/embed-verified-node\.sh\s+bundle\/node\s+node-arm64\s+"\$NODE_VERSION"/.test(body),
    'build-arm64 must download+verify an arm64 node, not use the runner default');
});

console.log(`\nreleaseNodeVerified: all ${passed} tests passed`);
