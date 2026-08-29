'use strict';

// Plain-Node guard (no Meteor) for how release-all.yml builds the snap for each
// CPU architecture. Run: node tests/releaseSnapArches.test.cjs
//
// The failure this pins: ppc64el and s390x were built by a `snap-qemu` job using
// diddlesnaps/snapcraft-multiarch-action, which hardcodes a maximum base of
// core22 and is unmaintained. WeKan's snapcraft.yaml is `base: core24`, so BOTH
// legs died before building anything - "Your build requires a base that this tool
// does not support (core24)" - on every single release. They now build on
// Launchpad, which is the only mechanism that does core24 on an arch with no
// native GitHub runner. See docs/Design/Autoupdate/Forks/Snap-Core.md.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

const workflow = read('.github/workflows/release-all.yml');
const snapcraft = read('snapcraft.yaml');
const snapcraftCore26 = read('snapcraft-core26.yaml');

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

// A comment in a YAML `run:` block is text the shell never sees, and this file
// has been fooled by it before: a comment that QUOTES the old broken code (kept
// on purpose, so the next reader knows what the fix was for) reads exactly like
// the code it replaced. Assertions about what the shell DOES use this.
function code(text) {
  return text.split('\n').filter(l => !/^\s*#/.test(l)).join('\n');
}

// The body of one top-level job: from "  <name>:" to the next job at the same
// indentation. Good enough to ask which matrix and which options are ITS own.
function job(name) {
  const start = workflow.indexOf(`\n  ${name}:\n`);
  assert.notStrictEqual(start, -1, `release-all.yml has no ${name} job`);
  const rest = workflow.slice(start + 1);
  const next = rest.slice(1).search(/\n {2}[a-z][\w-]*:\n/);
  return next === -1 ? rest : rest.slice(0, next + 1);
}

test('the QEMU snap job is gone, and so is the action that could not build core24', () => {
  assert.ok(!/\n {2}snap-qemu:/.test(workflow), 'snap-qemu must be deleted, not disabled');
  assert.ok(!/uses: diddlesnaps\/snapcraft-multiarch-action/.test(workflow),
    'the action caps at core22; nothing may USE it while snapcraft.yaml is core24 '
    + '(the comment explaining why is allowed to name it)');
  assert.ok(/^base: core24$/m.test(snapcraft),
    'this guard exists because the snap is core24 - if that changed, re-read Snap-Core.md');
});

test('every platform in snapcraft.yaml is built by some snap job', () => {
  // The platforms: block lists what the snap claims to support. An arch listed
  // there and built by no job is a snap that never appears in the store.
  // The block ends at the next top-level key (parts:, hooks:, ...).
  let block = snapcraft.slice(snapcraft.indexOf('\nplatforms:') + 1);
  const nextKey = block.slice(1).search(/\n[a-z][\w-]*:/);
  if (nextKey !== -1) block = block.slice(0, nextKey + 1);
  const platforms = [...block.matchAll(/^ {2}([a-z0-9]+):$/gm)].map(m => m[1]);
  // armhf joined once wekan/node built a Node.js for it: the snap takes its
  // runtime from the wekan-<arch>.zip bundle, so a snap arch is possible exactly
  // when a bundle for it is. i386 was REMOVED: core24 (Ubuntu 24.04) has no i386
  // port, so `build-on: i386` is a snapcraft PARSE error that failed EVERY snap
  // build, not only i386's. i386 users get the .deb and AppImage; an i386 snap
  // would need a non-core24 base (scaffolded in snap-base-debian/).
  assert.deepStrictEqual(platforms.sort(),
    ['amd64', 'arm64', 'armhf', 'ppc64el', 'riscv64', 's390x'],
    'the platform list changed - the two jobs below must cover the new list');

  const native = job('snap-native');
  const launchpad = job('snap-launchpad');
  const built = new Set([
    ...[...native.matchAll(/arch: ([a-z0-9]+)/g)].map(m => m[1]),
    ...(launchpad.match(/arch: \[([^\]]+)\]/) || [, ''])[1]
      .split(',').map(a => a.trim()).filter(Boolean),
  ]);
  const missing = platforms.filter(p => !built.has(p));
  assert.deepStrictEqual(missing, [], 'these platforms are in no snap job');
});

test('the snap copies the extracted bundle from its actual working directory', () => {
  const partsAt = snapcraft.indexOf('\nparts:\n');
  const partAt = snapcraft.indexOf('\n    wekan:\n', partsAt);
  assert.notStrictEqual(partAt, -1, 'snapcraft.yaml has no wekan part');
  const nextPart = snapcraft.indexOf('\n    caddy:\n', partAt);
  const part = code(snapcraft.slice(partAt, nextPart));

  assert.ok(/mkdir \.build[\s\S]*?cd \.build/.test(part),
    'the part creates and enters .build before extracting the release bundle');
  assert.ok(/unzip "\$\{WEKAN_ZIP\}"/.test(part),
    'the release archive is extracted in that working directory');
  assert.ok(/cp -p bundle\/node \$SNAPCRAFT_PART_INSTALL\/bin\/node/.test(part),
    'the embedded Node.js is copied from .build/bundle relative to that directory');
  assert.ok(/cp -r bundle\/\* \$SNAPCRAFT_PART_INSTALL\//.test(part),
    'the rest of the bundle is copied from the same extracted directory');
  assert.ok(!/cp .*\.build\/bundle/.test(part),
    'after cd .build, .build/bundle would incorrectly mean .build/.build/bundle');
});

