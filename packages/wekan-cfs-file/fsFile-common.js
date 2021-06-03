/**
 * @method FS.File
 * @namespace FS.File
 * @public
 * @constructor
 * @param {object|FS.File|data to attach} [ref] Another FS.File instance, a filerecord, or some data to pass to attachData
 */
FS.File = function(ref, createdByTransform) {
  var self = this;

  self.createdByTransform = !!createdByTransform;

  if (ref instanceof FS.File || isBasicObject(ref)) {
    // Extend self with filerecord related data
    FS.Utility.extend(self, FS.Utility.cloneFileRecord(ref, {full: true}));
  } else if (ref) {
    self.attachData(ref);
  }
};

// An FS.File can emit events
FS.File.prototype = new EventEmitter();

/**
 * @method FS.File.prototype.attachData
 * @public
 * @param {File|Blob|Buffer|ArrayBuffer|Uint8Array|String} data The data that you want to attach to the file.
 * @param {Object} [options] Options
 * @param {String} [options.type] The data content (MIME) type, if known.
 * @param {String} [options.headers] When attaching a URL, headers to be used for the GET request (currently server only)
 * @param {String} [options.auth] When attaching a URL, "username:password" to be used for the GET request (currently server only)
 * @param {Function} [callback] Callback function, callback(error). On the client, a callback is required if data is a URL.
 * @returns {FS.File} This FS.File instance.
 *
 */
FS.File.prototype.attachData = function fsFileAttachData(data, options, callback) {
  var self = this;

  if (!callback && typeof options === "function") {
    callback = options;
    options = {};
  }
  options = options || {};

  if (!data) {
    throw new Error('FS.File.attachData requires a data argument with some data');
  }

  var urlOpts;

  // Set any other properties we can determine from the source data
  // File
  if (typeof File !== "undefined" && data instanceof File) {
    self.name(data.name);
    self.updatedAt(data.lastModifiedDate);
    self.size(data.size);
    setData(data.type);
  }
  // Blob
  else if (typeof Blob !== "undefined" && data instanceof Blob) {
    self.name(data.name);
    self.updatedAt(new Date());
    self.size(data.size);
    setData(data.type);
  }
  // URL: we need to do a HEAD request to get the type because type
  // is required for filtering to work.
  else if (typeof data === "string" && (data.slice(0, 5) === "http:" || data.slice(0, 6) === "https:")) {
    urlOpts = FS.Utility.extend({}, options);
    if (urlOpts.type) {
      delete urlOpts.type;
    }

    if (!callback) {
      if (Meteor.isClient) {
        throw new Error('FS.File.attachData requires a callback when attaching a URL on the client');
      }
      var result = Meteor.call('_cfs_getUrlInfo', data, urlOpts);
      FS.Utility.extend(self, {original: result});
      setData(result.type);
    } else {
      Meteor.call('_cfs_getUrlInfo', data, urlOpts, function (error, result) {
        FS.debug && console.log("URL HEAD RESULT:", result);
        if (error) {
          callback(error);
        } else {
          var type = result.type || options.type;
          if (! type) {
            throw new Error('FS.File.attachData got a URL for which it could not determine the MIME type and none was provided using options.type');
          }
          FS.Utility.extend(self, {original: result});
          setData(type);
        }
      });
    }
  }
  // Everything else
  else {
    setData(options.type);
  }

  // Set the data
  function setData(type) {
    self.data = new DataMan(data, type, urlOpts);

    // Update the type to match what the data is
    self.type(self.data.type());

    // Update the size to match what the data is.
    // It's always safe to call self.data.size() without supplying a callback
    // because it requires a callback only for URLs on the client, and we
    // already added size for URLs when we got the result from '_cfs_getUrlInfo' method.
    if (!self.size()) {
      if (callback) {
        self.data.size(function (error, size) {
          if (error) {
            callback && callback(error);
          } else {
            self.size(size);
            setName();
          }
        });
      } else {
        self.size(self.data.size());
        setName();
      }
    } else {
      setName();
    }
  }

  function setName() {
    // See if we can extract a file name from URL or filepath
    if (!self.name() && typeof data === "string") {
      // name from URL
      if (data.slice(0, 5) === "http:" || data.slice(0, 6) === "https:") {
        if (FS.Utility.getFileExtension(data).length) {
          // for a URL we assume the end is a filename only if it has an extension
          self.name(FS.Utility.getFileName(data));
        }
      }
      // name from filepath
      else if (data.slice(0, 5) !== "data:") {
        self.name(FS.Utility.getFileName(data));
      }
    }

    callback && callback();
  }

  return self; //allow chaining
};

