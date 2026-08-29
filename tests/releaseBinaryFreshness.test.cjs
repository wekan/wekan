'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const workflow = read('.github/workflows/release-all.yml');
const resolver = read('releases/resolve-node-source.sh');
const checks = read('releases/check-arch-binaries.sh');
const repack = read('releases/repack-bundle-for-arch.sh');

for (const [name, source] of [
  ['release workflow', workflow],
  ['architecture preflight', checks],
  ['architecture repack', repack],
]) {
  assert.doesNotMatch(
    source,
    /wekan\/FerretDB\/releases\/download\/v\d/,
    `${name} must not pin an old FerretDB release`,
  );
  assert.doesNotMatch(
    source,
    /wekan\/mongo-tools-patches\/releases\/download\/v\d/,
    `${name} must not pin old MongoDB Database Tools`,
  );
}

assert.match(
  workflow,
  /wekan\/FerretDB\/releases\/latest\/download\/ferretdb-amd64/,
  'the primary bundle must fetch the newest FerretDB release',
);
assert.match(
  workflow,
  /wekan\/mongo-tools-patches\/releases\/latest\/download/,
  'the primary workflow must fetch the newest database-tool release',
);
assert.match(
  resolver,
  /index\.json, which lists every release newest first/,
  'Node resolution must begin with the newest maintained Node release',
);
assert.match(
  resolver,
  /PATCHES="https:\/\/github\.com\/wekan\/node-patches\/releases\/download"/,
  'fallback Node binaries must come from node-patches releases',
);
assert.match(
  resolver,
  /url="\$\{PATCHES\}\/\$\{V\}\/\$\{asset\}"/,
  'node-patches must use the newest Node version currently being considered',
);

console.log('releaseBinaryFreshness: 11 assertions passed');
