'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { transformSync } = require('@swc/core');
const root = path.resolve(__dirname, '..');
const temp = fs.mkdtempSync(path.join(root, '.tools/tmp/document-runtime-'));
const server = path.join(temp, 'programs/server');
const npm = path.join(server, 'npm/node_modules');
fs.mkdirSync(npm, { recursive: true });
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
function load(name, extra = '') {
  const module = { exports: {} };
  const context = { module, exports: module.exports, Buffer, Uint8Array, console,
    process: { cwd: () => server },
    require(name) {
      if (name === 'meteor/mongo') return { Mongo: { Collection: class {} } };
      if (name === './imageGif') return {};
      return require(name);
    },
  };
  vm.runInNewContext(transformSync(read(name) + extra, { module: { type: 'commonjs' } }).code, context);
  return module.exports;
}
(async () => {
  try {
    // Real archive decompression, with dependencies in the release layout.
    fs.cpSync(path.join(root, 'node_modules/fflate'), path.join(npm, 'fflate'), { recursive: true });
    fs.mkdirSync(path.join(npm, 'pdfjs-dist/legacy/build'), { recursive: true });
    fs.writeFileSync(path.join(npm, 'pdfjs-dist/package.json'), '{}');
    fs.writeFileSync(path.join(npm, 'pdfjs-dist/legacy/build/pdf.worker.mjs'), '');
    fs.mkdirSync(path.join(npm, 'sharp'), { recursive: true });
    fs.writeFileSync(path.join(npm, 'sharp/index.js'), 'module.exports = "release-native-module";');
    const api = load('server/lib/documentGif.js', '\nexports.test = { officeSearchText, runtimeResolve };').test;
    assert.ok(api.runtimeResolve('fflate').startsWith(npm + path.sep), 'must not accidentally use checkout dependencies');
    assert.equal(api.runtimeResolve('pdfjs-dist/legacy/build/pdf.worker.mjs'), path.join(npm, 'pdfjs-dist/legacy/build/pdf.worker.mjs'));
    assert.equal(api.runtimeResolve('pdfjs-dist/package.json'), path.join(npm, 'pdfjs-dist/package.json'));
    assert.throws(() => api.runtimeResolve('wekan-nonexistent-dependency'), { code: 'MODULE_NOT_FOUND' });
    const { zipSync, strToU8 } = require('fflate');
    const cases = [
      ['xlsx', {
        'xl/sharedStrings.xml': '<sst><si><t>Cloud spreadsheet</t></si></sst>',
        'xl/worksheets/sheet1.xml': '<worksheet><c t="s"><v>0</v></c><c><f>PRIVATE_FORMULA</f><v>42</v></c></worksheet>',
      }, 'Cloud spreadsheet 42'],
      ['docx', { 'word/document.xml': '<w:p>Cloud document &amp; text</w:p>' }, 'Cloud document & text'],
      ['pptx', { 'ppt/slides/slide1.xml': '<a:t>Cloud slides</a:t>' }, 'Cloud slides'],
    ];
    for (const [extension, entries, expected] of cases) {
      const archive = zipSync(Object.fromEntries(Object.entries(entries).map(([name, text]) => [name, strToU8(text)])));
      assert.equal(await api.officeSearchText(archive, extension), expected);
    }
    await assert.rejects(api.officeSearchText(zipSync({ 'ignored.xml': strToU8('not a spreadsheet') }), 'xlsx'), /no readable parts/);
    await assert.rejects(api.officeSearchText(zipSync({ 'word/document.xml': strToU8('a'.repeat(2 * 1024 * 1024 + 1)) }), 'docx'), /exceeds limit/);
    const images = load('server/lib/imageGif.js', '\nexports.loadForTest = loadSharpAtRuntime;');
    assert.equal(images.loadForTest(), 'release-native-module');
    // Source development also resolves through the parent node_modules.
    const sourceRequire = require('node:module').createRequire(path.join(root, 'npm/package.json'));
    assert.equal(sourceRequire.resolve('fflate'), require.resolve('fflate'));
    const docker = read('Dockerfile');
    assert.match(docker, /apt-get install --assume-yes --no-install-recommends file\n/);
    assert.doesNotMatch(docker.match(/ENV BUILD_DEPS="([^"]+)"/)[1], /\bfile\b/);
    console.log('Release dependencies: XLSX/DOCX/PPTX extraction, rejected archives, PDF assets, native-image lookup and Docker MIME utility pass.');
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
})().catch(error => { console.error(error); process.exitCode = 1; });
