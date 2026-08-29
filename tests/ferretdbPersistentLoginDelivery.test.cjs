'use strict';

const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const compose = read('docker-compose.yml');
const required = path.join(root, 'releases', 'require-ferretdb-resume-login.sh');
const binaries = read('releases/require-binaries.sh');

assert.match(
  compose,
  /FERRETDB_RELEASE: \$\{FERRETDB_RELEASE:-latest\/download\}/,
  'the default Docker backend must follow the newest published release',
);
assert.match(
  compose,
  /github\.com\/wekan\/FerretDB\/releases\/latest/,
  'Docker must resolve latest to a concrete release on every start',
);
assert.match(
  compose,
  /\[ "\$\$CACHED_RELEASE" != "\$\$REQUIRED_RELEASE" \]/,
  'a cached older Docker binary must be replaced',
);
assert.match(compose, /mv "\$\$BIN\.new" "\$\$BIN"/,
  'the replacement must become visible atomically after a successful download');
assert.match(compose, /"\$\$ACTUAL" = "\$\$EXPECTED"/,
  'Docker must verify the newest binary against its published checksum');
assert.match(compose, /> "\$\$RELEASE_FILE"/,
  'the cache must record which release its binary contains');

assert.doesNotThrow(() => childProcess.execFileSync('bash', [required, 'v1.63.0']));
assert.doesNotThrow(() => childProcess.execFileSync('bash', [required, 'v2.0.0']));
assert.throws(
  () => childProcess.execFileSync('bash', [required, 'v1.62.9'], { stdio: 'pipe' }),
  /Command failed/,
  'a release before nested positional projections must be rejected',
);
assert.throws(
  () => childProcess.execFileSync('bash', [required, 'latest'], { stdio: 'pipe' }),
  /Command failed/,
  'an unknown release must not silently pass the compatibility gate',
);

assert.match(
  binaries,
  /require-ferretdb-resume-login\.sh/,
  'bundle preflight must apply the version gate to FerretDB assets',
);

console.log('ferretdbPersistentLoginDelivery: 11 assertions passed');
