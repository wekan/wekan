import fs from 'fs';
import path from 'path';
import { PassThrough } from 'stream';
import { Meteor } from 'meteor/meteor';
import { createObjectId } from './grid/createObjectId';
import { httpStreamOutput } from './httpStream.js';
import {
  STORAGE_NAME_FILESYSTEM,
  STORAGE_NAME_GRIDFS,
  STORAGE_NAME_S3,
  STORAGE_NAME_AZURE,
  STORAGE_NAME_GCS,
  CLOUD_STORAGE_NAMES,
} from './fileStoreConstants';
import { getCloudAdapter, isCloudConfigured } from './cloudStorage';
import { ObjectId } from 'bson';

// Re-export constants from shared module (keeps existing import paths working)
export {
  STORAGE_NAME_FILESYSTEM,
  STORAGE_NAME_GRIDFS,
  STORAGE_NAME_S3,
  STORAGE_NAME_AZURE,
  STORAGE_NAME_GCS,
  CLOUD_STORAGE_NAMES,
} from './fileStoreConstants';

// Pure filename helpers (path traversal + length cap) live in a Meteor-free
// module so they can be unit tested directly with Node. See
// models/lib/filenameSanitizer.js (#6412).
const { sanitizeFilename } = require('./filenameSanitizer');
const { hasEnoughDiskSpace } = require('./diskSpace');

function normalizeForCompare(inputPath) {
  const normalized = path.resolve(inputPath);
  return process.platform === 'win32' ? normalized.toLowerCase() : normalized;
}

