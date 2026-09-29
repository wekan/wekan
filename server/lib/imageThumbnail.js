import { IMAGE_MAX_BYTES, IMAGE_MAX_PIXELS, loadSharpAtRuntime } from './imageGif.js';
import thumbnailRules from '../../models/lib/attachmentThumbnail.js';

const { THUMBNAIL_EDGE } = thumbnailRules;

// wekan/wekan#3275: the /cdn/storage/attachments/<id>/thumbnail preview. Same
// input limits as the GIF conversion in imageGif.js; the output is a WebP at most
// THUMBNAIL_EDGE pixels on its longest side.
export async function convertImageBufferToThumbnail(input) {
  if (!Buffer.isBuffer(input) || input.length === 0 || input.length > IMAGE_MAX_BYTES) {
    throw new Error('Invalid image input');
  }
  const sharp = loadSharpAtRuntime();
  return sharp(input, {
    animated: false,
    failOn: 'error',
    limitInputPixels: IMAGE_MAX_PIXELS,
  })
    .rotate()
    .resize({
      width: THUMBNAIL_EDGE,
      height: THUMBNAIL_EDGE,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 80, effort: 3 })
    .toBuffer();
}

// Thumbnails are cheap to rebuild and small, so they are kept in memory, not
// in attachment storage: bounded by count and by total bytes, least recently
// used first out. The key is the file's version identity (gifCacheKey), so a
// replaced file never gets its old preview.
const THUMBNAIL_CACHE_ENTRIES = 500;
const THUMBNAIL_CACHE_BYTES = 64 * 1024 * 1024;
const thumbnailCache = new Map();
let thumbnailCacheBytes = 0;

export function cachedThumbnail(key) {
  const hit = thumbnailCache.get(key);
  if (!hit) return null;
  thumbnailCache.delete(key);
  thumbnailCache.set(key, hit);
  return hit;
}

export function rememberThumbnail(key, buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length > THUMBNAIL_CACHE_BYTES) return;
  const old = thumbnailCache.get(key);
  if (old) {
    thumbnailCacheBytes -= old.length;
    thumbnailCache.delete(key);
  }
  thumbnailCache.set(key, buffer);
  thumbnailCacheBytes += buffer.length;
  while (thumbnailCache.size > THUMBNAIL_CACHE_ENTRIES || thumbnailCacheBytes > THUMBNAIL_CACHE_BYTES) {
    const [oldestKey, oldest] = thumbnailCache.entries().next().value;
    thumbnailCache.delete(oldestKey);
    thumbnailCacheBytes -= oldest.length;
  }
}
