/*
 * HTTP Upload Transfer Queue
 */

// 2MB default upload chunk size
// Can be overridden by user with FS.config.uploadChunkSize or per FS.Collection in collection options
var defaultChunkSize = 2 * 1024 * 1024;

/**
 * @private
 * @param {Object} task
 * @param {Function} next
 * @return {undefined}
 */
var _taskHandler = function(task, next) {
  FS.debug && console.log("uploading chunk " + task.chunk + ", bytes " + task.start + " to " + Math.min(task.end, task.fileObj.size()) + " of " + task.fileObj.size());
  task.fileObj.data.getBinary(task.start, task.end, function gotBinaryCallback(err, data) {
    if (err) {
      next(new Meteor.Error(err.error, err.message));
    } else {

      FS.debug && console.log('PUT to URL', task.url, task.urlParams);

      HTTP.call("PUT", task.url, {
        params: FS.Utility.extend({chunk: task.chunk}, task.urlParams),
        content: data,
        headers: {
          'Content-Type': task.fileObj.type()
        }
      }, function(error, result) {
        task = null;
        if (error) {
          next(new Meteor.Error(error.error, error.message));
        } else {
          next();
        }
      });

    }
  });
};

/**
 * @private
 * @param {Object} data
 * @param {Function} addTask
 * @return {undefined}
 */
var _errorHandler = function(data, addTask, failures) {
  // If file upload fails
  // TODO We should retry a few times and then emit error?
  // data.fileObj.emit("error", error);
};

/** @method UploadTransferQueue
 * @namespace UploadTransferQueue
 * @constructor
 * @param {Object} [options]
 */
