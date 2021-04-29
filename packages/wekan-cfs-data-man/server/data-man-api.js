/* global DataMan:true, Buffer */

var fs = Npm.require("fs");
var Readable = Npm.require('stream').Readable;

/**
 * @method DataMan
 * @public
 * @constructor
 * @param {Buffer|ArrayBuffer|Uint8Array|String} data The data that you want to manipulate.
 * @param {String} [type] The data content (MIME) type, if known. Required if the first argument is a Buffer, ArrayBuffer, Uint8Array, or URL
 * @param {Object} [options] Currently used only to pass options for the GET request when `data` is a URL.
 */
DataMan = function DataMan(data, type, options) {
  var self = this, buffer;

  if (!data) {
    throw new Error("DataMan constructor requires a data argument");
  }

  // The end result of all this is that we will have this.source set to a correct
  // data type handler. We are simply detecting what the data arg is.
  //
  // Unless we already have in-memory data, we don't load anything into memory
  // and instead rely on obtaining a read stream when the time comes.
  if (typeof Buffer !== "undefined" && data instanceof Buffer) {
    if (!type) {
      throw new Error("DataMan constructor requires a type argument when passed a Buffer");
    }
    self.source = new DataMan.Buffer(data, type);
  } else if (typeof ArrayBuffer !== "undefined" && data instanceof ArrayBuffer) {
    if (typeof Buffer === "undefined") {
      throw new Error("Buffer support required to handle an ArrayBuffer");
    }
    if (!type) {
      throw new Error("DataMan constructor requires a type argument when passed an ArrayBuffer");
    }
    buffer = new Buffer(new Uint8Array(data));
    self.source = new DataMan.Buffer(buffer, type);
  } else if (EJSON.isBinary(data)) {
    if (typeof Buffer === "undefined") {
      throw new Error("Buffer support required to handle an ArrayBuffer");
    }
    if (!type) {
      throw new Error("DataMan constructor requires a type argument when passed a Uint8Array");
    }
    buffer = new Buffer(data);
    self.source = new DataMan.Buffer(buffer, type);
  } else if (typeof Readable !== "undefined" && data instanceof Readable) {
    if (!type) {
      throw new Error("DataMan constructor requires a type argument when passed a stream.Readable");
    }
    self.source = new DataMan.ReadStream(data, type);
  } else if (typeof data === "string") {
    if (data.slice(0, 5) === "data:") {
      self.source = new DataMan.DataURI(data);
    } else if (data.slice(0, 5) === "http:" || data.slice(0, 6) === "https:") {
      if (!type) {
        throw new Error("DataMan constructor requires a type argument when passed a URL");
      }
      self.source = new DataMan.URL(data, type, options);
    } else {
      // assume it's a filepath
      self.source = new DataMan.FilePath(data, type);
    }
  } else {
    throw new Error("DataMan constructor received data that it doesn't support");
  }
};

/**
 * @method DataMan.prototype.getBuffer
 * @public
 * @param {function} [callback] callback(err, buffer)
 * @returns {Buffer|undefined}
 *
 * Returns a Buffer representing this data, or passes the Buffer to a callback.
 */
DataMan.prototype.getBuffer = function dataManGetBuffer(callback) {
  var self = this;
  return callback ? self.source.getBuffer(callback) : Meteor.wrapAsync(bind(self.source.getBuffer, self.source))();
};

function _saveToFile(readStream, filePath, callback) {
  var writeStream = fs.createWriteStream(filePath);
  writeStream.on('close', Meteor.bindEnvironment(function () {
    callback();
  }, function (error) { callback(error); }));
  writeStream.on('error', Meteor.bindEnvironment(function (error) {
    callback(error);
  }, function (error) { callback(error); }));
  readStream.pipe(writeStream);
}

/**
 * @method DataMan.prototype.saveToFile
 * @public
 * @param {String} filePath
 * @param {Function} callback
 * @returns {undefined}
 *
 * Saves this data to a filepath on the local filesystem.
 */
DataMan.prototype.saveToFile = function dataManSaveToFile(filePath, callback) {
  var readStream = this.createReadStream();
  return callback ? _saveToFile(readStream, filePath, callback) : Meteor.wrapAsync(_saveToFile)(readStream, filePath);
};

/**
 * @method DataMan.prototype.getDataUri
 * @public
 * @param {function} [callback] callback(err, dataUri)
 *
 * If no callback, returns the data URI.
 */
DataMan.prototype.getDataUri = function dataManGetDataUri(callback) {
  var self = this;
  return callback ? self.source.getDataUri(callback) : Meteor.wrapAsync(bind(self.source.getDataUri, self.source))();
};

/**
 * @method DataMan.prototype.createReadStream
 * @public
 *
 * Returns a read stream for the data.
 */
DataMan.prototype.createReadStream = function dataManCreateReadStream() {
  return this.source.createReadStream();
};

/**
 * @method DataMan.prototype.size
 * @public
 * @param {function} [callback] callback(err, size)
 *
 * If no callback, returns the size in bytes of the data.
 */
DataMan.prototype.size = function dataManSize(callback) {
  var self = this;
  return callback ? self.source.size(callback) : Meteor.wrapAsync(bind(self.source.size, self.source))();
};

/**
 * @method DataMan.prototype.type
 * @public
 *
 * Returns the type of the data.
 */
DataMan.prototype.type = function dataManType() {
  return this.source.type();
};

/*
 * "bind" shim; from underscorejs, but we avoid a dependency
 */
var slice = Array.prototype.slice;
var nativeBind = Function.prototype.bind;
var ctor = function(){};
function isFunction(obj) {
  return Object.prototype.toString.call(obj) == '[object Function]';
}
function bind(func, context) {
  var args, bound;
  if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
  if (!isFunction(func)) throw new TypeError;
  args = slice.call(arguments, 2);
  return bound = function() {
    if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
    ctor.prototype = func.prototype;
    var self = new ctor;
    ctor.prototype = null;
    var result = func.apply(self, args.concat(slice.call(arguments)));
    if (Object(result) === result) return result;
    return self;
  };
}
