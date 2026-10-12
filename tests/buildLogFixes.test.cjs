'use strict';
// Execute the affected workflow boundaries without Docker, credentials or uploads.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(root, '.tools/tmp/build-log-tests-'));
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
function step(file, title) {
  const body = read(file).split(`      - name: ${title}\n`)[1].split('\n      - ')[0];
  return body.split('        run: |\n')[1].split('\n').map(l => l.slice(10)).join('\n');
}
function executable(file, source) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, source, { mode: 0o755 });
}
const env = { ...process.env, PATH: path.join(tmp, 'bin') + path.delimiter + process.env.PATH,
  GITHUB_ENV: path.join(tmp, 'github-env'), TARGET: 'android-arm64', TARGET_PLATFORM: 'android',
  TARGET_ARCH: 'arm64', RELEASE_TAG: 'v12.37', TERMUX_ARCH: 'aarch64' };
try {
  fs.mkdirSync(path.join(tmp, 'bundle'));
  // Mirror Termux's env -i at its privilege boundary; no real container is run.
  executable(path.join(tmp, 'bin/docker'), `#!/usr/bin/env python3
import os, subprocess, sys
args = sys.argv[1:]
index = next(i for i, arg in enumerate(args) if arg.startswith('termux/termux-docker:'))
sys.exit(subprocess.run(args[index+1:], env={'PATH': os.environ['PATH']}).returncode)
`);
  executable(path.join(tmp, 'bin/apt-get'), '#!/bin/sh\nexit 0\n');
  executable(path.join(tmp, 'releases/bun/build-target.sh'), `#!/bin/bash
set -eu
[ "$TARGET" = android-arm64 ]
[ "$TARGET_PLATFORM" = android ]
[ "$TARGET_ARCH" = arm64 ]
[ "$RELEASE_TAG" = v12.37 ]
[ "$DO_NOT_TRACK" = 1 ]
echo metadata-preserved
`);
  const android = step('.github/workflows/bun.yml', 'Native Android Bionic build and smoke tests');
  const runAndroid = code => spawnSync('bash', ['-ec', code], { cwd: tmp, env, encoding: 'utf8' });
  const positive = runAndroid(android);
  assert.equal(positive.status, 0, positive.stdout + positive.stderr);
  assert.match(positive.stdout, /metadata-preserved/);
  const control = android.replace(/ env \\\n[\s\S]*?DO_NOT_TRACK=1 bash -ec/, ' bash -ec');
  assert.notEqual(control, android);
  assert.notEqual(runAndroid(control).status, 0, 'Docker -e alone must reproduce the lost environment');

  // The i386 bundle was attached 13 minutes before AppImage incorrectly skipped it.
  executable(path.join(tmp, 'bin/gh'), `#!/usr/bin/env python3
import os, sys
assert sys.argv.count('--repo') == 1
if os.environ['ASSET_CASE'] == 'error': sys.exit(9)
if os.environ['ASSET_CASE'] == 'present': print('wekan-12.37-i386.zip', flush=True)
# Large multi-write response catches early-closing grep/pipefail regressions.
for i in range(20000): print('other-asset-' + str(i))
`);
  const gate = step('.github/workflows/AppImage.yml', 'Skip this arch if its release bundle is not published yet')
    .replaceAll('${{ needs.release.outputs.version }}', '12.37')
    .replaceAll('${{ needs.release.outputs.tag }}', 'v12.37')
    .replaceAll('${{ matrix.bundle_arch }}', 'i386')
    .replaceAll('${{ github.repository }}', 'wekan/wekan');
  for (const kind of ['present', 'missing', 'error']) {
    fs.writeFileSync(env.GITHUB_ENV, '');
    const result = spawnSync('bash', ['-ec', gate], { cwd: tmp, env: { ...env, ASSET_CASE: kind }, encoding: 'utf8' });
    assert.equal(result.status === 0, kind !== 'error', result.stdout + result.stderr);
    assert.equal(fs.readFileSync(env.GITHUB_ENV, 'utf8').includes('BUILD_THIS=false'), kind === 'missing');
  }

  // Probes must exit after a successful require, rebuild on load errors and
  // terminate an addon stuck inside native initialization (no event-loop timer).
  const probeTest = path.join(tmp, 'probe.mjs');
  fs.writeFileSync(path.join(tmp, 'ok.cjs'), 'setInterval(() => {}, 1000);');
  fs.writeFileSync(path.join(tmp, 'bad.cjs'), 'throw new Error("bad native addon");');
  fs.writeFileSync(path.join(tmp, 'hung.cjs'), 'while (true) {}');
  fs.writeFileSync(probeTest, `import { probeAddon, run } from ${JSON.stringify(pathToFileURL(path.join(root, 'releases/bun/rebuild.mjs')).href)};
import assert from 'node:assert/strict';
assert.equal(probeAddon(process.execPath, './ok.cjs', process.cwd(), 2000), true);
assert.equal(probeAddon(process.execPath, './bad.cjs', process.cwd(), 2000), false);
assert.equal(probeAddon(process.execPath, './hung.cjs', process.cwd(), 200), false);
assert.throws(() => run(process.execPath, ['-e', 'while(true) {}'], process.cwd(), {}, 200), /ETIMEDOUT/);
`);
  const probes = spawnSync(process.execPath, [probeTest], { cwd: tmp, encoding: 'utf8', timeout: 8000 });
  assert.equal(probes.status, 0, probes.stdout + probes.stderr);
  assert.match(read('releases/bun/build-target.sh'), /node releases\/bun\/run-native-check.mjs/);
  assert.match(read('releases/bun/run-native-check.mjs'), /180000/);
  console.log('Android env reset, AppImage asset detection, and hung addon regression tests passed.');
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
