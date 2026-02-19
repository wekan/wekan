import fs from 'fs';
import path from 'path';
import { createObjectId } from './grid/createObjectId';
import { httpStreamOutput } from './httpStream.js';
//import {} from './s3/Server-side-file-store.js';
import { ObjectID } from 'bson';
// DISABLED: Minio support removed due to Node.js compatibility issues
// var Minio = require('minio');

export const STORAGE_NAME_FILESYSTEM = "fs";
export const STORAGE_NAME_GRIDFS     = "gridfs";
export const STORAGE_NAME_S3         = "s3";

/**
 * Sanitize filename to prevent path traversal attacks
 * @param {string} filename - User-provided filename
 * @return {string} Sanitized filename safe for filesystem operations
 */
function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    return 'unnamed';
  }

  // Use path.basename to strip any directory components
  let safe = path.basename(filename);

  // Remove null bytes
  safe = safe.replace(/\0/g, '');

  // Remove any remaining path traversal sequences
  safe = safe.replace(/\.\.[\\/\\]/g, '');
  safe = safe.replace(/^\.\.$/, '');

  // Trim whitespace
  safe = safe.trim();

  // If empty after sanitization, use default
  if (!safe || safe === '.' || safe === '..') {
    return 'unnamed';
  }

  return safe;
}

/**
 * Sanitize filename to prevent path traversal attacks
 * @param {string} filename - User-provided filename
 * @return {string} Sanitized filename safe for filesystem operations
 */
function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    return 'unnamed';
  }

  // Use path.basename to strip any directory components
  let safe = path.basename(filename);

  // Remove null bytes
  safe = safe.replace(/\0/g, '');

  // Remove any remaining path traversal sequences
  safe = safe.replace(/\.\.[\/\\]/g, '');
  safe = safe.replace(/^\.\.$/g, '');

  // Trim whitespace
  safe = safe.trim();

  // If empty after sanitization, use default
  if (!safe || safe === '.' || safe === '..') {
    return 'unnamed';
  }

  return safe;
}

/** Factory for FileStoreStrategy */
export default class FileStoreStrategyFactory {

