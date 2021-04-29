/**
 * Notes a details about a storage adapter failure within the file record
 * @param {string} storeName
 * @param {number} maxTries
 * @return {undefined}
 * @todo deprecate this
 */
FS.File.prototype.logCopyFailure = function(storeName, maxTries) {
  var self = this;

  // hasStored will update from the fileRecord
  if (self.hasStored(storeName)) {
    throw new Error("logCopyFailure: invalid storeName");
  }

  // Make sure we have a temporary file saved since we will be
  // trying the save again.
  FS.TempStore.ensureForFile(self);

  var now = new Date();
  var currentCount = (self.failures && self.failures.copies && self.failures.copies[storeName] && typeof self.failures.copies[storeName].count === "number") ? self.failures.copies[storeName].count : 0;
  maxTries = maxTries || 5;

  var modifier = {};
  modifier.$set = {};
  modifier.$set['failures.copies.' + storeName + '.lastAttempt'] = now;
  if (currentCount === 0) {
    modifier.$set['failures.copies.' + storeName + '.firstAttempt'] = now;
  }
  modifier.$set['failures.copies.' + storeName + '.count'] = currentCount + 1;
  modifier.$set['failures.copies.' + storeName + '.doneTrying'] = (currentCount + 1 >= maxTries);
  self.update(modifier);
};

/**
 * Has this store permanently failed?
 * @param {String} storeName The name of the store
 * @return {boolean} Has this store failed permanently?
 * @todo deprecate this
 */
FS.File.prototype.failedPermanently = function(storeName) {
  var self = this;
  return !!(self.failures &&
            self.failures.copies &&
            self.failures.copies[storeName] &&
            self.failures.copies[storeName].doneTrying);
};

/**
 * @method FS.File.prototype.createReadStream
 * @public
 * @param {String} [storeName]
 * @returns {stream.Readable} Readable NodeJS stream
 *
 * Returns a readable stream. Where the stream reads from depends on the FS.File instance and whether you pass a store name.
 *
 * * If you pass a `storeName`, a readable stream for the file data saved in that store is returned.
 * * If you don't pass a `storeName` and data is attached to the FS.File instance (on `data` property, which must be a DataMan instance), then a readable stream for the attached data is returned.
 * * If you don't pass a `storeName` and there is no data attached to the FS.File instance, a readable stream for the file data currently in the temporary store (`FS.TempStore`) is returned.
 *
 */
FS.File.prototype.createReadStream = function(storeName) {
  var self = this;

  // If we dont have a store name but got Buffer data?
  if (!storeName && self.data) {
    FS.debug && console.log("fileObj.createReadStream creating read stream for attached data");
    // Stream from attached data if present
    return self.data.createReadStream();
  } else if (!storeName && FS.TempStore && FS.TempStore.exists(self)) {
    FS.debug && console.log("fileObj.createReadStream creating read stream for temp store");
    // Stream from temp store - its a bit slower than regular streams?
    return FS.TempStore.createReadStream(self);
  } else {
    // Stream from the store using storage adapter
    if (self.isMounted()) {
      var storage = self.collection.storesLookup[storeName] || self.collection.primaryStore;
      FS.debug && console.log("fileObj.createReadStream creating read stream for store", storage.name);
      // return stream
      return storage.adapter.createReadStream(self);
    } else {
      throw new Meteor.Error('File not mounted');
    }

  }
};

/**
 * @method FS.File.prototype.createWriteStream
 * @public
 * @param {String} [storeName]
 * @returns {stream.Writeable} Writeable NodeJS stream
 *
 * Returns a writeable stream. Where the stream writes to depends on whether you pass in a store name.
 *
 * * If you pass a `storeName`, a writeable stream for (over)writing the file data in that store is returned.
 * * If you don't pass a `storeName`, a writeable stream for writing to the temp store for this file is returned.
 *
 */
