getHeaders = [];
getHeadersByCollection = {};

var contentDisposition = Npm.require('content-disposition');

FS.HTTP.Handlers = {};

/**
 * @method FS.HTTP.Handlers.Del
 * @public
 * @returns {any} response
 *
 * HTTP DEL request handler
 */
FS.HTTP.Handlers.Del = function httpDelHandler(ref) {
  var self = this;
  var opts = FS.Utility.extend({}, self.query || {}, self.params || {});

  // If DELETE request, validate with 'remove' allow/deny, delete the file, and return
  FS.Utility.validateAction(ref.collection.files._validators['remove'], ref.file, self.userId);

  /*
   * From the DELETE spec:
   * A successful response SHOULD be 200 (OK) if the response includes an
   * entity describing the status, 202 (Accepted) if the action has not
   * yet been enacted, or 204 (No Content) if the action has been enacted
   * but the response does not include an entity.
   */
  self.setStatusCode(200);

  return {
    deleted: !!ref.file.remove()
  };
};

/**
 * @method FS.HTTP.Handlers.GetList
 * @public
 * @returns {Object} response
 *
 * HTTP GET file list request handler
 */
FS.HTTP.Handlers.GetList = function httpGetListHandler() {
  // Not Yet Implemented
  // Need to check publications and return file list based on
  // what user is allowed to see
};

/*
  requestRange will parse the range set in request header - if not possible it
  will throw fitting errors and autofill range for both partial and full ranges

  throws error or returns the object:
  {
    start
    end
    length
    unit
    partial
  }
*/
var requestRange = function(req, fileSize) {
  if (req) {
    if (req.headers) {
      var rangeString = req.headers.range;

      // Make sure range is a string
      if (rangeString === ''+rangeString) {

        // range will be in the format "bytes=0-32767"
        var parts = rangeString.split('=');
        var unit = parts[0];

        // Make sure parts consists of two strings and range is of type "byte"
        if (parts.length == 2 && unit == 'bytes') {
          // Parse the range
          var range = parts[1].split('-');
          var start = Number(range[0]);
          var end = Number(range[1]);

          // Fix invalid ranges?
          if (range[0] != start) start = 0;
          if (range[1] != end || !end) end = fileSize - 1;

          // Make sure range consists of a start and end point of numbers and start is less than end
          if (start < end) {

            var partSize = 0 - start + end + 1;

            // Return the parsed range
            return {
              start: start,
              end: end,
              length: partSize,
              size: fileSize,
              unit: unit,
              partial: (partSize < fileSize)
            };

          } else {
            throw new Meteor.Error(416, "Requested Range Not Satisfiable");
          }

        } else {
          // The first part should be bytes
          throw new Meteor.Error(416, "Requested Range Unit Not Satisfiable");
        }

      } else {
        // No range found
      }

    } else {
      // throw new Error('No request headers set for _parseRange function');
    }
  } else {
    throw new Error('No request object passed to _parseRange function');
  }

  return {
    start: 0,
    end: fileSize - 1,
    length: fileSize,
    size: fileSize,
    unit: 'bytes',
    partial: false
  };
};

/**
 * @method FS.HTTP.Handlers.Get
 * @public
 * @returns {any} response
 *
 * HTTP GET request handler
 */
