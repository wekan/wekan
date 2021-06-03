/**
 * @method FS.Utility.binaryToBuffer
 * @public
 * @param {Uint8Array} data
 * @returns {Buffer}
 *
 * Converts a Uint8Array instance to a Node Buffer instance
 */
FS.Utility.binaryToBuffer = function(data) {
  var len = data.length;
  var buffer = new Buffer(len);
  for (var i = 0; i < len; i++) {
    buffer[i] = data[i];
  }
  return buffer;
};

/**
 * @method FS.Utility.bufferToBinary
 * @public
 * @param {Buffer} data
 * @returns {Uint8Array}
 *
 * Converts a Node Buffer instance to a Uint8Array instance
 */
FS.Utility.bufferToBinary = function(data) {
  var len = data.length;
  var binary = EJSON.newBinary(len);
  for (var i = 0; i < len; i++) {
    binary[i] = data[i];
  }
  return binary;
};

/**
 * @method FS.Utility.safeCallback
 * @public
 * @param {Function} callback
 * @returns {Function}
 *
 * Makes a callback safe for Meteor code
 */
FS.Utility.safeCallback = function (callback) {
  return Meteor.bindEnvironment(callback, function(err) { throw err; });
};

/**
 * @method FS.Utility.safeStream
 * @public
 * @param {Stream} nodestream
 * @returns {Stream}
 *
 * Adds `safeOn` and `safeOnce` methods to a NodeJS Stream
 * object. These are the same as `on` and `once`, except
 * that the callback is wrapped for use in Meteor.
 */
FS.Utility.safeStream = function(nodestream) {
  if (!nodestream || typeof nodestream.on !== 'function')
    throw new Error('FS.Utility.safeStream requires a NodeJS Stream');

  // Create Meteor safe events
  nodestream.safeOn = function(name, callback) {
    return nodestream.on(name, FS.Utility.safeCallback(callback));
  };

  // Create Meteor safe events
  nodestream.safeOnce = function(name, callback) {
    return nodestream.once(name, FS.Utility.safeCallback(callback));
  };

  // Return the modified stream - modified anyway
  return nodestream;
};

/**
 * @method FS.Utility.eachFileFromPath
 * @public
 * @param {String} p - Server path
 * @param {Function} f - Function to run for each file found in the path.
 * @returns {undefined}
 *
 * Utility for iteration over files from path on server
 */
FS.Utility.eachFileFromPath = function(p, f) {
  var fs = Npm.require('fs');
  var path = Npm.require('path');
  var files = fs.readdirSync(p);
  files.map(function (file) {
    return path.join(p, file);
  }).filter(function (filePath) {
    return fs.statSync(filePath).isFile() && path.basename(filePath)[0] !== '.';
  }).forEach(function (filePath) {
    f(filePath);
  });
};
