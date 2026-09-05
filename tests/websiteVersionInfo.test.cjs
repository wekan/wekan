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
const dockerfile = fs.readFileSync(path.join(root, 'Dockerfile'), 'utf8');
const pin = pattern => {
  const match = dockerfile.match(pattern);
  assert.ok(match, `Dockerfile is missing version pin ${pattern}`);
  return match[1];
};
const wekanVersion = pin(/^ARG VERSION=([^\s]+)$/m);
const meteorVersion = fs.readFileSync(path.join(root, '.meteor/release'), 'utf8')
  .trim().replace(/^METEOR@/, '');
const nodeVersion = pin(/^\s*NODE_VERSION=v([^\s\\]+).*$/m);
const npmVersion = pin(/^\s*NPM_VERSION=([^\s\\]+).*$/m);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'wekan-version-info-'));
const fixtureRepo = path.join(temp, 'wekan');
fs.mkdirSync(path.join(temp, 'install'));
fs.mkdirSync(path.join(fixtureRepo, '.meteor'), { recursive: true });
fs.writeFileSync(path.join(fixtureRepo, 'Dockerfile'), dockerfile.replace(
  /METEOR_RELEASE=METEOR@[^\s\\]+/,
  'METEOR_RELEASE=METEOR@3.5.2-beta.0'));
fs.copyFileSync(path.join(root, '.meteor/release'),
  path.join(fixtureRepo, '.meteor/release'));
fs.writeFileSync(path.join(temp, 'install/index.html'),
  '<main><h2>Install <span class="version-number">v11.29</span></h2></main>\n');

const run = version => spawnSync('bash', [helper, temp, fixtureRepo, wekanVersion], {
  cwd: root,
  encoding: 'utf8',
  env: { ...process.env, FERRETDB_VERSION: version },
});

assert.notEqual(meteorVersion, '3.5.2-beta.0',
  'fixture must catch the stale prerelease that was published for v11.50');

const expected = [
  `WeKan ${wekanVersion}`,
  'FerretDB 1.64.0',
  `Meteor ${meteorVersion}`,
  `Node ${nodeVersion}`,
  `NPM ${npmVersion}`,
].join('\n');
const result = run('v1.64.0');
assert.equal(result.status, 0, result.stderr);
assert.equal(fs.readFileSync(path.join(temp, 'version.txt'), 'utf8'), `${expected}\n`);
assert.ok(!fs.readFileSync(path.join(temp, 'version.txt'), 'utf8').includes('beta.0'),
  'stale Docker metadata cannot override the canonical .meteor/release pin');
const installPage = fs.readFileSync(path.join(temp, 'install/index.html'), 'utf8');
assert.ok(installPage.includes(`<pre id="version-info">${expected}</pre>`),
  'the install page contains the exact version manifest as literal text');

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
assert.match(localRelease,
  /METEOR_RELEASE=\$\(tr -d '[^']*' < \.meteor\/release \| head -1\)/,
  'release bump synchronizes Docker metadata from the canonical Meteor pin');
assert.match(localRelease, /METEOR_RELEASE=\$\{METEOR_RELEASE\}/,
  'the synchronized prerelease is written to Dockerfile');
assert.match(fs.readFileSync(path.join(root, 'Dockerfile'), 'utf8'),
  new RegExp(`METEOR_RELEASE=METEOR@${meteorVersion.replace(/\./g, '\\.')}`),
  'Docker metadata currently matches .meteor/release');
assert.match(workflow, /release-website\.sh "\$\{\{ inputs\.old_version \}\}" "\$\{\{ inputs\.new_version \}\}"/,
  'release-all website job runs the script that generates both destinations');

fs.rmSync(temp, { recursive: true, force: true });
console.log('websiteVersionInfo: manifest, install page and release wiring passed');
