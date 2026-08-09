'use strict';

// Plain-Node guard for WHERE WeKan's Node.js comes from.
// Run: node tests/releaseNodeSources.test.cjs
//
// The rule, for the bundle .zip, the Docker image and the snap (Sandstorm is
// amd64-only and out of scope):
//
//   1. Official Node.js          https://nodejs.org/dist/
//   2. Unofficial Node.js builds https://unofficial-builds.nodejs.org/download/release/
//   3. wekan/node-patches        https://github.com/wekan/node-patches/releases
//
// tried in that order, per platform - and when NONE of them has one, that
// platform is NOT BUILT this release: no bundle, no snap, no image architecture,
// and no red job either. It comes back by itself the first run after a Node.js
// for it is published anywhere.
//
// What this pins, and why each part is worth pinning:
//
//   * The order lives in ONE file. It was reimplemented in the Dockerfile, in
//     the extra-arch preflight and in the bundle helper before, and they drifted:
//     the image and the .zip of the same architecture could end up on Node.js
//     from different places, which is the one thing "one source per release" was
//     supposed to prevent.
//   * A "no Node.js" answer is a SKIP, not a failure. A red job every release
//     for a CPU nobody publishes a runtime for is noise, and it used to take the
//     whole matrix - and the Docker image with it - down.
//   * Nothing is shipped unverified. All three sources publish a checksum
//     (SHASUMS256.txt, or a .sha256sum sidecar), and the resolver only returns a
//     build it found one for, so the download can always be checked.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

