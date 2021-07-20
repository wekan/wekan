var mime = Npm.require('mime');
var fs = Npm.require("fs");

/**
 * @method DataMan.FilePath
 * @public
 * @constructor
 * @param {String} filepath
 * @param {String} [type] The data content (MIME) type. Will lookup from file if not passed.
 */
DataMan.FilePath = function DataManFilePath(filepath, type) {
  var self = this;
  self.filepath = filepath;
  self._type = type || mime.lookup(filepath);
};

/**
 * @method DataMan.FilePath.prototype.getBuffer
 * @private
 * @param {function} callback callback(err, buffer)
 * @returns {Buffer|undefined}
 *
 * Passes a Buffer representing the data to a callback.
 */
DataMan.FilePath.prototype.getBuffer = function dataManFilePathGetBuffer(callback) {
  var self = this;

  // Call node readFile
  fs.readFile(self.filepath, Meteor.bindEnvironment(function(err, buffer) {
    callback(err, buffer);
  }, function(err) {
    callback(err);
  }));
};

/**
 * @method DataMan.FilePath.prototype.getDataUri
 * @private
 * @param {function} callback callback(err, dataUri)
 *
 * Passes a data URI representing the data to a callback.
 */
DataMan.FilePath.prototype.getDataUri = function dataManFilePathGetDataUri(callback) {
  var self = this;

  self.getBuffer(function (error, buffer) {
    if (error) {
      callback(error);
    } else {
      if (!self._type) {
        callback(new Error("DataMan.getDataUri couldn't get a contentType"));
      } else {
        var dataUri = "data:" + self._type + ";base64," + buffer.toString("base64");
        buffer = null;
        callback(null, dataUri);
      }
    }
  });
};

/**
 * @method DataMan.FilePath.prototype.createReadStream
 * @private
 *
 * Returns a read stream for the data.
 */
DataMan.FilePath.prototype.createReadStream = function dataManFilePathCreateReadStream() {
  // Stream from filesystem
  return fs.createReadStream(this.filepath);
};

/**
 * @method DataMan.FilePath.prototype.size
 * @param {function} callback callback(err, size)
 * @private
 *
 * Passes the size in bytes of the data to a callback.
 */
DataMan.FilePath.prototype.size = function dataManFilePathSize(callback) {
  var self = this;

  if (typeof self._size === "number") {
    callback(null, self._size);
    return;
  }

  // We can get the size without buffering
  fs.stat(self.filepath, Meteor.bindEnvironment(function (error, stats) {
    if (stats && typeof stats.size === "number") {
      self._size = stats.size;
      callback(null, self._size);
    } else {
      callback(error);
    }
  }, function (error) {
    callback(error);
  }));
};

/**
 * @method DataMan.FilePath.prototype.type
 * @private
 *
 * Returns the type of the data.
 */
DataMan.FilePath.prototype.type = function dataManFilePathType() {
  return this._type;
};