/**
 * @method FS.File.prototype.uploadProgress
 * @public
 * @returns {number} The server confirmed upload progress
 */
FS.File.prototype.uploadProgress = function() {
  var self = this;
  // Make sure our file record is updated
  self.getFileRecord();

  // If fully uploaded, return 100
  if (self.uploadedAt) {
    return 100;
  }
  // Otherwise return the confirmed progress or 0
  else {
    return Math.round((self.chunkCount || 0) / (self.chunkSum || 1) * 100);
  }
};

/**
 * @method FS.File.prototype.controlledByDeps
 * @public
 * @returns {FS.Collection} Returns true if this FS.File is reactive
 *
 * > Note: Returns true if this FS.File object was created by a FS.Collection
 * > and we are in a reactive computations. What does this mean? Well it should
 * > mean that our fileRecord is fully updated by Meteor and we are mounted on
 * > a collection
 */
FS.File.prototype.controlledByDeps = function() {
  var self = this;
  return self.createdByTransform && Deps.active;
};

/**
 * @method FS.File.prototype.getCollection
 * @public
 * @returns {FS.Collection} Returns attached collection or undefined if not mounted
 */
FS.File.prototype.getCollection = function() {
  // Get the collection reference
  var self = this;

  // If we already made the link then do no more
  if (self.collection) {
    return self.collection;
  }

  // If we don't have a collectionName then there's not much to do, the file is
  // not mounted yet
  if (!self.collectionName) {
    // Should not throw an error here - could be common that the file is not
    // yet mounted into a collection
    return;
  }

  // Link the collection to the file
  self.collection = FS._collections[self.collectionName];

  return self.collection; //possibly undefined, but that's desired behavior
};

/**
 * @method FS.File.prototype.isMounted
 * @public
 * @returns {FS.Collection} Returns attached collection or undefined if not mounted
 */
FS.File.prototype.isMounted = FS.File.prototype.getCollection;

/**
 * @method FS.File.prototype.getFileRecord Returns the fileRecord
 * @public
 * @returns {object} The filerecord
 */
FS.File.prototype.getFileRecord = function() {
  var self = this;
  // Check if this file object fileRecord is kept updated by Meteor, if so
  // return self
  if (self.controlledByDeps()) {
    return self;
  }
  // Go for manually updating the file record
  if (self.isMounted()) {
    FS.debug && console.log('GET FILERECORD: ' + self._id);

    // Return the fileRecord or an empty object
    var fileRecord = self.collection.files.findOne({_id: self._id}) || {};
    FS.Utility.extend(self, fileRecord);
    return fileRecord;
  } else {
    // We return an empty object, this way users can still do `getRecord().size`
    // Without getting an error
    return {};
  }
};

/**
 * @method FS.File.prototype.update
 * @public
 * @param {modifier} modifier
 * @param {object} [options]
 * @param {function} [callback]
 *
 * Updates the fileRecord.
 */
FS.File.prototype.update = function(modifier, options, callback) {
  var self = this;

  FS.debug && console.log('UPDATE: ' + JSON.stringify(modifier));

  // Make sure we have options and callback
  if (!callback && typeof options === 'function') {
    callback = options;
    options = {};
  }
  callback = callback || FS.Utility.defaultCallback;

  if (!self.isMounted()) {
    callback(new Error("Cannot update a file that is not associated with a collection"));
    return;
  }

  // Call collection update - File record
  return self.collection.files.update({_id: self._id}, modifier, options, function(err, count) {
    // Update the fileRecord if it was changed and on the client
    // The server-side methods will pull the fileRecord if needed
    if (count > 0 && Meteor.isClient)
      self.getFileRecord();
    // Call callback
    callback(err, count);
  });
};

