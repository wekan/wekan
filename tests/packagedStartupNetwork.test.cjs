'use strict';

const assert = require('assert');
const { execFileSync } = require('child_process');
const fs = require('fs');

const read = file => fs.readFileSync(file, 'utf8');
const helper = 'releases/ferretdb/startup-network.cjs';
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

function resolve(extraEnv = {}, args = ['posix', '--ferretdb']) {
  const output = execFileSync(process.execPath, [helper, ...args], {
    env: { ...process.env, PORT: '', ROOT_URL: '', MONGO_URL: '',
      FERRETDB_LISTEN_ADDR: '', WEKAN_DATABASE_SERVICE: '',
      WEKAN_DATABASE_PASSWORD: '', ...extraEnv },
    encoding: 'utf8',
  });
  const values = {};
  for (const line of output.trim().split('\n')) {
    const match = line.match(/^export ([A-Z_]+)='(.*)'$/);
    assert.ok(match, `safe POSIX assignment: ${line}`);
    values[match[1]] = match[2];
  }
  return values;
}

console.log('packagedStartupNetwork:');

test('automatic endpoints use a LAN IPv4 and different local ports', () => {
  const values = resolve({ WEKAN_PORT_START: '42000', WEKAN_FERRETDB_PORT_START: '42100' });
  assert.match(values.ROOT_URL, /^http:\/\/(?:\d{1,3}\.){3}\d{1,3}:\d+$/);
  assert.strictEqual(new URL(values.ROOT_URL).port, values.PORT);
  assert.match(values.FERRETDB_LISTEN_ADDR, /^127\.0\.0\.1:\d+$/);
  assert.notStrictEqual(values.FERRETDB_LISTEN_ADDR.split(':')[1], values.PORT);
  assert.strictEqual(values.MONGO_URL,
    `mongodb://${values.FERRETDB_LISTEN_ADDR}/wekan`);
});

test('an available port 80 is represented without a URL port suffix', () => {
  let values;
  try {
    values = resolve({ WEKAN_PORT_START: '80', WEKAN_FERRETDB_PORT_START: '42100' });
  } catch (error) {
    if (!/EACCES|permission/i.test(String(error))) throw error;
    return;
  }
  if (values.PORT === '80') {
    assert.match(values.ROOT_URL, /^http:\/\/(?:\d{1,3}\.){3}\d{1,3}$/);
    assert.strictEqual(new URL(values.ROOT_URL).port, '');
  } else {
    assert.strictEqual(new URL(values.ROOT_URL).port, values.PORT);
  }
});

test('explicit deployment settings remain authoritative', () => {
  const values = resolve({
    PORT: '43210', ROOT_URL: 'https://boards.example.test',
    FERRETDB_LISTEN_ADDR: '127.0.0.1:43211',
    MONGO_URL: 'mongodb://127.0.0.1:43211/custom',
  });
  assert.deepStrictEqual(values, {
    PORT: '43210', ROOT_URL: 'https://boards.example.test',
    FERRETDB_LISTEN_ADDR: '127.0.0.1:43211',
    MONGO_URL: 'mongodb://127.0.0.1:43211/custom',
  });
});

test('Compose derives external FerretDB and MongoDB URLs without YAML defaults', () => {
  const ferret = resolve({ WEKAN_DATABASE_SERVICE: 'ferretdb' }, ['posix']);
  assert.strictEqual(ferret.MONGO_URL, 'mongodb://ferretdb:27017/wekan');
  const mongo = resolve({ WEKAN_DATABASE_SERVICE: 'wekandb' }, ['posix']);
  assert.strictEqual(mongo.MONGO_URL,
    'mongodb://wekandb:27017/wekan?replicaSet=rs0');
  const authenticated = resolve({
    WEKAN_DATABASE_SERVICE: 'ferretdb', WEKAN_DATABASE_PASSWORD: 'p@ss word',
  }, ['posix']);
  assert.strictEqual(authenticated.MONGO_URL,
    'mongodb://ferretdb:p%40ss%20word@ferretdb:27017/wekan?authMechanism=PLAIN');
});

test('single-instance Compose files leave endpoint settings inactive by default', () => {
  const files = [
    'docker-compose.yml',
    'docker-compose-mongodb-v7.yml',
    'docker-compose-ferretdb-v1-postgresql.yml',
    'docker-compose-ferretdb-v1-mysql.yml',
    'docker-compose-ferretdb-v1-mariadb.yml',
    'docker-compose-ferretdb-v1-sap-hana.yml',
    'docker-compose-ferretdb-v2-postgresql.yml',
  ];
  for (const file of files) {
    const source = read(file);
    for (const name of ['ROOT_URL', 'PORT', 'MONGO_URL']) {
      assert.doesNotMatch(source, new RegExp(`^\\s*- ${name}=`, 'm'),
        `${file}: ${name} must not have an active default`);
    }
    assert.match(source, /^\s*- 80:80$/m, `${file}: published and automatic ports agree`);
    assert.match(source, /Node console log/, `${file}: automatic values are documented`);
  }
});

test('bundled FerretDB refuses a non-loopback listen address', () => {
  assert.throws(() => resolve({ FERRETDB_LISTEN_ADDR: '0.0.0.0:27017' }),
    /bundled FerretDB must listen on 127\.0\.0\.1/);
});

test('ZIP, AppImage, Docker and Windows launchers use the resolver', () => {
  const posix = read('releases/ferretdb/start-wekan.sh');
  const windows = read('releases/ferretdb/start-wekan.bat');
  assert.match(posix, /startup-network\.cjs.*--ferretdb/);
  assert.match(windows, /startup-network\.cjs.*--ferretdb/);
  for (const [name, source] of [['start-wekan.sh', posix], ['start-wekan.bat', windows]]) {
    assert.doesNotMatch(source, /(?:ROOT_URL|PORT|MONGO_URL)=(?:http|mongodb|[0-9])/,
      `${name}: endpoint values must not be hard-coded`);
    assert.match(source, /resolved values[\s\S]*console/i,
      `${name}: automatic settings and their console output are documented`);
  }
  assert.match(read('releases/ferretdb/wekan-entrypoint.sh'), /startup-network\.cjs posix/);
  assert.doesNotMatch(read('.github/workflows/AppImage.yml'),
    /ROOT_URL:=http:\/\/localhost/);
  assert.match(read('Dockerfile'), /startup-network\.cjs \/build\/startup-network\.cjs/);
});

test('Snap shares one resolved endpoint file between WeKan and FerretDB', () => {
  const snap = read('snap-src/bin/startup-network');
  assert.match(snap, /\.startup-network\.env/);
  assert.match(snap, /startup-network\.cjs.*--ferretdb/);
  assert.match(read('snap-src/bin/wekan-control'), /source \$SNAP\/bin\/startup-network/);
  assert.match(read('snap-src/bin/ferretdb-control'), /source \$SNAP\/bin\/startup-network/);
  assert.match(read('snap-src/bin/ferretdb-control'), /BIND_IP="127\.0\.0\.1"/);
});

test('every packaged path logs ROOT_URL and its database endpoint', () => {
  for (const file of [
    'releases/ferretdb/start-wekan.sh',
    'releases/ferretdb/start-wekan.bat',
    'releases/ferretdb/wekan-entrypoint.sh',
    'snap-src/bin/wekan-control',
  ]) {
    const source = read(file);
    assert.match(source, /WeKan startup: ROOT_URL=/, file);
    assert.match(source, /MONGO_URL=/, file);
  }
});

console.log(`\n${passed} tests passed`);
