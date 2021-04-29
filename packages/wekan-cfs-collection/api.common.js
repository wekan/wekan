/** @method FS.Collection.prototype.insert Insert `File` or `FS.File` or remote URL into collection
 * @public
 * @param {File|Blob|Buffer|ArrayBuffer|Uint8Array|String} fileRef File, FS.File, or other data to insert
 * @param {function} [callback] Callback `function(error, fileObj)`
 * @returns {FS.File|undefined} The `file object`
 * [Meteor docs](http://docs.meteor.com/#insert)
 */
FS.Collection.prototype.insert = function(fileRef, callback) {
  var self = this;

  if (Meteor.isClient && !callback) {
    callback = FS.Utility.defaultCallback;
  }

  // XXX:
  // We should out factor beginStorage to FS.File.beginStorage
  // the client side storage adapters should be the one providing
  // the upload either via http/ddp or direct upload
  // Could be cool to have a streaming api on the client side
  // having a createReadStream etc. on the client too...
  function beginStorage(fileObj) {

    // If on client, begin uploading the data
    if (Meteor.isClient) {
      self.options.uploader && self.options.uploader(fileObj);
    }

    // If on the server, save the binary to a single chunk temp file,
    // so that it is available when FileWorker calls saveCopies.
    // This will also trigger file handling from collection observes.
    else if (Meteor.isServer) {
      fileObj.createReadStream().pipe(FS.TempStore.createWriteStream(fileObj));
    }
  }

  // XXX: would be great if this function could be simplyfied - if even possible?
  function checkAndInsert(fileObj) {
    // Check filters. This is called in deny functions, too, but we call here to catch
    // server inserts and to catch client inserts early, allowing us to call `onInvalid` on
    // the client and save a trip to the server.
    if (!self.allowsFile(fileObj)) {
      return FS.Utility.handleError(callback, 'FS.Collection insert: file does not pass collection filters');
    }

    // Set collection name
    fileObj.collectionName = self.name;

    // Insert the file into db
    // We call cloneFileRecord as an easy way of extracting the properties
    // that need saving.
    if (callback) {
      fileObj._id = self.files.insert(FS.Utility.cloneFileRecord(fileObj), function(err, id) {
        if (err) {
          if (fileObj._id) {
            delete fileObj._id;
          }
        } else {
          // Set _id, just to be safe, since this could be before or after the insert method returns
          fileObj._id = id;
          // Pass to uploader or stream data to the temp store
          beginStorage(fileObj);
        }
        callback(err, err ? void 0 : fileObj);
      });
    } else {
      fileObj._id = self.files.insert(FS.Utility.cloneFileRecord(fileObj));
      // Pass to uploader or stream data to the temp store
      beginStorage(fileObj);
    }
    return fileObj;
  }

  // Parse, adjust fileRef
  if (fileRef instanceof FS.File) {
    return checkAndInsert(fileRef);
  } else {
    // For convenience, allow File, Blob, Buffer, data URI, filepath, URL, etc. to be passed as first arg,
    // and we will attach that to a new fileobj for them
    var fileObj = new FS.File(fileRef);
    if (callback) {
      fileObj.attachData(fileRef, function attachDataCallback(error) {
        if (error) {
          callback(error);
        } else {
          checkAndInsert(fileObj);
        }
      });
    } else {
      // We ensure there's a callback on the client, so if there isn't one at this point,
      // we must be on the server expecting synchronous behavior.
      fileObj.attachData(fileRef);
      checkAndInsert(fileObj);
    }
    return fileObj;
  }
};

/** @method FS.Collection.prototype.update Update the file record
 * @public
 * @param {FS.File|object} selector
 * @param {object} modifier
 * @param {object} [options]
 * @param {function} [callback]
 * [Meteor docs](http://docs.meteor.com/#update)
 */
FS.Collection.prototype.update = function(selector, modifier, options, callback) {
  var self = this;
  if (selector instanceof FS.File) {
    // Make sure the file belongs to this FS.Collection
    if (selector.collectionName === self.files._name) {
      return selector.update(modifier, options, callback);
    } else {
      // Tried to save a file in the wrong FS.Collection
      throw new Error('FS.Collection cannot update file belongs to: "' + selector.collectionName + '" not: "' + self.files._name + '"');
    }
  }

  return self.files.update(selector, modifier, options, callback);
};

/** @method FS.Collection.prototype.remove Remove the file from the collection
 * @public
 * @param {FS.File|object} selector
 * @param {Function} [callback]
 * [Meteor docs](http://docs.meteor.com/#remove)
 */