FS.File.prototype.createWriteStream = function(storeName) {
  var self = this;

  // We have to have a mounted file in order for this to work
  if (self.isMounted()) {
    if (!storeName && FS.TempStore && FS.FileWorker) {
      // If we have worker installed - we pass the file to FS.TempStore
      // We dont need the storeName since all stores will be generated from
      // TempStore.
      // This should trigger FS.FileWorker at some point?
      FS.TempStore.createWriteStream(self);
    } else {
      // Stream directly to the store using storage adapter
      var storage = self.collection.storesLookup[storeName] || self.collection.primaryStore;
      return storage.adapter.createWriteStream(self);
    }
  } else {
    throw new Meteor.Error('File not mounted');
  }
};

/**
 * @method FS.File.prototype.copy Makes a copy of the file and underlying data in all stores.
 * @public
 * @returns {FS.File} The new FS.File instance
 */
FS.File.prototype.copy = function() {
  var self = this;

  if (!self.isMounted()) {
    throw new Error("Cannot copy a file that is not associated with a collection");
  }

  // Get the file record
  var fileRecord = self.collection.files.findOne({_id: self._id}, {transform: null}) || {};

  // Remove _id and copy keys from the file record
  delete fileRecord._id;

  // Insert directly; we don't have access to "original" in this case
  var newId = self.collection.files.insert(fileRecord);

  var newFile = self.collection.findOne(newId);

  // Copy underlying files in the stores
  var mod, oldKey;
  for (var name in newFile.copies) {
    if (newFile.copies.hasOwnProperty(name)) {
      oldKey = newFile.copies[name].key;
      if (oldKey) {
        // We need to ask the adapter for the true oldKey because
        // right now gridfs does some extra stuff.
        // TODO GridFS should probably set the full key object
        // (with _id and filename) into `copies.key`
        // so that copies.key can be passed directly to
        // createReadStreamForFileKey
        var sourceFileStorage = self.collection.storesLookup[name];
        if (!sourceFileStorage) {
          throw new Error(name + " is not a valid store name");
        }
        oldKey = sourceFileStorage.adapter.fileKey(self);
        // delete so that new fileKey will be generated in copyStoreData
        delete newFile.copies[name].key;
        mod = mod || {};
        mod["copies." + name + ".key"] = copyStoreData(newFile, name, oldKey);
      }
    }
  }
  // Update keys in the filerecord
  if (mod) {
    newFile.update({$set: mod});
  }

  return newFile;
};

Meteor.methods({
  // Does a HEAD request to URL to get the type, updatedAt,
  // and size prior to actually downloading the data.
  // That way we can do filter checks without actually downloading.
  '_cfs_getUrlInfo': function (url, options) {
    check(url, String);
    check(options, Object);

    this.unblock();

    var response = HTTP.call("HEAD", url, options);
    var headers = response.headers;
    var result = {};

    if (headers['content-type']) {
      result.type = headers['content-type'];
    }

    if (headers['content-length']) {
      result.size = +headers['content-length'];
    }

    if (headers['last-modified']) {
      result.updatedAt = new Date(headers['last-modified']);
    }

    return result;
  },
  // Helper function that checks whether given fileId from collectionName
  //  Is fully uploaded to specify storeName.
  '_cfs_returnWhenStored' : function (collectionName, fileId, storeName) {
    check(collectionName, String);
    check(fileId, String);
    check(storeName, String);

    var collection = FS._collections[collectionName];
    if (!collection) {
      return Meteor.Error('_cfs_returnWhenStored: FSCollection name not exists');
    }

    var file = collection.findOne({_id: fileId});
    if (!file) {
      return Meteor.Error('_cfs_returnWhenStored: FSFile not exists');
    }
    return file.hasStored(storeName);
  }
});

