// ##Temporary Storage
//
// Temporary storage is used for chunked uploads until all chunks are received
// and all copies have been made or given up. In some cases, the original file
// is stored only in temporary storage (for example, if all copies do some
// manipulation in beforeSave). This is why we use the temporary file as the
// basis for each saved copy, and then remove it after all copies are saved.
//
// Every chunk is saved as an individual temporary file. This is safer than
// attempting to write multiple incoming chunks to different positions in a
// single temporary file, which can lead to write conflicts.
//
// Using temp files also allows us to easily resume uploads, even if the server
// restarts, and to keep the working memory clear.

// The FS.TempStore emits events that others are able to listen to
var EventEmitter = Npm.require('events').EventEmitter;

// We have a special stream concating all chunk files into one readable stream
var CombinedStream = Npm.require('combined-stream');

/** @namespace FS.TempStore
 * @property FS.TempStore
 * @type {object}
 * @public
 * @summary An event emitter
 */
FS.TempStore = new EventEmitter();

// Create a tracker collection for keeping track of all chunks for any files that are currently in the temp store
var tracker = FS.TempStore.Tracker = new Mongo.Collection('cfs._tempstore.chunks');

/**
 * @property FS.TempStore.Storage
 * @type {StorageAdapter}
 * @namespace FS.TempStore
 * @private
 * @summary This property is set to either `FS.Store.FileSystem` or `FS.Store.GridFS`
 *
 * __When and why:__
 * We normally default to `cfs-filesystem` unless its not installed. *(we default to gridfs if installed)*
 * But if `cfs-gridfs` and `cfs-worker` is installed we default to `cfs-gridfs`
 *
 * If `cfs-gridfs` and `cfs-filesystem` is not installed we log a warning.
 * the user can set `FS.TempStore.Storage` them selfs eg.:
 * ```js
 *   // Its important to set `internal: true` this lets the SA know that we
 *   // are using this internally and it will give us direct SA api
 *   FS.TempStore.Storage = new FS.Store.GridFS('_tempstore', { internal: true });
 * ```
 *
 * > Note: This is considered as `advanced` use, its not a common pattern.
 */
FS.TempStore.Storage = null;

// We will not mount a storage adapter until needed. This allows us to check for the
// existance of FS.FileWorker, which is loaded after this package because it
// depends on this package.
function mountStorage() {

  if (FS.TempStore.Storage) return;

  // XXX: We could replace this test, testing the FS scope for grifFS etc.
  // This is on the todo later when we get "stable"
  if (Package["wekan-cfs-gridfs"] && (Package["wekan-cfs-worker"] || !Package["wekan-cfs-filesystem"])) {
    // If the file worker is installed we would prefer to use the gridfs sa
    // for scalability. We also default to gridfs if filesystem is not found

    // Use the gridfs
    FS.TempStore.Storage = new FS.Store.GridFS('_tempstore', { internal: true });
  } else if (Package["wekan-cfs-filesystem"]) {

    // use the Filesystem
    FS.TempStore.Storage = new FS.Store.FileSystem('_tempstore', { internal: true });
  } else {
    throw new Error('FS.TempStore.Storage is not set: Install wekan-cfs-filesystem or wekan-cfs-gridfs or set it manually');
  }

  FS.debug && console.log('TempStore is mounted on', FS.TempStore.Storage.typeName);
}

function mountFile(fileObj, name) {
  if (!fileObj.isMounted()) {
    throw new Error(name + ' cannot work with unmounted file');
  }
}

// We update the fileObj on progress
FS.TempStore.on('progress', function(fileObj, chunkNum, count, total, result) {
  FS.debug && console.log('TempStore progress: Received ' + count + ' of ' + total + ' chunks for ' + fileObj.name());
});

// XXX: TODO
// FS.TempStore.on('stored', function(fileObj, chunkCount, result) {
//   // This should work if we pass on result from the SA on stored event...
//   fileObj.update({ $set: { chunkSum: 1, chunkCount: chunkCount, size: result.size } });
// });

// Stream implementation

/**
 * @method _chunkPath
 * @private
 * @param {Number} [n] Chunk number
 * @returns {String} Chunk naming convention
 */
_chunkPath = function(n) {
  return (n || 0) + '.chunk';
};

/**
 * @method _fileReference
 * @param {FS.File} fileObj
 * @param {Number} chunk
 * @private
 * @returns {String} Generated SA specific fileKey for the chunk
 *
 * Note: Calling function should call mountStorage() first, and
 * make sure that fileObj is mounted.
 */
