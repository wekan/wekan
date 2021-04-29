rootUrlPathPrefix = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || "";
// Adjust the rootUrlPathPrefix if necessary
if (rootUrlPathPrefix.length > 0) {
  if (rootUrlPathPrefix.slice(0, 1) !== '/') {
    rootUrlPathPrefix = '/' + rootUrlPathPrefix;
  }
  if (rootUrlPathPrefix.slice(-1) === '/') {
    rootUrlPathPrefix = rootUrlPathPrefix.slice(0, -1);
  }
}

// prepend ROOT_URL when isCordova
if (Meteor.isCordova) {
  rootUrlPathPrefix = Meteor.absoluteUrl(rootUrlPathPrefix.replace(/^\/+/, '')).replace(/\/+$/, '');
}

baseUrl = '/cfs';
FS.HTTP = FS.HTTP || {};

// Note the upload URL so that client uploader packages know what it is
FS.HTTP.uploadUrl = rootUrlPathPrefix + baseUrl + '/files';

/**
 * @method FS.HTTP.setBaseUrl
 * @public
 * @param {String} newBaseUrl - Change the base URL for the HTTP GET and DELETE endpoints.
 * @returns {undefined}
 */
FS.HTTP.setBaseUrl = function setBaseUrl(newBaseUrl) {

  // Adjust the baseUrl if necessary
  if (newBaseUrl.slice(0, 1) !== '/') {
    newBaseUrl = '/' + newBaseUrl;
  }
  if (newBaseUrl.slice(-1) === '/') {
    newBaseUrl = newBaseUrl.slice(0, -1);
  }

  // Update the base URL
  baseUrl = newBaseUrl;

  // Change the upload URL so that client uploader packages know what it is
  FS.HTTP.uploadUrl = rootUrlPathPrefix + baseUrl + '/files';

  // Remount URLs with the new baseUrl, unmounting the old, on the server only.
  // If existingMountPoints is empty, then we haven't run the server startup
  // code yet, so this new URL will be used at that point for the initial mount.
  if (Meteor.isServer && !FS.Utility.isEmpty(_existingMountPoints)) {
    mountUrls();
  }
};

/*
 * FS.File extensions
 */

/**
 * @method FS.File.prototype.urlRelative Construct the file url
 * @public
 * @param {Object} [options]
 * @param {String} [options.store] Name of the store to get from. If not defined, the first store defined in `options.stores` for the collection on the client is used.
 * @param {Boolean} [options.auth=null] Add authentication token to the URL query string? By default, a token for the current logged in user is added on the client. Set this to `false` to omit the token. Set this to a string to provide your own token. Set this to a number to specify an expiration time for the token in seconds.
 * @param {Boolean} [options.download=false] Should headers be set to force a download? Typically this means that clicking the link with this URL will download the file to the user's Downloads folder instead of displaying the file in the browser.
 * @param {Boolean} [options.brokenIsFine=false] Return the URL even if we know it's currently a broken link because the file hasn't been saved in the requested store yet.
 * @param {Boolean} [options.returnWhenStored=false] Flag relevant only on server, Return the URL only when file has been saved to the requested store.
 * @param {Boolean} [options.metadata=false] Return the URL for the file metadata access point rather than the file itself.
 * @param {String} [options.uploading=null] A URL to return while the file is being uploaded.
 * @param {String} [options.storing=null] A URL to return while the file is being stored.
 * @param {String} [options.filename=null] Override the filename that should appear at the end of the URL. By default it is the name of the file in the requested store.
 *
 * Returns the relative HTTP URL for getting the file or its metadata.
 */