/**
 * @method FS.File.prototype._saveChanges
 * @private
 * @param {String} [what] "_original" to save original info, or a store name to save info for that store, or saves everything
 *
 * Updates the fileRecord from values currently set on the FS.File instance.
 */
FS.File.prototype._saveChanges = function(what) {
  var self = this;

  if (!self.isMounted()) {
    return;
  }

  FS.debug && console.log("FS.File._saveChanges:", what || "all");

  var mod = {$set: {}};
  if (what === "_original") {
    mod.$set.original = self.original;
  } else if (typeof what === "string") {
    var info = self.copies[what];
    if (info) {
      mod.$set["copies." + what] = info;
    }
  } else {
    mod.$set.original = self.original;
    mod.$set.copies = self.copies;
  }

  self.update(mod);
};

/**
 * @method FS.File.prototype.remove
 * @public
 * @param {Function} [callback]
 * @returns {number} Count
 *
 * Remove the current file from its FS.Collection
 */
FS.File.prototype.remove = function(callback) {
  var self = this;

  FS.debug && console.log('REMOVE: ' + self._id);

  callback = callback || FS.Utility.defaultCallback;

  if (!self.isMounted()) {
    callback(new Error("Cannot remove a file that is not associated with a collection"));
    return;
  }

  return self.collection.files.remove({_id: self._id}, function(err, res) {
    if (!err) {
      delete self._id;
      delete self.collection;
      delete self.collectionName;
    }
    callback(err, res);
  });
};

/**
 * @method FS.File.prototype.moveTo
 * @param {FS.Collection} targetCollection
 * @private // Marked private until implemented
 * @todo Needs to be implemented
 *
 * Move the file from current collection to another collection
 *
 * > Note: Not yet implemented
 */

/**
 * @method FS.File.prototype.getExtension Returns the lowercase file extension
 * @public
 * @deprecated Use the `extension` getter/setter method instead.
 * @param {Object} [options]
 * @param {String} [options.store] - Store name. Default is the original extension.
 * @returns {string} The extension eg.: `jpg` or if not found then an empty string ''
 */
FS.File.prototype.getExtension = function(options) {
  var self = this;
  return self.extension(options);
};

function checkContentType(fsFile, storeName, startOfType) {
  var type;
  if (storeName && fsFile.hasStored(storeName)) {
    type = fsFile.type({store: storeName});
  } else {
    type = fsFile.type();
  }
  if (typeof type === "string") {
    return type.indexOf(startOfType) === 0;
  }
  return false;
}

/**
 * @method FS.File.prototype.isImage Is it an image file?
 * @public
 * @param {object} [options]
 * @param {string} [options.store] The store we're interested in
 *
 * Returns true if the copy of this file in the specified store has an image
 * content type. If the file object is unmounted or doesn't have a copy for
 * the specified store, or if you don't specify a store, this method checks
 * the content type of the original file.
 */
FS.File.prototype.isImage = function(options) {
  return checkContentType(this, (options || {}).store, 'image/');
};

/**
 * @method FS.File.prototype.isVideo Is it a video file?
 * @public
 * @param {object} [options]
 * @param {string} [options.store] The store we're interested in
 *
 * Returns true if the copy of this file in the specified store has a video
 * content type. If the file object is unmounted or doesn't have a copy for
 * the specified store, or if you don't specify a store, this method checks
 * the content type of the original file.
 */
FS.File.prototype.isVideo = function(options) {
  return checkContentType(this, (options || {}).store, 'video/');
};

/**
 * @method FS.File.prototype.isAudio Is it an audio file?
 * @public
 * @param {object} [options]
 * @param {string} [options.store] The store we're interested in
 *
 * Returns true if the copy of this file in the specified store has an audio
 * content type. If the file object is unmounted or doesn't have a copy for
 * the specified store, or if you don't specify a store, this method checks
 * the content type of the original file.
 */