_fileReference = function(fileObj, chunk, existing) {
  // Maybe it's a chunk we've already saved
  existing = existing || tracker.findOne({fileId: fileObj._id, collectionName: fileObj.collectionName});

  // Make a temporary fileObj just for fileKey generation
  var tempFileObj = new FS.File({
    collectionName: fileObj.collectionName,
    _id: fileObj._id,
    original: {
      name: _chunkPath(chunk)
    },
    copies: {
      _tempstore: {
        key: existing && existing.keys[chunk]
      }
    }
  });

  // Return a fitting fileKey SA specific
  return FS.TempStore.Storage.adapter.fileKey(tempFileObj);
};

/**
 * @method FS.TempStore.exists
 * @param {FS.File} File object
 * @returns {Boolean} Is this file, or parts of it, currently stored in the TempStore
 */
FS.TempStore.exists = function(fileObj) {
  var existing = tracker.findOne({fileId: fileObj._id, collectionName: fileObj.collectionName});
  return !!existing;
};

/**
 * @method FS.TempStore.listParts
 * @param {FS.File} fileObj
 * @returns {Object} of parts already stored
 * @todo This is not yet implemented, milestone 1.1.0
 */
FS.TempStore.listParts = function fsTempStoreListParts(fileObj) {
  var self = this;
  console.warn('This function is not correctly implemented using SA in TempStore');
  //XXX This function might be necessary for resume. Not currently supported.
};

/**
 * @method FS.TempStore.removeFile
 * @public
 * @param {FS.File} fileObj
 * This function removes the file from tempstorage - it cares not if file is
 * already removed or not found, goal is reached anyway.
 */
FS.TempStore.removeFile = function fsTempStoreRemoveFile(fileObj) {
  var self = this;

  // Ensure that we have a storage adapter mounted; if not, throw an error.
  mountStorage();

  // If fileObj is not mounted or can't be, throw an error
  mountFile(fileObj, 'FS.TempStore.removeFile');

  // Emit event
  self.emit('remove', fileObj);

  var chunkInfo = tracker.findOne({
    fileId: fileObj._id,
    collectionName: fileObj.collectionName
  });

  if (chunkInfo) {

    // Unlink each file
    FS.Utility.each(chunkInfo.keys || {}, function (key, chunk) {
      var fileKey = _fileReference(fileObj, chunk, chunkInfo);
      FS.TempStore.Storage.adapter.remove(fileKey, FS.Utility.noop);
    });

    // Remove fileObj from tracker collection, too
    tracker.remove({_id: chunkInfo._id});

  }
};

/**
 * @method FS.TempStore.removeAll
 * @public
 * @summary This function removes all files from tempstorage - it cares not if file is
 * already removed or not found, goal is reached anyway.
 */
FS.TempStore.removeAll = function fsTempStoreRemoveAll() {
  var self = this;

  // Ensure that we have a storage adapter mounted; if not, throw an error.
  mountStorage();

  tracker.find().forEach(function (chunkInfo) {
    // Unlink each file
    FS.Utility.each(chunkInfo.keys || {}, function (key, chunk) {
      var fileKey = _fileReference({_id: chunkInfo.fileId, collectionName: chunkInfo.collectionName}, chunk, chunkInfo);
      FS.TempStore.Storage.adapter.remove(fileKey, FS.Utility.noop);
    });

    // Remove from tracker collection, too
    tracker.remove({_id: chunkInfo._id});
  });
};

/**
 * @method FS.TempStore.createWriteStream
 * @public
 * @param {FS.File} fileObj File to store in temporary storage
 * @param {Number | String} [options]
 * @returns {Stream} Writeable stream
 *
 * `options` of different types mean differnt things:
 * * `undefined` We store the file in one part
 * *(Normal server-side api usage)*
 * * `Number` the number is the part number total
 * *(multipart uploads will use this api)*
 * * `String` the string is the name of the `store` that wants to store file data
 * *(stores that want to sync their data to the rest of the files stores will use this)*
 *
 * > Note: fileObj must be mounted on a `FS.Collection`, it makes no sense to store otherwise
 */
