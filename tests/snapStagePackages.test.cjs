'use strict';

// A snap stage-package must be a package that REALLY EXISTS on every
// architecture the snap is built for - not one that merely resolves on most of
// them.
//
// Ubuntu 24.04's 64-bit time_t transition renamed a set of libraries to a `t64`
// suffix. On the 64-bit architectures the renamed package keeps the old name
// alive:
//
//     Package: libcurl4t64
//     Architecture: amd64
//     Provides: libcurl4 (= 8.5.0-2ubuntu10)
//
// but on **armhf**, where the ABI genuinely changed, there is no Provides line
// at all. So the old name resolves everywhere except armhf, and the snap fails
// on exactly one architecture, before it compiles anything:
//
//     Stage package not found in part 'mongodb': libcurl4.
//     Build failed
//
// That is a Launchpad "Stopped" build with no artifact, which looks like the
// build farm cancelling a job - so it reads as flakiness and gets retried. It
// was retried three times in v10.77 while s390x, ppc64el and riscv64 all built
// on attempt 1.
//
// It had already happened once, to libssl3 and libgoogle-perftools4 in v10.71.
// They were fixed; libcurl4 was the same transition and was left behind. This
// test is here so the third one is caught by a test run instead of by a release.
//
// Re-check the list against the archive with:
//   curl -fsSL http://ports.ubuntu.com/ubuntu-ports/dists/noble/main/binary-armhf/Packages.gz \
//     | gunzip -c | grep -E '^Package: ' | sed 's/^Package: //' | sort -u
// (and the same for universe, and archive.ubuntu.com for amd64)
//
// Run: node tests/snapStagePackages.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const yaml = fs.readFileSync(path.join(repoRoot, 'snapcraft.yaml'), 'utf8');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

// Every package named under a `stage-packages:` block.
function stagePackages() {
  const out = [];
  let inBlock = false;
  yaml.split('\n').forEach(line => {
    if (/^\s*stage-packages:\s*$/.test(line)) { inBlock = true; return; }
    if (!inBlock) return;
    const m = line.match(/^\s*-\s+([a-z0-9][a-z0-9.+-]*)\s*$/);
    if (m) { out.push(m[1]); return; }
    if (line.trim() && !line.trim().startsWith('#')) inBlock = false;
  });
  return out;
}

// The noble t64 renames that bite here: OLD NAME -> what noble actually ships.
// Each of these exists ONLY as the t64 package; the old name is a Provides on
// the 64-bit architectures and nothing at all on armhf. Verified against the
// noble main+universe indices for armhf and arm64.
const T64_RENAMED = {
  'libssl3': 'libssl3t64',
  'libcurl4': 'libcurl4t64',
  'libcurl3-gnutls': 'libcurl3t64-gnutls',
  'libgoogle-perftools4': 'libgoogle-perftools4t64',
  'libboost-filesystem1.83.0': null,      // NOT renamed - real on armhf
};

test('snapcraft.yaml declares stage-packages at all', () => {
  const pkgs = stagePackages();
  assert.ok(pkgs.length >= 10,
    `expected the mongodb part's package list, found ${pkgs.length}`);
});

test('THE BUG: no stage-package is a pre-t64 name armhf cannot resolve', () => {
  const pkgs = stagePackages();
  const broken = pkgs.filter(p => T64_RENAMED[p]);
  assert.deepStrictEqual(broken, [],
    'these resolve on the 64-bit arches through a Provides and fail on armhf; ' +
    'use ' + broken.map(p => `${p} -> ${T64_RENAMED[p]}`).join(', '));
});

test('libcurl is asked for by the name noble actually publishes', () => {
  const pkgs = stagePackages();
  assert.ok(pkgs.includes('libcurl4t64'),
    'the mongodb part still needs libcurl');
  assert.ok(!pkgs.includes('libcurl4'),
    'libcurl4 is not a real package on any noble architecture');
});

test('the two that were fixed in v10.71 have not regressed', () => {
  const pkgs = stagePackages();
  assert.ok(pkgs.includes('libssl3t64'));
  assert.ok(pkgs.includes('libgoogle-perftools4t64'));
  assert.ok(!pkgs.includes('libssl3'));
  assert.ok(!pkgs.includes('libgoogle-perftools4'));
});

test('NEGATIVE: a name that was never renamed is left alone', () => {
  // The rule is not "add t64 to everything". libboost-filesystem1.83.0,
  // zlib1g, libstemmer0d and the rest are real packages on armhf under their
  // plain names, and a t64 suffix on them would not exist.
  const pkgs = stagePackages();
  ['zlib1g', 'libstemmer0d', 'libsnappy1v5', 'libpcre2-8-0']
    .forEach(p => assert.ok(pkgs.includes(p), `${p} must keep its plain name`));
  pkgs.forEach(p => {
    if (p.endsWith('t64')) {
      assert.ok(Object.values(T64_RENAMED).includes(p),
        `${p} carries a t64 suffix that is not one of the known renames - ` +
        'check it exists before trusting it');
    }
  });
});

test('the reason is written down where the next person will read it', () => {
  // A bare rename is a mystery in six months; this one has now cost two
  // releases, and the comment is what stops it costing a third.
  const block = yaml.slice(0, yaml.indexOf('- libcurl4t64'));
  const near = block.slice(-2500);
  assert.ok(/Provides/.test(near), 'the Provides mechanism is explained');
  assert.ok(/armhf/.test(near), 'and which architecture it breaks');
  assert.ok(/Stage package not found/.test(near),
    'and the error it produces, so a search for it lands here');
});

console.log(`\n${passed} tests passed`);
