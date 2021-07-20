/* global FS */

var PassThrough = Npm.require('stream').PassThrough;
var lengthStream = Npm.require('length-stream');

FS.Transform = function(options) {
  var self = this;

  options = options || {};

  if (!(self instanceof FS.Transform))
    throw new Error('FS.Transform must be called with the "new" keyword');

  if (!options.adapter)
    throw new Error('Transform expects option.adapter to be a storage adapter');

  self.storage = options.adapter;

  // Fetch the transformation functions if any
  self.transformWrite = options.transformWrite;
  self.transformRead = options.transformRead;
};

// Allow packages to add scope
FS.Transform.scope = {};

// The transformation stream triggers an "stored" event when data is stored into
// the storage adapter
FS.Transform.prototype.createWriteStream = function(fileObj) {
  var self = this;

  // Get the file key
  var fileKey = self.storage.fileKey(fileObj);

  // Rig write stream
  var destinationStream = self.storage.createWriteStreamForFileKey(fileKey, {
    // Not all SA's can set these options and cfs dont depend on setting these
    // but its nice if other systems are accessing the SA that some of the data
    // is also available to those
    aliases: [fileObj.name()],
    contentType: fileObj.type(),
    metadata: fileObj.metadata
  });

  // Pass through transformWrite function if provided
  if (typeof self.transformWrite === 'function') {

    destinationStream = addPassThrough(destinationStream, function (ptStream, originalStream) {
      // Rig transform
      try {
        self.transformWrite.call(FS.Transform.scope, fileObj, ptStream, originalStream);
        // XXX: If the transform function returns a buffer should we stream that?
      } catch(err) {
        // We emit an error - should we throw an error?
        console.warn('FS.Transform.createWriteStream transform function failed, Error: ');
        throw err;
      }
    });

  }

  // If original doesn't have size, add another PassThrough to get and set the size.
  // This will run on size=0, too, which is OK.
  // NOTE: This must come AFTER the transformWrite code block above. This might seem
  // confusing, but by coming after it, this will actually be executed BEFORE the user's
  // transform, which is what we need in order to be sure we get the original file
  // size and not the transformed file size.
  if (!fileObj.size()) {
    destinationStream = addPassThrough(destinationStream, function (ptStream, originalStream) {
      var lstream = lengthStream(function (fileSize) {
        fileObj.size(fileSize, {save: false});
      });

      ptStream.pipe(lstream).pipe(originalStream);
    });
  }

  return destinationStream;
};

FS.Transform.prototype.createReadStream = function(fileObj, options) {
  var self = this;

  // Get the file key
  var fileKey = self.storage.fileKey(fileObj);

  // Rig read stream
  var sourceStream = self.storage.createReadStreamForFileKey(fileKey, options);

  // Pass through transformRead function if provided
  if (typeof self.transformRead === 'function') {

    sourceStream = addPassThrough(sourceStream, function (ptStream, originalStream) {
      // Rig transform
      try {
        self.transformRead.call(FS.Transform.scope, fileObj, originalStream, ptStream);
      } catch(err) {
        //throw new Error(err);
        // We emit an error - should we throw an error?
        sourceStream.emit('error', 'FS.Transform.createReadStream transform function failed');
      }
    });

  }

  // We dont transform just normal SA interface
  return sourceStream;
};

// Utility function to simplify adding layers of passthrough
function addPassThrough(stream, func) {
  var pts = new PassThrough();
  // We pass on the special "stored" event for those listening
  stream.on('stored', function(result) {
    pts.emit('stored', result);
  });
  func(pts, stream);
  return pts;
}
