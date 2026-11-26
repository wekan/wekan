// wekan-ondra on EVERY architecture the wekan snap has, released to every
// channel like wekan. (wekan-gantt-gpl is no longer published: its users moved
// to the official wekan snap.)
//
// They had amd64 and arm64 only: snap-variants builds those two natively, and
// snap-launchpad - the only builder of armhf, ppc64el, s390x and riscv64 -
// built only the wekan name. And "Push Snap to Store" made a variant from the
// release's wekan snaps only when the release had NO variant at all, so a
// release with the amd64 and arm64 ones never got the others either. Pins:
// each snap-launchpad leg makes and publishes the variant from its own snap,
// snap-store.yml fills in each missing architecture (run here against a fake
// release), and Release All Missing expects them all.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const yaml = require('js-yaml');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const { snapArchitectures, SNAP_CHANNELS } = require('../models/lib/snapArchitectures');

const releaseAll = yaml.load(read('.github/workflows/release-all.yml'));
const snapStore = yaml.load(read('.github/workflows/snap-store.yml'));
const launchpad = releaseAll.jobs['snap-launchpad'];
const VARIANT_STEP = 'Publish wekan-ondra ${{ matrix.arch }} from this snap (all channels)';
const ALL_CHANNELS = [...SNAP_CHANNELS].sort().join(',');

test('the variants are made for every snap architecture: natively for two, from snap-launchpad for the rest', () => {
  const native = releaseAll.jobs['snap-variants'].strategy.matrix.include.map(leg => leg.arch);
  const covered = new Set([...native, ...launchpad.strategy.matrix.arch]);
  assert.deepEqual([...covered].sort(), [...snapArchitectures()].sort(),
    'snap-variants plus snap-launchpad must cover exactly models/lib/snapArchitectures.js');
  for (const arch of ['amd64', 'arm64', 'armhf', 'ppc64el', 's390x']) assert.ok(covered.has(arch), arch);
});

test('each snap-launchpad leg renames its own snap into the variant, publishes it to all channels and attaches it', () => {
  const steps = launchpad.steps.map(s => s.name);
  const at = steps.indexOf(VARIANT_STEP);
  assert.ok(at > steps.indexOf('Attach the ${{ matrix.arch }} snap to the GitHub Release'),
    'after the wekan snap is attached, so a variant failure cannot cost wekan its asset');
  const step = launchpad.steps[at];
  assert.match(step.if, /always\(\)/);
  assert.match(step.if, /steps\.launchpad\.outputs\.built == 'true'/);
  assert.equal(step.env.SNAPCRAFT_STORE_CREDENTIALS, '${{ secrets.SNAP_AUTH }}');
  const run = step.run;
  assert.match(run, /src="wekan_\$\{VERSION\}_\$\{MATRIX_ARCH\}\.snap"/);
  assert.match(run, /'wekan-ondra:Wekan Ondra'/);
  assert.doesNotMatch(run, /wekan-gantt-gpl/, 'wekan-gantt-gpl is no longer made');
  assert.match(run, /bash releases\/snap-rename\.sh "\$src" "\$name" "\$title" variant-snaps/);
  assert.match(run, /releases\/github-release-upload\.sh "\$\{GITHUB_REPOSITORY:-wekan\/wekan\}" "v\$\{VERSION\}" "\$out"/);
  const channels = run.match(/snap-upload-retry\.sh "\$out" (\S+)/);
  assert.ok(channels, 'the variant is uploaded with the retrying helper');
  assert.equal(channels[1].split(',').sort().join(','), ALL_CHANNELS, 'every channel, like wekan');
  // Negative: a failure is red and says so, instead of a green leg with a
  // variant missing.
  assert.match(run, /if \[ -n "\$failed" \]; then\n[^\n]*::error::[^\n]*\n\s*exit 1\n\s*fi\s*$/);
});

test('negative: the variant files cannot be picked up by the wekan push or attach of the same leg', () => {
  // Those steps glob *_<arch>.snap in the working directory; the variants are
  // written to variant-snaps/, so wekan is never uploaded as a variant twice
  // and a variant is never uploaded under the wekan steps.
  const run = launchpad.steps.find(s => s.name === VARIANT_STEP).run;
  assert.doesNotMatch(run, /snap-rename\.sh "\$src" "\$name" "\$title" \.\s*\)/);
  for (const name of ['Push ${{ matrix.arch }} to the Snap Store (stable + candidate + beta + edge)', 'Attach the ${{ matrix.arch }} snap to the GitHub Release']) {
    const glob = launchpad.steps.find(s => s.name === name).run;
    assert.doesNotMatch(glob, /variant-snaps/);
  }
});

