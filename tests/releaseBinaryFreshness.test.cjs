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
const composeVariants = [
  'docker-compose.yml',
  'docker-compose-ferretdb-v1-postgresql.yml',
  'docker-compose-ferretdb-v1-mysql.yml',
  'docker-compose-ferretdb-v1-mariadb.yml',
  'docker-compose-ferretdb-v1-sap-hana.yml',
];

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

for (const file of composeVariants) {
  const compose = read(file);
  assert.match(
    compose,
    /RELEASE_FILE=\/data\/bin\/ferretdb\.release/,
    `${file} must remember which FerretDB release its volume contains`,
  );
  assert.match(
    compose,
    /CACHED_RELEASE=.*RELEASE_FILE/,
    `${file} must compare the cached binary with the requested release`,
  );
  assert.match(
    compose,
    /ferretdb-.*\.sha256sum/,
    `${file} must verify the downloaded FerretDB binary`,
  );
  assert.match(
    compose,
    /mv "\$\$BIN\.new" "\$\$BIN"/,
    `${file} must replace a verified download atomically`,
  );
}

console.log('releaseBinaryFreshness: 31 assertions passed');
