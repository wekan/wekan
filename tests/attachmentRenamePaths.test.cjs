'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { sanitizeFilename } = require('../models/lib/filenameSanitizer');

// Exercise the Meteor helper itself with real files, as the copy tests do.
const source = fs.readFileSync(path.join(__dirname, '../models/lib/fileStoreStrategy.js'), 'utf8');
const code = source.slice(source.indexOf('export const rename = ') + 'export const rename = '.length);
const loadRename = collection => new Function('sanitizeFilename', 'Attachments', `return (${code.replace(/;\s*$/, '')});`)(sanitizeFilename, collection);

for (const versions of [['original'], ['original', 'thumbnail'], ['thumbnail', 'original']]) {
  test(`rename keeps the upload object and persisted paths aligned: ${versions.join(', ')}`, async () => {
    const root = path.join(__dirname, '../.tools/tmp');
    fs.mkdirSync(root, { recursive: true });
    const directory = fs.mkdtempSync(path.join(root, 'rename-paths-'));
    const file = { _id: 'upload', name: 'long-original-name.png', versions: {} };
    const bytes = Buffer.from([0, 1, 2, 255]);
    const writes = [];
    let completedWrites = 0;
    const collection = {
      async updateAsync(selector, modifier) {
        assert.deepEqual(selector, { _id: file._id });
        await new Promise(resolve => setImmediate(resolve));
        writes.push(modifier.$set);
        completedWrites++;
      },
    };
    for (const version of versions) {
      const filename = path.join(directory, `old-${version}.png`);
      fs.writeFileSync(filename, bytes);
      file.versions[version] = { path: filename, storage: 'fs' };
    }
    file.path = file.versions.original.path;
    const oldPath = file.path;
    const factory = {
      storagePath: directory,
      collection,
      getFileStrategy(fileObj, version) {
        return {
          getNewPath(storagePath, name) { return path.join(storagePath, `${version}-${name}`); },
          rename(destination) { fs.renameSync(fileObj.versions[version].path, destination); },
        };
      },
    };
    try {
      await loadRename({ updateAsync() { assert.fail('use the supplied collection'); } })(file, 'short.png', factory);
      assert.equal(completedWrites, versions.length, 'the caller must wait for persistence');
      assert.equal(file.path, file.versions.original.path, 'validation must open the renamed original');
      assert.deepEqual(fs.readFileSync(file.path), bytes);
      assert.equal(fs.existsSync(oldPath), false);
      for (const [index, version] of versions.entries()) {
        assert.equal(writes[index][`versions.${version}.path`], file.versions[version].path);
        assert.deepEqual(fs.readFileSync(file.versions[version].path), bytes);
        assert.equal(writes[index].name, 'short.png');
        assert.equal(writes[index].extension, 'png');
        assert.equal(writes[index].extensionWithDot, '.png');
        if (version === 'original') assert.equal(writes[index].path, file.path);
        else assert.equal(Object.hasOwn(writes[index], 'path'), false, 'a thumbnail must not replace the original path');
      }
      // onAfterUpload persists this object again; it must not restore old paths.
      assert.deepEqual(file.versions.original.path, writes[versions.indexOf('original')]['versions.original.path']);
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });
}

test('a failed physical rename leaves paths untouched and does not write metadata', async () => {
  const file = { _id: 'missing', path: 'old.png', versions: { original: { path: 'old.png' } } };
  const before = structuredClone(file);
  const factory = {
    collection: { async updateAsync() { assert.fail('a failed rename must not persist new paths'); } },
    getFileStrategy() { return {
      getNewPath() { return 'new.png'; },
      rename() { throw new Error('no file found on disk'); },
    }; },
  };
  await assert.rejects(loadRename()(file, 'new.png', factory), /no file found on disk/);
  assert.deepEqual(file, before);
});

test('rename propagates a failed metadata write to its caller', async () => {
  const file = { _id: 'upload', path: 'old.png', versions: { original: { path: 'old.png' } } };
  const collection = { async updateAsync() { throw new Error('write failed'); } };
  const factory = { getFileStrategy() { return {
    getNewPath() { return 'new.png'; }, rename() {},
  }; } };
  await assert.rejects(loadRename(collection)(file, 'new.png', factory), /write failed/);
});
