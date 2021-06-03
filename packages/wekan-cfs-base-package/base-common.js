// Exported namespace
FS = {};

// namespace for adapters; XXX should this be added by cfs-storage-adapter pkg instead?
FS.Store = {
  GridFS: function () {
    throw new Error('To use FS.Store.GridFS, you must add the "wekan-cfs-gridfs" package.');
  },
  FileSystem: function () {
    throw new Error('To use FS.Store.FileSystem, you must add the "wekan-cfs-filesystem" package.');
  },
  S3: function () {
    throw new Error('To use FS.Store.S3, you must add the "wekan-cfs-s3" package.');
  },
  WABS: function () {
    throw new Error('To use FS.Store.WABS, you must add the "wekan-cfs-wabs" package.');
  },
  Dropbox: function () {
    throw new Error('To use FS.Store.Dropbox, you must add the "wekan-cfs-dropbox" package.');
  }
};

// namespace for access points
FS.AccessPoint = {};

// namespace for utillities
FS.Utility = {};

// A general place for any package to store global config settings
FS.config = {};

// An internal collection reference
FS._collections = {};

// Test scope
_Utility = {};

// #############################################################################
//
// HELPERS
//
// #############################################################################

/** @method _Utility.defaultZero
 * @private
  * @param {Any} val Returns number or 0 if value is a falsy
  */
_Utility.defaultZero = function(val) {
  return +(val || 0);
};

/**
 * @method FS.Utility.cloneFileRecord
 * @public
 * @param {FS.File|FS.Collection filerecord} rec
 * @param {Object} [options]
 * @param {Boolean} [options.full=false] Set `true` to prevent certain properties from being omitted from the clone.
 * @returns {Object} Cloned filerecord
 *
 * Makes a shallow clone of `rec`, filtering out some properties that might be present if
 * it's an FS.File instance, but which we never want to be part of the stored
 * filerecord.
 *
 * This is a blacklist clone rather than a whitelist because we want the user to be able
 * to specify whatever additional properties they wish.
 *
 * In general, we expect the following whitelist properties used by the internal and
 * external APIs:
 *
 * _id, name, size, type, chunkCount, chunkSize, chunkSum, copies, createdAt, updatedAt, uploadedAt
 *
 * Those properties, and any additional properties added by the user, should be present
 * in the returned object, which is suitable for inserting into the backing collection or
 * extending an FS.File instance.
 *
 */
FS.Utility.cloneFileRecord = function(rec, options) {
  options = options || {};
  var result = {};
  // We use this method for two purposes. If using it to clone one FS.File into another, then
  // we want a full clone. But if using it to get a filerecord object for inserting into the
  // internal collection, then there are certain properties we want to omit so that they aren't
  // stored in the collection.
  var omit = options.full ? [] : ['collectionName', 'collection', 'data', 'createdByTransform'];
  for (var prop in rec) {
    if (rec.hasOwnProperty(prop) && !_.contains(omit, prop)) {
      result[prop] = rec[prop];
    }
  }
  return result;
};

/**
 * @method FS.Utility.defaultCallback
 * @public
 * @param {Error} [err]
 * @returns {undefined}
 *
 * Can be used as a default callback for client methods that need a callback.
 * Simply throws the provided error if there is one.
 */
FS.Utility.defaultCallback = function defaultCallback(err) {
  if (err) {
    // Show gentle error if Meteor error
    if (err instanceof Meteor.Error) {
      console.error(err.message);
    } else {
      // Normal error, just throw error
      throw err;
    }

  }
};

/**
 * @method FS.Utility.defaultCallback
 * @public
 * @param {Function} [f] A callback function, if you have one. Can be undefined or null.
 * @param {Meteor.Error | Error | String} [err] Error or error message (string)
 * @returns {Any} the callback result if any
 *
 * Handle Error, creates an Error instance with the given text. If callback is
 * a function, passes the error to that function. Otherwise throws it. Useful
 * for dealing with errors in methods that optionally accept a callback.
 */
FS.Utility.handleError = function(f, err, result) {
  // Set callback
  var callback = (typeof f === 'function')? f : FS.Utility.defaultCallback;
  // Set the err
  var error = (err === ''+err)? new Error(err) : err;
  // callback
  return callback(error, result);
}

/**
 * @method FS.Utility.noop
 * @public
 * Use this to hand a no operation / empty function
 */
FS.Utility.noop = function() {};

/**
 * @method validateAction
 * @private
 * @param {Object} validators - The validators object to use, with `deny` and `allow` properties.
 * @param {FS.File} fileObj - Mounted or mountable file object to be passed to validators.
 * @param {String} userId - The ID of the user who is attempting the action.
 * @returns {undefined}
 *
 * Throws a "400-Bad Request" Meteor error if the file is not mounted or
 * a "400-Access denied" Meteor error if the action is not allowed.
 */