// The "Download" step of snap-store.yml, run for real against a fake release.
function runDownload(snap, assets) {
  const dir = fs.mkdtempSync(path.join(ROOT, '.tools', 'tmp', 'snapvariants-'));
  try {
    const release = path.join(dir, 'release');
    const bin = path.join(dir, 'bin');
    const work = path.join(dir, 'work');
    for (const d of [release, bin, path.join(work, 'releases')]) fs.mkdirSync(d, { recursive: true });
    for (const a of assets) fs.writeFileSync(path.join(release, a), `hsqs ${a}`);
    // gh release download TAG --repo R --dir D --pattern P: copy matches, fail on none.
    fs.writeFileSync(path.join(bin, 'gh'), `#!/bin/bash
while [ $# -gt 0 ]; do case "$1" in --dir) d=$2; shift ;; --pattern) p=$2; shift ;; esac; shift; done
mkdir -p "$d"; n=0
for f in "${release}"/$p; do [ -e "$f" ] || continue; cp "$f" "$d/"; n=$((n+1)); done
[ "$n" -gt 0 ] || { echo "no assets match the file pattern" >&2; exit 1; }
`);
    fs.writeFileSync(path.join(bin, 'unsquashfs'), '#!/bin/bash\nexit 0\n');
    fs.writeFileSync(path.join(bin, 'sudo'), '#!/bin/bash\necho "sudo must not be needed" >&2; exit 1\n');
    // snap-rename.sh itself has its own test (tests/snapStorePush.test.cjs);
    // here it only records what it was asked to make.
    fs.writeFileSync(path.join(work, 'releases', 'snap-rename.sh'), `#!/bin/bash
rest=$(basename "$1"); rest=\${rest#wekan_}; mkdir -p "$4"; echo "$3" > "$4/$2_$rest"; echo "$4/$2_$rest"
`);
    for (const f of ['gh', 'unsquashfs', 'sudo']) fs.chmodSync(path.join(bin, f), 0o755);
    const step = snapStore.jobs.push.steps.find(s => /^Download /.test(s.name));
    const r = spawnSync('bash', ['-c', step.run], {
      cwd: work, encoding: 'utf8',
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, TAG: 'v13.30', SNAP: snap, GITHUB_REPOSITORY: 'wekan/wekan', GH_TOKEN: 'x' },
    });
    const snaps = fs.existsSync(path.join(work, 'snaps')) ? fs.readdirSync(path.join(work, 'snaps')).sort() : [];
    const made = snaps.filter(f => fs.readFileSync(path.join(work, 'snaps', f), 'utf8').trim() !== `hsqs ${f}`);
    return { status: r.status, out: r.stdout + r.stderr, snaps, made };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const wekanSnaps = snapArchitectures().map(a => `wekan_13.30_${a}.snap`);

test('Push Snap to Store makes every architecture of a variant the release lacks, keeping the ones it has', () => {
  const r = runDownload('wekan-ondra', [...wekanSnaps, 'wekan-ondra_13.30_amd64.snap', 'wekan-ondra_13.30_arm64.snap']);
  assert.equal(r.status, 0, r.out);
  assert.deepEqual(r.snaps, snapArchitectures().map(a => `wekan-ondra_13.30_${a}.snap`).sort());
  assert.deepEqual(r.made, ['wekan-ondra_13.30_armhf.snap', 'wekan-ondra_13.30_ppc64el.snap', 'wekan-ondra_13.30_riscv64.snap', 'wekan-ondra_13.30_s390x.snap'],
    'the attached amd64 and arm64 ones are pushed as they are; only the missing ones are made');
});

test('a release with no variant attached at all still gets all of them, under the right title', () => {
  const r = runDownload('wekan-ondra', wekanSnaps);
  assert.equal(r.status, 0, r.out);
  assert.equal(r.made.length, snapArchitectures().length);
});

test('negative: wekan itself is never renamed, and a release with nothing to push is red', () => {
  const ok = runDownload('wekan', wekanSnaps);
  assert.equal(ok.status, 0, ok.out);
  assert.deepEqual(ok.made, []);
  const none = runDownload('wekan', []);
  assert.notEqual(none.status, 0);
  assert.match(none.out, /has no wekan_\*\.snap to push/);
  const nothing = runDownload('wekan-ondra', []);
  assert.notEqual(nothing.status, 0);
  assert.match(nothing.out, /has neither wekan-ondra_\*\.snap nor a wekan_\*\.snap/);
});

test('Release All Missing expects the variant on every snap architecture, and no wekan-gantt-gpl', () => {
  const expected = spawnSync('bash', [path.join(ROOT, 'releases/expected-assets.sh'), '13.30'], { encoding: 'utf8' }).stdout;
  for (const arch of snapArchitectures()) {
    assert.match(expected, new RegExp(`^variant wekan-ondra:${arch} wekan-ondra_13\\.30_${arch}\\.snap nosums$`, 'm'));
  }
  assert.doesNotMatch(expected, /wekan-gantt-gpl/);
  for (const arch of snapArchitectures()) assert.match(expected, new RegExp(`^snap wekan:${arch} `, 'm'));
});

// "Push Snap to Store" releases the highest revision NUMBER of each
// architecture. Completing an older release after a newer one would upload an
// older version as the newest revision and take stable back to it.
test('negative: releases before v13.30 are not completed with the new architectures\' variants', () => {
  for (const [version, arches] of [['13.29', ['amd64', 'arm64']], ['13.21', ['amd64', 'arm64']], ['13.30', snapArchitectures()], ['14.00', snapArchitectures()]]) {
    const expected = spawnSync('bash', [path.join(ROOT, 'releases/expected-assets.sh'), version], { encoding: 'utf8' }).stdout;
    const got = [...expected.matchAll(/^variant wekan-ondra:(\S+) /gm)].map(m => m[1]).sort();
    assert.deepEqual(got, [...arches].sort(), `v${version}`);
  }
});

test('the store release covers both snaps on all four channels', () => {
  const store = releaseAll.jobs['snap-store'];
  assert.ok(store.needs.includes('snap-launchpad'), 'after the legs that now make the variants');
  assert.equal(store.with.snaps, 'wekan wekan-ondra');
  assert.equal(store.with.channels.split(',').sort().join(','), ALL_CHANNELS);
});