  /** constructor
   * @param classFileStoreStrategyFilesystem use this strategy for filesystem storage
   * @param storagePath file storage path
   * @param classFileStoreStrategyGridFs use this strategy for GridFS storage
   * @param gridFsBucket use this GridFS Bucket as GridFS Storage
   * @param classFileStoreStrategyS3 DISABLED: S3 storage strategy removed due to Node.js compatibility
   * @param s3Bucket DISABLED: S3 bucket removed due to Node.js compatibility
   */
  constructor(classFileStoreStrategyFilesystem, storagePath, classFileStoreStrategyGridFs, gridFsBucket, classFileStoreStrategyS3, s3Bucket) {
    this.classFileStoreStrategyFilesystem = classFileStoreStrategyFilesystem;
    this.storagePath = storagePath;
    this.classFileStoreStrategyGridFs = classFileStoreStrategyGridFs;
    this.gridFsBucket = gridFsBucket;
    // DISABLED: S3 storage strategy removed due to Node.js compatibility
    // this.classFileStoreStrategyS3 = classFileStoreStrategyS3;
    // this.s3Bucket = s3Bucket;
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
        } else if (fileObj && fileObj.versions && fileObj.versions[version] && fileObj.versions[version].meta && fileObj.versions[version].meta.pipePath) {
          // DISABLED: S3 storage removed due to Node.js compatibility - fallback to filesystem
          storage = STORAGE_NAME_FILESYSTEM;
        } else {
          // newly uploaded, so it's at the filesystem
          storage = STORAGE_NAME_FILESYSTEM;
        }
      }
    }
    let ret;
    if ([STORAGE_NAME_FILESYSTEM, STORAGE_NAME_GRIDFS].includes(storage)) {
      if (storage == STORAGE_NAME_FILESYSTEM) {
        ret = new this.classFileStoreStrategyFilesystem(fileObj, versionName);
      } else if (storage == STORAGE_NAME_GRIDFS) {
        ret = new this.classFileStoreStrategyGridFs(this.gridFsBucket, fileObj, versionName);
      }
    } else if (storage == STORAGE_NAME_S3) {
      // DISABLED: S3 storage removed due to Node.js compatibility - fallback to filesystem
      console.warn('S3 storage is disabled due to Node.js compatibility issues, falling back to filesystem storage');
      ret = new this.classFileStoreStrategyFilesystem(fileObj, versionName);
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
  constructor(fileObj, versionName) {
    this.fileObj = fileObj;
    this.versionName = versionName;
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
    if (!_.isString(name)) {
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
  constructor(gridFsBucket, fileObj, versionName) {
    super(fileObj, versionName);
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
      httpStreamOutput(readStream, this.fileObj.name, http, downloadFlag, cacheControl);
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
    return ret;
  }

  /** writing finished
   * @param finishedData the data of the write stream finish event
   */
  writeStreamFinished(finishedData) {
    const gridFsFileIdName = this.getGridFsFileIdName();
    Attachments.update({ _id: this.fileObj._id }, { $set: { [gridFsFileIdName]: finishedData._id.toHexString(), } });
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
    Attachments.update({ _id: this.fileObj._id }, { $unset: { [gridFsFileIdName]: 1 } });
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
  constructor(fileObj, versionName) {
    super(fileObj, versionName);
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
    const storageRoot = path.join(process.env.WRITABLE_PATH || process.cwd(), baseDir);

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

    // Pick first existing candidate
    let chosen;
    for (const c of candidates) {
      try {
        const exists = c && fs.existsSync(c);
        if (exists) {
          chosen = c;
          break;
        }
      } catch (err) {
        // Continue to next candidate
      }
    }

    if (!chosen) {
      // No existing candidate found
      return undefined;
    }
    return fs.createReadStream(chosen);
  }

  /** returns a write stream
   * @param filePath if set, use this path
   * @return the write stream
   */
  getWriteStream(filePath) {
    if (!_.isString(filePath)) {
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


/** DISABLED: Strategy to store attachments at S3 - Minio support removed due to Node.js compatibility */
export class FileStoreStrategyS3 extends FileStoreStrategy {
  constructor(s3Bucket, fileObj, versionName) {
    super(fileObj, versionName);
    this.s3Bucket = s3Bucket;
  }

  onAfterUpload() {
    console.warn('S3 storage is disabled due to Node.js compatibility issues');
  }

  interceptDownload(http, fileRef, version) {
    console.warn('S3 storage is disabled due to Node.js compatibility issues');
    http.response.writeHead(503, { 'Content-Type': 'text/plain' });
    http.response.end('S3 storage is disabled');
  }

  getReadStream() {
    throw new Error('S3 storage is disabled due to Node.js compatibility issues');
  }

  getWriteStream(filePath) {
    throw new Error('S3 storage is disabled due to Node.js compatibility issues');
  }

  getPath() {
    throw new Error('S3 storage is disabled due to Node.js compatibility issues');
  }

  getNewPath(storagePath) {
    throw new Error('S3 storage is disabled due to Node.js compatibility issues');
  }

  getStorageName() {
    return STORAGE_NAME_S3;
  }

  writeStreamFinished(finishedData) {
    console.warn('S3 storage is disabled due to Node.js compatibility issues');
  }

  unlink() {
    console.warn('S3 storage is disabled due to Node.js compatibility issues');
  }

  getS3FileIdName() {
    const ret = `versions.${this.versionName}.meta.s3FileId`;
    return ret;
  }
}


/** move the fileObj to another storage
 * @param fileObj move this fileObj to another storage
 * @param storageDestination the storage destination (fs or gridfs)
 * @param fileStoreStrategyFactory get FileStoreStrategy from this factory
 */
export const moveToStorage = function(fileObj, storageDestination, fileStoreStrategyFactory) {
  // SECURITY: Sanitize filename to prevent path traversal attacks
  // This ensures any malicious names already in the database are cleaned up
  const safeName = sanitizeFilename(fileObj.name);
  if (safeName !== fileObj.name) {
    // Update the database with the sanitized name
    Attachments.update({ _id: fileObj._id }, { $set: { name: safeName } });
    // Update the local object for use in this function
    fileObj.name = safeName;
  }

  Object.keys(fileObj.versions).forEach(versionName => {
    const strategyRead = fileStoreStrategyFactory.getFileStrategy(fileObj, versionName);
    const strategyWrite = fileStoreStrategyFactory.getFileStrategy(fileObj, versionName, storageDestination);

    if (strategyRead.constructor.name != strategyWrite.constructor.name) {
      const readStream = strategyRead.getReadStream();

      const filePath = strategyWrite.getNewPath(fileStoreStrategyFactory.storagePath);
      const writeStream = strategyWrite.getWriteStream(filePath);

      writeStream.on('error', error => {
        console.error('[writeStream error]: ', error, fileObj._id);
      });

      readStream.on('error', error => {
        console.error('[readStream error]: ', error, fileObj._id);
      });

      writeStream.on('finish', Meteor.bindEnvironment((finishedData) => {
        strategyWrite.writeStreamFinished(finishedData);
      }));

      // https://forums.meteor.com/t/meteor-code-must-always-run-within-a-fiber-try-wrapping-callbacks-that-you-pass-to-non-meteor-libraries-with-meteor-bindenvironmen/40099/8
      readStream.on('end', Meteor.bindEnvironment(() => {
        Attachments.update({ _id: fileObj._id }, { $set: {
          [`versions.${versionName}.storage`]: strategyWrite.getStorageName(),
          [`versions.${versionName}.path`]: filePath,
        } });
        strategyRead.unlink();
      }));

      readStream.pipe(writeStream);
    }
  });
};

export const copyFile = async function(fileObj, newCardId, fileStoreStrategyFactory) {
  const newCard = await ReactiveCache.getCard(newCardId);
  Object.keys(fileObj.versions).forEach(versionName => {
    const strategyRead = fileStoreStrategyFactory.getFileStrategy(fileObj, versionName);
    const readStream = strategyRead.getReadStream();
    const strategyWrite = fileStoreStrategyFactory.getFileStrategy(fileObj, versionName, STORAGE_NAME_FILESYSTEM);

    const safeName = sanitizeFilename(fileObj.name);
    const tempPath = path.join(fileStoreStrategyFactory.storagePath, Random.id() + "-" + versionName + "-" + safeName);
    const writeStream = strategyWrite.getWriteStream(tempPath);

    writeStream.on('error', error => {
      console.error('[writeStream error]: ', error, fileObj._id);
    });

    readStream.on('error', error => {
      console.error('[readStream error]: ', error, fileObj._id);
    });

    // https://forums.meteor.com/t/meteor-code-must-always-run-within-a-fiber-try-wrapping-callbacks-that-you-pass-to-non-meteor-libraries-with-meteor-bindenvironmen/40099/8
    readStream.on('end', Meteor.bindEnvironment(() => {
      const fileId = new ObjectID().toString();
      Attachments.addFile(
        tempPath,
        {
          fileName: fileObj.name,
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
            Attachments.update({ _id: fileRef._id }, { $set: { userId: fileObj.userId } });
          }
        },
        true,
      );
    }));

    readStream.pipe(writeStream);
  });
};

export const rename = function(fileObj, newName, fileStoreStrategyFactory) {
  // Sanitize the new name to prevent path traversal
  const safeName = sanitizeFilename(newName);

  Object.keys(fileObj.versions).forEach(versionName => {
    const strategy = fileStoreStrategyFactory.getFileStrategy(fileObj, versionName);
    const newFilePath = strategy.getNewPath(fileStoreStrategyFactory.storagePath, safeName);
    strategy.rename(newFilePath);

    Attachments.update({ _id: fileObj._id }, { $set: {
      "name": safeName,
      [`versions.${versionName}.path`]: newFilePath,
    } });
  });
};
