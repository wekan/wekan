'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const loader = require('../npm-packages/meteor-i18n-server-loader');
const root = path.resolve(__dirname, '..');

test('all dictionaries emit unchanged assets; invalid JSON fails the build', () => {
  for (const name of fs.readdirSync(path.join(root, 'imports/i18n/data'))) {
    if (!name.endsWith('.i18n.json')) continue;
    const source = fs.readFileSync(path.join(root, 'imports/i18n/data', name), 'utf8');
    let emitted;
    const code = loader.call({ resourcePath: name, emitFile: (file, content) => { emitted = { file, content }; } }, source);
    assert.equal(emitted.content, source);
    let reads = 0;
    const context = { module: { exports: {} }, require: () => ({ readFileSync: file => {
      reads++; assert.equal(file, emitted.file); return source;
    } }), Assets: { absoluteFilePath: file => file } };
    vm.runInNewContext(code, context);
    assert.equal(reads, 1);
    assert.equal(JSON.stringify(context.module.exports), JSON.stringify(JSON.parse(source)));
  }
  assert.throws(() => loader.call({ emitFile() { throw Error('must not emit'); } }, '{'), SyntaxError);
});

test('server eager dynamic imports read only requested language and cache it', async t => {
  const { rspack } = require('@rspack/core');
  const tmp = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'wekan-i18n-'));
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  const french = path.join(root, 'imports/i18n/data/fr.i18n.json');
  const german = path.join(root, 'imports/i18n/data/de.i18n.json');
  fs.writeFileSync(path.join(tmp, 'entry.cjs'), `exports.fr = () => import(${JSON.stringify(french)}); exports.de = () => import(${JSON.stringify(german)});`);
  const compiler = rspack({ mode: 'production', target: 'node', entry: path.join(tmp, 'entry.cjs'),
    output: { path: path.join(tmp, 'out'), filename: 'main.cjs', library: { type: 'commonjs2' } },
    module: { parser: { javascript: { dynamicImportMode: 'eager' } }, rules: [{ test: /\.i18n\.json$/, type: 'javascript/auto', use: [path.join(root, 'npm-packages/meteor-i18n-server-loader')] }] },
  });
  await new Promise((resolve, reject) => compiler.run((err, stats) => compiler.close(() => {
    if (err) reject(err); else if (stats.hasErrors()) reject(Error(stats.toString())); else resolve();
  })));
  const reads = [];
  const context = { module: { exports: {} }, require,
    Assets: { absoluteFilePath: file => { reads.push(file); return path.join(tmp, 'out', file); } } };
  vm.runInNewContext(fs.readFileSync(path.join(tmp, 'out/main.cjs'), 'utf8'), context);
  assert.equal(reads.length, 0);
  const fr = await context.module.exports.fr();
  assert.equal(fr.default.accept, JSON.parse(fs.readFileSync(french)).accept);
  assert.equal(reads.length, 1);
  assert.match(reads[0], /fr\.i18n\./);
  await context.module.exports.fr();
  assert.equal(reads.length, 1);
  await context.module.exports.de();
  assert.equal(reads.length, 2);
});

test('the application rule applies only to server dictionaries, excluding English', () => {
  const factory = require('../rspack.config');
  const server = factory({ isServer: true, isClient: false });
  const client = factory({ isServer: false, isClient: true });
  const rule = server.module.rules.find(rule => rule.use?.some(value => String(value).includes('meteor-i18n-server-loader')));
  assert.ok(rule);
  assert.equal(rule.type, 'javascript/auto');
  assert.equal(rule.include, path.join(root, 'imports/i18n/data'));
  assert.ok(rule.test.test('fr.i18n.json'));
  assert.ok(rule.exclude.test(path.join(root, 'imports/i18n/data/en.i18n.json')));
  assert.ok(!rule.exclude.test(path.join(root, 'imports/i18n/data/en-GB.i18n.json')));
  assert.ok(!client.module.rules.some(rule => rule.use?.some(value => String(value).includes('meteor-i18n-server-loader'))));
});
