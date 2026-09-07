'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { Readable, Writable } = require('node:stream');

test('image conversion keeps GIF output and version-sensitive cache keys', async () => {
  const { boundedStreamBuffer, convertImageBufferToGif, gifCacheKey } =
    await import('../server/lib/imageGif.js');
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="red"/></svg>');
  const gif = await convertImageBufferToGif(await boundedStreamBuffer(Readable.from([svg])));
  assert.equal(gif.subarray(0, 6).toString('ascii'), 'GIF89a');
  assert.equal(gifCacheKey({ _id: 'a', size: 1 }), gifCacheKey({ _id: 'a', size: 1 }));
  assert.notEqual(gifCacheKey({ _id: 'a', size: 1 }), gifCacheKey({ _id: 'a', size: 2 }));
});

test('image conversion rejects oversized streams and empty input', async () => {
  const { boundedStreamBuffer, convertImageBufferToGif } = await import('../server/lib/imageGif.js');
  await assert.rejects(boundedStreamBuffer(Readable.from([Buffer.alloc(6), Buffer.alloc(6)]), 10), /exceeds/);
  await assert.rejects(convertImageBufferToGif(Buffer.alloc(0)), /Invalid image/);
});

test('branding GIFs still persist in the selected storage and original version', async () => {
  const { storeGeneratedGif } = await import('../server/lib/imageGif.js');
  const writes = [];
  const updates = [];
  const file = { _id: 'branding', versions: {} };
  const gif = Buffer.from('GIF89a');
  await storeGeneratedGif(file, gif, {
    versionName: 'original',
    getDefaultStorage: async () => 'gridfs',
    collection: { async updateAsync(selector, modifier) { updates.push(modifier); } },
    factory: {
      storagePath: '/unused',
      getFileStrategy(obj, version, storage) {
        assert.equal(version, 'original');
        assert.equal(storage, 'gridfs');
        return {
          getNewPath: () => 'stored-gif', getStorageName: () => storage,
          getWriteStream: () => new Writable({ write(chunk, encoding, done) { writes.push(chunk); done(); } }),
        };
      },
    },
  });
  assert.deepEqual(Buffer.concat(writes), gif);
  assert.equal(file.versions.original.storage, 'gridfs');
  assert.equal(updates[0].$set['versions.original'].size, gif.length);
  assert.equal(file.versions.legacyHtml4Gif, undefined);
});
