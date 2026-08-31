'use strict';

// Automatic network-interface and free-port discovery caused packaged startup
// failures. Packaged targets use explicit configuration again; their launchers
// may provide stable localhost defaults, but must not rewrite endpoints from the
// machine's current interfaces or occupied ports.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

const launchers = [
  '.github/workflows/AppImage.yml',
  '.github/workflows/release-all.yml',
  '.github/workflows/windows.yml',
  'Dockerfile',
  'releases/ferretdb/start-wekan.sh',
  'releases/ferretdb/start-wekan.bat',
  'releases/ferretdb/wekan-entrypoint.sh',
  'snap-src/bin/ferretdb-control',
  'snap-src/bin/wekan-control',
  'snap/hooks/configure',
  'snapcraft.yaml',
];

for (const rel of launchers) {
  assert.doesNotMatch(read(rel), /startup-network|AUTO_ROOT_URL|AUTO_PORT/,
    `${rel} must not invoke automatic endpoint discovery`);
}

assert.equal(fs.existsSync(path.join(root, 'releases/ferretdb/startup-network.cjs')), false,
  'bundles must not ship the automatic endpoint detector');
assert.equal(fs.existsSync(path.join(root, 'snap-src/bin/startup-network')), false,
  'the Snap must not ship the automatic endpoint detector');

const shell = read('releases/ferretdb/start-wekan.sh');
assert.match(shell, /PORT="\$\{PORT:-8080\}"/,
  'the Unix bundle retains its documented stable default');
assert.match(shell, /ROOT_URL="\$\{ROOT_URL:-http:\/\/localhost:\$PORT\}"/,
  'an explicit ROOT_URL remains authoritative');

const batch = read('releases/ferretdb/start-wekan.bat');
assert.match(batch, /if not defined PORT set "PORT=8080"/);
assert.match(batch, /if not defined ROOT_URL set "ROOT_URL=http:\/\/localhost:%PORT%"/);

for (const rel of fs.readdirSync(root).filter(name => /^docker-compose.*\.yml$/.test(name))) {
  const compose = read(rel);
  assert.doesNotMatch(compose, /AUTO_ROOT_URL|AUTO_PORT|startup-network/,
    `${rel} must use its declared environment instead of discovery`);
}

console.log('packagedStartupConfiguration: explicit endpoints and stable defaults passed');