function isPathInside(basePath, targetPath) {
  const normalizedBase = normalizeForCompare(basePath);
  const normalizedTarget = normalizeForCompare(targetPath);
  const relative = path.relative(normalizedBase, normalizedTarget);

  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function tryRealPath(inputPath) {
  try {
    return fs.realpathSync(inputPath);
  } catch (err) {
    return null;
  }
}

function isSafeReadableFile(candidatePath, storageRootPath) {
  if (!candidatePath || !storageRootPath) {
    return false;
  }

  if (!isPathInside(storageRootPath, candidatePath)) {
    return false;
  }

  try {
    const candidateRealPath = tryRealPath(candidatePath) || candidatePath;
    if (!isPathInside(storageRootPath, candidateRealPath)) {
      return false;
    }

    const stats = fs.statSync(candidateRealPath);
    return stats.isFile();
  } catch (err) {
    return false;
  }
}

/** Factory for FileStoreStrategy */
export default class FileStoreStrategyFactory {

  /** constructor
   * @param classFileStoreStrategyFilesystem use this strategy for filesystem storage
   * @param storagePath file storage path
   * @param classFileStoreStrategyGridFs use this strategy for GridFS storage
   * @param gridFsBucket use this GridFS Bucket as GridFS Storage
   * @param classFileStoreStrategyCloud strategy class for cloud backends (S3/Azure/GCS), optional
   */
  constructor(classFileStoreStrategyFilesystem, storagePath, classFileStoreStrategyGridFs, gridFsBucket, classFileStoreStrategyCloud, collection) {
    this.classFileStoreStrategyFilesystem = classFileStoreStrategyFilesystem;
    this.storagePath = storagePath;
    this.classFileStoreStrategyGridFs = classFileStoreStrategyGridFs;
    this.gridFsBucket = gridFsBucket;
    // Single strategy class handling every cloud provider (S3/Azure/GCS) via
    // @tweedegolf/storage-abstraction. Optional: when omitted (or the npm
    // packages are absent) cloud storage falls back to the filesystem.
    this.classFileStoreStrategyCloud = classFileStoreStrategyCloud;
    // The FilesCollection (Attachments or Avatars) whose documents this factory
    // operates on. Strategies persist storage/path changes to this collection so
    // the same code can move both attachments and avatars. Defaults to the
    // global Attachments for backward compatibility.
    this.collection = collection;
  }

  /** returns the right FileStoreStrategy
   * @param fileObj the current file object
   * @param versionName the current version
   * @param use this storage, or if not set, get the storage from fileObj
   */
  getFileStrategy(fileObj, versionName, storage) {
    if (!storage) {
      storage = fileObj.versions[versionName].storage;
      if (!storage) {
        if (fileObj.meta.source == "import" || fileObj.versions[versionName].meta.gridFsFileId) {
          // uploaded by import, so it's in GridFS (MongoDB)
          storage = STORAGE_NAME_GRIDFS;
        } else {
          // newly uploaded, so it's at the filesystem
          storage = STORAGE_NAME_FILESYSTEM;
        }
      }
    }
    let ret;
    if (storage == STORAGE_NAME_FILESYSTEM) {
      ret = new this.classFileStoreStrategyFilesystem(fileObj, versionName, this.collection);
    } else if (storage == STORAGE_NAME_GRIDFS) {
      ret = new this.classFileStoreStrategyGridFs(this.gridFsBucket, fileObj, versionName, this.collection);
    } else if (CLOUD_STORAGE_NAMES.includes(storage)) {
      if (this.classFileStoreStrategyCloud && isCloudConfigured(storage)) {
        ret = new this.classFileStoreStrategyCloud(storage, fileObj, versionName, this.collection);
      } else {
        // Cloud strategy unavailable or provider not configured — fall back to
        // filesystem so reads of files that never actually reached the cloud
        // still resolve instead of throwing.
        console.warn(`Cloud storage "${storage}" is not configured; falling back to filesystem storage`);
        ret = new this.classFileStoreStrategyFilesystem(fileObj, versionName, this.collection);
      }
    }
    return ret;
  }
}

/** Strategy to store files */
class FileStoreStrategy {

  /** constructor
   * @param fileObj the current file object
   * @param versionName the current version
   */
  constructor(fileObj, versionName, collection) {
    this.fileObj = fileObj;
    this.versionName = versionName;
    // FilesCollection to persist changes to (Attachments or Avatars). Falls
    // back to the global Attachments when not supplied.
    this.collection = collection || Attachments;
  }

  /** after successfull upload */
  onAfterUpload() {
  }

  /** download the file
   * @param http the current http request
   * @param cacheControl cacheControl of FilesCollection
   */
  interceptDownload(http, cacheControl) {
  }

  /** after file remove */
  onAfterRemove() {
  }

  /** returns a read stream
   * @return the read stream
   */
  getReadStream() {
  }

  /** returns a write stream
   * @param filePath if set, use this path
   * @return the write stream
   */
  getWriteStream(filePath) {
  }

  /** writing finished
   * @param finishedData the data of the write stream finish event
   */
  writeStreamFinished(finishedData) {
  }

  /** returns the new file path
   * @param storagePath use this storage path
   * @return the new file path
   */
  getNewPath(storagePath, name) {
    if (typeof name !== 'string') {
      name = this.fileObj.name;
    }
    // Sanitize filename to prevent path traversal attacks
    const safeName = sanitizeFilename(name);
    const ret = path.join(storagePath, this.fileObj._id + "-" + this.versionName + "-" + safeName);
    return ret;
  }

  /** remove the file */
  unlink() {
  }

  /** rename the file (physical)
   * @li at database the filename is updated after this method
   * @param newFilePath the new file path
   */
  rename(newFilePath) {
  }

  /** return the storage name
   * @return the storage name
   */
  getStorageName() {
  }
}

/** Strategy to store attachments at GridFS (MongoDB) */
export class FileStoreStrategyGridFs extends FileStoreStrategy {

  /** constructor
   * @param gridFsBucket use this GridFS Bucket
   * @param fileObj the current file object
   * @param versionName the current version
   */
  constructor(gridFsBucket, fileObj, versionName, collection) {
    super(fileObj, versionName, collection);
    this.gridFsBucket = gridFsBucket;
  }

  /** download the file
   * @param http the current http request
   * @param cacheControl cacheControl of FilesCollection
   */
  interceptDownload(http, cacheControl) {
    const readStream = this.getReadStream();
    const downloadFlag = http?.params?.query?.download;

    let ret = false;
    if (readStream) {
      ret = true;
      httpStreamOutput(readStream, this.fileObj.name, http, downloadFlag, cacheControl, this.fileObj);
    }

    return ret;
  }

  /** after file remove */
  onAfterRemove() {
    this.unlink();
    super.onAfterRemove();
  }

  /** returns a read stream
   * @return the read stream
   */
  getReadStream() {
    const gfsId = this.getGridFsObjectId();
    let ret;
    if (gfsId) {
      ret = this.gridFsBucket.openDownloadStream(gfsId);
    }
    return ret;
  }

  /** returns a write stream
   * @param filePath if set, use this path
   * @return the write stream
   */
  getWriteStream(filePath) {
    const fileObj = this.fileObj;
    const versionName = this.versionName;
    const metadata = { ...fileObj.meta, versionName, fileId: fileObj._id };
    const ret = this.gridFsBucket.openUploadStream(this.fileObj.name, {
      contentType: fileObj.type || 'binary/octet-stream',
      metadata,
    });
    // Keep a reference so writeStreamFinished can read the uploaded file's id
    // from the stream — the mongodb driver's 'finish' event no longer passes the
    // stored file document.
    this.gridFsWriteStream = ret;
    return ret;
  }

  /** writing finished
   * @param finishedData the data of the write stream finish event
   */
  writeStreamFinished(finishedData) {
    const gridFsFileIdName = this.getGridFsFileIdName();
    // Older mongodb drivers passed the stored file document to the 'finish'
    // event; current drivers emit it with no argument (so finishedData is
    // undefined and `finishedData._id` threw, crashing the server). Resolve the
    // GridFS file id from the finish data when present, otherwise from the write
    // stream itself (`id` is assigned by openUploadStream; `gridFSFile._id` is
    // set once the upload finishes).
    const stream = this.gridFsWriteStream;
    const gridFsId =
      (finishedData && finishedData._id) ||
      (stream && stream.gridFSFile && stream.gridFSFile._id) ||
      (stream && stream.id);
    if (!gridFsId) {
      console.error(
        'GridFS write finished but no file id was available for',
        this.fileObj && this.fileObj._id,
      );
      return;
    }
    const hexId =
      typeof gridFsId.toHexString === 'function' ? gridFsId.toHexString() : String(gridFsId);
    this.collection.updateAsync(
      { _id: this.fileObj._id },
      { $set: { [gridFsFileIdName]: hexId } },
    ).catch(error => {
      console.error('Failed to persist GridFS file id:', error);
    });
  }

  /** remove the file */
  unlink() {
    const gfsId = this.getGridFsObjectId();
    if (gfsId) {
      this.gridFsBucket.delete(gfsId, err => {
        if (err) {
          console.error("error on gfs bucket.delete: ", err);
        }
      });
    }

    const gridFsFileIdName = this.getGridFsFileIdName();
    this.collection.updateAsync(
      { _id: this.fileObj._id },
      { $unset: { [gridFsFileIdName]: 1 } },
    ).catch(error => {
      console.error('Failed to clear GridFS file id:', error);
    });
  }

  /** return the storage name
   * @return the storage name
   */
  getStorageName() {
    return STORAGE_NAME_GRIDFS;
  }

  /** returns the GridFS Object-Id
   * @return the GridFS Object-Id
   */
  getGridFsObjectId() {
    let ret;
    const gridFsFileId = this.getGridFsFileId();
    if (gridFsFileId) {
      ret = createObjectId({ gridFsFileId });
    }
    return ret;
  }

  /** returns the GridFS Object-Id
   * @return the GridFS Object-Id
   */
  getGridFsFileId() {
    const ret = (this.fileObj.versions[this.versionName].meta || {})
      .gridFsFileId;
    return ret;
  }

  /** returns the property name of gridFsFileId
   * @return the property name of gridFsFileId
   */
  getGridFsFileIdName() {
    const ret = `versions.${this.versionName}.meta.gridFsFileId`;
    return ret;
  }
}

/** Strategy to store attachments at filesystem */
export class FileStoreStrategyFilesystem extends FileStoreStrategy {

  /** constructor
   * @param fileObj the current file object
   * @param versionName the current version
   */
  constructor(fileObj, versionName, collection) {
    super(fileObj, versionName, collection);
  }

  /** returns a read stream
   * @return the read stream
   */
  getReadStream() {
    const v = this.fileObj.versions[this.versionName] || {};
    const originalPath = v.path || '';
    const normalized = (originalPath || '').replace(/\\/g, '/');
    const isAvatar = normalized.includes('/avatars/') || (this.fileObj.collectionName === 'avatars');
    const baseDir = isAvatar ? 'avatars' : 'attachments';
    const writableBase = process.env.WRITABLE_PATH || process.cwd();
    const endsWithFiles = writableBase.endsWith('/files') || writableBase.endsWith('\\files');
    const storageRoot = endsWithFiles
      ? path.join(writableBase, baseDir)
      : path.join(writableBase, 'files', baseDir);
    const resolvedStorageRoot = tryRealPath(storageRoot) || path.resolve(storageRoot);

    // Build candidate list in priority order
    const candidates = [];

    // 0) Try to find project root and resolve from there
    let projectRoot = null;
    if (originalPath) {
      // Find project root by looking for .meteor directory
      let current = process.cwd();
      let maxLevels = 10; // Safety limit

      while (maxLevels-- > 0) {
        const meteorPath = path.join(current, '.meteor');
        const packagePath = path.join(current, 'package.json');

        if (fs.existsSync(meteorPath) || fs.existsSync(packagePath)) {
          projectRoot = current;
          break;
        }

        const parent = path.dirname(current);
        if (parent === current) break; // Reached filesystem root
        current = parent;
      }

      if (projectRoot) {
        // Try resolving originalPath from project root
        const fromProjectRoot = path.resolve(projectRoot, originalPath);
        candidates.push(fromProjectRoot);

        // Also try direct path: projectRoot/attachments/filename
        const baseName = path.basename(normalized || this.fileObj._id || '');
        if (baseName) {
          const directPath = path.join(projectRoot, baseDir, baseName);
          candidates.push(directPath);
        }
      }
    }

    // 1) Original as-is (absolute or relative resolved to CWD)
    if (originalPath) {
      candidates.push(originalPath);
      if (!path.isAbsolute(originalPath)) {
        candidates.push(path.resolve(process.cwd(), originalPath));
        candidates.push(path.resolve(storageRoot, originalPath));
      }
    }
    // 2) Same basename in storageRoot
    const baseName = path.basename(normalized || this.fileObj._id || '');
    if (baseName) {
      candidates.push(path.join(storageRoot, baseName));
    }
    // 3) Only ObjectID (no extension) in storageRoot
    if (this.fileObj && this.fileObj._id) {
      candidates.push(path.join(storageRoot, String(this.fileObj._id)));
    }
    // 3) Old naming: {id}-{version}-{originalName}
    if (this.fileObj.name) {
      const safeName = sanitizeFilename(this.fileObj.name);
      candidates.push(path.join(storageRoot, `${this.fileObj._id}-${this.versionName}-${safeName}`));
    }

    // 4) Fallback by prefix: {id}-{version}-* (covers unknown/changed original names)
    if (this.fileObj && this.fileObj._id) {
      try {
        const prefix = `${this.fileObj._id}-${this.versionName}-`;
        const dirEntries = fs.readdirSync(storageRoot);
        const prefixedMatch = dirEntries.find((entry) => entry.startsWith(prefix));
        if (prefixedMatch) {
          candidates.push(path.join(storageRoot, prefixedMatch));
        }
      } catch (err) {
        // Ignore listing errors and continue with other candidates
      }
    }

    // Pick first existing candidate
    let chosen;
    for (const c of candidates) {
      if (isSafeReadableFile(c, resolvedStorageRoot)) {
        chosen = c;
        break;
      }
    }

    if (!chosen) {
      return undefined;
    }
    return fs.createReadStream(chosen);
  }

  /** returns a write stream
   * @param filePath if set, use this path
   * @return the write stream
   */
  getWriteStream(filePath) {
    if (typeof filePath !== 'string') {
      filePath = this.fileObj.versions[this.versionName].path;
    }
    const ret = fs.createWriteStream(filePath);
    return ret;
  }

  /** writing finished
   * @param finishedData the data of the write stream finish event
   */
  writeStreamFinished(finishedData) {
  }

  /** remove the file */
  unlink() {
    const filePath = this.fileObj.versions[this.versionName].path;
    fs.unlink(filePath, () => {});
  }

  /** rename the file (physical)
   * @li at database the filename is updated after this method
   * @param newFilePath the new file path
   */
  rename(newFilePath) {
    fs.renameSync(this.fileObj.versions[this.versionName].path, newFilePath);
  }

  /** return the storage name
   * @return the storage name
   */
  getStorageName() {
    return STORAGE_NAME_FILESYSTEM;
  }
}


/**
 * Strategy to store attachments on a cloud backend (S3-compatible, Azure Blob,
 * Google Cloud Storage) through @tweedegolf/storage-abstraction.
 *
 * The abstraction is asynchronous and result-object based, while the rest of
 * WeKan expects synchronous, pipe-able streams. We bridge the two with
 * PassThrough streams:
 *  - getReadStream() returns a PassThrough immediately and fills it once the
 *    async getFileAsStream() resolves.
 *  - getWriteStream() returns a PassThrough that the async addFileFromStream()
 *    consumes; waitUntilStored() exposes the upload's completion promise so
 *    moveToStorage() can confirm the upload before deleting the source file.
 *
 * The object key is `${id}-${version}-${name}` and is stored in
 * `versions.<version>.path` (mirrors the filesystem strategy) so reads can find
 * the object again regardless of provider.
 */
export class FileStoreStrategyCloud extends FileStoreStrategy {

  /** constructor
   * @param provider cloud storage name ('s3' | 'azure' | 'gcs')
   * @param fileObj the current file object
   * @param versionName the current version
   */
  constructor(provider, fileObj, versionName, collection) {
    super(fileObj, versionName, collection);
    this.provider = provider;
    this._uploadPromise = null;
    this._key = null;
  }

  /** download the file
   * @param http the current http request
   * @param cacheControl cacheControl of FilesCollection
   */
  interceptDownload(http, cacheControl) {
    const readStream = this.getReadStream();
    const downloadFlag = http?.params?.query?.download;

    let ret = false;
    if (readStream) {
      ret = true;
      httpStreamOutput(readStream, this.fileObj.name, http, downloadFlag, cacheControl, this.fileObj);
    }
    return ret;
  }

  /** after file remove */
  onAfterRemove() {
    this.unlink();
    super.onAfterRemove();
  }

  /** returns a read stream (filled asynchronously from the cloud backend)
   * @return the read stream
   */
  getReadStream() {
    const pass = new PassThrough();
    const adapter = getCloudAdapter(this.provider);
    if (!adapter) {
      process.nextTick(() => pass.destroy(new Error(`Cloud storage "${this.provider}" is not configured`)));
      return pass;
    }
    const key = this.getObjectKey();
    adapter.storage.getFileAsStream(adapter.bucketName, key)
      .then(result => {
        if (!result || result.error || !result.value) {
          pass.destroy(new Error(result && result.error ? result.error : 'No cloud read stream'));
          return;
        }
        result.value.on('error', error => pass.destroy(error));
        result.value.pipe(pass);
      })
      .catch(error => pass.destroy(error));
    return pass;
  }

  /** returns a write stream that uploads to the cloud backend
   * @param filePath the object key to write to (from getNewPath)
   * @return the write stream
   */
  getWriteStream(filePath) {
    const pass = new PassThrough();
    this._key = (typeof filePath === 'string' && filePath) ? filePath : this.getObjectKey();
    this._uploadError = null;

    const adapter = getCloudAdapter(this.provider);
    if (!adapter) {
      this._uploadError = new Error(`Cloud storage "${this.provider}" is not configured`);
      this._uploadPromise = Promise.resolve();
      process.nextTick(() => pass.destroy(this._uploadError));
      return pass;
    }

    // Buffer the incoming bytes and upload them as a complete buffer instead of
    // streaming a live body to the backend. Streaming an S3 PutObject body whose
    // length is unknown fails with
    //   Invalid value "undefined" for header "x-amz-decoded-content-length"
    // and, if the socket drops mid-upload, the AWS SDK's body-stream promise
    // rejects UNHANDLED and crashes the server (SyncedCron treats it as fatal).
    // A buffer has a known length and no socket-bound stream, so neither
    // happens. The bulk move processes one file at a time, so peak memory is one
    // file. The upload promise NEVER rejects — any failure is captured in
    // this._uploadError (read by waitUntilStored()).
    const chunks = [];
    this._uploadPromise = new Promise(resolve => {
      pass.on('data', chunk => chunks.push(chunk));
      pass.on('error', error => {
        if (!this._uploadError) {
          this._uploadError = error instanceof Error ? error : new Error(String(error));
        }
        resolve();
      });
      pass.on('end', () => {
        Promise.resolve()
          .then(() => adapter.storage.addFileFromBuffer({
            buffer: Buffer.concat(chunks),
            bucketName: adapter.bucketName,
            targetPath: this._key,
          }))
          .then(result => {
            if (result && result.error) {
              this._uploadError = new Error(result.error);
            }
          })
          .catch(error => {
            this._uploadError = error instanceof Error ? error : new Error(String(error));
          })
          .then(resolve);
      });
    });
    return pass;
  }

  /** Promise resolving once the upload has durably completed on the backend.
   * moveToStorage() awaits this before deleting the source file.
   */
  waitUntilStored() {
    // Wait for the (non-rejecting) upload promise, then re-throw any captured
    // error so moveToStorage's try/catch keeps the source file intact instead of
    // deleting it after a failed upload.
    return Promise.resolve(this._uploadPromise).then(() => {
      if (this._uploadError) {
        throw this._uploadError;
      }
    });
  }

  /** writing finished — persist the object key in the version meta */
  writeStreamFinished(finishedData) {
    const field = this.getCloudFileIdName();
    this.collection.updateAsync(
      { _id: this.fileObj._id },
      { $set: { [field]: this._key } },
    ).catch(error => {
      console.error('Failed to persist cloud file id:', error);
    });
  }

  /** remove the file from the cloud backend */
  unlink() {
    const adapter = getCloudAdapter(this.provider);
    if (!adapter) {
      return;
    }
    const key = this.getObjectKey();
    Promise.resolve(adapter.storage.removeFile(adapter.bucketName, key)).catch(error => {
      console.error('Failed to remove cloud file:', error);
    });

    const field = this.getCloudFileIdName();
    this.collection.updateAsync(
      { _id: this.fileObj._id },
      { $unset: { [field]: 1 } },
    ).catch(error => {
      console.error('Failed to clear cloud file id:', error);
    });
  }

  /** the object key used in the cloud bucket */
  getObjectKey() {
    const version = this.fileObj.versions[this.versionName] || {};
    if (version.path) {
      return version.path;
    }
    const meta = version.meta || {};
    if (meta[`${this.provider}FileId`]) {
      return meta[`${this.provider}FileId`];
    }
    const safeName = sanitizeFilename(this.fileObj.name);
    return `${this.fileObj._id}-${this.versionName}-${safeName}`;
  }

  /** the object key for a fresh write (no leading storage directory) */
  getNewPath(storagePath, name) {
    if (typeof name !== 'string') {
      name = this.fileObj.name;
    }
    const safeName = sanitizeFilename(name);
    return `${this.fileObj._id}-${this.versionName}-${safeName}`;
  }

  /** the database field storing this provider's object key */
  getCloudFileIdName() {
    return `versions.${this.versionName}.meta.${this.provider}FileId`;
  }

  /** rename the file: cloud objects are keyed by id+version+name, so a rename
   * is a server-side copy to the new key followed by removal of the old one.
   */
  rename(newFilePath) {
    const adapter = getCloudAdapter(this.provider);
    if (!adapter) {
      return;
    }
    const oldKey = this.getObjectKey();
    const newKey = newFilePath;
    if (!oldKey || !newKey || oldKey === newKey) {
      return;
    }
    adapter.storage.getFileAsStream(adapter.bucketName, oldKey)
      .then(result => {
        if (!result || result.error || !result.value) {
          throw new Error(result && result.error ? result.error : 'No cloud read stream for rename');
        }
        return adapter.storage.addFileFromStream({
          stream: result.value,
          bucketName: adapter.bucketName,
          targetPath: newKey,
        });
      })
      .then(() => adapter.storage.removeFile(adapter.bucketName, oldKey))
      .catch(error => console.error('Failed to rename cloud file:', error));
  }

  /** return the storage name (the provider) */
  getStorageName() {
    return this.provider;
  }
}


/** move the fileObj to another storage
 * @param fileObj move this fileObj to another storage
 * @param storageDestination the storage destination (fs or gridfs)
 * @param fileStoreStrategyFactory get FileStoreStrategy from this factory
 * @return a Promise that resolves once every version has finished moving.
 *   Existing callers may ignore the return value (fire-and-forget); the
 *   server-side bulk move job awaits it to move attachments sequentially.
 */
export const moveToStorage = async function(fileObj, storageDestination, fileStoreStrategyFactory) {
  const collection = fileStoreStrategyFactory.collection || Attachments;

  // When migrating/moving a file, sanitize known exploits from its CONTENT with the
  // same general function used on upload (strip JavaScript + XML-loop DOCTYPE/ENTITY
  // from SVG), so the sanitized bytes are what get written to the destination. Runs
  // in place on the local filesystem source (the common migration direction); the
  // serve-time sanitizer is the backstop for files still on a remote backend.
  try {
    const { sanitizeUploadedFileExploits } = require('./sanitizeUploadedFile');
    if (sanitizeUploadedFileExploits(fileObj)) {
      await collection.updateAsync({ _id: fileObj._id }, { $set: { versions: fileObj.versions } })
        .catch(error => console.error('Failed to persist sanitized versions before move:', error));
      try {
        await require('/server/lib/filenameSanitizeLog').logContentSanitized({
          fileObj, source: 'storageMigration',
        });
      } catch (e) { /* best effort */ }
    }
  } catch (error) {
    console.error('[moveToStorage] content exploit sanitize failed (continuing):', error);
  }

  // When migrating/moving a file to its destination storage, fix the filename with
  // the SAME general function used on upload: detect the real file type and correct
  // the extension, strip invisible/exploit characters, fold confusable homoglyphs,
  // cap the length to a portable maximum, keep it path-safe, and disambiguate a
  // different-content same-name collision with increasing numbering. The corrected
  // name is saved as the filename at the destination.
  try {
    const { finalizeStoredFileName } = require('./fileTypeCorrection');
    const originalName = fileObj.name;
    const { name: finalName, changed, detectedMime } = await finalizeStoredFileName(collection, fileObj, fileStoreStrategyFactory);
    if (changed && finalName) {
      const lastDot = finalName.lastIndexOf('.');
      const extension = lastDot === -1 ? '' : finalName.substring(lastDot + 1).toLowerCase();
      await collection.updateAsync({ _id: fileObj._id }, { $set: {
        name: finalName,
        extension,
        extensionWithDot: extension ? `.${extension}` : '',
      } }).catch(error => console.error('Failed to persist migrated attachment name:', error));
      // Log to Admin Panel / Problems: who uploaded, why it was sanitized, when.
      try {
        const { sanitizationReasons } = require('./uploadFileName');
        await require('/server/lib/filenameSanitizeLog').logFilenameSanitized({
          fileObj, source: 'storageMigration',
          reasons: sanitizationReasons(originalName, detectedMime || fileObj.type, finalName),
          from: originalName, to: finalName,
        });
      } catch (e) { /* best effort */ }
      fileObj.name = finalName;
    }
  } catch (error) {
    // Never block a move because name-finalization failed; fall back to the basic
    // path-traversal sanitizer so a malicious stored name is still cleaned up.
    console.error('[moveToStorage] filename finalization failed, using basic sanitizer:', error);
    const safeName = sanitizeFilename(fileObj.name);
    if (safeName !== fileObj.name) {
      collection.updateAsync({ _id: fileObj._id }, { $set: { name: safeName } }).catch(e => {
        console.error('Failed to persist sanitized attachment name:', e);
      });
      fileObj.name = safeName;
    }
  }

  const versionPromises = Object.keys(fileObj.versions).map(versionName => new Promise(resolve => {
    const strategyRead = fileStoreStrategyFactory.getFileStrategy(fileObj, versionName);
    const strategyWrite = fileStoreStrategyFactory.getFileStrategy(fileObj, versionName, storageDestination);

    // Compare by storage name rather than class name: every cloud provider
    // shares the same strategy class, so constructor.name would wrongly treat
    // an S3 -> Azure move as "already there".
    if (strategyRead.getStorageName() == strategyWrite.getStorageName()) {
      // Already on the destination storage, nothing to move for this version.
      resolve();
      return;
    }

    const readStream = strategyRead.getReadStream();

    const filePath = strategyWrite.getNewPath(fileStoreStrategyFactory.storagePath);

    // Before writing to local-disk (filesystem) storage, make sure there is enough
    // free space for this version — so a large move cannot fill the disk. When the
    // platform does not expose free-space info (e.g. a sandbox), hasEnoughDiskSpace
    // returns true and we proceed with chunked streaming, relying on the write-error
    // handler below to stop and remove any partial output. Never delete the source.
    if (strategyWrite.getStorageName() === STORAGE_NAME_FILESYSTEM) {
      const versionSize = (fileObj.versions[versionName] && fileObj.versions[versionName].size) || fileObj.size || 0;
      if (!hasEnoughDiskSpace(fileStoreStrategyFactory.storagePath, versionSize)) {
        console.error(
          '[moveToStorage] not enough free disk space to move attachment',
          fileObj._id, `version "${versionName}" (${versionSize} bytes) — skipping, source left intact.`,
        );
        resolve();
        return;
      }
    }

    const writeStream = strategyWrite.getWriteStream(filePath);

    // The source binary may be missing at its recorded location (e.g. a file left
    // half-moved by an earlier interrupted run: storage says "gridfs" but the
    // GridFS id reference is gone, or a filesystem path that no longer exists). In
    // that case getReadStream()/getWriteStream() return undefined. Skip this
    // version cleanly instead of throwing "Cannot read properties of undefined
    // (reading 'on')", and crucially do NOT delete the source — leave it intact so
    // no data is lost and the admin can investigate.
    if (!readStream || !writeStream) {
      console.error(
        '[moveToStorage] cannot move attachment',
        fileObj._id,
        `version "${versionName}" from ${strategyRead.getStorageName()} to ${strategyWrite.getStorageName()}:`,
        !readStream
          ? 'source file not found at its recorded location'
          : 'could not open the destination write stream',
        '— skipping this file, source left intact.',
      );
      resolve();
      return;
    }

    let ended = false;
    let finished = false;
    let settled = false;

    // Persist the new storage location and delete the source — but only once
    // the write is durably stored. For cloud backends waitUntilStored() awaits
    // the actual upload, so a failed upload never deletes the source file.
    const finalize = async () => {
      if (settled) {
        return;
      }
      settled = true;
      try {
        if (typeof strategyWrite.waitUntilStored === 'function') {
          await strategyWrite.waitUntilStored();
        }
        await (fileStoreStrategyFactory.collection || Attachments).updateAsync({ _id: fileObj._id }, { $set: {
          [`versions.${versionName}.storage`]: strategyWrite.getStorageName(),
          [`versions.${versionName}.path`]: filePath,
        } });
        strategyRead.unlink();
      } catch (error) {
        console.error('[moveToStorage] write not confirmed, keeping source intact: ', error, fileObj._id);
      }
      resolve();
    };

    // https://forums.meteor.com/t/meteor-code-must-always-run-within-a-fiber-try-wrapping-callbacks-that-you-pass-to-non-meteor-libraries-with-meteor-bindenvironmen/40099/8
    const settle = () => {
      if (ended && finished) {
        // finalize() handles its own errors, but guard the floating promise so a
        // stray rejection can never become an unhandled rejection (fatal to
        // SyncedCron).
        finalize().catch(error => {
          console.error('[moveToStorage] finalize failed: ', error, fileObj._id);
          if (!settled) {
            settled = true;
          }
          resolve();
        });
      }
    };

    const fail = (error, label) => {
      console.error(`[${label}]: `, error, fileObj._id);
      // Stop streaming immediately and remove the partial output we already wrote,
      // so a failed move never leaves a half-written destination file behind. Only
      // the destination is removed (filesystem); the SOURCE is always left intact.
      try { readStream.destroy(); } catch (e) { /* ignore */ }
      try { writeStream.destroy(); } catch (e) { /* ignore */ }
      if (strategyWrite.getStorageName() === STORAGE_NAME_FILESYSTEM) {
        fs.promises.unlink(filePath).catch(() => {}); // remove partial destination
      }
      if (!settled) {
        settled = true;
        resolve();
      }
    };

    writeStream.on('error', error => fail(error, 'writeStream error'));
    readStream.on('error', error => fail(error, 'readStream error'));

    writeStream.on('finish', finishedData => {
      try {
        strategyWrite.writeStreamFinished(finishedData);
      } catch (error) {
        // Persisting the storage id must never crash the process via this
        // (synchronous) event callback; the move is finalized below regardless.
        console.error('[writeStreamFinished error]: ', error, fileObj._id);
      }
      finished = true;
      settle();
    });

    readStream.on('end', () => {
      ended = true;
      settle();
    });

    readStream.pipe(writeStream);
  }));

  return Promise.all(versionPromises);
};

export const copyFile = async function(fileObj, newCardId, fileStoreStrategyFactory) {
  const newCard = await ReactiveCache.getCard(newCardId);

  // Sanitize known exploits from the source content, and fix + sanitize the copied
  // filename with the same general upload function (fold homoglyphs, strip
  // invisible/exploit chars, correct the extension for the type, cap the length).
  try {
    const { sanitizeUploadedFileExploits } = require('./sanitizeUploadedFile');
    sanitizeUploadedFileExploits(fileObj);
  } catch (e) { /* best effort */ }
  let copyName = fileObj.name;
  try {
    const { sanitizeUploadFileName } = require('./uploadFileName');
    copyName = sanitizeUploadFileName(fileObj.name, fileObj.type) || fileObj.name;
  } catch (e) { /* keep original name on failure */ }

  Object.keys(fileObj.versions).forEach(versionName => {
    const strategyRead = fileStoreStrategyFactory.getFileStrategy(fileObj, versionName);
    const readStream = strategyRead.getReadStream();
    const strategyWrite = fileStoreStrategyFactory.getFileStrategy(fileObj, versionName, STORAGE_NAME_FILESYSTEM);

    const safeName = sanitizeFilename(fileObj.name);
    const tempPath = path.join(fileStoreStrategyFactory.storagePath, Random.id() + "-" + versionName + "-" + safeName);
    const writeStream = strategyWrite.getWriteStream(tempPath);

    // Source binary missing at its recorded location — skip this version instead
    // of throwing "Cannot read properties of undefined (reading 'on')".
    if (!readStream || !writeStream) {
      console.error(
        '[copyFile] cannot copy attachment',
        fileObj._id,
        `version "${versionName}": source file not found at its recorded location — skipping.`,
      );
      return;
    }

    // On any error, stop streaming and remove the partial temp file so a failed
    // copy never leaves a half-written file behind (the source is untouched).
    const cleanupPartial = (error, label) => {
      console.error(`[${label}]: `, error, fileObj._id);
      try { readStream.destroy(); } catch (e) { /* ignore */ }
      try { writeStream.destroy(); } catch (e) { /* ignore */ }
      fs.promises.unlink(tempPath).catch(() => {});
    };

    writeStream.on('error', error => cleanupPartial(error, 'writeStream error'));
    readStream.on('error', error => cleanupPartial(error, 'readStream error'));

    // https://forums.meteor.com/t/meteor-code-must-always-run-within-a-fiber-try-wrapping-callbacks-that-you-pass-to-non-meteor-libraries-with-meteor-bindenvironmen/40099/8
    readStream.on('end', () => {
      const fileId = new ObjectId().toString();
      (fileStoreStrategyFactory.collection || Attachments).addFile(
        tempPath,
        {
          fileName: copyName,
          type: fileObj.type,
          meta: {
            boardId: newCard.boardId,
            cardId: newCardId,
            listId: newCard.listId,
            swimlaneId: newCard.swimlaneId,
            source: 'copy',
            copyFrom: fileObj._id,
            copyStorage: strategyRead.getStorageName(),
          },
          userId: fileObj.userId,
          size: fileObj.fileSize,
          fileId,
        },
        (err, fileRef) => {
          if (err) {
            console.log(err);
          } else {
            // Set the userId again
            (fileStoreStrategyFactory.collection || Attachments).updateAsync({ _id: fileRef._id }, { $set: { userId: fileObj.userId } }).catch(error => {
              console.error('Failed to update copied attachment userId:', error);
            });
          }
        },
        true,
      );
    });

    readStream.pipe(writeStream);
  });
};

export const rename = function(fileObj, newName, fileStoreStrategyFactory) {
  // Sanitize the new name to prevent path traversal
  const safeName = sanitizeFilename(newName);

  const lastDot = safeName.lastIndexOf('.');
  const extension = lastDot === -1 ? '' : safeName.substring(lastDot + 1).toLowerCase();
  const extensionWithDot = extension ? `.${extension}` : '';

  Object.keys(fileObj.versions).forEach(versionName => {
    const strategy = fileStoreStrategyFactory.getFileStrategy(fileObj, versionName);
    const newFilePath = strategy.getNewPath(fileStoreStrategyFactory.storagePath, safeName);
    strategy.rename(newFilePath);

    (fileStoreStrategyFactory.collection || Attachments).updateAsync({ _id: fileObj._id }, { $set: {
      "name": safeName,
      "extension": extension,
      "extensionWithDot": extensionWithDot,
      [`versions.${versionName}.path`]: newFilePath,
    } }).catch(error => {
      console.error('Failed to persist renamed attachment path:', error);
    });
  });
};
