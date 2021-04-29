/* global FS, _storageAdapters:true, EventEmitter */

// #############################################################################
//
// STORAGE ADAPTER
//
// #############################################################################
_storageAdapters = {};

FS.StorageAdapter = function(storeName, options, api) {
  var self = this, fileKeyMaker;
  options = options || {};

  // If storeName is the only argument, a string and the SA already found
  // we will just return that SA
  if (arguments.length === 1 && storeName === '' + storeName &&
          typeof _storageAdapters[storeName] !== 'undefined')
    return _storageAdapters[storeName];

  // Verify that the storage adapter defines all the necessary API methods
  if (typeof api === 'undefined') {
    throw new Error('FS.StorageAdapter please define an api');
  }
  
  FS.Utility.each('fileKey,remove,typeName,createReadStream,createWriteStream'.split(','), function(name) {
    if (typeof api[name] === 'undefined') {
      throw new Error('FS.StorageAdapter please define an api. "' + name + '" ' + (api.typeName || ''));
    }
  });

  // Create an internal namespace, starting a name with underscore is only
  // allowed for stores marked with options.internal === true
  if (options.internal !== true && storeName[0] === '_') {
    throw new Error('A storage adapter name may not begin with "_"');
  }

  if (storeName.indexOf('.') !== -1) {
    throw new Error('A storage adapter name may not contain a "."');
  }

  // store reference for easy lookup by storeName
  if (typeof _storageAdapters[storeName] !== 'undefined') {
    throw new Error('Storage name already exists: "' + storeName + '"');
  } else {
    _storageAdapters[storeName] = self;
  }

  // User can customize the file key generation function
  if (typeof options.fileKeyMaker === "function") {
    fileKeyMaker = options.fileKeyMaker;
  } else {
    fileKeyMaker = api.fileKey;
  }

  // User can provide a function to adjust the fileObj
  // before it is written to the store.
  var beforeWrite = options.beforeWrite;

  // extend self with options and other info
  FS.Utility.extend(this, options, {
    name: storeName,
    typeName: api.typeName
  });

  // Create a nicer abstracted adapter interface
  self.adapter = {};

  self.adapter.fileKey = function(fileObj) {
    return fileKeyMaker(fileObj);
  };

  // Return readable stream for fileKey
  self.adapter.createReadStreamForFileKey = function(fileKey, options) {
    if (FS.debug) console.log('createReadStreamForFileKey ' + storeName);
    return FS.Utility.safeStream( api.createReadStream(fileKey, options) );
  };

  // Return readable stream for fileObj
  self.adapter.createReadStream = function(fileObj, options) {
    if (FS.debug) console.log('createReadStream ' + storeName);
    if (self.internal) {
      // Internal stores take a fileKey
      return self.adapter.createReadStreamForFileKey(fileObj, options);
    }
    return FS.Utility.safeStream( self._transform.createReadStream(fileObj, options) );
  };

  function logEventsForStream(stream) {
    if (FS.debug) {
      stream.on('stored', function() {
        console.log('-----------STORED STREAM', storeName);
      });

      stream.on('close', function() {
        console.log('-----------CLOSE STREAM', storeName);
      });

      stream.on('end', function() {
        console.log('-----------END STREAM', storeName);
      });

      stream.on('finish', function() {
        console.log('-----------FINISH STREAM', storeName);
      });

      stream.on('error', function(error) {
        console.log('-----------ERROR STREAM', storeName, error && (error.message || error.code));
      });
    }
  }

  // Return writeable stream for fileKey
  self.adapter.createWriteStreamForFileKey = function(fileKey, options) {
    if (FS.debug) console.log('createWriteStreamForFileKey ' + storeName);
    var writeStream = FS.Utility.safeStream( api.createWriteStream(fileKey, options) );

    logEventsForStream(writeStream);

    return writeStream;
  };

  // Return writeable stream for fileObj
  self.adapter.createWriteStream = function(fileObj, options) {
    if (FS.debug) console.log('createWriteStream ' + storeName + ', internal: ' + !!self.internal);
    
    if (self.internal) {
      // Internal stores take a fileKey
      return self.adapter.createWriteStreamForFileKey(fileObj, options);
    }

    // If we haven't set name, type, or size for this version yet,
    // set it to same values as original version. We don't save
    // these to the DB right away because they might be changed
    // in a transformWrite function.
    if (!fileObj.name({store: storeName})) {
      fileObj.name(fileObj.name(), {store: storeName, save: false});
    }
    if (!fileObj.type({store: storeName})) {
      fileObj.type(fileObj.type(), {store: storeName, save: false});
    }
    if (!fileObj.size({store: storeName})) {
      fileObj.size(fileObj.size(), {store: storeName, save: false});
    }

    // Call user function to adjust file metadata for this store.
    // We support updating name, extension, and/or type based on
    // info returned in an object. Or `fileObj` could be
    // altered directly within the beforeWrite function.
    if (beforeWrite) {
      var fileChanges = beforeWrite(fileObj);
      if (typeof fileChanges === "object") {
        if (fileChanges.extension) {
          fileObj.extension(fileChanges.extension, {store: storeName, save: false});
        } else if (fileChanges.name) {
          fileObj.name(fileChanges.name, {store: storeName, save: false});
        }
        if (fileChanges.type) {
          fileObj.type(fileChanges.type, {store: storeName, save: false});
        }
      }
    }

    var writeStream = FS.Utility.safeStream( self._transform.createWriteStream(fileObj, options) );

    logEventsForStream(writeStream);

    // Its really only the storage adapter who knows if the file is uploaded
    //
    // We have to use our own event making sure the storage process is completed
    // this is mainly
    writeStream.safeOn('stored', function(result) {
      if (typeof result.fileKey === 'undefined') {
        throw new Error('SA ' + storeName + ' type ' + api.typeName + ' did not return a fileKey');
      }
      if (FS.debug) console.log('SA', storeName, 'stored', result.fileKey);
      // Set the fileKey
      fileObj.copies[storeName].key = result.fileKey;

      // Update the size, as provided by the SA, in case it was changed by stream transformation
      if (typeof result.size === "number") {
        fileObj.copies[storeName].size = result.size;
      }

      // Set last updated time, either provided by SA or now
      fileObj.copies[storeName].updatedAt = result.storedAt || new Date();

      // If the file object copy havent got a createdAt then set this
      if (typeof fileObj.copies[storeName].createdAt === 'undefined') {
        fileObj.copies[storeName].createdAt = fileObj.copies[storeName].updatedAt;
      }

      fileObj._saveChanges(storeName);

      // There is code in transform that may have set the original file size, too.
      fileObj._saveChanges('_original');
    });

    // Emit events from SA
    writeStream.once('stored', function(/*result*/) {
      // XXX Because of the way stores inherit from SA, this will emit on every store.
      // Maybe need to rewrite the way we inherit from SA?
      var emitted = self.emit('stored', storeName, fileObj);
      if (FS.debug && !emitted) {
        console.log(fileObj.name() + ' was successfully stored in the ' + storeName + ' store. You are seeing this informational message because you enabled debugging and you have not defined any listeners for the "stored" event on this store.');
      }
    });

    writeStream.on('error', function(error) {
      // XXX We could wrap and clarify error
      // XXX Because of the way stores inherit from SA, this will emit on every store.
      // Maybe need to rewrite the way we inherit from SA?
      var emitted = self.emit('error', storeName, error, fileObj);
      if (FS.debug && !emitted) {
        console.log(error);
      }
    });

    return writeStream;
  };

  //internal
  self._removeAsync = function(fileKey, callback) {
    // Remove the file from the store
    api.remove.call(self, fileKey, callback);
  };

  /**
   * @method FS.StorageAdapter.prototype.remove
   * @public
   * @param {FS.File} fsFile The FS.File instance to be stored.
   * @param {Function} [callback] If not provided, will block and return true or false
   *
   * Attempts to remove a file from the store. Returns true if removed or not
   * found, or false if the file couldn't be removed.
   */
  self.adapter.remove = function(fileObj, callback) {
    if (FS.debug) console.log("---SA REMOVE");

    // Get the fileKey
    var fileKey = (fileObj instanceof FS.File) ? self.adapter.fileKey(fileObj) : fileObj;

    if (callback) {
      return self._removeAsync(fileKey, FS.Utility.safeCallback(callback));
    } else {
      return Meteor.wrapAsync(self._removeAsync)(fileKey);
    }
  };

  self.remove = function(fileObj, callback) {
    // Add deprecation note
    console.warn('Storage.remove is deprecating, use "Storage.adapter.remove"');
    return self.adapter.remove(fileObj, callback);
  };

  if (typeof api.init === 'function') {
    Meteor.wrapAsync(api.init.bind(self))();
  }

  // This supports optional transformWrite and transformRead
  self._transform = new FS.Transform({
    adapter: self.adapter,
    // Optional transformation functions:
    transformWrite: options.transformWrite,
    transformRead: options.transformRead
  });

};

Npm.require('util').inherits(FS.StorageAdapter, EventEmitter);