FS.File.prototype.isAudio = function(options) {
  return checkContentType(this, (options || {}).store, 'audio/');
};

/**
 * @method FS.File.prototype.formattedSize
 * @public
 * @param  {Object} options
 * @param  {String} [options.store=none,display original file size] Which file do you want to get the size of?
 * @param  {String} [options.formatString='0.00 b'] The `numeral` format string to use.
 * @return {String} The file size formatted as a human readable string and reactively updated.
 *
 * * You must add the `numeral` package to your app before you can use this method.
 * * If info is not found or a size can't be determined, it will show 0.
 */
FS.File.prototype.formattedSize = function fsFileFormattedSize(options) {
  var self = this;

  if (typeof numeral !== "function")
    throw new Error("You must add the numeral package if you call FS.File.formattedSize");

  options = options || {};
  options = options.hash || options;

  var size = self.size(options) || 0;
  return numeral(size).format(options.formatString || '0.00 b');
};

/**
 * @method FS.File.prototype.isUploaded Is this file completely uploaded?
 * @public
 * @returns {boolean} True if the number of uploaded bytes is equal to the file size.
 */
FS.File.prototype.isUploaded = function() {
  var self = this;

  // Make sure we use the updated file record
  self.getFileRecord();

  return !!self.uploadedAt;
};

/**
 * @method FS.File.prototype.hasStored
 * @public
 * @param {string} storeName Name of the store
 * @param {boolean} [optimistic=false] In case that the file record is not found, read below
 * @returns {boolean} Is a version of this file stored in the given store?
 *
 * > Note: If the file is not published to the client or simply not found:
 * this method cannot know for sure if it exists or not. The `optimistic`
 * param is the boolean value to return. Are we `optimistic` that the copy
 * could exist. This is the case in `FS.File.url` we are optimistic that the
 * copy supplied by the user exists.
 */
FS.File.prototype.hasStored = function(storeName, optimistic) {
  var self = this;
  // Make sure we use the updated file record
  self.getFileRecord();
  // If we havent the published data then
  if (FS.Utility.isEmpty(self.copies)) {
    return !!optimistic;
  }
  if (typeof storeName === "string") {
    // Return true only if the `key` property is present, which is not set until
    // storage is complete.
    return !!(self.copies && self.copies[storeName] && self.copies[storeName].key);
  }
  return false;
};

// Backwards compatibility
FS.File.prototype.hasCopy = FS.File.prototype.hasStored;

/**
 * @method FS.File.prototype.getCopyInfo
 * @public
 * @deprecated Use individual methods with `store` option instead.
 * @param {string} storeName Name of the store for which to get copy info.
 * @returns {Object} The file details, e.g., name, size, key, etc., specific to the copy saved in this store.
 */
FS.File.prototype.getCopyInfo = function(storeName) {
  var self = this;
  // Make sure we use the updated file record
  self.getFileRecord();
  return (self.copies && self.copies[storeName]) || null;
};

/**
 * @method FS.File.prototype._getInfo
 * @private
 * @param {String} [storeName] Name of the store for which to get file info. Omit for original file details.
 * @param {Object} [options]
 * @param {Boolean} [options.updateFileRecordFirst=false] Update this instance with data from the DB first?
 * @returns {Object} The file details, e.g., name, size, key, etc. If not found, returns an empty object.
 */
FS.File.prototype._getInfo = function(storeName, options) {
  var self = this;
  options = options || {};

  if (options.updateFileRecordFirst) {
    // Make sure we use the updated file record
    self.getFileRecord();
  }

  if (storeName) {
    return (self.copies && self.copies[storeName]) || {};
  } else {
    return self.original || {};
  }
};

/**
 * @method FS.File.prototype._setInfo
 * @private
 * @param {String} storeName - Name of the store for which to set file info. Non-string will set original file details.
 * @param {String} property - Property to set
 * @param {String} value - New value for property
 * @param {Boolean} save - Should the new value be saved to the DB, too, or just set in the FS.File properties?
 * @returns {undefined}
 */
