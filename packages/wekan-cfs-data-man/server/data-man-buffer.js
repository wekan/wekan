var bufferStreamReader = Npm.require('buffer-stream-reader');

/**
 * @method DataMan.Buffer
 * @public
 * @constructor
 * @param {Buffer} buffer
 * @param {String} type The data content (MIME) type.
 */
DataMan.Buffer = function DataManBuffer(buffer, type) {
  var self = this;
  self.buffer = buffer;
  self._type = type;
};

/**
 * @method DataMan.Buffer.prototype.getBuffer
 * @private
 * @param {function} callback callback(err, buffer)
 * @returns {Buffer|undefined}
 *
 * Passes a Buffer representing the data to a callback.
 */
DataMan.Buffer.prototype.getBuffer = function dataManBufferGetBuffer(callback) {
  callback(null, this.buffer);
};

/**
 * @method DataMan.Buffer.prototype.getDataUri
 * @private
 * @param {function} callback callback(err, dataUri)
 *
 * Passes a data URI representing the data in the buffer to a callback.
 */
DataMan.Buffer.prototype.getDataUri = function dataManBufferGetDataUri(callback) {
  var self = this;
  if (!self._type) {
    callback(new Error("DataMan.getDataUri couldn't get a contentType"));
  } else {
    var dataUri = "data:" + self._type + ";base64," + self.buffer.toString("base64");
    callback(null, dataUri);
  }
};

/**
 * @method DataMan.Buffer.prototype.createReadStream
 * @private
 *
 * Returns a read stream for the data.
 */
DataMan.Buffer.prototype.createReadStream = function dataManBufferCreateReadStream() {
  return new bufferStreamReader(this.buffer);
};

/**
 * @method DataMan.Buffer.prototype.size
 * @param {function} callback callback(err, size)
 * @private
 *
 * Passes the size in bytes of the data in the buffer to a callback.
 */
DataMan.Buffer.prototype.size = function dataManBufferSize(callback) {
  var self = this;

  if (typeof self._size === "number") {
    callback(null, self._size);
    return;
  }

  self._size = self.buffer.length;
  callback(null, self._size);
};

/**
 * @method DataMan.Buffer.prototype.type
 * @private
 *
 * Returns the type of the data.
 */
DataMan.Buffer.prototype.type = function dataManBufferType() {
  return this._type;
};