FS.File.prototype.urlRelative = function(options) {
  var self = this;
  options = options || {};
  options = FS.Utility.extend({
    store: null,
    auth: null,
    download: false,
    metadata: false,
    brokenIsFine: false,
    returnWhenStored: false,
    uploading: null, // return this URL while uploading
    storing: null, // return this URL while storing
    filename: null // override the filename that is shown to the user
  }, options.hash || options); // check for "hash" prop if called as helper

  // Primarily useful for displaying a temporary image while uploading an image
  if (options.uploading && !self.isUploaded()) {
    return options.uploading;
  }

  if (self.isMounted()) {
    // See if we've stored in the requested store yet
    var storeName = options.store || self.collection.primaryStore.name;
    if (!self.hasStored(storeName)) {
      if (options.storing) {
        return options.storing;
      } else if (!options.brokenIsFine) {
        // In case we want to get back the url only when he is stored
        if (Meteor.isServer && options.returnWhenStored) {
          // Wait till file is stored to storeName
          self.onStored(storeName);
        } else {
          // We want to return null if we know the URL will be a broken
          // link because then we can avoid rendering broken links, broken
          // images, etc.
          return null;
        }
      }
    }

    // Add filename to end of URL if we can determine one
    var filename = options.filename || self.name({store: storeName});
    if (typeof filename === "string" && filename.length) {
      filename = '/' + filename;
    } else {
      filename = '';
    }

    // TODO: Could we somehow figure out if the collection requires login?
    var authToken = '';
    if (Meteor.isClient && typeof Accounts !== "undefined" && typeof Accounts._storedLoginToken === "function") {
      if (options.auth !== false) {
        // Add reactive deps on the user
        Meteor.userId();

        var authObject = {
          authToken: Accounts._storedLoginToken() || ''
        };

        // If it's a number, we use that as the expiration time (in seconds)
        if (options.auth === +options.auth) {
          authObject.expiration = FS.HTTP.now() + options.auth * 1000;
        }

        // Set the authToken
        var authString = JSON.stringify(authObject);
        authToken = FS.Utility.btoa(authString);
      }
    } else if (typeof options.auth === "string") {
      // If the user supplies auth token the user will be responsible for
      // updating
      authToken = options.auth;
    }

    // Construct query string
    var params = {};
    if (authToken !== '') {
      params.token = authToken;
    }
    if (options.download) {
      params.download = true;
    }
    if (options.store) {
      // We use options.store here instead of storeName because we want to omit the queryString
      // whenever possible, allowing users to have "clean" URLs if they want. The server will
      // assume the first store defined on the server, which means that we are assuming that
      // the first on the client is also the first on the server. If that's not the case, the
      // store option should be supplied.
      params.store = options.store;
    }
    var queryString = FS.Utility.encodeParams(params);
    if (queryString.length) {
      queryString = '?' + queryString;
    }

    // Determine which URL to use
    var area;
    if (options.metadata) {
      area = '/record';
    } else {
      area = '/files';
    }

    // Construct and return the http method url
    return baseUrl + area + '/' + self.collection.name + '/' + self._id + filename + queryString;
  }
};

/**
 * @method FS.File.prototype.url Construct the file url
 * @public
 * @param {Object} [options]
 * @param {String} [options.store] Name of the store to get from. If not defined, the first store defined in `options.stores` for the collection on the client is used.
 * @param {Boolean} [options.auth=null] Add authentication token to the URL query string? By default, a token for the current logged in user is added on the client. Set this to `false` to omit the token. Set this to a string to provide your own token. Set this to a number to specify an expiration time for the token in seconds.
 * @param {Boolean} [options.download=false] Should headers be set to force a download? Typically this means that clicking the link with this URL will download the file to the user's Downloads folder instead of displaying the file in the browser.
 * @param {Boolean} [options.brokenIsFine=false] Return the URL even if we know it's currently a broken link because the file hasn't been saved in the requested store yet.
 * @param {Boolean} [options.metadata=false] Return the URL for the file metadata access point rather than the file itself.
 * @param {String} [options.uploading=null] A URL to return while the file is being uploaded.
 * @param {String} [options.storing=null] A URL to return while the file is being stored.
 * @param {String} [options.filename=null] Override the filename that should appear at the end of the URL. By default it is the name of the file in the requested store.
 *
 * Returns the HTTP URL for getting the file or its metadata.
 */
FS.File.prototype.url = function(options) {
  self = this;
  return  rootUrlPathPrefix + self.urlRelative(options);
};