UploadTransferQueue = function(options) {
  // Rig options
  options = options || {};

  // Init the power queue
  var self = new PowerQueue({
    name: 'HTTPUploadTransferQueue',
    // spinalQueue: ReactiveList,
    maxProcessing: 1,
    maxFailures: 5,
    jumpOnFailure: true,
    autostart: true,
    isPaused: false,
    filo: false,
    debug: FS.debug
  });

  // Keep track of uploaded files via this queue
  self.files = {};

  // cancel maps onto queue reset
  self.cancel = self.reset;

  /**
    * @method UploadTransferQueue.isUploadingFile
    * @param {FS.File} fileObj File to check if uploading
    * @returns {Boolean} True if the file is uploading
    *
    * @todo Maybe have a similar function for accessing the file upload queue?
    */
  self.isUploadingFile = function(fileObj) {
    // Check if file is already in queue
    return !!(fileObj && fileObj._id && fileObj.collectionName && (self.files[fileObj.collectionName] || {})[fileObj._id]);
  };

  /** @method UploadTransferQueue.resumeUploadingFile
   * @param {FS.File} File to resume uploading
   * @todo Not sure if this is the best way to handle resumes
   */
  self.resumeUploadingFile = function(fileObj) {
    // Make sure we are handed a FS.File
    if (!(fileObj instanceof FS.File)) {
      throw new Error('Transfer queue expects a FS.File');
    }

    if (fileObj.isMounted()) {
      // This might still be true, preventing upload, if
      // there was a server restart without client restart.
      self.files[fileObj.collectionName] = self.files[fileObj.collectionName] || {};
      self.files[fileObj.collectionName][fileObj._id] = false;
      // Kick off normal upload
      self.uploadFile(fileObj);
    }
  };

  /** @method UploadTransferQueue.uploadFile
   * @param {FS.File} File to upload
   * @todo Check that a file can only be added once - maybe a visual helper on the FS.File?
   * @todo Have an initial request to the server getting uploaded chunks for resume
   */
  self.uploadFile = function(fileObj) {
    FS.debug && console.log("HTTP uploadFile");

    // Make sure we are handed a FS.File
    if (!(fileObj instanceof FS.File)) {
      throw new Error('Transfer queue expects a FS.File');
    }

    // Make sure that we have size as number
    if (typeof fileObj.size() !== 'number') {
      throw new Error('TransferQueue upload failed: fileObj size not set');
    }

    // We don't add the file if it's already in transfer or if already uploaded
    if (self.isUploadingFile(fileObj) || fileObj.isUploaded()) {
      return;
    }

    // Make sure the file object is mounted on a collection
    if (fileObj.isMounted()) {

      var collectionName = fileObj.collectionName;
      var id = fileObj._id;

      // Set the chunkSize to match the collection options, or global config, or default
      fileObj.chunkSize = fileObj.collection.options.chunkSize || FS.config.uploadChunkSize || defaultChunkSize;
      // Set counter for uploaded chunks
      fileObj.chunkCount = 0;
      // Calc the number of chunks
      fileObj.chunkSum = Math.ceil(fileObj.size() / fileObj.chunkSize);

      if (fileObj.chunkSum === 0)
        return;

      // Update the filerecord
      // TODO eventually we should be able to do this without storing any chunk info in the filerecord
      fileObj.update({$set: {chunkSize: fileObj.chunkSize, chunkCount: fileObj.chunkCount, chunkSum: fileObj.chunkSum}});

      // Create a sub queue
      var chunkQueue = new PowerQueue({
        onEnded: function oneChunkQueueEnded() {
          // Remove from list of files being uploaded
          self.files[collectionName][id] = false;
          // XXX It might be possible for this to be called even though there were errors uploading?
          fileObj.emit("uploaded");
        },
        spinalQueue: ReactiveList,
        maxProcessing: 1,
        maxFailures: 5,
        jumpOnFailure: true,
        autostart: false,
        isPaused: false,
        filo: false
      });

      // Rig the custom task handler
      chunkQueue.taskHandler = _taskHandler;

      // Rig the error handler
      chunkQueue.errorHandler = _errorHandler;

      // Set flag that this file is being transfered
      self.files[collectionName] = self.files[collectionName] || {};
      self.files[collectionName][id] = true;

      // Construct URL
      var url = FS.HTTP.uploadUrl + '/' + collectionName;
      if (id) {
        url += '/' + id;
      }

      // TODO: Could we somehow figure out if the collection requires login?
      var authToken = '';
      if (typeof Accounts !== "undefined") {
        var authObject = {
          authToken: Accounts._storedLoginToken() || '',
        };

        // Set the authToken
        var authString = JSON.stringify(authObject);
        authToken = FS.Utility.btoa(authString);
      }

      // Construct query string
      var urlParams = {
        filename: fileObj.name()
      };
      if (authToken !== '') {
        urlParams.token = authToken;
      }

      // Add chunk upload tasks
      for (var chunk = 0, start; chunk < fileObj.chunkSum; chunk++) {
        start = chunk * fileObj.chunkSize;
        // Create and add the task
        // XXX should we somehow make sure we haven't uploaded this chunk already, in
        // case we are resuming?
        chunkQueue.add({
          chunk: chunk,
          name: fileObj.name(),
          url: url,
          urlParams: urlParams,
          fileObj: fileObj,
          start: start,
          end: (chunk + 1) * fileObj.chunkSize
        });
      }

      // Add the queue to the main upload queue
      self.add(chunkQueue);
    }

  };

  return self;
};

/**
 * @namespace FS
 * @type UploadTransferQueue
 *
 * There is a single uploads transfer queue per client (not per CFS)
 */
FS.HTTP.uploadQueue = new UploadTransferQueue();

/*
 * FS.File extensions
 */

/**
 * @method FS.File.prototype.resume
 * @public
 * @param {File|Blob|Buffer} ref
 * @todo WIP, Not yet implemented for server
 *
 * > This function is not yet implemented for server
 */
FS.File.prototype.resume = function(ref) {
  var self = this;
  FS.uploadQueue.resumeUploadingFile(self);
};