test('snap builds copy the repository migrator from inside .build', () => {
  for (const [name, source] of [
    ['core24', snapcraft],
    ['core26', snapcraftCore26],
  ]) {
    assert.ok(
      /cd \.build[\s\S]*?cp \.\.\/releases\/migrate-mongodb-to-ferretdb\.mjs/.test(source),
      `${name} must step back out of .build to find the migration script`,
    );
    assert.ok(
      !/^[ \t]*cp releases\/migrate-mongodb-to-ferretdb\.mjs/m.test(source),
      `${name} must not look for a releases directory inside .build`,
    );
  }
});

test('the mainstream arches build natively, the exotic ones on Launchpad', () => {
  const native = job('snap-native');
  assert.ok(/arch: amd64\s+runner: ubuntu-24\.04\b/.test(native), 'amd64 on a native runner');
  assert.ok(/arch: arm64\s+runner: ubuntu-24\.04-arm\b/.test(native), 'arm64 on a native runner');
  assert.ok(native.includes('snapcore/action-build'), 'built with the official action');

  const launchpad = job('snap-launchpad');
  const arches = (launchpad.match(/arch: \[([^\]]+)\]/) || [, ''])[1]
    .split(',').map(a => a.trim());
  // Everything without a native GitHub runner. armhf has no runner either. i386
  // was removed along with its snapcraft.yaml platform: core24 has no i386 port
  // (see above), so there is no i386 snap to build here.
  assert.deepStrictEqual(arches, ['ppc64el', 's390x', 'riscv64', 'armhf'],
    'ppc64el and s390x belong here: no native runner, and QEMU cannot do core24');
  assert.ok(/snapcraft remote-build/.test(launchpad), 'built with remote-build');
});

test('a slow Launchpad arch can neither fail the release nor cancel another arch', () => {
  // This is the whole trade of using Launchpad: a build can queue for hours.
  const launchpad = job('snap-launchpad');
  assert.ok(/continue-on-error: true/.test(launchpad), 'continue-on-error');
  assert.ok(/fail-fast: false/.test(launchpad), 'fail-fast: false');
  const timeout = launchpad.match(/timeout-minutes: (\d+)/);
  assert.ok(timeout, 'timeout-minutes must bound a stuck build');
  // Raised from 180 after v10.71: the riscv64 leg spent 2h24m queueing for a
  // builder on attempt 1 alone, so 180 minutes bought ONE attempt out of three
  // and the job's own timeout - "The operation was canceled." - was what ended
  // it, 35 minutes into attempt 2. A retry loop the job does not outlive is not
  // a retry loop, so this must fit two slow attempts. GitHub's per-job ceiling
  // is 360.
  assert.ok(Number(timeout[1]) >= 300,
    `timeout-minutes: ${timeout[1]} does not fit two attempts on a slow arch`);
  assert.ok(Number(timeout[1]) <= 360,
    `timeout-minutes: ${timeout[1]} is over GitHub's per-job ceiling`);
  assert.ok(/timeout 300m snapcraft remote-build/.test(launchpad),
    'riscv64 stops its local waiter before the six-hour hosted-job cancellation');
  assert.ok(!/timeout --foreground 300m snapcraft remote-build/.test(launchpad),
    'timeout must isolate the waiter so SIGTERM returns 124 instead of cancelling Actions');
  assert.ok(/\[ "\$\{\{ matrix\.arch \}\}" = riscv64 \] && \[ "\$rc" -eq 124 \]/.test(launchpad),
    'the waiter timeout is recognized as queued work, not a failed build');
  assert.ok(/pending=true/.test(launchpad),
    'the clean timeout is exposed to the job summary');
});

test('Launchpad waits for and verifies its architecture-specific release bundle', () => {
  const launchpad = job('snap-launchpad');
  assert.ok(/needs: \[[^\]]*build-extra-arches[^\]]*\]/.test(launchpad),
    'Launchpad must wait for build-extra-arches; otherwise the snap downloads a '
    + 'release asset while the job that creates it is still running and gets 404');
  assert.ok(/ppc64el\) bundle_arch=ppc64le/.test(launchpad),
    'the Launchpad ppc64el spelling must map to the ppc64le bundle spelling');
  assert.ok(/asset="wekan-\$\{VERSION\}-\$\{bundle_arch\}\.zip"/.test(launchpad),
    'the preflight checks the exact bundle snapcraft will download');
  assert.ok(/gh release view[\s\S]*--json assets[\s\S]*grep -qxF "\$asset"/.test(launchpad),
    'the release asset must be read back from GitHub before starting Launchpad');
  assert.ok(/available=false[\s\S]*skipping the .* snap instead of retrying a permanent 404/.test(launchpad),
    'a missing optional bundle is skipped with its real cause instead of retried');

  for (const step of [
    'actions/checkout@v7',
    'Flatten history so the Launchpad push stays small',
    'Install snapcraft',
    'Provide Launchpad credentials for remote-build',
    'Verify snapcraft.yaml version matches the release',
    'Build the ${{ matrix.arch }} snap on Launchpad',
    'Push ${{ matrix.arch }} to the Snap Store',
    'Attach the ${{ matrix.arch }} snap to the GitHub Release',
  ]) {
    const at = launchpad.indexOf(step);
    assert.notStrictEqual(at, -1, `missing Launchpad step: ${step}`);
    const surrounding = launchpad.slice(at, at + 500);
    assert.ok(/if: steps\.bundle\.outputs\.available == 'true'/.test(surrounding),
      `${step} must not run when its runtime bundle is absent`);
  }
});