FS.Collection.prototype.remove = function(selector, callback) {
  var self = this;
  if (selector instanceof FS.File) {

    // Make sure the file belongs to this FS.Collection
    if (selector.collectionName === self.files._name) {
      return selector.remove(callback);
    } else {
      // Tried to remove a file from the wrong FS.Collection
      throw new Error('FS.Collection cannot remove file belongs to: "' + selector.collectionName + '" not: "' + self.files._name + '"');
    }
  }

  //doesn't work correctly on the client without a callback
  callback = callback || FS.Utility.defaultCallback;
  return self.files.remove(selector, callback);
};

/** @method FS.Collection.prototype.findOne
 * @public
 * @param {[selector](http://docs.meteor.com/#selectors)} selector
 * [Meteor docs](http://docs.meteor.com/#findone)
 * Example:
 ```js
 var images = new FS.Collection( ... );
 // Get the file object
 var fo = images.findOne({ _id: 'NpnskCt6ippN6CgD8' });
 ```
 */
// Call findOne on files collection
FS.Collection.prototype.findOne = function(selector) {
  var self = this;
  return self.files.findOne.apply(self.files, arguments);
};

/** @method FS.Collection.prototype.find
 * @public
 * @param {[selector](http://docs.meteor.com/#selectors)} selector
 * [Meteor docs](http://docs.meteor.com/#find)
 * Example:
 ```js
 var images = new FS.Collection( ... );
 // Get the all file objects
 var files = images.find({ _id: 'NpnskCt6ippN6CgD8' }).fetch();
 ```
 */
FS.Collection.prototype.find = function(selector) {
  var self = this;
  return self.files.find.apply(self.files, arguments);
};

/** @method FS.Collection.prototype.allow
 * @public
 * @param {object} options
 * @param {function} options.download Function that checks if the file contents may be downloaded
 * @param {function} options.insert
 * @param {function} options.update
 * @param {function} options.remove Functions that look at a proposed modification to the database and return true if it should be allowed
 * @param {[string]} [options.fetch] Optional performance enhancement. Limits the fields that will be fetched from the database for inspection by your update and remove functions
 * [Meteor docs](http://docs.meteor.com/#allow)
 * Example:
 ```js
 var images = new FS.Collection( ... );
 // Get the all file objects
 var files = images.allow({
 insert: function(userId, doc) { return true; },
 update: function(userId, doc, fields, modifier) { return true; },
 remove: function(userId, doc) { return true; },
 download: function(userId, fileObj) { return true; },
 });
 ```
 */
FS.Collection.prototype.allow = function(options) {
  var self = this;

  // Pull out the custom "download" functions
  if (options.download) {
    if (!(options.download instanceof Function)) {
      throw new Error("allow: Value for `download` must be a function");
    }
    self._validators.download.allow.push(options.download);
    delete options.download;
  }

  return self.files.allow.call(self.files, options);
};

/** @method FS.Collection.prototype.deny
 * @public
 * @param {object} options
 * @param {function} options.download Function that checks if the file contents may be downloaded
 * @param {function} options.insert
 * @param {function} options.update
 * @param {function} options.remove Functions that look at a proposed modification to the database and return true if it should be denyed
 * @param {[string]} [options.fetch] Optional performance enhancement. Limits the fields that will be fetched from the database for inspection by your update and remove functions
 * [Meteor docs](http://docs.meteor.com/#deny)
 * Example:
 ```js
 var images = new FS.Collection( ... );
 // Get the all file objects
 var files = images.deny({
 insert: function(userId, doc) { return true; },
 update: function(userId, doc, fields, modifier) { return true; },
 remove: function(userId, doc) { return true; },
 download: function(userId, fileObj) { return true; },
 });
 ```
 */
FS.Collection.prototype.deny = function(options) {
  var self = this;

  // Pull out the custom "download" functions
  if (options.download) {
    if (!(options.download instanceof Function)) {
      throw new Error("deny: Value for `download` must be a function");
    }
    self._validators.download.deny.push(options.download);
    delete options.download;
  }

  return self.files.deny.call(self.files, options);
};

// TODO: Upsert?

/**
 * We provide a default implementation that doesn't do anything.
 * Can be changed by user or packages, such as the default cfs-collection-filters pkg.
 * @param  {FS.File} fileObj File object
 * @return {Boolean} Should we allow insertion of this file?
 */
FS.Collection.prototype.allowsFile = function fsColAllowsFile(fileObj) {
  return true;
};
