/* global DataMan */

var PassThrough = Npm.require('stream').PassThrough;

/**
 * @method DataMan.ReadStream
 * @public
 * @constructor
 * @param {ReadStream} stream
 * @param {String} type The data content (MIME) type.
 */
DataMan.ReadStream = function DataManBuffer(stream, type) {
  var self = this;

  // Create a bufferable / paused new stream...
  var pt = new PassThrough();

  // Pipe provided read stream into pass-through stream
  stream.pipe(pt);

  // Set pass-through stream reference
  self.stream = pt;

  // Set type as provided
  self._type = type;
};

/**
 * @method DataMan.ReadStream.prototype.getBuffer
 * @private
 * @param {function} callback callback(err, buffer)
 * @returns {undefined}
 *
 * Passes a Buffer representing the data to a callback.
 */
DataMan.ReadStream.prototype.getBuffer = function dataManReadStreamGetBuffer(/*callback*/) {
  // TODO implement as passthrough stream?
};

/**
 * @method DataMan.ReadStream.prototype.getDataUri
 * @private
 * @param {function} callback callback(err, dataUri)
 *
 * Passes a data URI representing the data in the stream to a callback.
 */
DataMan.ReadStream.prototype.getDataUri = function dataManReadStreamGetDataUri(/*callback*/) {
  // TODO implement as passthrough stream?
};

/**
 * @method DataMan.ReadStream.prototype.createReadStream
 * @private
 *
 * Returns a read stream for the data.
 */
DataMan.ReadStream.prototype.createReadStream = function dataManReadStreamCreateReadStream() {
  return this.stream;
};

/**
 * @method DataMan.ReadStream.prototype.size
 * @param {function} callback callback(err, size)
 * @private
 *
 * Passes the size in bytes of the data in the stream to a callback.
 */
DataMan.ReadStream.prototype.size = function dataManReadStreamSize(callback) {
  callback(0); // will determine from stream later
};

/**
 * @method DataMan.ReadStream.prototype.type
 * @private
 *
 * Returns the type of the data.
 */
DataMan.ReadStream.prototype.type = function dataManReadStreamType() {
  return this._type;
};
