'use strict';

// `docker compose up -d` has to give you JALOR.
//
// This is not a formality. Upstream's compose file pulls a published WeKan
// image, and upstream's Dockerfile does not compile anything either - it
// downloads a release archive from github.com/wekan/wekan/releases and packages
// it. Either of those, used here, would start upstream WeKan with none of this
// repository's work in it, and it would LOOK like it had worked.
//
// Run: node tests/jalorDocker.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('jalorDocker:');

const compose = read('docker-compose.yml');

test('the app service is BUILT here, not pulled', () => {
  assert.ok(/^\s+build:\s*$/m.test(compose), 'the service has a build section');
  assert.ok(/dockerfile: Dockerfile\.jalor/.test(compose),
    'and it names Dockerfile.jalor');
  assert.ok(/image: \$\{JALOR_IMAGE:-jalor:local\}/.test(compose),
    'with a tag of its own, overridable for a published image');
  assert.ok(!/^\s+image: ghcr\.io\/wekan\/wekan:latest\s*$/m.test(compose),
    'and it no longer pulls the upstream WeKan image');
});

test('upstream Dockerfile is untouched, and is not what compose builds', () => {
  // It is left alone so upstream's own release tooling keeps working - but it
  // downloads a WeKan release archive, so building it here would produce WeKan.
  const upstream = read('Dockerfile');
  assert.ok(/releases\/download\/v\$\{VERSION\}\/wekan-/.test(upstream),
    'the upstream Dockerfile still downloads a published release archive');
  // Comment lines stripped: upstream leaves an explanation at that spot, and
  // a `#` line is not a setting.
  const active = compose.split('\n').filter(l => !/^\s*#/.test(l)).join('\n');
  assert.ok(!/dockerfile: Dockerfile\s*$/m.test(active),
    'so compose must not point at it');
});

test('Dockerfile.jalor builds the application from this checkout', () => {
  const df = read('Dockerfile.jalor');
  // Instructions only: the header comment explains at length what the upstream
  // Dockerfile downloads, and quoting a URL is not fetching it.
  const instructions = df.split('\n').filter(l => !/^\s*#/.test(l)).join('\n');
  assert.ok(/COPY \. \./.test(instructions), 'the source is copied in');
  assert.ok(/meteor build --directory/.test(instructions), 'and Meteor builds it');
  assert.ok(!/releases\/download/.test(instructions),
    'nothing is downloaded from a releases page - that is the whole point');
  assert.ok(/AS builder/.test(instructions) && /AS runtime/.test(instructions),
    'two stages, so the toolchain does not ship');
});

test('it pins the same Node and Meteor the rest of the repo uses', () => {
  const df = read('Dockerfile.jalor');
  const nodeArg = df.match(/ARG NODE_VERSION=(v[\d.]+)/);
  assert.ok(nodeArg, 'Dockerfile.jalor pins a Node version');
  const upstreamNode = read('Dockerfile').match(/NODE_VERSION=(v[\d.]+)/);
  assert.strictEqual(nodeArg[1], upstreamNode[1],
    'the two images must run the same Node');

  const meteorArg = df.match(/ARG METEOR_RELEASE=([\w.\-]+)/);
  assert.ok(meteorArg, 'and a Meteor release');
  const release = read('.meteor/release').trim().replace(/^METEOR@/, '');
  assert.strictEqual(meteorArg[1], release,
    '.meteor/release and Dockerfile.jalor must agree');
});

test('the DSFR can be installed inside the build', () => {
  // @gouvfr/dsfr refuses to install without .dsfr.yml. The build copies
  // package.json before the rest of the source, so the file has to be copied
  // with it or `npm install` fails.
  const df = read('Dockerfile.jalor');
  assert.ok(/COPY package\.json package-lock\.json \.dsfr\.yml/.test(df),
    'the licence-acceptance file is copied with the manifests');
  assert.ok(!read('.dockerignore').split('\n').some(l => l.trim() === '.dsfr.yml'),
    'and it is not excluded by .dockerignore');
});

test('the data keeps its home', () => {
  // Container names are labels and were renamed; VOLUME names are where the
  // boards and the attachments live, and renaming one restarts an existing
  // installation on an empty database.
  assert.ok(/container_name: jalor-app/.test(compose));
  assert.ok(/container_name: jalor-ferretdb/.test(compose));
  assert.ok(/^volumes:\n(?:.*\n)*?  wekan-files:/m.test(compose),
    'the app volume keeps its name');
  assert.ok(/  ferretdb-data:/.test(compose), 'and so does the database volume');
  assert.ok(/wekan-files:\/data:rw/.test(compose), 'still mounted at /data');
});

test('nothing else about the service changed', () => {
  // The environment, the healthcheck and the dependency order are WeKan's and
  // are what make the stack come up in the right sequence.
  for (const needle of [
    'MONGO_URL=mongodb://ferretdb:27017/wekan?directConnection=true',
    'WITH_API=true',
    'WRITABLE_PATH=/data',
    'condition: service_healthy',
    'healthcheck:',
  ]) {
    assert.ok(compose.includes(needle), `docker-compose.yml lost: ${needle}`);
  }
  // The runtime image answers to the same variables, so a compose file written
  // for the WeKan image still works against this one.
  const df = read('Dockerfile.jalor');
  for (const needle of ['PORT=8080', 'ROOT_URL=', 'MONGO_URL=', 'WRITABLE_PATH=/data']) {
    assert.ok(df.includes(needle), `Dockerfile.jalor does not default ${needle}`);
  }
});

test('the README tells you what it builds and where to find it', () => {
  const readme = read('README.md');
  assert.ok(/docker compose up -d/.test(readme));
  assert.ok(/Dockerfile\.jalor/.test(readme), 'and says which Dockerfile is used');
  assert.ok(/http:\/\/localhost\n```/.test(readme),
    'and the address matches the published port (80:8080), not 3000');
  assert.ok(/wekan-files/.test(readme), 'and explains why the volumes keep their names');
});

console.log(`\njalorDocker: ${passed} tests passed`);
