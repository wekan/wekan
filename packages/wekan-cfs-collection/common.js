/**
 *
 * @constructor
 * @param {string} name A name for the collection
 * @param {Object} options
 * @param {FS.StorageAdapter[]} options.stores An array of stores in which files should be saved. At least one is required.
 * @param {Object} [options.filter] Filter definitions
 * @param {Number} [options.chunkSize=2MB] Override the chunk size in bytes for uploads
 * @param {Function} [options.uploader] A function to pass FS.File instances after inserting, which will begin uploading them. By default, `FS.HTTP.uploadQueue.uploadFile` is used if the `cfs-upload-http` package is present, or `FS.DDP.uploadQueue.uploadFile` is used if the `cfs-upload-ddp` package is present. You can override with your own, or set to `null` to prevent automatic uploading.
 * @returns {undefined}
 */
FS.Collection = function(name, options) {
  var self = this;

  self.storesLookup = {};

  self.primaryStore = {};

  self.options = {
    filter: null, //optional
    stores: [], //required
    chunkSize: null
  };

  // Define a default uploader based on which upload packages are present,
  // preferring HTTP. You may override with your own function or
  // set to null to skip automatic uploading of data after file insert/update.
  if (FS.HTTP && FS.HTTP.uploadQueue) {
    self.options.uploader = FS.HTTP.uploadQueue.uploadFile;
  } else if (FS.DDP && FS.DDP.uploadQueue) {
    self.options.uploader = FS.DDP.uploadQueue.uploadFile;
  }

  // Extend and overwrite options
  FS.Utility.extend(self.options, options || {});

  // Set the FS.Collection name
  self.name = name;

  // Make sure at least one store has been supplied.
  // Usually the stores aren't used on the client, but we need them defined
  // so that we can access their names and use the first one as the default.
  if (FS.Utility.isEmpty(self.options.stores)) {
    throw new Error("You must specify at least one store. Please consult the documentation.");
  }

  FS.Utility.each(self.options.stores, function(store, i) {
    // Set the primary store
    if (i === 0) {
      self.primaryStore = store;
    }

    // Check for duplicate naming
    if (typeof self.storesLookup[store.name] !== 'undefined') {
      throw new Error('FS.Collection store names must be uniq, duplicate found: ' + store.name);
    }

    // Set the lookup
    self.storesLookup[store.name] = store;

    if (Meteor.isServer) {

      // Emit events based on store events
      store.on('stored', function (storeName, fileObj) {
        // This is weird, but currently there is a bug where each store will emit the
        // events for all other stores, too, so we need to make sure that this event
        // is truly for this store.
        if (storeName !== store.name)
          return;
        // When a file is successfully stored into the store, we emit a "stored" event on the FS.Collection only if the file belongs to this collection
        if (fileObj.collectionName === name) {
          var emitted = self.emit('stored', fileObj, store.name);
          if (FS.debug && !emitted) {
            console.log(fileObj.name({store: store.name}) + ' was successfully saved to the ' + store.name + ' store. You are seeing this informational message because you enabled debugging and you have not defined any listeners for the "stored" event on the ' + name + ' collection.');
          }
        }
        fileObj.emit('stored', store.name);
      });

      store.on('error', function (storeName, error, fileObj) {
        // This is weird, but currently there is a bug where each store will emit the
        // events for all other stores, too, so we need to make sure that this event
        // is truly for this store.
        if (storeName !== store.name)
          return;
        // When a file has an error while being stored into the temp store, we emit an "error" event on the FS.Collection only if the file belongs to this collection
        if (fileObj.collectionName === name) {
          error = new Error('Error storing file to the ' + store.name + ' store: ' + error.message);
          var emitted = self.emit('error', error, fileObj, store.name);
          if (FS.debug && !emitted) {
            console.log(error.message);
          }
        }
        fileObj.emit('error', store.name);
      });

    }
  });

  var _filesOptions = {
    transform: function(doc) {
      // This should keep the filerecord in the file object updated in reactive
      // context
      var result = new FS.File(doc, true);
      result.collectionName = name;
      return result;
    }
  };
  
  if(self.options.idGeneration) _filesOptions.idGeneration = self.options.idGeneration;

  // Enable specifying an alternate driver, to change where the filerecord is stored
  // Drivers can be created with MongoInternals.RemoteCollectionDriver()
  if(self.options._driver){
    _filesOptions._driver = self.options._driver;
  }

  // Create the 'cfs.' ++ ".filerecord" and use fsFile
  var collectionName = 'cfs.' + name + '.filerecord';
  self.files = new Mongo.Collection(collectionName, _filesOptions);

  // For storing custom allow/deny functions
  self._validators = {
    download: {allow: [], deny: []}
  };

  // Set up filters
  // XXX Should we deprecate the filter option now that this is done with a separate pkg, or just keep it?
  if (self.filters) {
    self.filters(self.options.filter);
  }

  // Save the collection reference (we want it without the 'cfs.' prefix and '.filerecord' suffix)
  FS._collections[name] = this;

  // Set up observers
  Meteor.isServer && FS.FileWorker && FS.FileWorker.observe(this);

  // Emit "removed" event on collection
  self.files.find().observe({
    removed: function(fileObj) {
      self.emit('removed', fileObj);
    }
  });

  // Emit events based on TempStore events
  if (FS.TempStore) {
    FS.TempStore.on('stored', function (fileObj, result) {
      // When a file is successfully stored into the temp store, we emit an "uploaded" event on the FS.Collection only if the file belongs to this collection
      if (fileObj.collectionName === name) {
        var emitted = self.emit('uploaded', fileObj);
        if (FS.debug && !emitted) {
          console.log(fileObj.name() + ' was successfully uploaded. You are seeing this informational message because you enabled debugging and you have not defined any listeners for the "uploaded" event on the ' + name + ' collection.');
        }
      }
    });

    FS.TempStore.on('error', function (error, fileObj) {
      // When a file has an error while being stored into the temp store, we emit an "error" event on the FS.Collection only if the file belongs to this collection
      if (fileObj.collectionName === name) {
        self.emit('error', new Error('Error storing uploaded file to TempStore: ' + error.message), fileObj);
      }
    });
  } else if (Meteor.isServer) {
    throw new Error("FS.Collection constructor: FS.TempStore must be defined before constructing any FS.Collections.")
  }

};

// An FS.Collection can emit events
FS.Collection.prototype = new EventEmitter();
