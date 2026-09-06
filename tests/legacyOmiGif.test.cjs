const test = require('node:test');
const assert = require('node:assert/strict');
const { Readable } = require('node:stream');

test('Legacy Omi converts an attachment image to a bounded GIF on the server', async () => {
  const {
    boundedStreamBuffer,
    convertImageBufferToGif,
    omiGifCacheKey,
  } = await import('../server/lib/legacyOmiGif.js');
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="red"/></svg>');
  const input = await boundedStreamBuffer(Readable.from([svg]), 1024);
  const gif = await convertImageBufferToGif(input);
  assert.equal(gif.subarray(0, 6).toString('ascii'), 'GIF89a');
  assert.equal(omiGifCacheKey({ _id: 'a', size: 1 }), omiGifCacheKey({ _id: 'a', size: 1 }));
  assert.notEqual(omiGifCacheKey({ _id: 'a', size: 1 }), omiGifCacheKey({ _id: 'a', size: 2 }));
});

test('Legacy Omi persists the first GIF as a version in Default Storage', async () => {
  const { attachmentAsStoredGif } = await import('../server/lib/legacyOmiGif.js');
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2"></svg>');
  const writes = [];
  const fileObj = { _id: 'image1', size: svg.length, versions: { original: {} } };
  const collection = {
    async updateAsync(selector, modifier) {
      if (modifier.$set) Object.assign(fileObj.versions, { legacyOmiGif: modifier.$set['versions.legacyOmiGif'] });
    },
  };
  const factory = {
    storagePath: '/unused',
    getFileStrategy(obj, version, storage) {
      if (version === 'original') return { getReadStream: () => Readable.from([svg]) };
      assert.equal(storage, 'gridfs');
      const { Writable } = require('node:stream');
      return {
        getNewPath: () => 'grid-id', getStorageName: () => storage,
        getWriteStream: () => new Writable({ write(chunk, encoding, done) { writes.push(chunk); done(); } }),
        writeStreamFinished() {},
      };
    },
  };
  const gif = await attachmentAsStoredGif(fileObj, {
    factory, collection, getDefaultStorage: async () => 'gridfs',
  });
  assert.equal(Buffer.concat(writes).subarray(0, 6).toString('ascii'), 'GIF89a');
  assert.equal(fileObj.versions.legacyOmiGif.storage, 'gridfs');
  assert.equal(fileObj.versions.legacyOmiGif.size, gif.length);
});

test('Legacy Omi refuses an oversized image stream before conversion', async () => {
  const { boundedStreamBuffer } = await import('../server/lib/legacyOmiGif.js');
  await assert.rejects(
    boundedStreamBuffer(Readable.from([Buffer.alloc(6), Buffer.alloc(6)]), 10),
    /exceeds/,
  );
});
