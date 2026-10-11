import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { assertComplete, verifyFile, verifyFiles } from '../releases/ucs-migration/verify.mjs';

const good = { success: true, phase: 'completed', finishedAt: 'now', errors: [], collections: { cards: { done: 2, total: 2 } } };
test('only fully successful, nonempty migration reports pass', () => {
  assertComplete(good);
  for (const change of [{ success: false }, { phase: 'completed-with-errors' }, { phase: 'skipped' },
    { errors: ['bad document'] }, { collections: {} }, { collections: { cards: { done: 1, total: 2 } } },
    { finishedAt: null }]) assert.throws(() => assertComplete({ ...good, ...change }));
});
test('every migrated version must be a complete file in its persistent directory', () => {
  const goodFile = { storage: 'fs', path: '/data/files/attachments/id-a.txt', size: 10 };
  const stat = () => ({ isFile: () => true, size: 10 });
  verifyFile(goodFile, '/data/files/attachments', stat);
  for (const change of [{ storage: 'gridfs' }, { path: '/tmp/lost' }, { path: '/data/files/attachments/../lost' },
    { size: 11 }, { meta: { gridFsFileId: 'old' } }]) {
    assert.throws(() => verifyFile({ ...goodFile, ...change }, '/data/files/attachments', stat));
  }
  assert.throws(() => verifyFile(goodFile, '/data/files/attachments', () => { throw new Error('ENOENT'); }));
});
test('missing original attachment metadata blocks cutover', async () => {
  const db = { collection: () => ({ find: async function* () { yield { _id: 'lost' }; } }) };
  await assert.rejects(verifyFiles(db), /Missing original/);
});

test('attachments and avatars are verified beneath the configured writable path', async () => {
  const writable = fs.mkdtempSync(path.join(os.tmpdir(), 'ucs-writable-'));
  try {
    for (const bucket of ['attachments', 'avatars']) {
      fs.mkdirSync(path.join(writable, 'files', bucket), { recursive: true });
      fs.writeFileSync(path.join(writable, 'files', bucket, 'original'), 'content');
    }
    const db = { collection: bucket => ({ find: async function* () {
      yield { versions: { original: { storage: 'fs', size: 7,
        path: path.join(writable, 'files', bucket, 'original') } } };
    } }) };
    await verifyFiles(db, writable);
    await assert.rejects(verifyFiles(db, path.join(writable, 'wrong')), /outside persistent volume/);
    fs.unlinkSync(path.join(writable, 'files', 'avatars', 'original'));
    await assert.rejects(verifyFiles(db, writable), /ENOENT/);
  } finally { fs.rmSync(writable, { recursive: true, force: true }); }
});