FS.HTTP.Handlers.Get = function httpGetHandler(ref) {
  var self = this;
  // Once we have the file, we can test allow/deny validators
  // XXX: pass on the "share" query eg. ?share=342hkjh23ggj for shared url access?
  FS.Utility.validateAction(ref.collection._validators['download'], ref.file, self.userId /*, self.query.shareId*/);

  var storeName = ref.storeName;

  // If no storeName was specified, use the first defined storeName
  if (typeof storeName !== "string") {
    // No store handed, we default to primary store
    storeName = ref.collection.primaryStore.name;
  }

  // Get the storage reference
  var storage = ref.collection.storesLookup[storeName];

  if (!storage) {
    throw new Meteor.Error(404, "Not Found", 'There is no store "' + storeName + '"');
  }

  // Get the file
  var copyInfo = ref.file.copies[storeName];

  if (!copyInfo) {
    throw new Meteor.Error(404, "Not Found", 'This file was not stored in the ' + storeName + ' store');
  }

  // Set the content type for file
  if (typeof copyInfo.type === "string") {
    self.setContentType(copyInfo.type);
  } else {
    self.setContentType('application/octet-stream');
  }

  // Add 'Content-Disposition' header if requested a download/attachment URL
  if (typeof ref.download !== "undefined") {
    var filename = ref.filename || copyInfo.name;
    self.addHeader('Content-Disposition', contentDisposition(filename));
  } else {
    self.addHeader('Content-Disposition', 'inline');
  }

  // Get the contents range from request
  var range = requestRange(self.request, copyInfo.size);

  // Some browsers cope better if the content-range header is
  // still included even for the full file being returned.
  self.addHeader('Content-Range', range.unit + ' ' + range.start + '-' + range.end + '/' + range.size);

  // If a chunk/range was requested instead of the whole file, serve that'
  if (range.partial) {
    self.setStatusCode(206, 'Partial Content');
  } else {
    self.setStatusCode(200, 'OK');
  }

  // Add any other global custom headers and collection-specific custom headers
  FS.Utility.each(getHeaders.concat(getHeadersByCollection[ref.collection.name] || []), function(header) {
    self.addHeader(header[0], header[1]);
  });

  // Inform clients about length (or chunk length in case of ranges)
  self.addHeader('Content-Length', range.length);

  // Last modified header (updatedAt from file info)
  self.addHeader('Last-Modified', copyInfo.updatedAt.toUTCString());

  // Inform clients that we accept ranges for resumable chunked downloads
  self.addHeader('Accept-Ranges', range.unit);

  if (FS.debug) console.log('Read file "' + (ref.filename || copyInfo.name) + '" ' + range.unit + ' ' + range.start + '-' + range.end + '/' + range.size);

  var readStream = storage.adapter.createReadStream(ref.file, {start: range.start, end: range.end});

  readStream.on('error', function(err) {
    // Send proper error message on get error
    if (err.message && err.statusCode) {
      self.Error(new Meteor.Error(err.statusCode, err.message));
    } else {
      self.Error(new Meteor.Error(503, 'Service unavailable'));
    }
  });

  readStream.pipe(self.createWriteStream());
};

// File with unicode or other encodings filename can upload to server susscessfully,
// but when download, the  HTTP header "Content-Disposition" cannot accept 
// characters other than ASCII, the filename should be converted to binary or URI encoded.
// https://github.com/wekan/wekan/issues/784
const originalHandler = FS.HTTP.Handlers.Get;
FS.HTTP.Handlers.Get = function (ref) {
  try {
      var userAgent = (this.requestHeaders['user-agent']||'').toLowerCase();
      if(userAgent.indexOf('msie') >= 0 || userAgent.indexOf('chrome') >= 0) {
          ref.filename =  encodeURIComponent(ref.filename);
      } else if(userAgent.indexOf('firefox') >= 0) {
          ref.filename = new Buffer(ref.filename).toString('binary');
      } else {
          /* safari*/
          ref.filename = new Buffer(ref.filename).toString('binary');
      }   
   } catch (ex){
        ref.filename = ref.filename;
   } 
   return originalHandler.call(this, ref);
};


/**
 * @method FS.HTTP.Handlers.PutInsert
 * @public
 * @returns {Object} response object with _id property
 *
 * HTTP PUT file insert request handler
 */
FS.HTTP.Handlers.PutInsert = function httpPutInsertHandler(ref) {
  var self = this;
  var opts = FS.Utility.extend({}, self.query || {}, self.params || {});

  FS.debug && console.log("HTTP PUT (insert) handler");

  // Create the nice FS.File
  var fileObj = new FS.File();

  // Set its name
  fileObj.name(opts.filename || null);

  // Attach the readstream as the file's data
  fileObj.attachData(self.createReadStream(), {type: self.requestHeaders['content-type'] || 'application/octet-stream'});

  // Validate with insert allow/deny
  FS.Utility.validateAction(ref.collection.files._validators['insert'], fileObj, self.userId);

  // Insert file into collection, triggering readStream storage
  ref.collection.insert(fileObj);

  // Send response
  self.setStatusCode(200);

  // Return the new file id
  return {_id: fileObj._id};
};

/**
 * @method FS.HTTP.Handlers.PutUpdate
 * @public
 * @returns {Object} response object with _id and chunk properties
 *
 * HTTP PUT file update chunk request handler
 */
FS.HTTP.Handlers.PutUpdate = function httpPutUpdateHandler(ref) {
  var self = this;
  var opts = FS.Utility.extend({}, self.query || {}, self.params || {});

  var chunk = parseInt(opts.chunk, 10);
  if (isNaN(chunk)) chunk = 0;

  FS.debug && console.log("HTTP PUT (update) handler received chunk: ", chunk);

  // Validate with insert allow/deny; also mounts and retrieves the file
  FS.Utility.validateAction(ref.collection.files._validators['insert'], ref.file, self.userId);

  self.createReadStream().pipe( FS.TempStore.createWriteStream(ref.file, chunk) );

  // Send response
  self.setStatusCode(200);

  return { _id: ref.file._id, chunk: chunk };
};
