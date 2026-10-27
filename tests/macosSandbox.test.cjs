'use strict';

// docs/Security/Sandboxes/macOS/sandbox.sh starts VSCodium under sandbox-exec
// so that it, its terminals and its extensions reach only this checkout - the
// macOS counterpart of the Linux Flatpak sandbox (README.md beside it).
// Run: node tests/macosSandbox.test.cjs

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'docs/Security/Sandboxes/macOS/sandbox.sh'), 'utf8');
let passed = 0;
const test = (name, fn) => { const r = fn(); if (r === 'skip') { console.log('  skip -', name); return; } passed += 1; console.log('  ok -', name); };

test('the profile refuses every user\'s files and opens only the checkout', () => {
  assert.match(script, /\(deny file-read\* file-write\* \(subpath "\/Users"\) \(subpath "\/Volumes"\)\)/);
  assert.match(script, /\(allow file-read\* file-write\* \(subpath \$\(sb_string "\$REPO"\)\)\)/);
  assert.match(script, /com\\\\\.apple\\\\\.launchd/, 'and the ssh-agent socket');
});

test('VSCodium runs with a clean environment, its data and temporary files in .tools', () => {
  assert.match(script, /sandbox-exec -f "\$PROFILE" \/usr\/bin\/env -i/);
  assert.match(script, /HOME="\$TOOLS\/home" TMPDIR="\$TOOLS\/tmp"/);
  assert.match(script, /--user-data-dir "\$TOOLS\/vscodium\/user-data"/);
  assert.match(script, /--extensions-dir "\$TOOLS\/vscodium\/extensions"/);
  // Chromium's own helper sandbox cannot start inside sandbox-exec.
  assert.match(script, /VSCodium" --no-sandbox/);
});

test('the commit author is copied into the checkout, as ~/.gitconfig is out of reach', () => {
  assert.match(script, /git -C "\$REPO" config --local "\$key" "\$value"/);
});

test('on macOS: the profile really refuses the home directory and allows the checkout', () => {
  if (process.platform !== 'darwin' || spawnSync('which', ['sandbox-exec']).status !== 0) return 'skip';
  const tmp = fs.mkdtempSync(path.join(root, '.tools', 'tmp', 'macos-sandbox-'));
  try {
    const home = os.homedir();
    const profile = path.join(tmp, 'test.sb');
    fs.writeFileSync(profile, `(version 1)\n(allow default)\n(deny file-read* file-write* (subpath "/Users") (subpath "/Volumes"))\n`
      + `(allow file-read* file-write* (subpath ${JSON.stringify(root)}))\n`);
    const r = spawnSync('sandbox-exec', ['-f', profile, '/bin/bash', '-c',
      `ls ${JSON.stringify(home + '/Desktop')} >/dev/null 2>&1 && echo home=read || echo home=refused;`
      + `touch ${JSON.stringify(tmp + '/ok')} && echo checkout=written`], { encoding: 'utf8' });
    assert.match(r.stdout, /home=refused/);
    assert.match(r.stdout, /checkout=written/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

console.log(`\nmacosSandbox: ${passed} passed`);