function hook(mode, oldVersion = '6.09', existingTarget = false) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ucs-hook-'));
  try {
    const base = path.join(temp, 'app/data');
    fs.mkdirSync(path.join(temp, 'app/compose'), { recursive: true });
    fs.writeFileSync(path.join(temp, 'app/compose/docker-compose.yml'), 'old-compose');
    if (existingTarget) {
      fs.mkdirSync(path.join(base, 'ferretdb'), { recursive: true });
      fs.writeFileSync(path.join(base, 'ferretdb/.ucs-migration-complete'), 'old-result');
    }
    const mock = `#!${process.execPath}
const fs = require('fs'), path = require('path');
const a = process.argv.slice(2), base = process.env.TEST_BASE;
fs.appendFileSync(process.env.TEST_LOG, JSON.stringify(a)+'\\n');
if (a[0] === 'pull') {
  const mode = process.env.TEST_MODE;
  if (mode === 'pull-fail') process.exit(1);
  if (mode === 'ucs-only' && !a[1].startsWith('docker.software-univention.de/')) process.exit(1);
  if (mode === 'hub-only' && !a[1].startsWith('docker.io/')) process.exit(1);
  if (mode === 'quay-only' && !a[1].startsWith('quay.io/')) process.exit(1);
}
if (a[0] === 'tag' && process.env.TEST_MODE === 'tag-fail') process.exit(1);
if (a[0] === 'run' && a.includes('--check') && process.env.TEST_MODE === 'tools-missing') process.exit(1);
if (a[0] === 'inspect') {
  if (a.includes('wekan-ucs-migration') || a.includes('wekan-ucs-migration-db')) process.exit(1);
  console.log(a.includes('-f') ? 'true' : '{}');
}
if (a[0] === 'exec' && a.includes('mongo')) console.log('10');
if (a[0] === 'exec' && a.includes('mongodump')) {
  if (process.env.TEST_MODE === 'dump-fail') process.exit(1);
  fs.mkdirSync(path.join(base, a[a.indexOf('--out')+1], 'wekan'), { recursive: true });
}
if (a[0] === 'run' && a.some(arg => arg.includes('touch /data/.ucs-migration-complete'))) {
  fs.mkdirSync(path.join(base, 'ferretdb/files/db'), { recursive: true });
  fs.writeFileSync(path.join(base, 'ferretdb/.ucs-migration-complete'), 'fresh');
}
if (a[0] === 'run' && a.includes('wekan-ucs-migration')) {
  if (process.env.TEST_MODE === 'migration-fail') process.exit(1);
  fs.writeFileSync(path.join(base, 'ferretdb/.ucs-migration-complete'), 'verified');
}
`;
    fs.writeFileSync(path.join(temp, 'docker'), mock, { mode: 0o755 });
    const definition = path.join(temp, 'definition/component');
    fs.mkdirSync(definition, { recursive: true });
    for (const name of ['inst', 'uinst', 'test', 'README_EN', 'README_DE']) {
      fs.writeFileSync(path.join(definition, name), 'fixture');
    }
    fs.copyFileSync(new URL('fixtures/ucs/preinst', import.meta.url), path.join(definition, 'preinst'));
    fs.writeFileSync(path.join(definition, 'compose'), 'services:\n  wekan:\n    image: ghcr.io/wekan/wekan:v12.28\n  wekandb:\n    image: ghcr.io/wekan/ferretdb:v1.92.0\n');
    const prepared = path.join(temp, 'prepared');
    const preparation = spawnSync('python3', ['-B', new URL('../releases/ucs-release.py', import.meta.url).pathname,
      'prepare', '--repo', path.dirname(definition), '--directory', prepared, '--version', '12.32'], { encoding: 'utf8' });
    assert.equal(preparation.status, 0, preparation.stderr);
    const source = fs.readFileSync(path.join(prepared, 'component/preinst'), 'utf8')
      .replaceAll('/var/lib/univention-appcenter/apps/wekan', path.join(temp, 'app'));
    fs.writeFileSync(path.join(temp, 'target.preinst'), source);
    fs.writeFileSync(path.join(temp, 'target.compose'), 'services:\n  wekan:\n    image: "docker.software-univention.de/wekan-wekan:12.32-ucs2"\n  wekandb:\n    image: "docker.software-univention.de/wekan-wekandb:12.32-ucs2"\n');
    if (mode === 'missing-compose') fs.unlinkSync(path.join(temp, 'target.compose'));
    if (mode === 'ambiguous-compose') fs.appendFileSync(path.join(temp, 'target.compose'),
      '    image: docker.software-univention.de/other:12.32\n');
    if (mode === 'templated-compose') fs.writeFileSync(path.join(temp, 'target.compose'),
      'services:\n  wekan:\n    image: "@%@unknown/image@%@"\n');
    const args = [path.join(temp, 'target.preinst'), '--version', '12.28', '--error-file', path.join(temp, 'error')];
    if (oldVersion) args.push('--old-version', oldVersion);
    const result = spawnSync('bash', args, { encoding: 'utf8', env: { ...process.env,
      PATH: `${temp}:${process.env.PATH}`, TEST_BASE: base, TEST_LOG: path.join(temp, 'calls'), TEST_MODE: mode } });
    const calls = fs.existsSync(path.join(temp, 'calls'))
      ? fs.readFileSync(path.join(temp, 'calls'), 'utf8').trim().split('\n').map(JSON.parse) : [];
    return { ...result, calls, portalError: fs.existsSync(path.join(temp, 'error')) ? fs.readFileSync(path.join(temp, 'error'), 'utf8') : '', files: fs.readdirSync(base), marker: fs.existsSync(path.join(base, 'ferretdb/.ucs-migration-complete')) };
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
}
const call = (result, command, word) => result.calls.findIndex(a => a[0] === command && a.includes(word));
test('portal upgrade stops writes, backs up, migrates, removes both temporary containers', () => {
  const r = hook('success');
  assert.equal(r.status, 0, r.stderr);
  assert.ok(call(r, 'stop', 'wekan-app') < call(r, 'exec', 'mongodump'));
  assert.ok(call(r, 'exec', 'mongodump') < call(r, 'run', 'wekan-ucs-migration'));
  assert.ok(call(r, 'rm', 'wekan-ucs-migration') >= 0);
  assert.ok(call(r, 'rm', 'wekan-ucs-migration-db') >= 0);
  assert.equal(call(r, 'start', 'wekan-app'), -1, 'old app must not accept post-copy writes');
  assert.equal(r.marker, true);
});
for (const mode of ['pull-fail', 'tag-fail', 'tools-missing', 'dump-fail', 'migration-fail']) {
  test(`${mode} aborts the portal upgrade and restores old app when stopped`, () => {
    const r = hook(mode);
    assert.notEqual(r.status, 0);
    assert.equal(r.marker, false);
    if (['pull-fail', 'tag-fail', 'tools-missing'].includes(mode)) assert.equal(call(r, 'stop', 'wekan-app'), -1);
    else assert.ok(call(r, 'start', 'wekan-app') >= 0);
    if (mode === 'migration-fail') {
      assert.ok(call(r, 'rm', 'wekan-ucs-migration') >= 0);
      assert.ok(call(r, 'rm', 'wekan-ucs-migration-db') >= 0);
    }
  });
}
test('a retried legacy upgrade preserves previous target and takes a new copy', () => {
  const r = hook('success', '6.09', true);
  assert.equal(r.status, 0, r.stderr);
  assert.ok(r.files.some(name => name.startsWith('ferretdb-before-')));
  assert.ok(call(r, 'exec', 'mongodump') >= 0);
});
test('subsequent portal upgrades do not recopy old MongoDB', () => {
  const r = hook('success', '12.28', true);
  assert.equal(r.status, 0, r.stderr);
  assert.equal(call(r, 'exec', 'mongodump'), -1);
  assert.equal(call(r, 'run', 'wekan-ucs-migration'), -1);
});
test('unsupported upgrade without completion marker fails closed', () => {
  assert.notEqual(hook('success', '9.00').status, 0);
});
test('fresh install initializes storage without touching a source container', () => {
  const r = hook('success', '');
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.marker, true);
  assert.equal(call(r, 'stop', 'wekan-app'), -1);
  assert.equal(call(r, 'exec', 'mongodump'), -1);
});

