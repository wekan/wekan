'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { detectMimeBuffer, detectMimeFile } = require('../models/lib/mimeDetection');
const { verify } = require('../releases/verify-mime-runtime.cjs');
(async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'portable-mime-'));
  const savedPath = process.env.PATH;
  try {
    process.env.PATH = path.join(temp, 'no-executables');
    const cases = [
      ['<!doctype html><html><body>test</body></html>', 'text/html'],
      ['{"test":true}', 'application/json'],
      ['ordinary readable text\n', 'text/plain'],
      ['%PDF-1.7\n', 'application/pdf'],
      ['', 'application/x-empty'],
    ];
    // Concurrent initialization and actual libmagic detection with native file absent.
    assert.deepEqual(await Promise.all(cases.map(([s]) => detectMimeBuffer(Buffer.from(s)))), cases.map(([, mime]) => mime));
    const misleading = path.join(temp, 'wrong.txt');
    fs.writeFileSync(misleading, cases[0][0]);
    assert.equal(await detectMimeFile(misleading), 'text/html');
    assert.equal(await detectMimeFile(path.join(temp, 'missing')), undefined);
    assert.equal(await detectMimeFile(temp), undefined);
    await assert.rejects(detectMimeBuffer('not bytes'), TypeError);
    console.log('ok - portable MIME detection, concurrent initialization and negative inputs');
    const manifest = require('../package.json');
    assert.equal(manifest.dependencies.wasmagic, '1.0.10');
    const snap = fs.readFileSync(path.resolve('snapcraft.yaml'), 'utf8');
    assert.match(snap, /stage-packages:\s*- file\s*- libmagic-mgc/);
    const setup = fs.readFileSync(path.resolve('build.sh'), 'utf8');
    for (const command of ['apk add', 'pacman -Sy', 'dnf install', 'apt-get install']) {
      assert.ok(setup.split('\n').some(line => line.includes(command) && /\bfile\b/.test(line)), command);
    }
    for (const filename of ['models/fileValidation.js', 'models/lib/fileTypeCorrection.js', 'server/methods/fileStatusAudit.js']) {
      assert.match(fs.readFileSync(path.resolve(filename), 'utf8'), /require\(['"][^'"]*mimeDetection['"]\)/);
    }
    console.log('ok - production dependency, platform packaging and shared consumers');
    const bundle = path.join(temp, 'bundle');
    const server = path.join(bundle, 'programs/server');
    const modules = path.join(server, 'npm/node_modules');
    fs.mkdirSync(modules, { recursive: true });
    const engine = path.join(modules, 'wasmagic');
    fs.cpSync(path.resolve('node_modules/wasmagic'), engine, { recursive: true });
    fs.copyFileSync(path.resolve('models/lib/mimeDetection.js'), path.join(server, 'detector.cjs'));
    const isolated = spawnSync(process.execPath, ['-e', "require('./detector.cjs').detectMimeBuffer(Buffer.from('<html><body>check</body></html>')).then(m => {if(m !== 'text/html') process.exit(1)})"], { cwd: server, env: { ...process.env, NODE_PATH: '' }, encoding: 'utf8', timeout: 10000 });
    assert.equal(isolated.status, 0, isolated.stderr);
    await verify(bundle);
    fs.renameSync(path.join(engine, 'dist/libmagic-wrapper.wasm'), path.join(engine, 'dist/missing.wasm'));
    const broken = spawnSync(process.execPath, [path.resolve('releases/verify-mime-runtime.cjs'), bundle], { encoding: 'utf8', timeout: 10000 });
    assert.notEqual(broken.status, 0, 'missing WASM must fail release verification');
    fs.rmSync(engine, { recursive: true });
    await assert.rejects(verify(bundle));
    console.log('ok - isolated Meteor release layout and missing module/asset rejection');
  } finally {
    if (savedPath === undefined) delete process.env.PATH; else process.env.PATH = savedPath;
    fs.rmSync(temp, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
