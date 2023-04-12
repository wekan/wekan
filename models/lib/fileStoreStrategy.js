import fs from 'fs';
import path from 'path';
import { createObjectId } from './grid/createObjectId';
import { httpStreamOutput } from './httpStream.js';
//import {} from './s3/Server-side-file-store.js';
import { ObjectID } from 'bson';
var Minio = require('minio');

export const STORAGE_NAME_FILESYSTEM = "fs";
export const STORAGE_NAME_GRIDFS     = "gridfs";
export const STORAGE_NAME_S3         = "s3";

/** Factory for FileStoreStrategy */
export default class FileStoreStrategyFactory {

  /** constructor
   * @param classFileStoreStrategyFilesystem use this strategy for filesystem storage
   * @param storagePath file storage path
   * @param classFileStoreStrategyGridFs use this strategy for GridFS storage
   * @param gridFsBucket use this GridFS Bucket as GridFS Storage
   * @param classFileStoreStrategyS3 use this strategy for S3 storage
   * @param s3Bucket use this S3 Bucket as S3 Storage
   */
  constructor(classFileStoreStrategyFilesystem, storagePath, classFileStoreStrategyGridFs, gridFsBucket, classFileStoreStrategyS3, s3Bucket) {
    this.classFileStoreStrategyFilesystem = classFileStoreStrategyFilesystem;
    this.storagePath = storagePath;
    this.classFileStoreStrategyGridFs = classFileStoreStrategyGridFs;
    this.gridFsBucket = gridFsBucket;
    this.classFileStoreStrategyS3 = classFileStoreStrategyS3;
    this.s3Bucket = s3Bucket;
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
          storage = STORAGE_NAME_S3;
        } else {
          // newly uploaded, so it's at the filesystem
          storage = STORAGE_NAME_FILESYSTEM;
        }
      }
    }
    let ret;
    if ([STORAGE_NAME_FILESYSTEM, STORAGE_NAME_GRIDFS, STORAGE_NAME_S3].includes(storage)) {
      if (storage == STORAGE_NAME_FILESYSTEM) {
        ret = new this.classFileStoreStrategyFilesystem(fileObj, versionName);
      } else if (storage == STORAGE_NAME_S3) {
        ret = new this.classFileStoreStrategyS3(this.s3Bucket, fileObj, versionName);
      } else if (storage == STORAGE_NAME_GRIDFS) {
        ret = new this.classFileStoreStrategyGridFs(this.gridFsBucket, fileObj, versionName);
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
    const ret = path.join(storagePath, this.fileObj._id + "-" + this.versionName + "-" + name);
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
    const ret = fs.createReadStream(this.fileObj.versions[this.versionName].path)
    return ret;
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


/** Strategy to store attachments at S3 */
export class FileStoreStrategyS3 extends FileStoreStrategy {


  /** constructor
   * @param s3Bucket use this S3 Bucket
   * @param fileObj the current file object
   * @param versionName the current version
   */
  constructor(s3Bucket, fileObj, versionName) {
    super(fileObj, versionName);
    this.s3Bucket = s3Bucket;
  }

  /** after successfull upload */
  onAfterUpload() {
    if (process.env.S3) {
      Meteor.settings.s3 = JSON.parse(process.env.S3).s3;
    }

    const s3Conf = Meteor.settings.s3 || {};
    const bound  = Meteor.bindEnvironment((callback) => {
      return callback();
    });

    /* https://github.com/veliovgroup/Meteor-Files/blob/master/docs/aws-s3-integration.md */
    /* Check settings existence in `Meteor.settings` */
    /* This is the best practice for app security */

    /*
    if (s3Conf && s3Conf.key && s3Conf.secret && s3Conf.bucket && s3Conf.region && s3Conf.sslEnabled) {
      // Create a new S3 object
      const s3 = new S3({
        secretAccessKey: s3Conf.secret,
        accessKeyId: s3Conf.key,
        region: s3Conf.region,
        sslEnabled: s3Conf.sslEnabled, // optional
        httpOptions: {
          timeout: 6000,
          agent: false
        }
      });
    }
    */

    if (s3Conf && s3Conf.key && s3Conf.secret && s3Conf.bucket && s3Conf.endPoint && s3Conf.port && s3Conf.sslEnabled) {
      // Create a new S3 object
      var s3Client = new Minio.Client({
        endPoint: s3Conf.endPoint,
        port: s3Conf.port,
        useSSL: s3Conf.sslEnabled,
        accessKey: s3Conf.key,
        secretKey: s3Conf.secret
        //region: s3Conf.region,
        // sslEnabled: true, // optional
        //httpOptions: {
        //  timeout: 6000,
        //  agent: false
        //
      });

      // Declare the Meteor file collection on the Server
      const UserFiles = new FilesCollection({
        debug: false, // Change to `true` for debugging
        storagePath: storagePath,
        collectionName: 'userFiles',
        // Disallow Client to execute remove, use the Meteor.method
        allowClientCode: false,

        // Start moving files to AWS:S3
        // after fully received by the Meteor server
        onAfterUpload(fileRef) {
          // Run through each of the uploaded file
          _.each(fileRef.versions, (vRef, version) => {
            // We use Random.id() instead of real file's _id
            // to secure files from reverse engineering on the AWS client
            const filePath = 'files/' + (Random.id()) + '-' + version + '.' + fileRef.extension;

            // Create the AWS:S3 object.
            // Feel free to change the storage class from, see the documentation,
            // `STANDARD_IA` is the best deal for low access files.
            // Key is the file name we are creating on AWS:S3, so it will be like files/XXXXXXXXXXXXXXXXX-original.XXXX
            // Body is the file stream we are sending to AWS

            const fileObj = this.fileObj;
            const versionName = this.versionName;
            const metadata = { ...fileObj.meta, versionName, fileId: fileObj._id };

            s3Client.putObject({
              // ServerSideEncryption: 'AES256', // Optional
              //StorageClass: 'STANDARD',
              Bucket: s3Conf.bucket,
              Key: filePath,
              Body: fs.createReadStream(vRef.path),
              metadata,
              ContentType: vRef.type,
            }, (error) => {
              bound(() => {
                if (error) {
                  console.error(error);
                } else {
                  // Update FilesCollection with link to the file at AWS
                  const upd = { $set: {} };
                  upd['$set']['versions.' + version + '.meta.pipePath'] = filePath;

                  this.collection.update({
                    _id: fileRef._id
                  }, upd, (updError) => {
                    if (updError) {
                      console.error(updError);
                    } else {
                      // Unlink original files from FS after successful upload to AWS:S3
                      this.unlink(this.collection.findOne(fileRef._id), version);
                    }
                  });
                }
              });
            });
          });
        },
      });
    }
  }

  // Intercept access to the file
  // And redirect request to AWS:S3
  interceptDownload(http, fileRef, version) {
    let path;

    if (fileRef && fileRef.versions && fileRef.versions[version] && fileRef.versions[version].meta && fileRef.versions[version].meta.pipePath) {
      path = fileRef.versions[version].meta.pipePath;
    }

    if (path) {
      // If file is successfully moved to AWS:S3
      // We will pipe request to AWS:S3
      // So, original link will stay always secure

      // To force ?play and ?download parameters
      // and to keep original file name, content-type,
      // content-disposition, chunked "streaming" and cache-control
      // we're using low-level .serve() method
      const opts = {
        Bucket: s3Conf.bucket,
        Key: path
      };

      if (http.request.headers.range) {
        const vRef  = fileRef.versions[version];
        let range   = _.clone(http.request.headers.range);
        const array = range.split(/bytes=([0-9]*)-([0-9]*)/);
        const start = parseInt(array[1]);
        let end     = parseInt(array[2]);
        if (isNaN(end)) {
          // Request data from AWS:S3 by small chunks
          end       = (start + this.chunkSize) - 1;
          if (end >= vRef.size) {
            end     = vRef.size - 1;
          }
        }
        opts.Range   = `bytes=${start}-${end}`;
        http.request.headers.range = `bytes=${start}-${end}`;
      }

      const fileColl = this;
      s3Client.getObject(opts, function (error) {
        if (error) {
          console.error(error);
          if (!http.response.finished) {
            http.response.end();
          }
        } else {
          if (http.request.headers.range && this.httpResponse.headers['content-range']) {
            // Set proper range header in according to what is returned from AWS:S3
            http.request.headers.range = this.httpResponse.headers['content-range'].split('/')[0].replace('bytes ', 'bytes=');
          }

          const dataStream = new stream.PassThrough();
          fileColl.serve(http, fileRef, fileRef.versions[version], version, dataStream);
          dataStream.end(this.data.Body);
        }
      });
      return true;
    }
    // While file is not yet uploaded to AWS:S3
    // It will be served file from FS
    return false;
  }


  /** after file remove */
  onAfterRemove() {

    if (process.env.S3) {
      Meteor.settings.s3 = JSON.parse(process.env.S3).s3;
    }

    const s3Conf = Meteor.settings.s3 || {};
    const bound  = Meteor.bindEnvironment((callback) => {
      return callback();
    });

    if (s3Conf && s3Conf.key && s3Conf.secret && s3Conf.bucket && s3Conf.endPoint && s3Conf.port && s3Conf.sslEnabled) {
      // Create a new S3 object
      var s3Client = new Minio.Client({
        endPoint: s3Conf.endPoint,
        port: s3Conf.port,
        useSSL: s3Conf.sslEnabled,
        accessKey: s3Conf.key,
        secretKey: s3Conf.secret
      });
    }

    this.unlink();
    super.onAfterRemove();
    // Intercept FilesCollection's remove method to remove file from AWS:S3
    const _origRemove = UserFiles.remove;
    UserFiles.remove = function (selector, callback) {
      const cursor = this.collection.find(selector);
      cursor.forEach((fileRef) => {
        _.each(fileRef.versions, (vRef) => {
          if (vRef && vRef.meta && vRef.meta.pipePath) {
            // Remove the object from AWS:S3 first, then we will call the original FilesCollection remove
            s3Client.deleteObject({
              Bucket: s3Conf.bucket,
              Key: vRef.meta.pipePath,
            }, (error) => {
              bound(() => {
                if (error) {
                  console.error(error);
                }
              });
            });
          }
        });
      });
    // Remove original file from database
    _origRemove.call(this, selector, callback);
  };
}

  /** returns a read stream
   * @return the read stream
   */
  getReadStream() {
    const s3Id = this.getS3ObjectId();
    let ret;
    if (s3Id) {
      ret = this.s3Bucket.openDownloadStream(s3Id);
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
    const ret = this.s3Bucket.openUploadStream(this.fileObj.name, {
      contentType: fileObj.type || 'binary/octet-stream',
      metadata,
    });
    return ret;
  }

  /** writing finished
   * @param finishedData the data of the write stream finish event
   */
  writeStreamFinished(finishedData) {
    const s3FileIdName = this.getS3FileIdName();
    Attachments.update({ _id: this.fileObj._id }, { $set: { [s3FileIdName]: finishedData._id.toHexString(), } });
  }

  /** remove the file */
  unlink() {
    const s3Id = this.gets3ObjectId();
    if (s3Id) {
      this.s3Bucket.delete(s3Id, err => {
        if (err) {
          console.error("error on S3 bucket.delete: ", err);
        }
      });
    }

    const s3FileIdName = this.getS3FileIdName();
    Attachments.update({ _id: this.fileObj._id }, { $unset: { [s3FileIdName]: 1 } });
  }

  /** return the storage name
   * @return the storage name
   */
  getStorageName() {
    return STORAGE_NAME_S3;
  }

  /** returns the GridFS Object-Id
   * @return the GridFS Object-Id
   */
  getS3ObjectId() {
    let ret;
    const s3FileId = this.s3FileId();
    if (s3FileId) {
      ret = createObjectId({ s3FileId });
    }
    return ret;
  }

  /** returns the S3 Object-Id
   * @return the S3 Object-Id
   */
  getS3FileId() {
    const ret = (this.fileObj.versions[this.versionName].meta || {})
      .s3FileId;
    return ret;
  }

  /** returns the property name of s3FileId
   * @return the property name of s3FileId
   */
  getS3FileIdName() {
    const ret = `versions.${this.versionName}.meta.s3FileId`;
    return ret;
  }
};



/** move the fileObj to another storage
 * @param fileObj move this fileObj to another storage
 * @param storageDestination the storage destination (fs or gridfs)
 * @param fileStoreStrategyFactory get FileStoreStrategy from this factory
 */
export const moveToStorage = function(fileObj, storageDestination, fileStoreStrategyFactory) {
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

export const copyFile = function(fileObj, newCardId, fileStoreStrategyFactory) {
  Object.keys(fileObj.versions).forEach(versionName => {
    const strategyRead = fileStoreStrategyFactory.getFileStrategy(fileObj, versionName);
    const readStream = strategyRead.getReadStream();
    const strategyWrite = fileStoreStrategyFactory.getFileStrategy(fileObj, versionName, STORAGE_NAME_FILESYSTEM);

    const tempPath = path.join(fileStoreStrategyFactory.storagePath, Random.id() + "-" + versionName + "-" + fileObj.name);
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
            boardId: fileObj.meta.boardId,
            cardId: newCardId,
            listId: fileObj.meta.listId,
            swimlaneId: fileObj.meta.swimlaneId,
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
  Object.keys(fileObj.versions).forEach(versionName => {
    const strategy = fileStoreStrategyFactory.getFileStrategy(fileObj, versionName);
    const newFilePath = strategy.getNewPath(fileStoreStrategyFactory.storagePath, newName);
    strategy.rename(newFilePath);

    Attachments.update({ _id: fileObj._id }, { $set: {
      "name": newName,
      [`versions.${versionName}.path`]: newFilePath,
    } });
  });
};
