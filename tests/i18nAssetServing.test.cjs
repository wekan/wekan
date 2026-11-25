'use strict';
// The browser's translations come from the server's one copy of each
// dictionary: /i18n/<hash>.json (server/i18nAssets.js, models/lib/i18nAsset.js),
// fetched by imports/i18n/tap.js. The bundle used to carry every dictionary
// twice, as a server asset and as a client chunk, 140 MiB each.
// Negative: no request can name another file, and no dictionary is in the
// browser's build.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { i18nAssetPath, i18nAssetHash, i18nAssetUrl } = require('../models/lib/i18nAsset');

const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const HASH = '0123456789abcdef0123';

test('a 20-hex-digit name is the server asset of that hash', () => {
  assert.equal(i18nAssetPath(`${HASH}.json`), `build-assets/i18n/${HASH}.json`);
});

test('negative: any other name is no asset at all', () => {
  for (const bad of ['', 'fr.i18n.json', `${HASH}.js`, `${HASH}.json/..`, `../${HASH}.json`, `${HASH.toUpperCase()}.json`,
    `${HASH}0.json`, `${HASH.slice(1)}.json`, `${HASH}.json?x`, '..%2F..%2Fsettings.json', `${HASH}.json\0`, null, undefined]) {
    assert.equal(i18nAssetPath(bad), null, String(bad));
  }
});

test('a module is a hash only when it says so with a real hash', () => {
  assert.equal(i18nAssetHash({ __wekanI18nAsset: HASH }), HASH);
  for (const data of [{ accept: 'Accept' }, { __wekanI18nAsset: '../x' }, { __wekanI18nAsset: 1 }, null, 'x']) {
    assert.equal(i18nAssetHash(data), null, JSON.stringify(data));
  }
});

test('the browser asks the page origin, under ROOT_URL\'s path prefix', () => {
  assert.equal(i18nAssetUrl(HASH, ''), `/i18n/${HASH}.json`);
  assert.equal(i18nAssetUrl(HASH, '/wekan'), `/wekan/i18n/${HASH}.json`);
  assert.equal(i18nAssetUrl(HASH, '/wekan/'), `/wekan/i18n/${HASH}.json`);
  assert.throws(() => i18nAssetUrl('../x', ''), /not a translation hash/);
});

test('the server serves it, cached as immutable, and the route is loaded', () => {
  const route = read('server/i18nAssets.js');
  assert.match(route, /WebApp\.handlers\.get\('\/i18n\/:file'/);
  assert.match(route, /i18nAssetPath\(req\.params\.file\)/);
  assert.match(route, /'private, max-age=31536000, immutable'/);
  assert.doesNotMatch(route, /'public/, 'negative: no shared cache keeps it');
  assert.equal((route.match(/return notFound\(res\)/g) || []).length, 3, 'a bad name, no asset table entry and no file are 404');
  assert.match(route, /application\/json/);
  assert.match(read('server/imports.js'), /^import '\/server\/i18nAssets';$/m);
});

test('tap.js fetches a hash module, forgets a failed fetch, and copies what custom translations change', () => {
  const tap = read('imports/i18n/tap.js');
  assert.match(tap, /const dictionaryHash = i18nAssetHash\(data\);\n\s+if \(dictionaryHash\) data = await fetchDictionary\(dictionaryHash\);/);
  assert.match(tap, /ROOT_URL_PATH_PREFIX/);
  assert.match(tap, /pending\.catch\(\(\) => fetchedDictionaries\.delete\(hash\)\)/);
  assert.match(tap, /\.then\(data => \(\{ \.\.\.data \}\)\)/);
});

test('negative: a built browser bundle carries no dictionary', { skip: !fs.existsSync(path.join(root, '.build/bundle/programs/web.browser/program.json')) }, () => {
  // Only meaningful for a bundle built from this source; an older one still has
  // the chunks, so this checks the newest one when it is newer than the loader.
  const program = path.join(root, '.build/bundle/programs/web.browser/program.json');
  const loader = path.join(root, 'npm-packages/meteor-i18n-server-loader/index.js');
  if (fs.statSync(program).mtimeMs < fs.statSync(loader).mtimeMs) return;
  const chunks = path.join(root, '.build/bundle/programs/web.browser/app/build-chunks');
  for (const name of fs.readdirSync(chunks).filter(n => n.endsWith('.js'))) {
    assert.doesNotMatch(fs.readFileSync(path.join(chunks, name), 'utf8').slice(0, 4000), /"act-addAttachment"/, name);
  }
});