test('a validated snap survives a snapcraft post-download cleanup failure', () => {
  const launchpad = code(job('snap-launchpad'));
  const success = launchpad.slice(
    launchpad.indexOf('snap_ok()'),
    launchpad.indexOf('if [ "$rc" -eq 0 ] && [ "${#snaps[@]}" -gt 0 ]'),
  );
  assert.ok(/if \[ "\$\{#snaps\[@\]\}" -gt 0 \] && snap_ok "\$\{snaps\[0\]\}"/.test(success),
    'artifact validity, not snapcraft cleanup status, determines build success');
  assert.ok(!/"\$rc" -eq 0/.test(success),
    'the success condition must accept a validated artifact after non-zero cleanup');
  assert.ok(/snapcraft exited \$rc during post-download cleanup/.test(success),
    'the non-zero cleanup is retained as a warning, not silently hidden');
  assert.ok(/snap_ok\(\)/.test(success) && /52428800/.test(success) && /hsqs/.test(success),
    'acceptance still requires a full-sized squashfs snap');
});

test('it names the secret it is missing, and the one Launchpad refused', () => {
  // A remote build needs BOTH: SNAP_AUTH to upload, LP_CREDENTIALS to build. The
  // arches that just moved here did not need LP_CREDENTIALS before, so a missing
  // one would otherwise read as an ordinary build failure.
  const launchpad = job('snap-launchpad');
  for (const secret of ['SNAP_AUTH', 'LP_CREDENTIALS']) {
    assert.ok(launchpad.includes(`missing="$missing ${secret}"`),
      `the first step must name ${secret} when it is unset`);
  }
  assert.ok(/base64 -d/.test(launchpad), 'and decode LP_CREDENTIALS rather than trust it');
  assert.ok(/LP_CREDENTIALS may not work/.test(launchpad),
    'and say so when Launchpad answers unauthorized');
  // Changed deliberately after v10.48: the upload step used to print "SNAP_AUTH
  // did not work" for a snap that was never built, because its existence test was
  // a literal filename in an array (see the test below). "The build produced
  // nothing" and "the store said no" are two different problems with two different
  // owners, so they are now two different messages - and the store one still names
  // the secret and the command that re-exports it.
  assert.ok(/This is NOT a SNAP_AUTH problem/.test(launchpad),
    'a missing artifact must NOT be reported as a credential failure');
  assert.ok(/The Snap Store refused the upload/.test(launchpad),
    'and a real refusal by the store is its own message');
  assert.ok(/snapcraft export-login --snaps wekan,wekan-ondra,wekan-gantt-gpl/.test(launchpad),
    'which says how to fix it - and for ALL THREE snap names, since one release '
    + 'publishes wekan, wekan-ondra and wekan-gantt-gpl');
  assert.ok(/Credentials could not be parsed/.test(launchpad),
    'and tells an unreadable credential apart from a refused one: v10.50 built '
    + 'every snap and then died on "Credentials could not be parsed", which is '
    + 'snapcraft unable to read SNAP_AUTH, not the store refusing anything');
});

test('a remote build that produced no .snap is a failure, not a silent success', () => {
  // remote-build can exit 0 having only downloaded logs. Uploading nothing is how
  // "is not a valid file" (snapcraft upload, exit 64) used to end a release.
  const launchpad = job('snap-launchpad');
  assert.ok(/No wekan_\$\{VERSION\}_\$\{\{ matrix\.arch \}\}\.snap to upload/.test(launchpad),
    'the upload step must refuse to run without the file');
  assert.ok(/failed after \$attempts attempts/.test(launchpad), 'and the build step must retry');

  // v10.48: every one of those tests was `snaps=( wekan_${VERSION}_<arch>.snap )`
  // followed by a count. That string has no wildcard, so it is a literal filename,
  // `shopt -s nullglob` cannot empty a literal, and the count was ALWAYS 1 - s390x
  // reported "succeeded" over an empty artifact list and uploaded a file that did
  // not exist. Every array built from a .snap name must therefore be a real GLOB.
  const arrays = [...code(launchpad).matchAll(/snaps=\(([^)]*)\)/g)].map(m => m[1].trim());
  assert.ok(arrays.length >= 3, 'the build, upload and attach steps each look for the file');
  for (const a of arrays) {
    assert.ok(a.includes('*'),
      `"snaps=( ${a} )" has no wildcard, so it is a literal filename that always `
      + 'exists as a string - nullglob cannot empty it and the count is always 1');
  }
  // And the count alone is not enough: an empty file passes it.
  assert.ok(/\[ -s "\$\{snaps\[0\]\}" \]/.test(code(launchpad)),
    'the file must also be non-empty before it is uploaded or attached');

  // ...and every one of those lists is DEDUPLICATED. The two patterns match the
  // same file - `wekan_10.91_s390x.snap` matches both - so the array held one
  // path twice, and `gh release upload --clobber` was asked to attach one name
  // twice: it deleted the asset it had just uploaded and 404'd on it.
  //
  //   HTTP 404: Not Found (https://uploads.github.com/repos/wekan/wekan/
  //   releases/370103352/assets?label=&name=wekan_10.91_s390x.snap)
  //
  // v10.91 lost s390x, ppc64el and riscv64 from the GitHub Release that way,
  // having built all three and published all three to the Snap Store.
  for (const a of arrays) {
    assert.ok(/sort -u/.test(a),
      `"snaps=( ${a} )" is not deduplicated: the two patterns match the same file, `
      + 'and uploading one name twice deletes the asset and then 404s on it');
  }

  // ...and the attach is confirmed from the OTHER side, the way the native snap
  // job already did. An upload that reports success and leaves no asset behind
  // is the failure nobody notices until a download 404s - and the three v10.91
  // architectures that went missing had each said "built" and "published to the
  // Snap Store" in the same job.
  const attach = launchpad.slice(launchpad.indexOf('Attach the ${{ matrix.arch }} snap'));
  assert.ok(/gh release view[\s\S]{0,200}--json assets/.test(attach),
    'the attach step reads back the release assets');
  assert.ok(/is not listed in release v\$\{VERSION\} although the upload reported success/.test(attach),
    'and fails when its own snap is not among them');
});