// TODO maybe this should be in cfs-storage-adapter
function _copyStoreData(fileObj, storeName, sourceKey, callback) {
  if (!fileObj.isMounted()) {
    throw new Error("Cannot copy store data for a file that is not associated with a collection");
  }

  var storage = fileObj.collection.storesLookup[storeName];
  if (!storage) {
    throw new Error(storeName + " is not a valid store name");
  }

  // We want to prevent beforeWrite and transformWrite from running, so
  // we interact directly with the store.
  var destinationKey = storage.adapter.fileKey(fileObj);
  var readStream = storage.adapter.createReadStreamForFileKey(sourceKey);
  var writeStream = storage.adapter.createWriteStreamForFileKey(destinationKey);

  writeStream.once('stored', function(result) {
    callback(null, result.fileKey);
  });

  writeStream.once('error', function(error) {
    callback(error);
  });

  readStream.pipe(writeStream);
}
var copyStoreData = Meteor.wrapAsync(_copyStoreData);

/**
 * @method FS.File.prototype.copyData Copies the content of a store directly into another store.
 * @public
 * @param {string} sourceStoreName
 * @param {string} targetStoreName
 * @param {boolean=} move
 */
FS.File.prototype.copyData = function(sourceStoreName, targetStoreName, move){

  move = !!move;
  /**
   * @type {Object.<string,*>}
   */
  var sourceStoreValues = this.copies[sourceStoreName];
  /**
   * @type {string}
   */
  var copyKey = cloneDataToStore(this, sourceStoreName, targetStoreName, move);
  /**
   * @type {Object.<string,*>}
   */
  var targetStoreValues = {};
  for (var v in sourceStoreValues) {
    if (sourceStoreValues.hasOwnProperty(v)) {
      targetStoreValues[v] = sourceStoreValues[v]
    }
  }
  targetStoreValues.key = copyKey;
  targetStoreValues.createdAt = new Date();
  targetStoreValues.updatedAt = new Date();
  /**
   *
   * @type {modifier}
   */
  var modifier = {};
  modifier.$set = {};
  modifier.$set["copies."+targetStoreName] = targetStoreValues;
  if(move){
    modifier.$unset = {};
    modifier.$unset["copies."+sourceStoreName] = "";
  }
  this.update(modifier);
};
/**
 * @method FS.File.prototype.moveData Moves the content of a store directly into another store.
 * @public
 * @param {string} sourceStoreName
 * @param {string} targetStoreName
 */
FS.File.prototype.moveData = function(sourceStoreName, targetStoreName){
  this.copyData(sourceStoreName, targetStoreName, true);
};
// TODO maybe this should be in cfs-storage-adapter
/**
 *
 * @param {FS.File} fileObj
 * @param {string} sourceStoreName
 * @param {string} targetStoreName
 * @param {boolean} move
 * @param callback
 * @private
 */
function _copyDataFromStoreToStore(fileObj, sourceStoreName, targetStoreName, move, callback) {
  if (!fileObj.isMounted()) {
    throw new Error("Cannot copy store data for a file that is not associated with a collection");
  }
  /**
   * @type {FS.StorageAdapter}
   */
  var sourceStorage = fileObj.collection.storesLookup[sourceStoreName];
  /**
   * @type {FS.StorageAdapter}
   */
  var targetStorage = fileObj.collection.storesLookup[targetStoreName];

  if (!sourceStorage) {
    throw new Error(sourceStoreName + " is not a valid store name");
  }
  if (!targetStorage) {
    throw new Error(targetStorage + " is not a valid store name");
  }

  // We want to prevent beforeWrite and transformWrite from running, so
  // we interact directly with the store.
  var sourceKey = sourceStorage.adapter.fileKey(fileObj);
  var targetKey = targetStorage.adapter.fileKey(fileObj);
  var readStream = sourceStorage.adapter.createReadStreamForFileKey(sourceKey);
  var writeStream = targetStorage.adapter.createWriteStreamForFileKey(targetKey);


  writeStream.safeOnce('stored', function(result) {
    if(move && sourceStorage.adapter.remove(fileObj)===false){
      callback("Copied to store:" + targetStoreName
      + " with fileKey: "
      + result.fileKey
      + ", but could not delete from source store: "
      + sourceStoreName);
    }else{
      callback(null, result.fileKey);
    }
  });

  writeStream.once('error', function(error) {
    callback(error);
  });

  readStream.pipe(writeStream);
}
var cloneDataToStore = Meteor.wrapAsync(_copyDataFromStoreToStore);
