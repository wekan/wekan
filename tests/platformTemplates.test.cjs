'use strict';

// The files under docs/Platforms/ that are meant to be pasted into other
// projects' app catalogs (ZimaOS/CasaOS, TrueNAS, Coolify, Dokploy) and the AUR
// package. They are not run here - each catalog's own validator is, in .tools/
// (docs/Platforms/Platforms.md says which passed) - so this suite pins
// what they must agree on, so that one can not drift from the others:
//
//   * one pinned WeKan image tag, the same everywhere, never latest;
//   * one container with the bundled FerretDB v1 on SQLite, data under /data;
//   * WeKan on port 8080 with a ROOT_URL;
//   * a healthcheck that uses the image's own Node.js (the image has no curl);
//   * TrueNAS keeps FerretDB's state.json in /data, because it runs as another user;
//   * the AUR package checks every source and sets the data directory.
// Run: node tests/platformTemplates.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT = path.join(__dirname, '..');
const D = 'docs/Platforms/FOSS/Container/Docker';
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('platformTemplates:');

const compose = {
  casaos: yaml.load(read(`${D}/CasaOS/Apps/WeKan/docker-compose.yml`)),
  coolify: yaml.load(read(`${D}/Coolify/templates/compose/wekan.yaml`)),
  dokploy: yaml.load(read(`${D}/Dokploy/blueprints/wekan/docker-compose.yml`)),
};
const truenasValues = yaml.load(read(`${D}/TrueNAS/ix-dev/community/wekan/ix_values.yaml`));
const truenasTemplate = read(`${D}/TrueNAS/ix-dev/community/wekan/templates/docker-compose.yaml`);
const env = (svc) => Array.isArray(svc.environment)
  ? Object.fromEntries(svc.environment.map((e) => e.split('=')).map(([k, ...v]) => [k, v.join('=')]))
  : svc.environment;

const tags = {};
for (const [name, doc] of Object.entries(compose)) {
  const svc = doc.services.wekan;
  const m = /^ghcr\.io\/wekan\/wekan:(v\d+\.\d+)$/.exec(svc.image);
  assert.ok(m, `${name}: a pinned ghcr.io/wekan/wekan:vX.Y image, got ${svc.image}`);
  tags[name] = m[1];
}
tags.truenas = /^(v\d+\.\d+)@sha256:[0-9a-f]{64}$/.exec(truenasValues.images.image.tag)?.[1];

test('every template pins the same WeKan image, never latest', () => {
  assert.strictEqual(truenasValues.images.image.repository, 'ghcr.io/wekan/wekan');
  assert.ok(tags.truenas, 'TrueNAS pins tag AND digest');
  assert.strictEqual(new Set(Object.values(tags)).size, 1, `tags differ: ${JSON.stringify(tags)}`);
  const version = tags.truenas.slice(1);
  assert.strictEqual(JSON.parse(read(`${D}/Dokploy/blueprints/wekan/meta.json`)).version, version);
  assert.strictEqual(compose.casaos['x-casaos'].version, version);
  assert.strictEqual(yaml.load(read(`${D}/TrueNAS/ix-dev/community/wekan/app.yaml`)).app_version, tags.truenas);
});

test('one container with the bundled FerretDB, data in /data, on port 8080', () => {
  for (const [name, doc] of Object.entries(compose)) {
    assert.deepStrictEqual(Object.keys(doc.services), ['wekan'], `${name}: one service`);
    const e = env(doc.services.wekan);
    assert.strictEqual(e.WEKAN_DB, 'ferretdb', name);
    assert.strictEqual(e.WRITABLE_PATH, '/data', name);
    assert.strictEqual(String(e.PORT), '8080', name);
    assert.ok(e.ROOT_URL, `${name}: ROOT_URL`);
    const mounts = doc.services.wekan.volumes.map((v) => (typeof v === 'string' ? v.split(':')[1] : v.target));
    assert.deepStrictEqual(mounts, ['/data'], name);
  }
  for (const k of ['"WEKAN_DB", "ferretdb"', '"WRITABLE_PATH", "/data"', '"ROOT_URL"', 'c1.add_storage("/data"']) {
    assert.ok(truenasTemplate.includes(k), `TrueNAS: ${k}`);
  }
});

test('healthchecks use the image\'s own Node.js, not curl or wget (negative)', () => {
  for (const [name, doc] of Object.entries(compose)) {
    const t = doc.services.wekan.healthcheck.test;
    assert.deepStrictEqual(t.slice(0, 3), ['CMD', 'node', '-e'], name);
    assert.match(t[3], /fetch\("http:\/\/127\.0\.0\.1:8080\/"\)/, name);
  }
  assert.match(truenasTemplate, /healthcheck\.set_custom_test\(\["CMD", "node", "-e"/);
  assert.doesNotMatch(truenasTemplate, /set_test\("(curl|wget)"/, 'the image has neither');
});

test('TrueNAS runs as another user, so FerretDB state goes to /data', () => {
  assert.match(truenasTemplate, /c1\.set_user\(values\.run_as\.user, values\.run_as\.group\)/);
  assert.match(truenasTemplate, /add_env\("FERRETDB_STATE_DIR", "\/data\/ferretdb"\)/);
});

test('each catalog\'s own rules (negative)', () => {
  const dok = compose.dokploy.services.wekan;
  assert.ok(!dok.ports && !dok.container_name && !dok.networks && !compose.dokploy.networks, 'Dokploy: expose only');
  const cool = compose.coolify.services.wekan;
  assert.ok(!cool.container_name && !cool.restart, 'Coolify adds these itself');
  assert.ok(cool.environment.includes('SERVICE_URL_WEKAN_8080'));
  assert.match(read(`${D}/Coolify/templates/compose/wekan.yaml`), /^# port: 8080$/m);
  const x = compose.casaos['x-casaos'];
  assert.match(x.id, /^[a-z0-9]+(?:[._-][a-z0-9]+)*(?:\.[a-z0-9]+(?:[._-][a-z0-9]+)*)+$/, 'reverse-domain id');
  assert.strictEqual(x.main, 'wekan');
  assert.strictEqual(typeof x.port_map, 'string');
  assert.strictEqual(String(compose.casaos.services.wekan.ports[0].published), x.port_map);
});

test('the AUR package checks every source and keeps data in /var/lib/wekan', () => {
  const pkg = read('docs/Platforms/FOSS/Package/AUR/wekan-bin/PKGBUILD');
  const count = (re) => (pkg.match(re) || []).length;
  assert.strictEqual(count(/'[0-9a-f]{64}'/g), 7, 'five sources + two zips, all with a sha256');
  assert.doesNotMatch(pkg, /SKIP/, 'no unchecked source (negative)');
  assert.match(pkg, /options=\('!strip' '!debug'\)/);
  assert.match(read('docs/Platforms/FOSS/Package/AUR/wekan-bin/wekan.env'), /^WRITABLE_PATH=\/var\/lib\/wekan$/m);
  const unit = read('docs/Platforms/FOSS/Package/AUR/wekan-bin/wekan.service');
  assert.match(unit, /^WorkingDirectory=\/var\/lib\/wekan$/m, 'FerretDB writes state.json there');
  assert.match(unit, /^Restart=always$/m, 'the launcher exits 0, so on-failure never fires');
  assert.match(unit, /^ReadWritePaths=\/var\/lib\/wekan$/m);
});

console.log(`\nplatformTemplates: ${passed} tests passed`);