const resolver = read('releases/resolve-node-source.sh');
const embed = read('releases/embed-verified-node.sh');
const checkArch = read('releases/check-arch-binaries.sh');
const dockerfile = read('Dockerfile');
const workflow = read('.github/workflows/release-all.yml');

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ok - ${name}`);
  } catch (err) {
    console.error(`  FAIL - ${name}\n    ${err.message}`);
    process.exitCode = 1;
  }
}

// Shell comments are not what the shell runs, and this repo's guards have been
// fooled by them before: a comment explaining the OLD behaviour reads exactly
// like the old code. Assertions about what actually happens use this.
const code = text => text.split('\n')
  .filter(l => !/^\s*#/.test(l))
  .join('\n');

test('the three sources are in the resolver, in the required order', () => {
  const body = code(resolver);
  const iOfficial = body.indexOf('https://nodejs.org/dist');
  const iUnofficial = body.indexOf('https://unofficial-builds.nodejs.org/download/release');
  const iPatches = body.indexOf('https://github.com/wekan/node-patches/releases/download');
  assert.ok(iOfficial >= 0, 'the resolver must know nodejs.org/dist');
  assert.ok(iUnofficial >= 0, 'the resolver must know unofficial-builds.nodejs.org');
  assert.ok(iPatches >= 0, 'the resolver must know the wekan/node-patches releases');

  // And they are TRIED in that order, which is the part that matters: the walk
  // asks official, then unofficial, then node-patches, inside one version.
  // $DIST and ${DIST} are the same variable; match either spelling.
  const at = (text, name) => {
    const m = new RegExp(`\\$\\{?${name}\\}?`).exec(text);
    return m ? m.index : -1;
  };
  const walk = body.slice(body.indexOf('for V in $versions'));
  const order = ['DIST', 'UNOFFICIAL', 'PATCHES'].map(v => at(walk, v));
  assert.ok(order.every(i => i >= 0), 'the walk must try all three sources');
  assert.deepStrictEqual([...order].sort((a, b) => a - b), order,
    'the walk must try official, then unofficial, then node-patches - in that order');
});

test('version is the OUTER loop, so a current patched build beats an ancient official one', () => {
  // Source-first would prefer nodejs.org from six releases ago over a current
  // node-patches build, which is not what "the newest Node.js for this platform"
  // means. Version-first, source-second: within one version the order above
  // holds, and only when no source has that version is an older one looked at.
  const body = code(resolver);
  const loop = body.indexOf('for V in $versions');
  assert.ok(loop >= 0, 'the resolver must loop over versions');
  for (const src of ['DIST', 'UNOFFICIAL', 'PATCHES']) {
    const re = new RegExp(`\\$\\{?${src}\\}?`);
    const m = re.exec(body.slice(loop));
    assert.ok(m, `${src} must be tried INSIDE the version loop, not in a loop of its own`);
  }
});

test('a platform no source has is not built, and says so without failing', () => {
  // exit 3, distinct from both "found" (0) and "something broke" (1) - a caller
  // must be able to tell "nobody publishes this" from "the lookup failed".
  assert.ok(/node_found=false/.test(resolver) && /exit 3/.test(resolver),
    'the resolver must answer node_found=false and exit 3 when no source has it');
  assert.ok(/::warning::No Node\.js for/.test(resolver),
    'and say so as a warning, naming the platform');
  assert.ok(/exit 3/.test(embed),
    'the embed helper must pass that answer on rather than turning it into a failure');

  // The extra-arch preflight turns it into skip=true, and a "could not ASK" into
  // an error - conflating the two would skip every platform when nodejs.org is
  // merely unreachable, and call an empty release normal.
  const arch = code(checkArch);
  assert.ok(/resolve_rc" -eq 3/.test(arch) && /skip=1/.test(arch),
    'check-arch-binaries.sh must turn "no source has it" into a skip');
  assert.ok(/Could not work out where[\s\S]*?missing=1/.test(arch),
    'and must NOT treat an unreachable lookup as "nobody publishes it"');
});

test('every consumer asks the one resolver instead of carrying its own copy', () => {
  // The bundles, the extra arches and the image. If any of them grows its own
  // walk again, the image and the .zip of one architecture can end up on Node.js
  // from different places.
  assert.ok(/resolve-node-source\.sh/.test(code(embed)),
    'embed-verified-node.sh must use the resolver');
  assert.ok(/resolve-node-source\.sh/.test(code(checkArch)),
    'check-arch-binaries.sh must use the resolver');
  assert.ok(/resolve-node-source\.sh/.test(code(dockerfile)),
    'the Dockerfile must use the resolver');
  assert.ok(/COPY .*resolve-node-source\.sh/.test(dockerfile),
    'and must COPY it in rather than reimplementing it');

  // Nobody may still download from the retired fork.
  for (const [name, text] of [['the Dockerfile', dockerfile],
                              ['release-all.yml', workflow],
                              ['embed-verified-node.sh', embed],
                              ['check-arch-binaries.sh', checkArch]]) {
    assert.ok(!/github\.com\/wekan\/node\/releases\/download/.test(code(text)),
      `${name} must not download Node.js from the retired wekan/node fork`);
  }
});

test('the Dockerfile installs the resolved node and verifies it', () => {
  const body = code(dockerfile);
  assert.ok(/resolve-node-source\.sh/.test(body), 'the image resolves its node');
  assert.ok(/sha256sum -c -/.test(body),
    'and checks the download against the SHA256 the source published');
  // Both shapes: the tarball nodejs.org/unofficial-builds publish, and the bare
  // binary node-patches publishes.
  assert.ok(/tar\.xz\|tar\.gz\|tar\)/.test(body) && /\bbinary\)/.test(body),
    'and unpacks whichever shape that source publishes');
  // npm is a build-time tool and stays official, on the version that was
  // resolved - not on a separately pinned one that could differ from the node.
  assert.ok(/nodejs\.org\/dist\/\$\{node_full\}/.test(body),
    'npm must come from the official tarball of the version that was resolved');
});

test('every platform WeKan builds has a row in the resolver mapping table', () => {
  // The mapping is the one place Node's spelling and WeKan's meet (Node says x86
  // where everyone else says i386, armv7l where they say armhf). A platform in
  // the build matrix with no row here cannot be resolved at all.
  const PLATFORMS = ['x64', 'arm64', 'i386', 'armv6', 'armhf', 'armv7', 'ppc64le',
    's390x', 'riscv64', 'loong64', 'win64', 'win32', 'win-arm64',
    'mac-x64', 'mac-arm64'];
  // The platform name goes into a RegExp, so it is escaped rather than
  // interpolated raw. It used to read `p.replace('-', '-')`, which replaces a
  // hyphen with a hyphen: a no-op that LOOKS like escaping, so nothing here was
  // escaped and a platform name containing a regex metacharacter would have
  // matched something else entirely (or thrown). GitHub CodeQL reports that
  // shape as js/identity-replacement, and it is right - the usual cause is a
  // mistyped backslash escape.
  const escapeRegExp = str => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const p of PLATFORMS) {
    const re = new RegExp(`^\\s*${escapeRegExp(p)}\\)\\s+nodename=`, 'm');
    assert.ok(re.test(resolver), `resolve-node-source.sh has no row for ${p}`);
  }
  // amd64 is WeKan's name for x64 and every caller uses it; it must map, not fail.
  assert.ok(/"\$platform" = "amd64"/.test(resolver),
    'amd64 must be accepted as a spelling of x64');

  // And the extra-arch matrix must not name a platform the resolver cannot answer.
  const extra = workflow.slice(workflow.indexOf('  build-extra-arches:'));
  const matrix = extra.slice(0, extra.indexOf('    env:'));
  for (const m of matrix.matchAll(/^\s+- arch: ([a-z0-9-]+)$/gm)) {
    assert.ok(PLATFORMS.includes(m[1]),
      `build-extra-arches builds ${m[1]}, which resolve-node-source.sh has no row for`);
  }
});

test('each bundle job stops before building when its platform has no Node.js', () => {
  // Not building a platform is the intended outcome, so it must be decided
  // BEFORE the expensive work, and every step after that gated on it.
  for (const j of ['build-arm64', 'build-win64', 'build-win32', 'build-mac-arm64',
                   'build-mac-x64']) {
    const start = workflow.indexOf(`\n  ${j}:\n`);
    assert.notStrictEqual(start, -1, `release-all.yml has no ${j} job`);
    const rest = workflow.slice(start + 1);
    const next = rest.search(/\n  [a-z0-9-]+:\n/);
    const body = next === -1 ? rest : rest.slice(0, next);

    assert.ok(/id: preflight/.test(body) && /resolve-node-source\.sh/.test(body),
      `${j} must resolve its Node.js in a preflight step`);
    assert.ok(/echo "skip=true" >> "\$GITHUB_OUTPUT"/.test(body),
      `${j}'s preflight must set skip=true when no source has one`);
    assert.ok((body.match(/if: steps\.preflight\.outputs\.skip != 'true'/g) || []).length >= 3,
      `${j}'s build steps must be gated on that skip`);
  }
});

if (process.exitCode) {
  console.error(`\nreleaseNodeSources: ${passed} passed, and the FAILures above`);
} else {
  console.log(`\nreleaseNodeSources: all ${passed} tests passed`);
}
