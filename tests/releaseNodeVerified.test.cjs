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
// Now each native bundle downloads the pinned Node.js from nodejs.org and
// verifies it against SHASUMS256.txt (via releases/embed-verified-node.sh), and
// verifies FerretDB against its published .sha256sum. This pins that, so a
// future edit cannot quietly go back to the runner's node or an unverified
// download - either would make the bundled binary untraceable, which is the
// whole point of the provenance table.

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

// arch: what WeKan calls the bundle; os/node_arch: what nodejs.org calls it.
const NATIVE = [
  { job: 'build-amd64',     os: 'linux',  node_arch: 'x64',   ferret: 'ferretdb-amd64' },
  { job: 'build-arm64',     os: 'linux',  node_arch: 'arm64', ferret: 'ferretdb-arm64' },
  { job: 'build-win64',     os: 'win',    node_arch: 'x64',   ferret: 'ferretdb-win64.exe' },
  { job: 'build-mac-arm64', os: 'darwin', node_arch: 'arm64', ferret: 'ferretdb-mac-arm64' },
];

test('the verified-node helper exists and verifies against SHASUMS256.txt', () => {
  const helper = fs.readFileSync(
    path.join(repoRoot, 'releases/embed-verified-node.sh'), 'utf8',
  );
  assert.ok(/SHASUMS256\.txt/.test(helper), 'helper must fetch nodejs.org SHASUMS256.txt');
  // A mismatch must be fatal, not a warning it walks past.
  assert.ok(
    /does not match its published SHA256[\s\S]*exit 1/.test(helper),
    'helper must exit non-zero when the archive does not match its published SHA256',
  );
  // It must hand the exact version and checksum back for provenance.
  assert.ok(/node_full=/.test(helper) && /node_sha256=/.test(helper),
    'helper must print node_full and node_sha256 for the caller to record');
});

for (const b of NATIVE) {
  test(`${b.job} ships a verified nodejs.org Node.js, not the runner's node`, () => {
    const body = job(b.job);
    // The shipped node comes from the helper, for this exact OS+CPU.
    const re = new RegExp(
      `embed-verified-node\\.sh\\s+\\S*node\\S*\\s+${b.os}\\s+${b.node_arch}`,
    );
    assert.ok(re.test(body),
      `${b.job} must embed node via embed-verified-node.sh ${b.os} ${b.node_arch}`);
    // No copying the runner's node into the bundle any more.
    assert.ok(
      !/cp\s+(?:-L\s+)?"\$\(command -v node\)"/.test(body)
        && !/cp\s+"\$NODE_SRC"/.test(body),
      `${b.job} must not copy the runner's node ($(command -v node)/$NODE_SRC) into the bundle`,
    );
    // Provenance names nodejs.org as the source, not the runner.
    assert.ok(
      /record-provenance\.sh[\s\S]*?'Node\.js'[\s\S]*?'nodejs\.org'/.test(body),
      `${b.job} must record Node.js provenance with source nodejs.org`,
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
  assert.ok(/embed-verified-node\.sh\s+bundle\/node\s+linux\s+arm64/.test(body),
    'build-arm64 must download+verify linux-arm64 Node, not use the runner default');
});

console.log(`\nreleaseNodeVerified: all ${passed} tests passed`);
