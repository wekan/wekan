/**
 * @method FS.Collection.prototype.filters
 * @public
 * @param {Object} filters - File filters for this collection.
 * @returns {undefined}
 */
FS.Collection.prototype.filters = function fsColFilters(filters) {
  var self = this;

  // Check filter option values and normalize them for quicker checking later
  if (filters) {
    // check/adjust allow/deny
    FS.Utility.each(['allow', 'deny'], function (type) {
      if (!filters[type]) {
        filters[type] = {};
      } else if (typeof filters[type] !== "object") {
        throw new Error(type + ' filter must be an object');
      }
    });

    // check/adjust maxSize
    if (typeof filters.maxSize === "undefined") {
      filters.maxSize = null;
    } else if (filters.maxSize && typeof filters.maxSize !== "number") {
      throw new Error('maxSize filter must be an number');
    }

    // check/adjust extensions
    FS.Utility.each(['allow', 'deny'], function (type) {
      if (!filters[type].extensions) {
        filters[type].extensions = [];
      } else if (!FS.Utility.isArray(filters[type].extensions)) {
        throw new Error(type + '.extensions filter must be an array of extensions');
      } else {
        //convert all to lowercase
        for (var i = 0, ln = filters[type].extensions.length; i < ln; i++) {
          filters[type].extensions[i] = filters[type].extensions[i].toLowerCase();
        }
      }
    });

    // check/adjust content types
    FS.Utility.each(['allow', 'deny'], function (type) {
      if (!filters[type].contentTypes) {
        filters[type].contentTypes = [];
      } else if (!FS.Utility.isArray(filters[type].contentTypes)) {
        throw new Error(type + '.contentTypes filter must be an array of content types');
      }
    });

    self.options.filter = filters;
  }

  // Define deny functions to enforce file filters on the server
  // for inserts and updates that initiate from untrusted code.
  self.files.deny({
    insert: function(userId, fsFile) {
      return !self.allowsFile(fsFile);
    },
    update: function(userId, fsFile, fields, modifier) {
      // TODO will need some kind of additional security here:
      // Don't allow them to change the type, size, name, and
      // anything else that would be security or data integrity issue.
      // Such security should probably be added by cfs-collection package, not here.
      return !self.allowsFile(fsFile);
    },
    fetch: []
  });

  // If insecure package is in use, we need to add allow rules that return
  // true. Otherwise, it would seemingly turn off insecure mode.
  if (Package && Package.insecure) {
    self.allow({
      insert: function() {
        return true;
      },
      update: function() {
        return true;
      },
      remove: function() {
        return true;
      },
      download: function() {
        return true;
      },
      fetch: [],
      transform: null
    });
  }
  // If insecure package is NOT in use, then adding the deny function
  // does not have any effect on the main app's security paradigm. The
  // user will still be required to add at least one allow function of her
  // own for each operation for this collection. And the user may still add
  // additional deny functions, but does not have to.
};

/**
 * @method FS.Collection.prototype.allowsFile Does the collection allow the specified file?
 * @public
 * @returns {boolean} True if the collection allows this file.
 *
 * Checks based on any filters defined on the collection. If the
 * file is not valid according to the filters, this method returns false
 * and also calls the filter `onInvalid` method defined for the
 * collection, passing it an English error string that explains why it
 * failed.
 */
FS.Collection.prototype.allowsFile = function fsColAllowsFile(fileObj) {
  var self = this;

  // Get filters
  var filter = self.options.filter;
  if (!filter) {
    return true;
  }
  var saveAllFileExtensions = (filter.allow.extensions.length === 0);
  var saveAllContentTypes = (filter.allow.contentTypes.length === 0);

  // Get info about the file
  var filename = fileObj.name();
  var contentType = fileObj.type();
  if (!saveAllContentTypes && !contentType) {
    filter.onInvalid && filter.onInvalid(filename + " has an unknown content type");
    return false;
  }
  var fileSize = fileObj.size();
  if (!fileSize || isNaN(fileSize)) {
    filter.onInvalid && filter.onInvalid(filename + " has an unknown file size");
    return false;
  }

  // Do extension checks only if we have a filename
  if (filename) {
    var ext = fileObj.getExtension();
    if (!((saveAllFileExtensions ||
            FS.Utility.indexOf(filter.allow.extensions, ext) !== -1) &&
            FS.Utility.indexOf(filter.deny.extensions, ext) === -1)) {
      filter.onInvalid && filter.onInvalid(filename + ' has the extension "' + ext + '", which is not allowed');
      return false;
    }
  }

  // Do content type checks
  if (!((saveAllContentTypes ||
          contentTypeInList(filter.allow.contentTypes, contentType)) &&
          !contentTypeInList(filter.deny.contentTypes, contentType))) {
    filter.onInvalid && filter.onInvalid(filename + ' is of the type "' + contentType + '", which is not allowed');
    return false;
  }

  // Do max size check
  if (typeof filter.maxSize === "number" && fileSize > filter.maxSize) {
    filter.onInvalid && filter.onInvalid(filename + " is too big");
    return false;
  }
  return true;
};

/**
 * @method contentTypeInList Is the content type string in the list?
 * @private
 * @param {String[]} list - Array of content types
 * @param {String} contentType - The content type
 * @returns {Boolean}
 *
 * Returns true if the content type is in the list, or if it matches
 * one of the special types in the list, e.g., "image/*".
 */
function contentTypeInList(list, contentType) {
  var listType, found = false;
  for (var i = 0, ln = list.length; i < ln; i++) {
    listType = list[i];
    if (listType === contentType) {
      found = true;
      break;
    }
    if (listType === "image/*" && contentType.indexOf("image/") === 0) {
      found = true;
      break;
    }
    if (listType === "audio/*" && contentType.indexOf("audio/") === 0) {
      found = true;
      break;
    }
    if (listType === "video/*" && contentType.indexOf("video/") === 0) {
      found = true;
      break;
    }
  }
  return found;
}