test('a queued riscv64 build cannot reach publish steps without an artifact', () => {
  const launchpad = job('snap-launchpad');
  assert.ok(/id: launchpad/.test(launchpad), 'the build step exposes its outcome');
  for (const name of ['Push ${{ matrix.arch }} to the Snap Store', 'Attach the ${{ matrix.arch }} snap']) {
    const at = launchpad.indexOf(`- name: ${name}`);
    assert.notStrictEqual(at, -1, `${name} exists`);
    assert.match(launchpad.slice(at, at + 260),
      /steps\.launchpad\.outputs\.built == 'true'/,
      `${name} must be skipped while Launchpad is only queued`);
  }
});

test('the Launchpad build log is printed whenever there is no snap', () => {
  // It is downloaded by remote-build and is the only thing that says WHY a build
  // stopped. v10.48 fetched it, exited 0 (see above) and threw it away, so three
  // "Stopped" builds left no trace of their reason anywhere.
  const launchpad = job('snap-launchpad');
  const build = launchpad.slice(launchpad.indexOf('Build the ${{ matrix.arch }} snap on Launchpad'));
  const loop = build.slice(0, build.indexOf('- name: Push'));
  assert.ok(/for log in snapcraft-wekan-\*\.txt/.test(loop), 'the downloaded log is read');
  assert.ok(/exited 0 but produced NO \.snap/.test(loop),
    'and the "exit 0, no artifact" case says so in words instead of passing');
  assert.ok(loop.indexOf('for log in snapcraft-wekan-*.txt') > loop.indexOf('exited 0 but produced NO .snap'),
    'the log is printed on that path too, not only when snapcraft exits non-zero');
});

test('every snap the release publishes is core24, and goes to all four channels', () => {
  // core24 is a released base, so the snap may carry `grade: stable` and be
  // accepted by the stable and candidate channels. core26 is still experimental:
  // `build-base: devel` forces `grade: devel`, and a devel-grade snap is refused
  // by stable and candidate - it can only go to beta and edge. So the release
  // builds core24, and publishes stable + candidate + beta + edge everywhere:
  // the default snap on native arches, the Launchpad arches, and the wekan-ondra
  // / wekan-gantt-gpl variants.
  assert.ok(/^base: core24$/m.test(snapcraft), 'snapcraft.yaml is built on core24');
  assert.ok(/^grade: stable$/m.test(snapcraft), 'and is grade: stable, or stable refuses it');
  assert.ok(!/^build-base:/m.test(snapcraft), 'a build-base would force grade: devel');

  // `release: ` also occurs in ordinary English inside a run: block ("is not
  // built this release. No Node.js ..."), and that is not a channel list. Keep
  // only the matches that actually name a channel - a publish that lists too FEW
  // channels still names one, so nothing this guard is for slips through.
  const CHANNELS = ['stable', 'candidate', 'beta', 'edge'];
  const publishes = [...code(workflow).matchAll(/(?:--release=|release: )([a-z,]+)/g)]
    .map(m => m[1])
    .filter(v => v.split(',').some(c => CHANNELS.includes(c)));
  assert.ok(publishes.length >= 3,
    'the native, Launchpad and variant snap jobs each publish somewhere');
  for (const channels of publishes) {
    assert.deepStrictEqual(channels.split(',').sort(), ['beta', 'candidate', 'edge', 'stable'],
      `"${channels}" is not all four channels`);
  }

  // And nothing BUILDS the core26 file, which could only reach beta/edge. The
  // variant sync renames the snap inside it, which is the one line that may
  // mention it.
  const mentions = code(workflow).split('\n').filter(l => l.includes('snapcraft-core26.yaml'));
  for (const line of mentions) {
    assert.ok(/for f in |sed /.test(line),
      `snapcraft-core26.yaml is only renamed, never built:\n      ${line.trim()}`);
  }
});

