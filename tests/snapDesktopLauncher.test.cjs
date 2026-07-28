'use strict';

// Plain-Node guard for the snap's application-menu entry (#6539).
// Run: node tests/snapDesktopLauncher.test.cjs
//
// "Wekan installed but is not visible in menu": the snap installs a SERVER, so
// there was no .desktop file and nothing appeared in the application menu - it
// looked like nothing had been installed. The `open` app is that entry: it reads
// the snap's own settings and opens the address WeKan is actually serving.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(ROOT, rel));

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ok -', name);
  } catch (err) {
    console.error(`  FAIL - ${name}\n    ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('snapDesktopLauncher:');

test('there is a desktop file, and an icon beside it', () => {
  assert.ok(exists('snap/gui/wekan.desktop'), 'snap/gui/wekan.desktop');
  assert.ok(exists('snap/gui/icon.png'), 'snap/gui/icon.png');

  const desktop = read('snap/gui/wekan.desktop');
  assert.ok(/^\[Desktop Entry\]/.test(desktop), 'a desktop entry');
  assert.ok(/^Type=Application$/m.test(desktop));
  assert.ok(/^Name=WeKan$/m.test(desktop));
  // `Exec` must be the SNAP APP name: snapd rewrites nothing here, and a bare
  // path would not be runnable from the menu.
  assert.ok(/^Exec=wekan\.open$/m.test(desktop), 'Exec is the snap app');
  assert.ok(/^Icon=\$\{SNAP\}\/meta\/gui\/icon\.png$/m.test(desktop),
    'the icon is addressed inside the snap');
  assert.ok(/^Categories=.*Office.*$/m.test(desktop), 'it lands somewhere sensible in the menu');
});

test('the snap declares the app, its desktop file and the plug it needs', () => {
  const snapcraft = read('snapcraft.yaml');
  const at = snapcraft.indexOf('\n    open:\n');
  assert.notStrictEqual(at, -1, 'the `open` app must exist');
  const app = snapcraft.slice(at, snapcraft.indexOf('\n    help:', at));

  assert.ok(/command: \.\/bin\/wekan-open/.test(app));
  assert.ok(/desktop: usr\/share\/applications\/wekan\.desktop/.test(app),
    'the desktop file is what puts it in the menu');
  // `desktop` is the interface snapd's xdg-open shim needs to reach the session.
  assert.ok(/plugs: \[desktop, network\]/.test(app));

  // …and the file has to be staged where that key points.
  const part = snapcraft.slice(snapcraft.indexOf('    desktop-launcher:'));
  assert.ok(/wekan\.desktop: usr\/share\/applications\/wekan\.desktop/.test(part),
    'the part organizes it into place');
});

test('the launcher opens what WeKan is serving, not a guessed address', () => {
  const sh = read('snap-src/bin/wekan-open');
  assert.ok(/source \$SNAP\/bin\/wekan-read-settings/.test(sh),
    'the port and root URL come from the snap settings');
  assert.ok(/URL="\$ROOT_URL"/.test(sh), 'ROOT_URL is what WeKan tells clients it is');
  assert.ok(/\$\{PORT:-8080\}/.test(sh), 'with the configured port when there is no ROOT_URL');
  assert.ok(/xdg-open/.test(sh), 'and it is handed to the session');
  // A headless server has no session: it must say the address rather than fail.
  assert.ok(/No xdg-open available/.test(sh), 'a headless install is told the address');
});

console.log(`\n${passed} tests passed`);