FS.File.prototype._setInfo = function(storeName, property, value, save) {
  var self = this;
  if (typeof storeName === "string") {
    self.copies = self.copies || {};
    self.copies[storeName] = self.copies[storeName] || {};
    self.copies[storeName][property] = value;
    save && self._saveChanges(storeName);
  } else {
    self.original = self.original || {};
    self.original[property] = value;
    save && self._saveChanges("_original");
  }
};

/**
 * @method FS.File.prototype.name
 * @public
 * @param {String|null} [value] - If setting the name, specify the new name as the first argument. Otherwise the options argument should be first.
 * @param {Object} [options]
 * @param {Object} [options.store=none,original] - Get or set the name of the version of the file that was saved in this store. Default is the original file name.
 * @param {Boolean} [options.updateFileRecordFirst=false] Update this instance with data from the DB first? Applies to getter usage only.
 * @param {Boolean} [options.save=true] Save change to database? Applies to setter usage only.
 * @returns {String|undefined} If setting, returns `undefined`. If getting, returns the file name.
 */
FS.File.prototype.name = function(value, options) {
  var self = this;

  if (!options && ((typeof value === "object" && value !== null) || typeof value === "undefined")) {
    // GET
    options = value || {};
    options = options.hash || options; // allow use as UI helper
    return self._getInfo(options.store, options).name;
  } else {
    // SET
    options = options || {};
    return self._setInfo(options.store, 'name', value, typeof options.save === "boolean" ? options.save : true);
  }
};

/**
 * @method FS.File.prototype.extension
 * @public
 * @param {String|null} [value] - If setting the extension, specify the new extension (without period) as the first argument. Otherwise the options argument should be first.
 * @param {Object} [options]
 * @param {Object} [options.store=none,original] - Get or set the extension of the version of the file that was saved in this store. Default is the original file extension.
 * @param {Boolean} [options.updateFileRecordFirst=false] Update this instance with data from the DB first? Applies to getter usage only.
 * @param {Boolean} [options.save=true] Save change to database? Applies to setter usage only.
 * @returns {String|undefined} If setting, returns `undefined`. If getting, returns the file extension or an empty string if there isn't one.
 */
FS.File.prototype.extension = function(value, options) {
  var self = this;

  if (!options && ((typeof value === "object" && value !== null) || typeof value === "undefined")) {
    // GET
    options = value || {};
    return FS.Utility.getFileExtension(self.name(options) || '');
  } else {
    // SET
    options = options || {};
    var newName = FS.Utility.setFileExtension(self.name(options) || '', value);
    return self._setInfo(options.store, 'name', newName, typeof options.save === "boolean" ? options.save : true);
  }
};

/**
 * @method FS.File.prototype.size
 * @public
 * @param {Number} [value] - If setting the size, specify the new size in bytes as the first argument. Otherwise the options argument should be first.
 * @param {Object} [options]
 * @param {Object} [options.store=none,original] - Get or set the size of the version of the file that was saved in this store. Default is the original file size.
 * @param {Boolean} [options.updateFileRecordFirst=false] Update this instance with data from the DB first? Applies to getter usage only.
 * @param {Boolean} [options.save=true] Save change to database? Applies to setter usage only.
 * @returns {Number|undefined} If setting, returns `undefined`. If getting, returns the file size.
 */
FS.File.prototype.size = function(value, options) {
  var self = this;

  if (!options && ((typeof value === "object" && value !== null) || typeof value === "undefined")) {
    // GET
    options = value || {};
    options = options.hash || options; // allow use as UI helper
    return self._getInfo(options.store, options).size;
  } else {
    // SET
    options = options || {};
    return self._setInfo(options.store, 'size', value, typeof options.save === "boolean" ? options.save : true);
  }
};

/**
 * @method FS.File.prototype.type
 * @public
 * @param {String} [value] - If setting the type, specify the new type as the first argument. Otherwise the options argument should be first.
 * @param {Object} [options]
 * @param {Object} [options.store=none,original] - Get or set the type of the version of the file that was saved in this store. Default is the original file type.
 * @param {Boolean} [options.updateFileRecordFirst=false] Update this instance with data from the DB first? Applies to getter usage only.
 * @param {Boolean} [options.save=true] Save change to database? Applies to setter usage only.
 * @returns {String|undefined} If setting, returns `undefined`. If getting, returns the file type.
 */