test('the next base declares the same architectures as the current one', () => {
  // snapcraft-core26.yaml is the SAME WeKan on the next base, kept so the move
  // can be tested before it is made. It is not built by the release (the guard
  // above), which is exactly why an architecture can go missing from it without
  // anything failing - and then reappear as a silently dropped platform on the
  // day core26 becomes the base. That is how it stood: core24 declared six and
  // core26 declared five, with armhf the one missing, and the only symptom would
  // have been an armhf column in the store going stale like wekan-ondra's.
  const core26 = read('snapcraft-core26.yaml');
  // Both files use the `platforms:` key - snapcraft 8 took it for core24 as well,
  // as snapcraft.yaml's own comment says - and both list the architecture as a
  // key with build-on/build-for under it, so read the keys of that block.
  const archesOf = (text, key) => {
    const start = text.indexOf(`\n${key}:\n`);
    assert.notStrictEqual(start, -1, `no ${key}: block`);
    const rest = text.slice(start + 1);
    const end = rest.search(/\n[a-z-]+:\n/);
    const block = end === -1 ? rest : rest.slice(0, end);
    return [...block.matchAll(/^ {2}([a-z0-9]+):$/gm)].map(m => m[1]).sort();
  };
  const current = archesOf(snapcraft, 'platforms');
  const next = archesOf(core26, 'platforms');
  assert.deepStrictEqual(current, ['amd64', 'arm64', 'armhf', 'ppc64el', 'riscv64', 's390x'],
    'snapcraft.yaml declares the six architectures the store gets');
  assert.deepStrictEqual(next, current,
    'snapcraft-core26.yaml must declare the same architectures as snapcraft.yaml, '
    + 'or moving to that base silently drops the ones it forgot');
});

test('snap assembly reuses prebuilt bundles instead of rebuilding npm dependencies', () => {
  for (const file of ['snapcraft.yaml', 'snapcraft-core26.yaml']) {
    const yaml = read(file);
    const partAt = yaml.indexOf('\n    wekan:\n');
    assert.notStrictEqual(partAt, -1, `${file} has no wekan part`);
    const nextPart = yaml.indexOf('\n    helpers:\n', partAt);
    const part = code(yaml.slice(partAt, nextPart));

    assert.match(part, /\n\s+plugin: nil\n/,
      `${file}: a prebuilt bundle needs no npm plugin toolchain`);
    assert.doesNotMatch(part, /npm-node-version|npm-include-node|\bnpm (?:install|pack)\b/,
      `${file}: Launchpad must not repeat the npm work completed by build-extra-arches`);
    assert.doesNotMatch(part, /rm -rf node_modules/,
      `${file}: the completed architecture-correct dependency tree must be retained`);
    assert.match(part, /cp -r bundle\/\* \$SNAPCRAFT_PART_INSTALL\//,
      `${file}: the prebuilt bundle is still copied into the snap`);

    const buildPackages = part.slice(part.indexOf('build-packages:'),
      part.indexOf('stage-packages:'));
    for (const unnecessary of ['build-essential', 'python3', 'g++', 'capnproto', 'nodejs', 'npm']) {
      assert.doesNotMatch(buildPackages, new RegExp(`- ${unnecessary.replace('+', '\\+')}(?:\\s|$)`),
        `${file}: ${unnecessary} is unnecessary when Launchpad only unpacks the bundle`);
    }
  }
});

test('large snaps use faster LZO compression', () => {
  for (const file of ['snapcraft.yaml', 'snapcraft-core26.yaml']) {
    assert.match(read(file), /^compression: lzo$/m,
      `${file}: default XZ spends avoidable CPU time packing the large WeKan tree`);
  }
});

