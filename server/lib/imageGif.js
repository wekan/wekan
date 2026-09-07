import crypto from 'crypto';
import { createRequire } from 'module';
import path from 'path';

export const IMAGE_MAX_BYTES = 32 * 1024 * 1024;
export const IMAGE_MAX_PIXELS = 40 * 1000 * 1000;
export const IMAGE_MAX_EDGE = 1024;

// Load the native image converter only when an image needs conversion.
function loadSharpAtRuntime() {
  // Resolve native optional dependencies from the application package. During
  // development import.meta.url points below _build/, which has no node_modules.
  const runtimeRequire = createRequire(path.join(process.cwd(), 'package.json'));
  const packageName = ['sh', 'arp'].join('');
  return runtimeRequire(packageName);
}

export function gifCacheKey(fileObj) {
  const version = fileObj?.versions?.original || {};
  const identity = JSON.stringify({
    id: fileObj?._id || '',
    checksum: version.sha256 || version.md5 || fileObj?.sha256 || fileObj?.md5 || '',
    size: version.size || fileObj?.size || 0,
    updatedAt: fileObj?.updatedAt || fileObj?.uploadedAt || '',
  });
  return crypto.createHash('sha256').update(identity).digest('hex');
}

export async function boundedStreamBuffer(stream, maxBytes = IMAGE_MAX_BYTES) {
  if (!stream || typeof stream[Symbol.asyncIterator] !== 'function') {
    throw new Error('Attachment image stream is unavailable');
  }
  const chunks = [];
  let length = 0;
  for await (const chunk of stream) {
    length += chunk.length;
    if (length > maxBytes) {
      if (typeof stream.destroy === 'function') stream.destroy();
      throw new Error('Attachment image exceeds the conversion limit');
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks, length);
}

export async function convertImageBufferToGif(input) {
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
      width: IMAGE_MAX_EDGE,
      height: IMAGE_MAX_EDGE,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .gif({ colours: 256, effort: 3 })
    .toBuffer();
}

export async function storeGeneratedGif(fileObj, gif, options) {
  const { factory, collection, getDefaultStorage, versionName = 'generatedGif' } = options;
  const storage = await getDefaultStorage();
  const target = factory.getFileStrategy(fileObj, versionName, storage);
  if (!target) throw new Error('GIF default storage is unavailable');
  const targetPath = target.getNewPath(factory.storagePath, `${fileObj._id}.gif`);
  const version = {
    path: targetPath, size: gif.length, type: 'image/gif', extension: 'gif',
    storage: target.getStorageName(), cacheKey: gifCacheKey(fileObj),
  };
  await collection.updateAsync({ _id: fileObj._id }, { $set: { [`versions.${versionName}`]: version } });
  fileObj.versions[versionName] = version;
  const output = target.getWriteStream(targetPath);
  if (!output) throw new Error('GIF default storage is not writable');
  await new Promise((resolve, reject) => {
    output.once('error', reject); output.once('finish', resolve); output.end(gif);
  });
  if (typeof target.waitUntilStored === 'function') await target.waitUntilStored();
  if (typeof target.writeStreamFinished === 'function') target.writeStreamFinished();
  return gif;
}
