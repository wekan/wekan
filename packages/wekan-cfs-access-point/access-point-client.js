FS.HTTP.setHeadersForGet = function setHeadersForGet() {
  // Client Stub
};

FS.HTTP.now = function() {
  return new Date(new Date() + FS.HTTP._serverTimeDiff);
};

// Returns the localstorage if its found and working
// TODO: check if this works in IE
// could use Meteor._localStorage - just needs a rewrite
FS.HTTP._storage = function() {
  var storage,
      fail,
      uid;
  try {
    uid = "test";
    (storage = window.localStorage).setItem(uid, uid);
    fail = (storage.getItem(uid) !== uid);
    storage.removeItem(uid);
    if (fail) {
      storage = false;
    }
  } catch(e) {
    console.log("Error initializing storage for FS.HTTP");
    console.log(e);
  }

  return storage;
};

// get our storage if found
FS.HTTP.storage = FS.HTTP._storage();

FS.HTTP._prefix = 'fsHTTP.';

FS.HTTP._serverTimeDiff = 0; // Time difference in ms

if (FS.HTTP.storage) {
  // Initialize the FS.HTTP._serverTimeDiff
  FS.HTTP._serverTimeDiff = (1*FS.HTTP.storage.getItem(FS.HTTP._prefix+'timeDiff')) || 0;
  // At client startup we figure out the time difference between server and
  // client time - this includes lag and timezone
  Meteor.startup(function() {
    // Call the server method an get server time
    HTTP.get(rootUrlPathPrefix + '/cfs/servertime', function(error, result) {
      if (!error) {
        // Update our server time diff
        var dateNew = new Date(+result.content);
        FS.HTTP._serverTimeDiff = dateNew - new Date();// - lag or/and timezone
        // Update the localstorage
        FS.HTTP.storage.setItem(FS.HTTP._prefix + 'timeDiff', FS.HTTP._serverTimeDiff);
      } else {
      	console.log(error.message);
      }
    }); // EO Server call
  });
}