test('the mongodb part cannot stage bin as a symlink', () => {
  // The s390x build died right after "Staging mongodb":
  //     /build/.../stage/bin: Is a directory
  //     IsADirectoryError: filename: '/build/.../stage/bin'
  //
  // Its stage-packages unpack an Ubuntu 24.04 merged-/usr layout, which leaves
  // `bin` as a symlink to usr/bin. On amd64 and arm64 the build replaces it
  // with a real directory when it copies mongod in; on the FerretDB-only arches
  // - s390x, ppc64el, riscv64 - MongoDB ships no server, the build exits before
  // that, and the symlink survives. Staging a bin SYMLINK over the real
  // stage/bin DIRECTORY an earlier part already staged is what fails, and it
  // fails the WHOLE snap, not just this part.
  const yaml = fs.readFileSync(path.join(repoRoot, 'snapcraft.yaml'), 'utf8');
  const partAt = yaml.indexOf('\n    mongodb:\n        plugin: nil');
  assert.notStrictEqual(partAt, -1, 'the mongodb part must be there');
  const part = yaml.slice(partAt, yaml.indexOf('\n    migratemongo:', partAt));

  // It still stages bin - the amd64/arm64 binaries live there...
  assert.ok(/stage:\n\s+- bin\n/.test(part), 'it stages bin');
  // ...so it must guarantee bin is a real directory by then.
  assert.ok(/override-stage: \|/.test(part), 'and it takes over the stage step to do it');

  const stageAt = part.indexOf('override-stage: |');
  const stage = code(part.slice(stageAt, part.indexOf('\n        stage:', stageAt)));

  // CHANGED after v10.71, and this is the reason. The first fix tested for a
  // symlink and nothing else - `if [ -L ... ]` - and the v10.71 logs show that
  // test running, coming out FALSE on s390x, ppc64el and riscv64, and the build
  // dying in exactly the same IsADirectoryError immediately after it. So `bin`
  // was some other thing that is not a directory, the symlink was only the
  // shape the FIRST failure happened to have, and a guard written to one shape
  // of a failure is a guard that passes while the build breaks. What the part
  // needs is the invariant, not the diagnosis: when this part carries no mongod,
  // bin is an empty real directory whatever it was before.
  assert.ok(/if \[ ! -f "\$\{CRAFT_PART_INSTALL\}\/bin\/mongod" \]/.test(stage),
    'the condition is "this part has no mongod", which covers every shape bin '
    + 'can have - symlink, regular file, or missing - not just the symlink');
  assert.ok(!/if \[ -L "\$\{CRAFT_PART_INSTALL\}\/bin" \]/.test(stage),
    'the symlink-only test is what let v10.71 through; it must not come back');
  assert.ok(/rm -rf "\$\{CRAFT_PART_INSTALL\}\/bin"/.test(stage),
    'removing first - mkdir -p FOLLOWS a symlink and would change nothing - and '
    + 'rm -rf takes a directory or a regular file too, where rm -f took neither');
  assert.ok(/mkdir -p "\$\{CRAFT_PART_INSTALL\}\/bin"/.test(stage),
    'then a real directory, which merges into stage/bin without changing it');
  assert.ok((stage.match(/ls -ld "\$\{CRAFT_PART_INSTALL\}\/bin"/g) || []).length >= 2,
    'and it prints what bin was before and after: the reason this took two '
    + 'attempts is that no log ever said what the thing actually was');
  assert.ok(/craftctl default/.test(stage),
    'and then staging normally - an override-stage that forgets this stages nothing at all');

  // The arch split that creates the situation is still the one described above:
  // a case with amd64 and arm64, and everything else exiting early.
  assert.ok(/No MongoDB server for \$\{CRAFT_ARCH_BUILD_FOR\}/.test(part),
    'the FerretDB-only arches still skip mongod');
});

test('the mongodb stage-packages are the names noble actually publishes', () => {
  // v10.71 armhf never got as far as building anything:
  //     Stage package not found in part 'mongodb': libssl3.
  //     Stage package not found in part 'mongodb': libgoogle-perftools4.
  // Ubuntu 24.04's 64-bit time_t transition renamed both to `...t64`. On the
  // 64-bit architectures the renamed package also PROVIDES the old name, so the
  // old spelling resolves there and the mistake is invisible; on armhf the ABI
  // genuinely changed, there is no compatibility provide, and the old name does
  // not exist. Checked against the noble archive: libssl3t64 is published for
  // all seven architectures and libgoogle-perftools4t64 for every one that
  // builds a snap.
  // BOTH snapcraft files, not just the one the release builds: core26 is the next
  // base, it declares armhf as well now, and it carried the pre-t64 names - so a
  // move to that base would have re-found this exact failure on this exact
  // architecture.
  for (const file of ['snapcraft.yaml', 'snapcraft-core26.yaml']) {
  const yaml = fs.readFileSync(path.join(repoRoot, file), 'utf8');
  const partAt = yaml.indexOf('\n    mongodb:\n        plugin: nil');
  assert.notStrictEqual(partAt, -1, `${file} has no mongodb part`);
  const nextPart = yaml.indexOf('\n    migratemongo:', partAt);
  const part = yaml.slice(partAt, nextPart === -1 ? undefined : nextPart);
  const listAt = part.indexOf('stage-packages:');
  const pkgs = [...code(part.slice(listAt, part.indexOf('override-build:', listAt)))
    .matchAll(/^\s+- (\S+)$/gm)].map(m => m[1]);
  assert.ok(pkgs.length > 5, `the stage-packages list must still be there in ${file}`);

  for (const [wrong, right] of [['libssl3', 'libssl3t64'],
                                ['libcurl4', 'libcurl4t64'],
                                ['libgoogle-perftools4', 'libgoogle-perftools4t64']]) {
    assert.ok(pkgs.includes(right), `${file}: ${right} is the name noble publishes on every snap arch`);
    assert.ok(!pkgs.includes(wrong),
      `${file}: ${wrong} resolves on the 64-bit arches through a compatibility provide and `
      + 'fails on armhf, which is a build that breaks on one architecture only');
  }
  }
});

