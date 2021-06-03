
//XXX not sure this is still working properly?
FS.Utility.connectionLogin = function(connection) {
  // We check if the accounts package is installed, since we depend on
  // `Meteor.userId()`
  if (typeof Accounts !== 'undefined') {
    // Monitor logout from main connection
    Meteor.startup(function() {
      Tracker.autorun(function() {
        var userId = Meteor.userId();
        if (userId) {
          connection.onReconnect = function() {
            var token = Accounts._storedLoginToken();
            connection.apply('login', [{resume: token}], function(err, result) {
              if (!err && result) {
                connection.setUserId(result.id);
              }
            });
          };
        } else {
          connection.onReconnect = null;
          connection.setUserId(null);
        }
      });
    });

  }
};

/**
 * @method FS.Utility.eachFile
 * @public
 * @param {Event} e - Browser event
 * @param {Function} f - Function to run for each file found in the event.
 * @returns {undefined}
 * 
 * Utility for iteration over files in event
 */
FS.Utility.eachFile = function(e, f) {
  var evt = (e.originalEvent || e);

  var files = evt.target.files;

  if (!files || files.length === 0) {
    files = evt.dataTransfer ? evt.dataTransfer.files : [];
  }

  for (var i = 0; i < files.length; i++) {
    f(files[i], i);
  }
};
