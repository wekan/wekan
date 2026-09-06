import crypto from 'crypto';
import { createRequire } from 'module';
import path from 'path';

export const OMI_IMAGE_MAX_BYTES = 32 * 1024 * 1024;
export const OMI_IMAGE_MAX_PIXELS = 40 * 1000 * 1000;
export const OMI_IMAGE_MAX_EDGE = 1024;
const conversionsInProgress = new Map();

// Do not import Sharp at module evaluation time. Rspack rewrites Sharp's
// platform-selecting loader and a development server that was already running
// when rspack.config.js changed can keep the old bundled loader until a full
// restart. Resolve it with Node only when a Legacy HTML4 image actually needs
// conversion. If the optional native package is unavailable, only that image
// request fails; WeKan and its HTML4 sign-in page keep running.
function loadSharpAtRuntime() {
  // Resolve native optional dependencies from the application package. During
  // development import.meta.url points below _build/, which has no node_modules.
  const runtimeRequire = createRequire(path.join(process.cwd(), 'package.json'));
  const packageName = ['sh', 'arp'].join('');
  return runtimeRequire(packageName);
}

export function omiGifCacheKey(fileObj) {
  const version = fileObj?.versions?.original || {};
  const identity = JSON.stringify({
    id: fileObj?._id || '',
    checksum: version.sha256 || version.md5 || fileObj?.sha256 || fileObj?.md5 || '',
    size: version.size || fileObj?.size || 0,
    updatedAt: fileObj?.updatedAt || fileObj?.uploadedAt || '',
  });
  return crypto.createHash('sha256').update(identity).digest('hex');
}

export async function boundedStreamBuffer(stream, maxBytes = OMI_IMAGE_MAX_BYTES) {
  if (!stream || typeof stream[Symbol.asyncIterator] !== 'function') {
    throw new Error('Attachment image stream is unavailable');
  }
  const chunks = [];
  let length = 0;
  for await (const chunk of stream) {
    length += chunk.length;
    if (length > maxBytes) {
      if (typeof stream.destroy === 'function') stream.destroy();
      throw new Error('Attachment image exceeds the Legacy HTML4 conversion limit');
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks, length);
}

export async function convertImageBufferToGif(input) {
  if (!Buffer.isBuffer(input) || input.length === 0 || input.length > OMI_IMAGE_MAX_BYTES) {
    throw new Error('Invalid Legacy HTML4 image input');
  }
  const sharp = loadSharpAtRuntime();
  return sharp(input, {
    animated: false,
    failOn: 'error',
    limitInputPixels: OMI_IMAGE_MAX_PIXELS,
  })
    .rotate()
    .resize({
      width: OMI_IMAGE_MAX_EDGE,
      height: OMI_IMAGE_MAX_EDGE,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .gif({ colours: 256, effort: 3 })
    .toBuffer();
}

// Convert only when the compatibility representation reads an image. The
// source attachment is never changed. A content/version-bound cache avoids
// spending CPU on the same conversion again.
async function createOrReadStoredGif(fileObj, options) {
  const { factory, collection, getDefaultStorage } = options;
  const existing = fileObj?.versions?.legacyHtml4Gif;
  if (existing && existing.cacheKey === omiGifCacheKey(fileObj)) {
    const strategy = factory.getFileStrategy(fileObj, 'legacyHtml4Gif');
    return boundedStreamBuffer(strategy.getReadStream());
  }

  const originalStrategy = factory.getFileStrategy(fileObj, 'original');
  const input = await boundedStreamBuffer(originalStrategy.getReadStream());
  const gif = await convertImageBufferToGif(input);

  const storage = await getDefaultStorage();
  const target = factory.getFileStrategy(fileObj, 'legacyHtml4Gif', storage);
  if (!target) throw new Error('Legacy HTML4 GIF default storage is unavailable');
  const targetPath = target.getNewPath(factory.storagePath, `${fileObj._id}.gif`);
  const version = {
    path: targetPath,
    size: gif.length,
    type: 'image/gif',
    extension: 'gif',
    storage: target.getStorageName(),
    cacheKey: omiGifCacheKey(fileObj),
  };
  await collection.updateAsync(
    { _id: fileObj._id },
    { $set: { 'versions.legacyHtml4Gif': version } },
  );
  fileObj.versions.legacyHtml4Gif = version;

  const output = target.getWriteStream(targetPath);
  if (!output) {
    await collection.updateAsync({ _id: fileObj._id }, { $unset: { 'versions.legacyHtml4Gif': 1 } });
    throw new Error('Legacy HTML4 GIF default storage is not writable');
  }
  await new Promise((resolve, reject) => {
    output.once('error', reject);
    output.once('finish', resolve);
    output.end(gif);
  });
  if (typeof target.waitUntilStored === 'function') await target.waitUntilStored();
  if (typeof target.writeStreamFinished === 'function') target.writeStreamFinished();
  return gif;
}

export async function storeGeneratedGif(fileObj, gif, options) {
  const { factory, collection, getDefaultStorage, versionName = 'legacyHtml4Gif' } = options;
  const storage = await getDefaultStorage();
  const target = factory.getFileStrategy(fileObj, versionName, storage);
  if (!target) throw new Error('Legacy HTML4 GIF default storage is unavailable');
  const targetPath = target.getNewPath(factory.storagePath, `${fileObj._id}.gif`);
  const version = {
    path: targetPath, size: gif.length, type: 'image/gif', extension: 'gif',
    storage: target.getStorageName(), cacheKey: omiGifCacheKey(fileObj),
  };
  await collection.updateAsync({ _id: fileObj._id }, { $set: { [`versions.${versionName}`]: version } });
  fileObj.versions[versionName] = version;
  const output = target.getWriteStream(targetPath);
  if (!output) throw new Error('Legacy HTML4 GIF default storage is not writable');
  await new Promise((resolve, reject) => {
    output.once('error', reject); output.once('finish', resolve); output.end(gif);
  });
  if (typeof target.waitUntilStored === 'function') await target.waitUntilStored();
  if (typeof target.writeStreamFinished === 'function') target.writeStreamFinished();
  return gif;
}

export async function attachmentAsStoredGif(fileObj, options) {
  const key = String(fileObj?._id || '');
  if (conversionsInProgress.has(key)) return conversionsInProgress.get(key);
  const work = createOrReadStoredGif(fileObj, options).finally(() => {
    conversionsInProgress.delete(key);
  });
  conversionsInProgress.set(key, work);
  return work;
}