test('the caddy part resolves its version without the GitHub API', () => {
  // v10.71's wekan-gantt-gpl amd64 snap died on one line of this part:
  //     curl: (22) The requested URL returned error: 403
  // api.github.com rate-limits unauthenticated callers by IP and a CI runner
  // shares its address with every other job on the host. The pinned fallback
  // was already there, on the very next line, and never ran: snapcraft runs a
  // scriptlet under `set -o pipefail`, so the 403 failed the ASSIGNMENT and
  // `set -e` ended the part one line above its own safety net.
  const yaml = fs.readFileSync(path.join(repoRoot, 'snapcraft.yaml'), 'utf8');
  const caddy = code(yaml.slice(yaml.indexOf('\n    caddy:\n')));

  assert.ok(!/api\.github\.com/.test(caddy),
    'nothing the shell RUNS may call api.github.com - the comment above it may '
    + 'name the API, since it is explaining what broke');
  assert.ok(/releases\/latest/.test(caddy) && /url_effective/.test(caddy),
    'the version comes from the releases/latest REDIRECT, which is not the API '
    + 'and is not rate-limited the same way');
  assert.ok(/\|\| true/.test(caddy),
    'and the lookup is allowed to fail: without that, pipefail plus set -e ends '
    + 'the part before the fallback, which is exactly what happened');
  assert.ok(/CADDY_PINNED_VERSION="\d+\.\d+\.\d+"/.test(caddy),
    'there is a pinned version to fall back to');
  assert.ok(/CADDY_VERSION="\$\{CADDY_PINNED_VERSION\}"/.test(caddy),
    'and something actually falls back to it - a pin nothing assigns is a comment');
  assert.ok(/if \[ -n "\$\{CADDY_VERSION:-\}" \]/.test(caddy),
    'CADDY_VERSION from the environment still wins, for a reproducible build');
});

test('the Launchpad build logs outlive the job that made them', () => {
  // The Launchpad build log is deleted with the temporary snap recipe, so when
  // v10.71 needed the mongodb part's output from an hour before the failure,
  // the only copy that had ever existed was a 150-line tail in a job log.
  const launchpad = job('snap-launchpad');
  assert.ok(/uses: actions\/upload-artifact/.test(launchpad),
    'the full logs must be uploaded as an artifact');
  assert.ok(/name: snap-launchpad-logs-\$\{\{ matrix\.arch \}\}/.test(launchpad),
    'one artifact per arch, or six jobs collide on one name');
  const collectAt = launchpad.indexOf('Collect the FULL build logs');
  assert.notStrictEqual(collectAt, -1, 'the logs are collected into a directory first');
  assert.ok(/if: always\(\)/.test(launchpad.slice(collectAt)),
    'always(), not failure(): a build that succeeded on attempt 2 still hides why '
    + 'attempt 1 did not');
  // And the excerpt in the job log itself must not be a blind tail any more.
  assert.ok(/grep -n -E -B 5 -A 20 'Build failed\|/.test(launchpad),
    'the job log prints the lines around the failure markers, not only the tail: '
    + 'in v10.71 the tail was 150 lines of lpbuildd traceback');
});

