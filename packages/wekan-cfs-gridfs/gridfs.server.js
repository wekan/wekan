var path = Npm.require('path');
var mongodb = Npm.require('mongodb');
var ObjectID = Npm.require('mongodb').ObjectID;
var Grid = Npm.require('gridfs-stream');
//var Grid = Npm.require('gridfs-locking-stream');

var chunkSize = 1024*1024*2; // 256k is default GridFS chunk size, but performs terribly for largish files

/**
 * @public
 * @constructor
 * @param {String} name - The store name
 * @param {Object} options
 * @param {Function} [options.beforeSave] - Function to run before saving a file from the server. The context of the function will be the `FS.File` instance we're saving. The function may alter its properties.
 * @param {Number} [options.maxTries=5] - Max times to attempt saving a file
 * @returns {FS.StorageAdapter} An instance of FS.StorageAdapter.
 *
 * Creates a GridFS store instance on the server. Inherits from FS.StorageAdapter
 * type.
 */

FS.Store.GridFS = function(name, options) {
  var self = this;
  options = options || {};

  var gridfsName = name;
  var mongoOptions = options.mongoOptions || {};

  if (!(self instanceof FS.Store.GridFS))
    throw new Error('FS.Store.GridFS missing keyword "new"');

  if (!options.mongoUrl) {
    options.mongoUrl = process.env.MONGO_URL;
    // When using a Meteor MongoDB instance, preface name with "cfs_gridfs."
    gridfsName = "cfs_gridfs." + name;
  }

  if (!options.mongoOptions) {
    options.mongoOptions = { db: { native_parser: true }, server: { auto_reconnect: true }};
  }

  if (options.chunkSize) {
    chunkSize = options.chunkSize;
  }

  return new FS.StorageAdapter(name, options, {

    typeName: 'storage.gridfs',
    fileKey: function(fileObj) {
      // We should not have to mount the file here - We assume its taken
      // care of - Otherwise we create new files instead of overwriting
      var key = {
        _id: null,
        filename: null
      };

      // If we're passed a fileObj, we retrieve the _id and filename from it.
      if (fileObj) {
        var info = fileObj._getInfo(name, {updateFileRecordFirst: false});
        key._id = info.key || null;
        key.filename = info.name || fileObj.name({updateFileRecordFirst: false}) || (fileObj.collectionName + '-' + fileObj._id);
      }

      // If key._id is null at this point, createWriteStream will let GridFS generate a new ID
      return key;
    },
    createReadStream: function(fileKey, options) {
      options = options || {};

      // Init GridFS
      var gfs = new Grid(self.db, mongodb);

      // Set the default streamning settings
      var settings = {
        _id: new ObjectID(fileKey._id),
        root: gridfsName
      };

      // Check if this should be a partial read
      if (typeof options.start !== 'undefined' && typeof options.end !== 'undefined' ) {
        // Add partial info
        settings.range = {
          startPos: options.start,
          endPos: options.end
        };
      }

      FS.debug && console.log('GRIDFS', settings);

      return gfs.createReadStream(settings);

    },
    createWriteStream: function(fileKey, options) {
      options = options || {};

      // Init GridFS
      var gfs = new Grid(self.db, mongodb);

      var opts = {
        filename: fileKey.filename,
        mode: 'w',
        root: gridfsName,
        chunk_size: options.chunk_size || chunkSize,
        // We allow aliases, metadata and contentType to be passed in via
        // options
        aliases: options.aliases || [],
        metadata: options.metadata || null,
        content_type: options.contentType || 'application/octet-stream'
      };

      if (fileKey._id) {
        opts._id = new ObjectID(fileKey._id);
      }

      var writeStream = gfs.createWriteStream(opts);

      writeStream.on('close', function(file) {
        if (!file) {
          // gridfs-stream will emit "close" without passing a file
          // if there is an error. We can simply exit here because
          // the "error" listener will also be called in this case.
          return;
        }

        if (FS.debug) console.log('SA GridFS - DONE!');

        // Emit end and return the fileKey, size, and updated date
        writeStream.emit('stored', {
          // Set the generated _id so that we know it for future reads and writes.
          // We store the _id as a string and only convert to ObjectID right before
          // reading, writing, or deleting. If we store the ObjectID itself,
          // Meteor (EJSON?) seems to convert it to a LocalCollection.ObjectID,
          // which GFS doesn't understand.
          fileKey: file._id.toString(),
          size: file.length,
          storedAt: file.uploadDate || new Date()
        });
      });

      writeStream.on('error', function(error) {
        console.log('SA GridFS - ERROR!', error);
      });

      return writeStream;

    },
    remove: function(fileKey, callback) {
      // Init GridFS
      var gfs = new Grid(self.db, mongodb);

      try {
        gfs.remove({ _id: new ObjectID(fileKey._id), root: gridfsName }, callback);
      } catch(err) {
        callback(err);
      }
    },

    // Not implemented
    watch: function() {
      throw new Error("GridFS storage adapter does not support the sync option");
    },

    init: function(callback) {
      mongodb.MongoClient.connect(options.mongoUrl, mongoOptions, function (err, db) {
        if (err) { return callback(err); }
        self.db = db;
        
        // ensure that indexes are added as otherwise CollectionFS fails for Mongo >= 3.0
        var collection = new Mongo.Collection(gridfsName);
        collection.rawCollection().ensureIndex({ "files_id": 1, "n": 1});        
        
        callback(null);
      });
    }
  });
};
