'use strict';

// The website version manifest is both the Admin Panel's release source and the
// human-readable version block on /install/. This runs the real release helper
// against a temporary website without network access.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const helper = path.join(root, 'releases/update-website-version-info.sh');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-version-info-'));
fs.mkdirSync(path.join(temp, 'install'));
fs.writeFileSync(path.join(temp, 'install/index.html'),
  '<main><h2>Install <span class="version-number">v11.29</span></h2></main>\n');

const run = version => spawnSync('bash', [helper, temp, root, '11.30'], {
  cwd: root,
  encoding: 'utf8',
  env: { ...process.env, FERRETDB_VERSION: version },
});

const expected = [
  'WeKan 11.30',
  'FerretDB 1.64.0',
  'Meteor 3.5.2-beta.0',
  'Node 24.20.0',
  'NPM 11.12.1',
].join('\n');
const result = run('v1.64.0');
assert.equal(result.status, 0, result.stderr);
assert.equal(fs.readFileSync(path.join(temp, 'version.txt'), 'utf8'), `${expected}\n`);
assert.match(fs.readFileSync(path.join(temp, 'install/index.html'), 'utf8'),
  new RegExp(`<pre id="version-info">${expected.replace(/\./g, '\\.')}</pre>`));

const before = fs.readFileSync(path.join(temp, 'version.txt'), 'utf8');
const rejected = run('<script>1.64.0</script>');
assert.notEqual(rejected.status, 0, 'a non-version FerretDB response must fail');
assert.equal(fs.readFileSync(path.join(temp, 'version.txt'), 'utf8'), before,
  'invalid input cannot overwrite the last valid manifest');

const releaseWebsite = fs.readFileSync(
  path.join(root, 'releases/release-website.sh'), 'utf8');
const localRelease = fs.readFileSync(path.join(root, 'releases/version.sh'), 'utf8');
const workflow = fs.readFileSync(
  path.join(root, '.github/workflows/release-all.yml'), 'utf8');
assert.match(releaseWebsite, /update-website-version-info\.sh/);
assert.match(localRelease, /update-website-version-info\.sh/);
assert.match(workflow, /release-website\.sh "\$\{\{ inputs\.old_version \}\}" "\$\{\{ inputs\.new_version \}\}"/,
  'release-all website job runs the script that generates both destinations');

fs.rmSync(temp, { recursive: true, force: true });
console.log('websiteVersionInfo: manifest, install page and release wiring passed');