test('vendored importer resolves real CollectionFS references and rejects missing keys', async () => {
  const { default: vm } = await import('node:vm');
  const source = fs.readFileSync(new URL('../releases/ucs-migration/importer.mjs', import.meta.url), 'utf8');
  const functionText = source.match(/function resolveCfsGridFsId\(record, bucketName\) \{[\s\S]*?\n\}/)?.[0];
  assert.ok(functionText);
  const resolve = vm.runInNewContext(`(${functionText})`);
  assert.equal(resolve({ copies: { attachments: { key: 'binary-id' } } }, 'attachments'), 'binary-id');
  assert.equal(resolve({ copies: { avatars: { key: 'avatar-id' } } }, 'avatars'), 'avatar-id');
  assert.equal(resolve({ copies: {} }, 'attachments'), null);
  assert.equal(resolve(null, 'attachments'), null);
  assert.equal((source.match(/written !== Number\(size\)/g) || []).length, 2,
    'both CollectionFS and Meteor-Files must reject truncated chunk streams');
  assert.match(source, /if \(!id \|\| !fileIds.has\(String\(id\)\)\) err/,
    'a missing binary must block completion, not silently lose a card attachment');
  assert.match(source, /updated.matchedCount !== 1/);
});


for (const [mode, registry] of [['ucs-only', 'docker.software-univention.de/'],
  ['hub-only', 'docker.io/'], ['quay-only', 'quay.io/']]) {
  test(`${mode}: target images are pulled before downtime and worker uses the app image`, () => {
    const r = hook(mode);
    assert.equal(r.status, 0, r.stderr);
    const pulls = r.calls.filter(a => a[0] === 'pull').map(a => a[1]);
    assert.ok(pulls.some(image => image.startsWith(registry)));
    if (mode === 'ucs-only') {
      assert.deepEqual(pulls, ['docker.software-univention.de/wekan-wekan:12.32-ucs2',
        'docker.software-univention.de/wekan-wekandb:12.32-ucs2']);
    }
    assert.ok(!pulls.some(image => image.includes('wekan-ucs-migration')));
    assert.ok(call(r, 'tag', 'ghcr.io/wekan/wekan:v12.32') < call(r, 'stop', 'wekan-app'));
    const worker = r.calls.find(a => a[0] === 'run' && a.includes('wekan-ucs-migration'));
    assert.deepEqual(worker.slice(-3), ['ghcr.io/wekan/wekan:v12.32', 'bash', '/opt/ucs-migration/start.sh']);
  });
}

for (const mode of ['missing-compose', 'ambiguous-compose', 'templated-compose']) {
  test(`${mode}: reject unknown target images and report failure to UCS before downtime`, () => {
    const r = hook(mode);
    assert.notEqual(r.status, 0);
    assert.deepEqual(r.calls, []);
    assert.match(r.portalError, /Upgrade cancelled; original MongoDB retained/);
    assert.equal(r.marker, false);
  });
}