FS.Utility.validateAction = function validateAction(validators, fileObj, userId) {
  var denyValidators = validators.deny;
  var allowValidators = validators.allow;

  // If insecure package is used and there are no validators defined,
  // allow the action.
  if (typeof Package === 'object'
          && Package.insecure
          && denyValidators.length + allowValidators.length === 0) {
    return;
  }

  // If already mounted, validators should receive a fileObj
  // that is fully populated
  if (fileObj.isMounted()) {
    fileObj.getFileRecord();
  }

  // Any deny returns true means denied.
  if (_.any(denyValidators, function(validator) {
    return validator(userId, fileObj);
  })) {
    throw new Meteor.Error(403, "Access denied");
  }
  // Any allow returns true means proceed. Throw error if they all fail.
  if (_.all(allowValidators, function(validator) {
    return !validator(userId, fileObj);
  })) {
    throw new Meteor.Error(403, "Access denied");
  }
};

/**
 * @method FS.Utility.getFileName
 * @private
 * @param {String} name - A filename, filepath, or URL
 * @returns {String} The filename without the URL, filepath, or query string
 */
FS.Utility.getFileName = function utilGetFileName(name) {
  // in case it's a URL, strip off potential query string
  // should have no effect on filepath
  name = name.split('?')[0];
  // strip off beginning path or url
  var lastSlash = name.lastIndexOf('/');
  if (lastSlash !== -1) {
    name = name.slice(lastSlash + 1);
  }
  return name;
};

/**
 * @method FS.Utility.getFileExtension
 * @public
 * @param {String} name - A filename, filepath, or URL that may or may not have an extension.
 * @returns {String} The extension or an empty string if no extension found.
 */
FS.Utility.getFileExtension = function utilGetFileExtension(name) {
  name = FS.Utility.getFileName(name);
  // Seekout the last '.' if found
  var found = name.lastIndexOf('.');
  // Return the extension if found else ''
  // If found is -1, we return '' because there is no extension
  // If found is 0, we return '' because it's a hidden file
  return (found > 0 ? name.slice(found + 1).toLowerCase() : '');
};

/**
 * @method FS.Utility.setFileExtension
 * @public
 * @param {String} name - A filename that may or may not already have an extension.
 * @param {String} ext - An extension without leading period, which you want to be the new extension on `name`.
 * @returns {String} The filename with changed extension.
 */
FS.Utility.setFileExtension = function utilSetFileExtension(name, ext) {
  if (!name || !name.length) {
    return name;
  }
  var currentExt = FS.Utility.getFileExtension(name);
  if (currentExt.length) {
    name = name.slice(0, currentExt.length * -1) + ext;
  } else {
    name = name + '.' + ext;
  }
  return name;
};

/*
 * Borrowed these from http package
 */
FS.Utility.encodeParams = function encodeParams(params) {
  var buf = [];
  _.each(params, function(value, key) {
    if (buf.length)
      buf.push('&');
    buf.push(FS.Utility.encodeString(key), '=', FS.Utility.encodeString(value));
  });
  return buf.join('').replace(/%20/g, '+');
};

FS.Utility.encodeString = function encodeString(str) {
  return encodeURIComponent(str).replace(/[!'()]/g, escape).replace(/\*/g, "%2A");
};

/*
 * btoa and atob shims for client and server
 */

FS.Utility._btoa = function _fsUtility_btoa(str) {
  var buffer;

  if (str instanceof Buffer) {
    buffer = str;
  } else {
    buffer = new Buffer(str.toString(), 'binary');
  }

  return buffer.toString('base64');
};

FS.Utility.btoa = function fsUtility_btoa(str) {
  if (typeof btoa === 'function') {
    // Client
    return btoa(str);
  } else if (typeof Buffer !== 'undefined') {
    // Server
    return FS.Utility._btoa(str);
  } else {
    throw new Error('FS.Utility.btoa: Cannot base64 encode on your system');
  }
};

FS.Utility._atob = function _fsUtility_atob(str) {
  return new Buffer(str, 'base64').toString('binary');
};

FS.Utility.atob = function fsUtility_atob(str) {
  if (typeof atob === 'function') {
    // Client
    return atob(str);
  } else if (typeof Buffer !== 'undefined') {
    // Server
    return FS.Utility._atob(str);
  } else {
    throw new Error('FS.Utility.atob: Cannot base64 encode on your system');
  }
};

// Api wrap for 3party libs like underscore
FS.Utility.extend = _.extend;

FS.Utility.each = _.each;

FS.Utility.isEmpty = _.isEmpty;

FS.Utility.indexOf = _.indexOf;

FS.Utility.isArray = _.isArray;

FS.Utility.map = _.map;

FS.Utility.once = _.once;

FS.Utility.include = _.include;

FS.Utility.size = _.size;
