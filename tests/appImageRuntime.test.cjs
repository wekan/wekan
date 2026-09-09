'use strict';

// Regression coverage for the two 32-bit failures seen in AppImage run
// 89470778656: i686 exhausted its address space during V8 snapshot startup,
// while armhf's outer runtime ran but its inner Node lacked a host loader.
// Run: node tests/appImageRuntime.test.cjs

const assert = require('assert');
const fs = require('fs');

const launcher = fs.readFileSync('releases/ferretdb/start-wekan.sh', 'utf8');
const workflow = fs.readFileSync('.github/workflows/AppImage.yml', 'utf8');
const releaseAll = fs.readFileSync('.github/workflows/release-all.yml', 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('appImageRuntime:');

test('32-bit bundled Node gets a safe automatic V8 heap ceiling', () => {
  assert.match(launcher, /file "\$NODE" \| grep -q 'ELF 32-bit'/);
  assert.match(launcher, /\[ "\$_heap_mb" -gt 1024 \] && _heap_mb=1024/);
  assert.ok(launcher.indexOf("grep -q 'ELF 32-bit'") < launcher.indexOf('export NODE_OPTIONS='));
});

test('explicit NODE_OPTIONS still overrides every automatic ceiling', () => {
  assert.match(launcher, /export NODE_OPTIONS="\$\{NODE_OPTIONS:---max-old-space-size=\$_heap_mb\}"/);
  assert.match(workflow, /\$\{NODE_OPTIONS:=--max-old-space-size=1024\}/,
    'AppRun must use assignment only when NODE_OPTIONS is unset or empty');
});

test('AppRun protects 32-bit images even when their published bundle predates the launcher fix', () => {
  assert.match(workflow, /case "@APPIMAGE_ARCH@" in\s*\n\s*i686\|armhf\)/);
  assert.match(workflow, /sed -i "s\/@APPIMAGE_ARCH@\/\$arch\/" AppDir\/AppRun/);
  assert.ok(workflow.indexOf('${NODE_OPTIONS:=--max-old-space-size=1024}')
    < workflow.indexOf('exec "$BUNDLE/start-wekan.sh" "$@"'));
});

test('AppImage smoke test probes the bundled runtime, not only its wrapper', () => {
  assert.match(workflow, /AppDir\/usr\/lib\/wekan\/bundle\/node --version/);
  assert.doesNotMatch(workflow, /"\$app" --appimage-help/);
});

test('a runnable inner Node is still followed by the real HTTP smoke test', () => {
  const probe = workflow.indexOf('AppDir/usr/lib/wekan/bundle/node --version');
  const launch = workflow.indexOf('APPIMAGE_EXTRACT_AND_RUN=1 "$app" > smoke.log');
  const curl = workflow.indexOf('http://localhost:8080/sign-in');
  assert.ok(probe >= 0 && probe < launch && launch < curl);
});

// #6699-style report: checkmk warned "/tmp/.mount_wekan.OhaGOG ... 100%
// used" because the AppImage runtime's own squashfs mount landed on a small
// /tmp. AppRun now relocates it to WRITABLE_PATH/app and sweeps out orphaned
// leftovers - AppImage-only, since no other WeKan platform mounts itself
// this way.
test('AppRun relocates its own mount to WRITABLE_PATH/app instead of /tmp', () => {
  const at = workflow.indexOf("WRITABLE_PATH:=");
  const block = workflow.slice(at, workflow.indexOf('${PORT:=8080}', at));
  assert.match(block, /APPIMAGE_TMP="\$WRITABLE_PATH\/app"/,
    'the relocated mount directory is under WRITABLE_PATH, not /tmp');
  assert.match(block, /export TMPDIR="\$APPIMAGE_TMP"/,
    'TMPDIR is what the AppImage runtime itself reads for where to mount');
  assert.match(block, /exec "\$APPIMAGE" "\$@"/,
    'it re-execs the same AppImage so the NEXT mount honors the new TMPDIR');
});

test('the relocation only fires once per launch, and never overrides an explicit TMPDIR', () => {
  const at = workflow.indexOf("WRITABLE_PATH:=");
  const block = workflow.slice(at, workflow.indexOf('${PORT:=8080}', at));
  assert.match(block, /\[ -z "\$\{TMPDIR:-\}" \]/,
    'an administrator who already set TMPDIR (even to /tmp) is left alone');
  assert.match(block, /\[ -n "\$\{APPIMAGE:-\}" \]/,
    'only a real mounted AppImage re-execs - AppRun run directly is untouched');
  assert.match(block, /WEKAN_APPIMAGE_RELOCATED.{0,20}!= "1"/s,
    'a marker guards against re-execing forever');
  assert.match(block, /export WEKAN_APPIMAGE_RELOCATED=1/);
});

test('only orphaned mount directories are removed, never a live one (negative)', () => {
  const at = workflow.indexOf("WRITABLE_PATH:=");
  const block = workflow.slice(at, workflow.indexOf('${PORT:=8080}', at));
  assert.match(block, /for d in \/tmp\/\.mount_\*\[Ee\]kan\*/,
    'only WeKan\'s own leftover mount directories are considered');
  assert.match(block, /\/proc\/mounts/,
    'a directory still listed as mounted is checked for, not assumed stale');
  assert.match(block, /rm -rf "\$d"/);
  // The check must gate the removal - "awk ... ; rm -rf" unconditionally would
  // delete a live mount out from under the instance running from it.
  const loopAt = block.indexOf('for d in /tmp/.mount_*[Ee]kan*');
  const loopBody = block.slice(loopAt, block.indexOf('done', loopAt));
  assert.match(loopBody, /if ! awk[\s\S]*then\s*\n\s*rm -rf/,
    'rm -rf only runs inside the "not currently mounted" branch');
});

test('the full release waits for every bundle that an AppImage wraps', () => {
  const job = releaseAll.match(/^  appimage:\n([\s\S]*?)(?=^  \S)/m);
  assert.ok(job, 'release-all.yml must contain an appimage job');
  assert.match(job[1], /needs: \[prepare, release, build-extra-arches\]/,
    'i686 and armhf bundles are attached by build-extra-arches');
  assert.match(job[1], /uses: \.\/\.github\/workflows\/AppImage\.yml/);
  assert.match(job[1], /contents: write/);
  assert.match(job[1], /tag: v\$\{\{ needs\.prepare\.outputs\.version \}\}/);
  assert.match(job[1], /publish: true/);
});

console.log(`\nappImageRuntime: ${passed} tests passed`);