FS.File.prototype.type = function(value, options) {
  var self = this;

  if (!options && ((typeof value === "object" && value !== null) || typeof value === "undefined")) {
    // GET
    options = value || {};
    options = options.hash || options; // allow use as UI helper
    return self._getInfo(options.store, options).type;
  } else {
    // SET
    options = options || {};
    return self._setInfo(options.store, 'type', value, typeof options.save === "boolean" ? options.save : true);
  }
};

/**
 * @method FS.File.prototype.updatedAt
 * @public
 * @param {String} [value] - If setting updatedAt, specify the new date as the first argument. Otherwise the options argument should be first.
 * @param {Object} [options]
 * @param {Object} [options.store=none,original] - Get or set the last updated date for the version of the file that was saved in this store. Default is the original last updated date.
 * @param {Boolean} [options.updateFileRecordFirst=false] Update this instance with data from the DB first? Applies to getter usage only.
 * @param {Boolean} [options.save=true] Save change to database? Applies to setter usage only.
 * @returns {String|undefined} If setting, returns `undefined`. If getting, returns the file's last updated date.
 */
FS.File.prototype.updatedAt = function(value, options) {
  var self = this;

  if (!options && ((typeof value === "object" && value !== null && !(value instanceof Date)) || typeof value === "undefined")) {
    // GET
    options = value || {};
    options = options.hash || options; // allow use as UI helper
    return self._getInfo(options.store, options).updatedAt;
  } else {
    // SET
    options = options || {};
    return self._setInfo(options.store, 'updatedAt', value, typeof options.save === "boolean" ? options.save : true);
  }
};

/**
 * @method FS.File.onStoredCallback
 * @summary Calls callback when the file is fully stored to the specify storeName
 * @public
 * @param {String} [storeName] - The name of the file store we want to get called when stored.
 * @param {function} [callback]
 */
FS.File.prototype.onStoredCallback = function (storeName, callback) {
  // Check file is not already stored
  if (this.hasStored(storeName)) {
    callback();
    return;
  }
  if (Meteor.isServer) {
    // Listen to file stored events
    // TODO Require thinking whether it is better to use observer for case of using multiple application instances, Ask for same image url while upload is being done.
    this.on('stored', function (newStoreName) {
      // If stored is completed to the specified store call callback
      if (storeName === newStoreName) {
        // Remove the specified file stored listener
        this.removeListener('stored', arguments.callee);
        callback();
      }
    }.bind(this)
    );
  } else {
    var fileId = this._id,
        collectionName = this.collectionName;
    // Wait for file to be fully uploaded
    Tracker.autorun(function (c) {
      Meteor.call('_cfs_returnWhenStored', collectionName, fileId, storeName, function (error, result) {
        if (result && result === true) {
          c.stop();
          callback();
        } else {
          Meteor.setTimeout(function () {
            c.invalidate();
          }, 100);
        }
      });
    });
  }
};

/**
 * @method FS.File.onStored
 * @summary Function that returns when the file is fully stored to the specify storeName
 * @public
 * @param {String} storeName - The name of the file store we want to get called when stored.
 *
 * Function that returns when the file is fully stored to the specify storeName.
 *
 * For example needed if wanted to save the direct link to a file on s3 when fully uploaded.
 */
FS.File.prototype.onStored = function (arguments) {
  var onStoredSync = Meteor.wrapAsync(this.onStoredCallback);
  return onStoredSync.call(this, arguments);
};

function isBasicObject(obj) {
  return (obj === Object(obj) && Object.getPrototypeOf(obj) === Object.prototype);
}

// getPrototypeOf polyfill
if (typeof Object.getPrototypeOf !== "function") {
  if (typeof "".__proto__ === "object") {
    Object.getPrototypeOf = function(object) {
      return object.__proto__;
    };
  } else {
    Object.getPrototypeOf = function(object) {
      // May break if the constructor has been tampered with
      return object.constructor.prototype;
    };
  }
}


