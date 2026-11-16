'use strict';

// docs/Security/Sandboxes/vscodium/vscodium-sandbox.sh closes the VSCodium
// Flatpak to this checkout, with ONE deliberate exception:
// --talk-name=org.freedesktop.Flatpak, so `flatpak-spawn --host docker ...`
// reaches the host's Docker and build.sh can run Playwright Firefox and WebKit
// in the Playwright image when they cannot start inside the sandbox.
// WEKAN_SANDBOX_HOST_DOCKER=0 must close that again. This runs the script with
// a stub `flatpak` in PATH and checks the arguments it would have passed.
// Run: node tests/vscodiumSandboxHostDocker.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const scriptPath = path.join(root, 'docs/Security/Sandboxes/vscodium/vscodium-sandbox.sh');
const readme = fs.readFileSync(path.join(root, 'docs/Security/Sandboxes/vscodium/README.md'), 'utf8');
const buildSh = fs.readFileSync(path.join(root, 'build.sh'), 'utf8');
let passed = 0;
const test = (name, fn) => { const r = fn(); if (r === 'skip') { console.log('  skip -', name); return; } passed += 1; console.log('  ok -', name); };

const tmpBase = path.join(root, '.tools', 'tmp');
fs.mkdirSync(tmpBase, { recursive: true });
const tmp = fs.mkdtempSync(path.join(tmpBase, 'vscodium-sandbox-test-'));
const stubDir = path.join(tmp, 'bin');
fs.mkdirSync(stubDir);
const logFile = path.join(tmp, 'flatpak.log');
// One line per `flatpak` call, its arguments separated by tabs.
fs.writeFileSync(path.join(stubDir, 'flatpak'),
  '#!/bin/sh\n(IFS="\t"; printf "%s\\n" "$*") >> "$FLATPAK_LOG"\n', { mode: 0o755 });

function overrideArgs(env) {
  fs.rmSync(logFile, { force: true });
  const r = spawnSync('bash', [scriptPath], {
    env: { ...process.env, ...env, PATH: `${stubDir}:${process.env.PATH}`, FLATPAK_LOG: logFile },
    encoding: 'utf8',
  });
  assert.strictEqual(r.status, 0, r.stderr);
  const calls = fs.readFileSync(logFile, 'utf8').trim().split('\n').map((l) => l.split('\t'));
  const override = calls.find((c) => c[0] === 'override' && c.includes('--nofilesystem=home'));
  assert.ok(override, 'the closing `flatpak override` was called');
  return override;
}

try {
  test('the script is bash (it uses an array) and parses', () => {
    assert.match(fs.readFileSync(scriptPath, 'utf8'), /^#!\/usr\/bin\/env bash\n/);
    assert.strictEqual(spawnSync('bash', ['-n', scriptPath]).status, 0);
  });

  test('by default the host Docker route is granted', () => {
    const args = overrideArgs({ WEKAN_SANDBOX_HOST_DOCKER: '' });
    assert.ok(args.includes('--talk-name=org.freedesktop.Flatpak'), args.join(' '));
    assert.ok(!args.includes('--no-talk-name=org.freedesktop.Flatpak'));
  });

  test('negative: WEKAN_SANDBOX_HOST_DOCKER=0 refuses it', () => {
    const args = overrideArgs({ WEKAN_SANDBOX_HOST_DOCKER: '0' });
    assert.ok(args.includes('--no-talk-name=org.freedesktop.Flatpak'), args.join(' '));
    assert.ok(!args.includes('--talk-name=org.freedesktop.Flatpak'));
  });

  test('negative: the grant opens nothing else - home, host and the SSH agent stay closed', () => {
    for (const env of [{ WEKAN_SANDBOX_HOST_DOCKER: '' }, { WEKAN_SANDBOX_HOST_DOCKER: '0' }]) {
      const args = overrideArgs(env);
      for (const closed of ['--nofilesystem=home', '--nofilesystem=host', '--nosocket=ssh-auth']) {
        assert.ok(args.includes(closed), `${closed} missing`);
      }
      assert.ok(!args.some((a) => /docker\.sock/.test(a)), 'no Docker socket is mounted');
      assert.ok(!args.some((a) => /^--filesystem=(home|host|~\/?$)/.test(a)), 'no home/host filesystem');
    }
  });

  test('build.sh reaches Docker through flatpak-spawn --host docker, not a general host shell', () => {
    assert.match(buildSh, /flatpak-spawn --host docker "\$@"/);
  });

  test('the README documents the grant, its cost and the opt-out', () => {
    assert.match(readme, /--talk-name=org\.freedesktop\.Flatpak/);
    assert.match(readme, /root-equivalent/);
    assert.match(readme, /WEKAN_SANDBOX_HOST_DOCKER=0/);
    assert.ok(!/Docker is NOT available inside this Flatpak sandbox/.test(readme), 'stale claim removed');
  });
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log(`vscodiumSandboxHostDocker: ${passed} passed`);
