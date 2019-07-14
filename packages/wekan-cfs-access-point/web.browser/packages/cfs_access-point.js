(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/cfs:access-point/access-point-common.js                                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
rootUrlPathPrefix = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || "";                                             // 1
// Adjust the rootUrlPathPrefix if necessary                                                                          // 2
if (rootUrlPathPrefix.length > 0) {                                                                                   // 3
  if (rootUrlPathPrefix.slice(0, 1) !== '/') {                                                                        // 4
    rootUrlPathPrefix = '/' + rootUrlPathPrefix;                                                                      // 5
  }                                                                                                                   // 6
  if (rootUrlPathPrefix.slice(-1) === '/') {                                                                          // 7
    rootUrlPathPrefix = rootUrlPathPrefix.slice(0, -1);                                                               // 8
  }                                                                                                                   // 9
}                                                                                                                     // 10
                                                                                                                      // 11
// prepend ROOT_URL when isCordova                                                                                    // 12
if (Meteor.isCordova) {                                                                                               // 13
  rootUrlPathPrefix = Meteor.absoluteUrl(rootUrlPathPrefix.replace(/^\/+/, '')).replace(/\/+$/, '');                  // 14
}                                                                                                                     // 15
                                                                                                                      // 16
baseUrl = '/cfs';                                                                                                     // 17
FS.HTTP = FS.HTTP || {};                                                                                              // 18
                                                                                                                      // 19
// Note the upload URL so that client uploader packages know what it is                                               // 20
FS.HTTP.uploadUrl = rootUrlPathPrefix + baseUrl + '/files';                                                           // 21
                                                                                                                      // 22
/**                                                                                                                   // 23
 * @method FS.HTTP.setBaseUrl                                                                                         // 24
 * @public                                                                                                            // 25
 * @param {String} newBaseUrl - Change the base URL for the HTTP GET and DELETE endpoints.                            // 26
 * @returns {undefined}                                                                                               // 27
 */                                                                                                                   // 28
FS.HTTP.setBaseUrl = function setBaseUrl(newBaseUrl) {                                                                // 29
                                                                                                                      // 30
  // Adjust the baseUrl if necessary                                                                                  // 31
  if (newBaseUrl.slice(0, 1) !== '/') {                                                                               // 32
    newBaseUrl = '/' + newBaseUrl;                                                                                    // 33
  }                                                                                                                   // 34
  if (newBaseUrl.slice(-1) === '/') {                                                                                 // 35
    newBaseUrl = newBaseUrl.slice(0, -1);                                                                             // 36
  }                                                                                                                   // 37
                                                                                                                      // 38
  // Update the base URL                                                                                              // 39
  baseUrl = newBaseUrl;                                                                                               // 40
                                                                                                                      // 41
  // Change the upload URL so that client uploader packages know what it is                                           // 42
  FS.HTTP.uploadUrl = rootUrlPathPrefix + baseUrl + '/files';                                                         // 43
                                                                                                                      // 44
  // Remount URLs with the new baseUrl, unmounting the old, on the server only.                                       // 45
  // If existingMountPoints is empty, then we haven't run the server startup                                          // 46
  // code yet, so this new URL will be used at that point for the initial mount.                                      // 47
  if (Meteor.isServer && !FS.Utility.isEmpty(_existingMountPoints)) {                                                 // 48
    mountUrls();                                                                                                      // 49
  }                                                                                                                   // 50
};                                                                                                                    // 51
                                                                                                                      // 52
/*                                                                                                                    // 53
 * FS.File extensions                                                                                                 // 54
 */                                                                                                                   // 55
                                                                                                                      // 56
/**                                                                                                                   // 57
 * @method FS.File.prototype.url Construct the file url                                                               // 58
 * @public                                                                                                            // 59
 * @param {Object} [options]                                                                                          // 60
 * @param {String} [options.store] Name of the store to get from. If not defined, the first store defined in `options.stores` for the collection on the client is used.
 * @param {Boolean} [options.auth=null] Add authentication token to the URL query string? By default, a token for the current logged in user is added on the client. Set this to `false` to omit the token. Set this to a string to provide your own token. Set this to a number to specify an expiration time for the token in seconds.
 * @param {Boolean} [options.download=false] Should headers be set to force a download? Typically this means that clicking the link with this URL will download the file to the user's Downloads folder instead of displaying the file in the browser.
 * @param {Boolean} [options.brokenIsFine=false] Return the URL even if we know it's currently a broken link because the file hasn't been saved in the requested store yet.
 * @param {Boolean} [options.metadata=false] Return the URL for the file metadata access point rather than the file itself.
 * @param {String} [options.uploading=null] A URL to return while the file is being uploaded.                         // 66
 * @param {String} [options.storing=null] A URL to return while the file is being stored.                             // 67
 * @param {String} [options.filename=null] Override the filename that should appear at the end of the URL. By default it is the name of the file in the requested store.
 *                                                                                                                    // 69
 * Returns the HTTP URL for getting the file or its metadata.                                                         // 70
 */                                                                                                                   // 71
FS.File.prototype.url = function(options) {                                                                           // 72
  var self = this;                                                                                                    // 73
  options = options || {};                                                                                            // 74
  options = FS.Utility.extend({                                                                                       // 75
    store: null,                                                                                                      // 76
    auth: null,                                                                                                       // 77
    download: false,                                                                                                  // 78
    metadata: false,                                                                                                  // 79
    brokenIsFine: false,                                                                                              // 80
    uploading: null, // return this URL while uploading                                                               // 81
    storing: null, // return this URL while storing                                                                   // 82
    filename: null // override the filename that is shown to the user                                                 // 83
  }, options.hash || options); // check for "hash" prop if called as helper                                           // 84
                                                                                                                      // 85
  // Primarily useful for displaying a temporary image while uploading an image                                       // 86
  if (options.uploading && !self.isUploaded()) {                                                                      // 87
    return options.uploading;                                                                                         // 88
  }                                                                                                                   // 89
                                                                                                                      // 90
  if (self.isMounted()) {                                                                                             // 91
    // See if we've stored in the requested store yet                                                                 // 92
    var storeName = options.store || self.collection.primaryStore.name;                                               // 93
    if (!self.hasStored(storeName)) {                                                                                 // 94
      if (options.storing) {                                                                                          // 95
        return options.storing;                                                                                       // 96
      } else if (!options.brokenIsFine) {                                                                             // 97
        // We want to return null if we know the URL will be a broken                                                 // 98
        // link because then we can avoid rendering broken links, broken                                              // 99
        // images, etc.                                                                                               // 100
        return null;                                                                                                  // 101
      }                                                                                                               // 102
    }                                                                                                                 // 103
                                                                                                                      // 104
    // Add filename to end of URL if we can determine one                                                             // 105
    var filename = options.filename || self.name({store: storeName});                                                 // 106
    if (typeof filename === "string" && filename.length) {                                                            // 107
      filename = '/' + filename;                                                                                      // 108
    } else {                                                                                                          // 109
      filename = '';                                                                                                  // 110
    }                                                                                                                 // 111
                                                                                                                      // 112
    // TODO: Could we somehow figure out if the collection requires login?                                            // 113
    var authToken = '';                                                                                               // 114
    if (Meteor.isClient && typeof Accounts !== "undefined" && typeof Accounts._storedLoginToken === "function") {     // 115
      if (options.auth !== false) {                                                                                   // 116
        // Add reactive deps on the user                                                                              // 117
        Meteor.userId();                                                                                              // 118
                                                                                                                      // 119
        var authObject = {                                                                                            // 120
          authToken: Accounts._storedLoginToken() || ''                                                               // 121
        };                                                                                                            // 122
                                                                                                                      // 123
        // If it's a number, we use that as the expiration time (in seconds)                                          // 124
        if (options.auth === +options.auth) {                                                                         // 125
          authObject.expiration = FS.HTTP.now() + options.auth * 1000;                                                // 126
        }                                                                                                             // 127
                                                                                                                      // 128
        // Set the authToken                                                                                          // 129
        var authString = JSON.stringify(authObject);                                                                  // 130
        authToken = FS.Utility.btoa(authString);                                                                      // 131
      }                                                                                                               // 132
    } else if (typeof options.auth === "string") {                                                                    // 133
      // If the user supplies auth token the user will be responsible for                                             // 134
      // updating                                                                                                     // 135
      authToken = options.auth;                                                                                       // 136
    }                                                                                                                 // 137
                                                                                                                      // 138
    // Construct query string                                                                                         // 139
    var params = {};                                                                                                  // 140
    if (authToken !== '') {                                                                                           // 141
      params.token = authToken;                                                                                       // 142
    }                                                                                                                 // 143
    if (options.download) {                                                                                           // 144
      params.download = true;                                                                                         // 145
    }                                                                                                                 // 146
    if (options.store) {                                                                                              // 147
      // We use options.store here instead of storeName because we want to omit the queryString                       // 148
      // whenever possible, allowing users to have "clean" URLs if they want. The server will                         // 149
      // assume the first store defined on the server, which means that we are assuming that                          // 150
      // the first on the client is also the first on the server. If that's not the case, the                         // 151
      // store option should be supplied.                                                                             // 152
      params.store = options.store;                                                                                   // 153
    }                                                                                                                 // 154
    var queryString = FS.Utility.encodeParams(params);                                                                // 155
    if (queryString.length) {                                                                                         // 156
      queryString = '?' + queryString;                                                                                // 157
    }                                                                                                                 // 158
                                                                                                                      // 159
    // Determine which URL to use                                                                                     // 160
    var area;                                                                                                         // 161
    if (options.metadata) {                                                                                           // 162
      area = '/record';                                                                                               // 163
    } else {                                                                                                          // 164
      area = '/files';                                                                                                // 165
    }                                                                                                                 // 166
                                                                                                                      // 167
    // Construct and return the http method url                                                                       // 168
    return rootUrlPathPrefix + baseUrl + area + '/' + self.collection.name + '/' + self._id + filename + queryString; // 169
  }                                                                                                                   // 170
                                                                                                                      // 171
};                                                                                                                    // 172
                                                                                                                      // 173
                                                                                                                      // 174
                                                                                                                      // 175
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/cfs:access-point/access-point-client.js                                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
FS.HTTP.setHeadersForGet = function setHeadersForGet() {                                                              // 1
  // Client Stub                                                                                                      // 2
};                                                                                                                    // 3
                                                                                                                      // 4
FS.HTTP.now = function() {                                                                                            // 5
  return new Date(new Date() + FS.HTTP._serverTimeDiff);                                                              // 6
};                                                                                                                    // 7
                                                                                                                      // 8
// Returns the localstorage if its found and working                                                                  // 9
// TODO: check if this works in IE                                                                                    // 10
// could use Meteor._localStorage - just needs a rewrite                                                              // 11
FS.HTTP._storage = function() {                                                                                       // 12
  var storage,                                                                                                        // 13
      fail,                                                                                                           // 14
      uid;                                                                                                            // 15
  try {                                                                                                               // 16
    uid = "test";                                                                                                     // 17
    (storage = window.localStorage).setItem(uid, uid);                                                                // 18
    fail = (storage.getItem(uid) !== uid);                                                                            // 19
    storage.removeItem(uid);                                                                                          // 20
    if (fail) {                                                                                                       // 21
      storage = false;                                                                                                // 22
    }                                                                                                                 // 23
  } catch(e) {                                                                                                        // 24
    console.log("Error initializing storage for FS.HTTP");                                                            // 25
    console.log(e);                                                                                                   // 26
  }                                                                                                                   // 27
                                                                                                                      // 28
  return storage;                                                                                                     // 29
};                                                                                                                    // 30
                                                                                                                      // 31
// get our storage if found                                                                                           // 32
FS.HTTP.storage = FS.HTTP._storage();                                                                                 // 33
                                                                                                                      // 34
FS.HTTP._prefix = 'fsHTTP.';                                                                                          // 35
                                                                                                                      // 36
FS.HTTP._serverTimeDiff = 0; // Time difference in ms                                                                 // 37
                                                                                                                      // 38
if (FS.HTTP.storage) {                                                                                                // 39
  // Initialize the FS.HTTP._serverTimeDiff                                                                           // 40
  FS.HTTP._serverTimeDiff = (1*FS.HTTP.storage.getItem(FS.HTTP._prefix+'timeDiff')) || 0;                             // 41
  // At client startup we figure out the time difference between server and                                           // 42
  // client time - this includes lag and timezone                                                                     // 43
  Meteor.startup(function() {                                                                                         // 44
    // Call the server method an get server time                                                                      // 45
    HTTP.get(rootUrlPathPrefix + '/cfs/servertime', function(error, result) {                                         // 46
      if (!error) {                                                                                                   // 47
        // Update our server time diff                                                                                // 48
        var dateNew = new Date(+result.content);                                                                      // 49
        FS.HTTP._serverTimeDiff = dateNew - new Date();// - lag or/and timezone                                       // 50
        // Update the localstorage                                                                                    // 51
        FS.HTTP.storage.setItem(FS.HTTP._prefix + 'timeDiff', FS.HTTP._serverTimeDiff);                               // 52
      } else {                                                                                                        // 53
      	console.log(error.message);                                                                                    // 54
      }                                                                                                               // 55
    }); // EO Server call                                                                                             // 56
  });                                                                                                                 // 57
}                                                                                                                     // 58
                                                                                                                      // 59
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);
