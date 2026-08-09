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

// The Caddy architecture `case` block, and not the WEKAN_ARCH one above it:
// snapcraft.yaml has more than one `case "${CRAFT_ARCH_BUILD_FOR}" in`, and
// taking the first match tested the wrong block while looking like it worked.
function caddyCaseIn(text) {
  const at = text.indexOf('CADDY_ARCH=');
  if (at < 0) return null;
  const start = text.lastIndexOf('case "${CRAFT_ARCH_BUILD_FOR}" in', at);
  assert.ok(start > 0, 'the Caddy mapping is no longer a case statement');
  const end = text.indexOf('esac', start);
  return text.slice(start, end);
}

// EVERY snapcraft file that downloads Caddy, not just the main one. The armhf
// gap existed identically in snapcraft.yaml and snapcraft-core26.yaml, and
// fixing one while the other kept the passthrough default is exactly how it
// would come back the day core26 gains an armhf build.
const CADDY_FILES = fs.readdirSync(repoRoot)
  .filter(f => /^snapcraft.*\.ya?ml$/.test(f))
  .filter(f => fs.readFileSync(path.join(repoRoot, f), 'utf8').includes('CADDY_ARCH='));

function caddyCase() {
  const c = caddyCaseIn(yaml);
  assert.ok(c, 'the Caddy architecture mapping is gone');
  return c;
}

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

// ─────────────────────────────────── Caddy is built by Go, and named like it

test('THE BUG: every snap architecture maps to a Caddy asset that exists', () => {
  // Caddy's release assets carry GO's architecture names, not Debian's. There
  // is no linux_armhf archive and there never has been - the 32-bit ARM ones
  // are armv5, armv6 and armv7 - so armhf fell through to the default branch,
  // asked for caddy_<v>_linux_armhf.tar.gz and got
  //     curl: (22) The requested URL returned error: 404
  // which failed the whole armhf snap. The "fall back to the pinned version"
  // path then retried the SAME wrong name, so the error blamed the Caddy
  // release for something the case statement got wrong.
  const caseBlock = caddyCase();

  const EXPECTED = {
    amd64: 'amd64',
    arm64: 'arm64',
    s390x: 's390x',
    ppc64el: 'ppc64le',   // Caddy uses Go's name, not Debian's
    riscv64: 'riscv64',
    armhf: 'armv7',       // Debian armhf's baseline IS Go's GOARM=7
  };
  Object.entries(EXPECTED).forEach(([deb, go]) => {
    const re = new RegExp(`${deb.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)\\s*CADDY_ARCH=${go}\\b`);
    assert.ok(re.test(caseBlock),
      `${deb} must map to Caddy's ${go}; Caddy publishes no linux_${deb} archive`);
  });
});

test('every architecture snapcraft builds has a Caddy mapping', () => {
  // The list that decides which snaps exist is build-for in this same file, so
  // a new architecture added there without a Caddy branch is caught here rather
  // than by a 404 halfway through a release.
  const buildFor = [...new Set(
    [...yaml.matchAll(/^\s*build-for:\s*(\S+)\s*$/gm)].map(m => m[1]))];
  assert.ok(buildFor.length >= 5, `expected the build-for list, found ${buildFor.length}`);
  const caseBlock = caddyCase();
  buildFor.forEach(a => {
    assert.ok(new RegExp(`(^|\\s|\\|)${a}\\)`, 'm').test(caseBlock),
      `snapcraft builds ${a} but no Caddy architecture is mapped for it`);
  });
});

test('NEGATIVE: an unmapped architecture fails loudly instead of 404ing', () => {
  // The old default silently produced a URL that cannot exist. A guess that
  // looks like a Caddy release name is worse than no guess, because the failure
  // then reads as "Caddy stopped publishing this architecture".
  const caseBlock = caddyCase();
  assert.ok(!/\*\)\s*CADDY_ARCH="\$\{CRAFT_ARCH_BUILD_FOR\}"/.test(caseBlock),
    'the default branch still passes the Debian name straight through');
  assert.ok(/no Caddy architecture is mapped for/.test(caseBlock),
    'the default branch must say what went wrong');
  assert.ok(/exit 1/.test(caseBlock), 'and must stop rather than 404 later');
});

test('EVERY snapcraft file that fetches Caddy has the same mapping', () => {
  // snapcraft.yaml was fixed first; snapcraft-core26.yaml had the identical
  // passthrough default and was missed. core26 does not build armhf today, so
  // nothing failed - which is precisely why it would have been rediscovered by
  // a release rather than by a test.
  // Not "there must be two". WeKan ships core24 - snapcraft.yaml, grade:
  // stable - because that is what may publish to the stable channel;
  // snapcraft-core26.yaml is a variant carried alongside it at grade: devel.
  // Either could be removed one day, so the invariant is about the files that
  // DO fetch Caddy, not about how many there are.
  assert.ok(CADDY_FILES.length >= 1,
    'no snapcraft file fetches Caddy any more - this test checks nothing');
  CADDY_FILES.forEach(f => {
    const block = caddyCaseIn(fs.readFileSync(path.join(repoRoot, f), 'utf8'));
    assert.ok(block, `${f} fetches Caddy but has no architecture case`);
    assert.ok(/armhf\)\s*CADDY_ARCH=armv7\b/.test(block),
      `${f} has no armhf -> armv7 branch; Caddy publishes no linux_armhf archive`);
    assert.ok(!/\*\)\s*CADDY_ARCH="\$\{CRAFT_ARCH_BUILD_FOR\}"/.test(block),
      `${f} still passes the Debian name straight through for unmapped architectures`);
    assert.ok(/no Caddy architecture is mapped for/.test(block),
      `${f} does not say what went wrong for an unmapped architecture`);
  });
});

test('stock Caddy is enough - no plugin, so no xcaddy build', () => {
  // The bundled Caddyfile is a reverse proxy and nothing else. Every directive
  // it uses is in the standard distribution, so the official release binaries
  // serve - which is why this downloads them instead of building Caddy from
  // source with xcaddy. A directive from a third-party module would change
  // that, and would not fail until Caddy refused the config at runtime.
  const caddyfile = yaml.slice(yaml.indexOf('etc/Caddyfile'));
  const body = caddyfile.slice(0, caddyfile.indexOf('stage:'));
  assert.ok(/reverse_proxy\s+localhost:3000/.test(body),
    'the default Caddyfile no longer reverse-proxies WeKan');
  // Directives that only exist in a plugin build. If one appears, the snap
  // needs an xcaddy build and downloading the release binary is not enough.
  [/\bcloudflare\b/, /\broute53\b/, /\bdns\s+\w/, /\bsecurity\s*\{/, /\bgit\b/]
    .forEach(re => assert.ok(!re.test(body),
      `the Caddyfile uses ${re} - a plugin directive; stock Caddy cannot load it`));
});

console.log(`\n${passed} tests passed`);
