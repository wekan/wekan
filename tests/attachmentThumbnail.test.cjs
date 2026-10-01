'use strict';

// wekan/wekan#3275: /cdn/storage/attachments/<id>/thumbnail.
// Run: node tests/attachmentThumbnail.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const { isThumbnailPath, canThumbnail, thumbnailUrl, THUMBNAIL_EDGE } = require('../models/lib/attachmentThumbnail.js');

const ROOT = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(ROOT, file), 'utf8');

async function loadImageLib() {
  const thumbnails = await import('../server/lib/imageThumbnail.js');
  const { gifCacheKey } = await import('../server/lib/imageGif.js');
  return { ...thumbnails, gifCacheKey };
}

async function main() {
  // Only exactly "<id>/thumbnail" asks for one.
  assert.ok(isThumbnailPath('/abc123/thumbnail'));
  assert.ok(isThumbnailPath('/abc123/thumbnail?x=1'));
  for (const p of ['/abc123', '/abc123/original/photo.png', '/abc123/thumbnail/extra', '/thumbnail', '', null, '/abc/THUMBNAIL']) {
    assert.ok(!isThumbnailPath(p), String(p));
  }
  // Raster images only - never SVG, never a non-image.
  assert.ok(canThumbnail({ type: 'image/png' }));
  assert.ok(canThumbnail({ type: 'image/jpeg; charset=binary' }));
  assert.ok(canThumbnail({ name: 'photo.JPG' }), 'a migrated file with only a name');
  for (const doc of [{ type: 'image/svg+xml' }, { name: 'drawing.svg' }, { type: 'application/pdf' }, { type: 'text/html', name: 'x.png' },
    { name: 'README' }, null, {}]) {
    assert.ok(!canThumbnail(doc), JSON.stringify(doc));
  }
  assert.equal(thumbnailUrl('/cdn/storage/attachments/abc'), '/cdn/storage/attachments/abc/thumbnail');
  assert.equal(thumbnailUrl('/sub/cdn/storage/attachments/abc/'), '/sub/cdn/storage/attachments/abc/thumbnail');
  assert.equal(thumbnailUrl(''), '');
  console.log('  ok - thumbnail paths and eligible files');

  // Conversion: a WebP no larger than THUMBNAIL_EDGE, never enlarged.
  const lib = await loadImageLib();
  const big = await sharp({ create: { width: 3000, height: 1000, channels: 3, background: '#224488' } }).jpeg().toBuffer();
  const meta = await sharp(await lib.convertImageBufferToThumbnail(big)).metadata();
  assert.deepEqual([meta.format, meta.width, meta.height], ['webp', THUMBNAIL_EDGE, 171]);
  const small = await sharp({ create: { width: 40, height: 30, channels: 4, background: '#fff0' } }).png().toBuffer();
  const smallMeta = await sharp(await lib.convertImageBufferToThumbnail(small)).metadata();
  assert.deepEqual([smallMeta.width, smallMeta.height], [40, 30], 'never enlarged');
  // Negative: not an image, empty, or not a buffer.
  for (const bad of [Buffer.from('not an image'), Buffer.alloc(0), 'png']) {
    await assert.rejects(() => lib.convertImageBufferToThumbnail(bad));
  }
  console.log('  ok - conversion makes a bounded WebP and refuses non-images');

  // Cache: bounded by count, least recently used out, keyed by file version.
  for (let i = 0; i < 510; i += 1) lib.rememberThumbnail(`k${i}`, Buffer.from([i % 256]));
  assert.equal(lib.cachedThumbnail('k0'), null, 'the oldest entries were evicted');
  assert.equal(lib.cachedThumbnail('k9'), null);
  assert.ok(lib.cachedThumbnail('k509'));
  // Reading k10 (now the oldest) makes it recent, so the next insert evicts k11.
  assert.ok(lib.cachedThumbnail('k10'));
  lib.rememberThumbnail('fresh', Buffer.from([1]));
  assert.ok(lib.cachedThumbnail('k10'), 'reading an entry keeps it');
  assert.equal(lib.cachedThumbnail('k11'), null, 'the least recently used goes first');
  // Bounded by bytes too: one oversized buffer is never cached.
  lib.rememberThumbnail('huge', Buffer.alloc(65 * 1024 * 1024));
  assert.equal(lib.cachedThumbnail('huge'), null);
  const v1 = lib.gifCacheKey({ _id: 'a', versions: { original: { size: 1, sha256: 'x' } } });
  const v2 = lib.gifCacheKey({ _id: 'a', versions: { original: { size: 2, sha256: 'y' } } });
  assert.notEqual(v1, v2, 'a replaced file does not reuse the old thumbnail');
  console.log('  ok - the cache is bounded and keyed by file version');

  // The route: thumbnails come after every access check the original has.
  const route = read('server/routes/universalFileServer.js');
  const handler = route.slice(route.indexOf("WebApp.handlers.use('/cdn/storage/attachments'"), route.indexOf("WebApp.handlers.use('/cdn/storage/avatars'"));
  const at = text => { const i = handler.indexOf(text); assert.notEqual(i, -1, text); return i; };
  const thumbnail = at('const wantsThumbnail = isThumbnailPath(');
  for (const check of ['isAuthorizedForBoard(req, board)', 'isActiveSiteLogo(', 'attachmentDownloadLimits.blocked',
    'attachmentDownloadLimits.maxBytes', 'isStorageReadEnabled(storageName)']) {
    assert.ok(at(check) < thumbnail, `${check} runs before a thumbnail is served`);
  }
  assert.match(handler, /if \(wantsThumbnail && !canThumbnail\(attachment\)\) \{\s*res\.writeHead\(404\);/);
  assert.match(handler, /convertImageBufferToThumbnail\(await boundedStreamBuffer\(readStream\)\)/);
  assert.match(handler, /res\.writeHead\(302, \{ Location: Meteor\.absoluteUrl\(`cdn\/storage\/attachments\/\$\{fileId\}`\)/);
  assert.match(route, /'Cache-Control': 'private, max-age=86400'/);
  assert.doesNotMatch(route.slice(route.indexOf('function sendThumbnail')), /'Cache-Control': 'public/,
    'a thumbnail of a private board is never publicly cacheable');
  // The client uses it where images are shown small, and only there.
  assert.match(read('client/components/cards/attachments.jade'), /img\.attachment-thumbnail\(src="\{\{attachmentPreviewUrl this\}\}"/);
  // The cover is an img now (v12.12 email: a CSS background had no URL and no
  // fallback); it still uses the thumbnail, and only when there is one.
  assert.match(read('client/components/cards/minicard.jade'), /img\.minicard-cover-image\(alt="" src="\{\{attachmentPreviewUrl cover\}\}\?dummyReloadAfterSessionEstablished/);
  assert.match(read('client/components/cards/attachments.js'), /return canThumbnail\(attachment\) \? thumbnailUrl\(url\) : url;/);
  console.log('  ok - the route checks access first, and the gallery and cover use it');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