FS.TempStore.createWriteStream = function(fileObj, options) {
  var self = this;

  // Ensure that we have a storage adapter mounted; if not, throw an error.
  mountStorage();

  // If fileObj is not mounted or can't be, throw an error
  mountFile(fileObj, 'FS.TempStore.createWriteStream');

  // Cache the selector for use multiple times below
  var selector = {fileId: fileObj._id, collectionName: fileObj.collectionName};

  // TODO, should pass in chunkSum so we don't need to use FS.File for it
  var chunkSum = fileObj.chunkSum || 1;

  // Add fileObj to tracker collection
  tracker.upsert(selector, {$setOnInsert: {keys: {}}});

  // Determine how we're using the writeStream
  var isOnePart = false, isMultiPart = false, isStoreSync = false, chunkNum = 0;
  if (options === +options) {
    isMultiPart = true;
    chunkNum = options;
  } else if (options === ''+options) {
    isStoreSync = true;
  } else {
    isOnePart = true;
  }

  // XXX: it should be possible for a store to sync by storing data into the
  // tempstore - this could be done nicely by setting the store name as string
  // in the chunk variable?
  // This store name could be passed on the the fileworker via the uploaded
  // event
  // So the uploaded event can return:
  // undefined - if data is stored into and should sync out to all storage adapters
  // number - if a chunk has been uploaded
  // string - if a storage adapter wants to sync its data to the other SA's

  // Find a nice location for the chunk data
  var fileKey = _fileReference(fileObj, chunkNum);

  // Create the stream as Meteor safe stream
  var writeStream = FS.TempStore.Storage.adapter.createWriteStream(fileKey);

  // When the stream closes we update the chunkCount
  writeStream.safeOn('stored', function(result) {
    // Save key in tracker document
    var setObj = {};
    setObj['keys.' + chunkNum] = result.fileKey;
    tracker.update(selector, {$set: setObj});

    var temp = tracker.findOne(selector);

    if (!temp) {
      FS.debug && console.log('NOT FOUND FROM TEMPSTORE => EXIT (REMOVED)');
      return;
    }

    // Get updated chunkCount
    var chunkCount = FS.Utility.size(temp.keys);

    // Progress
    self.emit('progress', fileObj, chunkNum, chunkCount, chunkSum, result);

    var modifier = { $set: {} };
    if (!fileObj.instance_id) {
      modifier.$set.instance_id = process.env.COLLECTIONFS_ENV_NAME_UNIQUE_ID ? process.env[process.env.COLLECTIONFS_ENV_NAME_UNIQUE_ID] : process.env.METEOR_PARENT_PID;
    }

    // If upload is completed
    if (chunkCount === chunkSum) {
      // We no longer need the chunk info
      modifier.$unset = {chunkCount: 1, chunkSum: 1, chunkSize: 1};

      // Check if the file has been uploaded before
      if (typeof fileObj.uploadedAt === 'undefined') {
        // We set the uploadedAt date
        modifier.$set.uploadedAt = new Date();
      } else {
        // We have been uploaded so an event were file data is updated is
        // called synchronizing - so this must be a synchronizedAt?
        modifier.$set.synchronizedAt = new Date();
      }

      // Update the fileObject
      fileObj.update(modifier);

      // Fire ending events
      var eventName = isStoreSync ? 'synchronized' : 'stored';
      self.emit(eventName, fileObj, result);

      // XXX is emitting "ready" necessary?
      self.emit('ready', fileObj, chunkCount, result);
    } else {
      // Update the chunkCount on the fileObject
      modifier.$set.chunkCount = chunkCount;
      fileObj.update(modifier);
    }
  });

  // Emit errors
  writeStream.on('error', function (error) {
    FS.debug && console.log('TempStore writeStream error:', error);
    self.emit('error', error, fileObj);
  });

  return writeStream;
};

/**
  * @method FS.TempStore.createReadStream
  * @public
  * @param {FS.File} fileObj The file to read
  * @return {Stream} Returns readable stream
  *
  */
FS.TempStore.createReadStream = function(fileObj) {
  // Ensure that we have a storage adapter mounted; if not, throw an error.
  mountStorage();

  // If fileObj is not mounted or can't be, throw an error
  mountFile(fileObj, 'FS.TempStore.createReadStream');

  FS.debug && console.log('FS.TempStore creating read stream for ' + fileObj._id);

  // Determine how many total chunks there are from the tracker collection
  var chunkInfo = tracker.findOne({fileId: fileObj._id, collectionName: fileObj.collectionName}) || {};
  var totalChunks = FS.Utility.size(chunkInfo.keys);

  function getNextStreamFunc(chunk) {
    return Meteor.bindEnvironment(function(next) {
      var fileKey = _fileReference(fileObj, chunk);
      var chunkReadStream = FS.TempStore.Storage.adapter.createReadStream(fileKey);
      next(chunkReadStream);
    }, function (error) {
      throw error;
    });
  }

  // Make a combined stream
  var combinedStream = CombinedStream.create();

  // Add each chunk stream to the combined stream when the previous chunk stream ends
  var currentChunk = 0;
  for (var chunk = 0; chunk < totalChunks; chunk++) {
    combinedStream.append(getNextStreamFunc(chunk));
  }

  // Return the combined stream
  return combinedStream;
};
