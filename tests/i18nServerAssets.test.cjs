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
  // The dictionaries sit beside the entry, so its source is constant: no path
  // is turned into code (CodeQL alerts #567 and #568, js/bad-code-sanitization).
  fs.copyFileSync(french, path.join(tmp, 'fr.i18n.json'));
  fs.copyFileSync(german, path.join(tmp, 'de.i18n.json'));
  fs.writeFileSync(path.join(tmp, 'entry.cjs'), "exports.fr = () => import('./fr.i18n.json'); exports.de = () => import('./de.i18n.json');");
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
  assert.match(reads[0], /build-assets\/i18n\/[0-9a-f]{20}\.json$/);
  await context.module.exports.fr();
  assert.equal(reads.length, 1);
  await context.module.exports.de();
  assert.equal(reads.length, 2);
});

const usesLoader = rule => rule.use?.some(value => String(value?.loader || value).includes('meteor-i18n-server-loader'));

test('a browser build splits each language into a chunk that holds only its hash', async t => {
  const { rspack } = require('@rspack/core');
  const tmp = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'wekan-i18n-web-'));
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  const french = path.join(root, 'imports/i18n/data/fr.i18n.json');
  fs.copyFileSync(french, path.join(tmp, 'fr.i18n.json'));
  fs.writeFileSync(path.join(tmp, 'entry.js'), "window.fr = () => import('./fr.i18n.json');");
  const compiler = rspack({ mode: 'production', target: 'web', entry: path.join(tmp, 'entry.js'),
    output: { path: path.join(tmp, 'out'), filename: 'main.js', chunkFilename: '[id].chunk.js' },
    module: { rules: [{ test: /\.i18n\.json$/, type: 'javascript/auto',
      use: [{ loader: path.join(root, 'npm-packages/meteor-i18n-server-loader'), options: { target: 'client' } }] }] },
  });
  await new Promise((resolve, reject) => compiler.run((err, stats) => compiler.close(() => {
    if (err) reject(err); else if (stats.hasErrors()) reject(Error(stats.toString())); else resolve();
  })));
  const out = fs.readdirSync(path.join(tmp, 'out'));
  const chunks = out.filter(n => n.endsWith('.chunk.js'));
  assert.equal(chunks.length, 1, 'the language is still its own chunk, loaded on demand');
  const chunk = fs.readFileSync(path.join(tmp, 'out', chunks[0]), 'utf8');
  assert.ok(chunk.includes(loader.dictionaryHash(fs.readFileSync(french, 'utf8'))), 'it names the dictionary');
  assert.ok(chunk.length < 1000, `the chunk is ${chunk.length} bytes`);
  // Negative: no text of the dictionary, and no asset emitted for the browser.
  assert.ok(!chunk.includes(JSON.parse(fs.readFileSync(french, 'utf8'))['act-addAttachment']));
  assert.ok(!out.some(n => n.startsWith('build-assets')), out.join(' '));
});

test('the rule applies to the dictionaries but English, on the server as assets and in the browser as hashes', () => {
  const factory = require('../rspack.config');
  const server = factory({ isServer: true, isClient: false });
  const client = factory({ isServer: false, isClient: true });
  for (const [config, target] of [[server, undefined], [client, 'client']]) {
    const rule = config.module.rules.find(usesLoader);
    assert.ok(rule);
    assert.equal(rule.type, 'javascript/auto');
    assert.equal(rule.include, path.join(root, 'imports/i18n/data'));
    assert.ok(rule.test.test('fr.i18n.json'));
    assert.ok(rule.exclude.test(path.join(root, 'imports/i18n/data/en.i18n.json')));
    assert.ok(!rule.exclude.test(path.join(root, 'imports/i18n/data/en-GB.i18n.json')));
    assert.equal(rule.use[0]?.options?.target, target);
  }
});

test('in the browser a dictionary is only its hash - the bundle has one copy, on the server', () => {
  for (const name of ['fr.i18n.json', 'en-IT.i18n.json', 'ru-RU.i18n.json']) {
    const source = fs.readFileSync(path.join(root, 'imports/i18n/data', name), 'utf8');
    let emitted = 0;
    const code = loader.call({ resourcePath: name, getOptions: () => ({ target: 'client' }), emitFile: () => { emitted++; } }, source);
    assert.equal(emitted, 0, 'the browser build emits no copy');
    assert.ok(code.length < 100, `the browser module is ${code.length} bytes, not the dictionary`);
    const context = { module: { exports: {} } };
    vm.runInNewContext(code, context);
    assert.equal(JSON.stringify(context.module.exports), JSON.stringify({ __wekanI18nAsset: loader.dictionaryHash(source) }));
  }
});

test('identical dictionaries are one asset that each of them reads (#ENOENT: en-IT, en_ZA)', () => {
  const dir = path.join(root, 'imports/i18n/data');
  const byHash = new Map();
  for (const name of fs.readdirSync(dir).filter(n => n.endsWith('.i18n.json'))) {
    const source = fs.readFileSync(path.join(dir, name), 'utf8');
    let file;
    loader.call({ resourcePath: name, emitFile: f => { file = f; } }, source);
    assert.equal(file, `build-assets/i18n/${loader.dictionaryHash(source)}.json`, name);
    if (!byHash.has(file)) byHash.set(file, []);
    byHash.get(file).push(name);
  }
  // The names that used to lose their file: each shares its asset with the
  // dictionary it is a byte-for-byte copy of, and that asset is emitted.
  const assetOf = name => [...byHash].find(([, names]) => names.includes(name))[0];
  for (const [copy, original] of [['en-IT.i18n.json', 'en-BR.i18n.json'], ['en_ZA.i18n.json', 'en_AU.i18n.json']]) {
    if (fs.readFileSync(path.join(dir, copy), 'utf8') !== fs.readFileSync(path.join(dir, original), 'utf8')) continue;
    assert.equal(assetOf(copy), assetOf(original), `${copy} reads ${original}'s file`);
  }
  // Negative: no asset name carries a dictionary name, so two of them can never
  // be the same bytes under two names.
  for (const file of byHash.keys()) assert.match(file, /^build-assets\/i18n\/[0-9a-f]{20}\.json$/);
});