test('every platform is in all the places that build it', () => {
  // One release, four lists that have to agree: the bundle matrix in
  // release-all.yml, the snap `platforms:` block and arch case in
  // snapcraft.yaml, the snap-launchpad matrix, and the docker --platform list.
  // They used to be edited one at a time, which is how an arch ends up with a
  // .zip and no snap, or a snap that downloads a bundle nobody built.
  const wf = fs.readFileSync(path.join(repoRoot, '.github/workflows/release-all.yml'), 'utf8');
  const snap = fs.readFileSync(path.join(repoRoot, 'snapcraft.yaml'), 'utf8');

  // The bundles built by the extra-arches job (the non-native Linux ones).
  const extra = wf.slice(wf.indexOf('  build-extra-arches:'));
  const matrix = extra.slice(0, extra.indexOf('    steps:'));
  const bundles = [...matrix.matchAll(/^ +- arch: (\S+)$/gm)].map(m => m[1]);
  assert.deepStrictEqual(bundles,
    ['s390x', 'ppc64le', 'riscv64', 'i386', 'armv6', 'armhf', 'armv7', 'loong64'],
    'the non-native Linux bundles');

  // Every one of them names all three things it needs, and they are distinct
  // vocabularies: Node says x86 and armv7l where we and FerretDB say i386 and
  // armhf, so a row that omitted one would download another CPU's binary.
  for (const key of ['platform', 'node_arch', 'ferretdb_arch']) {
    const n = (matrix.match(new RegExp(`^ +${key}: `, 'gm')) || []).length;
    assert.strictEqual(n, bundles.length, `every bundle row names ${key}`);
  }

  // The snap: `platforms:` and the arch case in the wekan part must list the
  // same set, and every snap arch must have a bundle to build from. Snap names
  // ppc64le "ppc64el"; loong64 is not a snap architecture at all.
  const toSnap = a => (a === 'ppc64le' ? 'ppc64el' : a);
  const snapPlatforms = [...snap.slice(snap.indexOf('\nplatforms:'), snap.indexOf('\nplugs:'))
    .matchAll(/^  ([a-z0-9]+):$/gm)].map(m => m[1]);
  const launchpad = /arch: \[([^\]]+)\]/.exec(wf);
  assert.ok(launchpad, 'the snap-launchpad matrix must be there');
  const lpArches = launchpad[1].split(',').map(x => x.trim());

  for (const arch of bundles) {
    if (arch === 'loong64') {
      assert.ok(!snapPlatforms.includes('loong64'), 'loong64 is not a snap architecture');
      continue;
    }
    if (arch === 'i386') {
      // i386 has a BUNDLE (debian:trixie builds it) but NOT a snap: core24 has
      // no i386 port, so an i386 snap platform is a snapcraft parse error (see
      // the platforms test above). So, like loong64, it is deliberately neither
      // a snap platform nor a Launchpad arch.
      assert.ok(!snapPlatforms.includes('i386'),
        'i386 is not a snap platform (core24 has no i386 port)');
      assert.ok(!lpArches.includes('i386'), 'i386 is not built on Launchpad');
      continue;
    }
    if (arch === 'armv6') {
      // armv6 has a BUNDLE (Raspberry Pi 1 and Zero, on wekan/node-patches'
      // node-armv6) but no snap and never can: the Snap Store has no armv6
      // architecture at all - its only 32-bit ARM is armhf, which is ARMv7-A
      // hard-float and will not run on an ARMv6 board. Bundle zip and a
      // linux/arm/v6 Docker image only. models/lib/snapArchitectures.js records
      // the same reason in NOT_SNAP_ARCHITECTURES.
      assert.ok(!snapPlatforms.includes('armv6'),
        'armv6 is not a snap platform (the Snap Store has no armv6)');
      assert.ok(!lpArches.includes('armv6'), 'armv6 is not built on Launchpad');
      continue;
    }
    if (arch === 'armv7') {
      // armv7 has its OWN bundle (the fork's node-armv7) but no separate snap:
      // the snap's 32-bit ARM platform is armhf, so armv7 is neither a snap
      // platform nor a Launchpad arch of its own - it is a .zip bundle only.
      assert.ok(!snapPlatforms.includes('armv7'),
        'armv7 is not a snap platform (armhf is the snap 32-bit ARM)');
      assert.ok(!lpArches.includes('armv7'), 'armv7 is not built on Launchpad');
      continue;
    }
    assert.ok(snapPlatforms.includes(toSnap(arch)), `${arch} must be a snap platform`);
    assert.ok(lpArches.includes(toSnap(arch)), `${arch} must be built on Launchpad`);
    assert.ok(new RegExp(`^\\s+${toSnap(arch)}\\)\\s+WEKAN_ARCH=`, 'm').test(snap),
      `${arch} must map to a bundle name in the wekan part`);
  }
  // ...and nothing in the snap that has no bundle behind it.
  for (const arch of snapPlatforms.filter(a => !['amd64', 'arm64'].includes(a))) {
    const asBundle = arch === 'ppc64el' ? 'ppc64le' : arch;
    assert.ok(bundles.includes(asBundle), `snap arch ${arch} has no bundle job`);
  }

  // Docker: the platform set is DECIDED at run time from the bundles that landed
  // (see release-all.yml's "Decide which platforms" step and
  // releaseDockerPlatforms.test.cjs), so buildx uses --platform "${PLATFORMS}"
  // and the verify uses want="${WANT}" - built and verified from one variable,
  // so they cannot disagree. Here just cross-check that every EXOTIC docker
  // candidate has an extra-arches bundle behind it (the docker image downloads
  // wekan-<v>-<arch>.zip). amd64/arm64 are native (not extra-arch) bundles.
  const dockerJob = (() => {
    const s = wf.indexOf('\n  docker:\n');
    const rest = wf.slice(s + 1);
    const n = rest.search(/\n  [a-z0-9-]+:\n/);
    return n === -1 ? rest : rest.slice(0, n);
  })();
  assert.ok(/--platform\s+"\$\{PLATFORMS\}"/.test(dockerJob),
    'buildx must build the decided set --platform "${PLATFORMS}"');
  assert.ok(/want="\$\{WANT\}"/.test(dockerJob),
    'the push verify must use the same decided set want="${WANT}"');
  // The optional docker platforms, as <plat>:<bundle-arch> pairs.
  const opt = /\n\s*opt="([^"]+)"/.exec(dockerJob);
  assert.ok(opt, 'the Decide step must list optional docker platforms in opt="..."');
  for (const tok of opt[1].trim().split(/\s+/)) {
    const bundleArch = tok.split(':')[1];
    assert.ok(bundles.includes(bundleArch),
      `docker exotic platform ${tok} has no extra-arches bundle "${bundleArch}" to build from`);
  }
});

test('a remote build that never starts still says why', () => {
  // v10.55 riscv64 failed three times with one line and nothing else:
  //   "Git operation failed with: Could not push 'HEAD' to git.launchpad.net/..."
  // The build never started, so there was no Launchpad build log to print - and
  // snapcraft had put git's own message in its execution log, named it in the
  // output, and nobody read it.
  const launchpad = job('snap-launchpad');
  assert.ok(/\.local\/state\/snapcraft\/log/.test(launchpad),
    "snapcraft's own execution log must be printed when an attempt fails");
  assert.ok(/snapcraft-wekan-\*\.txt/.test(launchpad),
    'and the Launchpad build log, for the builds that did start');

  // A retry has to start from nothing: snapcraft keeps a local clone of the
  // Launchpad repository, and reusing a half-pushed one repeats the failure -
  // which is what three identical attempts sixteen minutes apart look like.
  assert.ok(/rm -rf "\$HOME\/\.cache\/snapcraft\/remote-build"/.test(launchpad),
    'the remote-build cache is cleared between attempts');
  const clearAt = launchpad.indexOf('rm -rf "$HOME/.cache/snapcraft/remote-build"');
  const sleepAt = launchpad.indexOf('sleep 60');
  assert.ok(clearAt !== -1 && clearAt < sleepAt,
    '...before the wait, so the next attempt starts clean rather than after it');
});

console.log(`\n${passed} tests passed`);
