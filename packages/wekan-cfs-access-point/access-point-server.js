var path = Npm.require("path");

HTTP.publishFormats({
  fileRecordFormat: function (input) {
    // Set the method scope content type to json
    this.setContentType('application/json');
    if (FS.Utility.isArray(input)) {
      return EJSON.stringify(FS.Utility.map(input, function (obj) {
        return FS.Utility.cloneFileRecord(obj);
      }));
    } else {
      return EJSON.stringify(FS.Utility.cloneFileRecord(input));
    }
  }
});

/**
 * @method FS.HTTP.setHeadersForGet
 * @public
 * @param {Array} headers - List of headers, where each is a two-item array in which item 1 is the header name and item 2 is the header value.
 * @param {Array|String} [collections] - Which collections the headers should be added for. Omit this argument to add the header for all collections.
 * @returns {undefined}
 */
FS.HTTP.setHeadersForGet = function setHeadersForGet(headers, collections) {
  if (typeof collections === "string") {
    collections = [collections];
  }
  if (collections) {
    FS.Utility.each(collections, function(collectionName) {
      getHeadersByCollection[collectionName] = headers || [];
    });
  } else {
    getHeaders = headers || [];
  }
};

/**
 * @method FS.HTTP.publish
 * @public
 * @param {FS.Collection} collection
 * @param {Function} func - Publish function that returns a cursor.
 * @returns {undefined}
 *
 * Publishes all documents returned by the cursor at a GET URL
 * with the format baseUrl/record/collectionName. The publish
 * function `this` is similar to normal `Meteor.publish`.
 */
FS.HTTP.publish = function fsHttpPublish(collection, func) {
  var name = baseUrl + '/record/' + collection.name;
  // Mount collection listing URL using http-publish package
  HTTP.publish({
    name: name,
    defaultFormat: 'fileRecordFormat',
    collection: collection,
    collectionGet: true,
    collectionPost: false,
    documentGet: true,
    documentPut: false,
    documentDelete: false
  }, func);

  FS.debug && console.log("Registered HTTP method GET URLs:\n\n" + name + '\n' + name + '/:id\n');
};

/**
 * @method FS.HTTP.unpublish
 * @public
 * @param {FS.Collection} collection
 * @returns {undefined}
 *
 * Unpublishes a restpoint created by a call to `FS.HTTP.publish`
 */
FS.HTTP.unpublish = function fsHttpUnpublish(collection) {
  // Mount collection listing URL using http-publish package
  HTTP.unpublish(baseUrl + '/record/' + collection.name);
};

_existingMountPoints = {};

/**
 * @method defaultSelectorFunction
 * @private
 * @returns { collection, file }
 *
 * This is the default selector function
 */
var defaultSelectorFunction = function() {
  var self = this;
  // Selector function
  //
  // This function will have to return the collection and the
  // file. If file not found undefined is returned - if null is returned the
  // search was not possible
  var opts = FS.Utility.extend({}, self.query || {}, self.params || {});

  // Get the collection name from the url
  var collectionName = opts.collectionName;

  // Get the id from the url
  var id = opts.id;

  // Get the collection
  var collection = FS._collections[collectionName];

  //if Mongo ObjectIds are used, then we need to use that in find statement
  if(collection.options.idGeneration && collection.options.idGeneration === 'MONGO') {
    // Get the file if possible else return null
    var file = (id && collection)? collection.findOne({ _id: new Meteor.Collection.ObjectID(id)}): null;
  } else {
    var file = (id && collection)? collection.findOne({ _id: id }): null;
  }


  // Return the collection and the file
  return {
    collection: collection,
    file: file,
    storeName: opts.store,
    download: opts.download,
    filename: opts.filename
  };
};

/*
 * @method FS.HTTP.mount
 * @public
 * @param {array of string} mountPoints mount points to map rest functinality on
 * @param {function} selector_f [selector] function returns `{ collection, file }` for mount points to work with
 *
*/
FS.HTTP.mount = function(mountPoints, selector_f) {
  // We take mount points as an array and we get a selector function
  var selectorFunction = selector_f || defaultSelectorFunction;

  var accessPoint = {
    'stream': true,
    'auth': expirationAuth,
    'post': function(data) {
      // Use the selector for finding the collection and file reference
      var ref = selectorFunction.call(this);

      // We dont support post - this would be normal insert eg. of filerecord?
      throw new Meteor.Error(501, "Not implemented", "Post is not supported");
    },
    'put': function(data) {
      // Use the selector for finding the collection and file reference
      var ref = selectorFunction.call(this);

      // Make sure we have a collection reference
      if (!ref.collection)
        throw new Meteor.Error(404, "Not Found", "No collection found");

      // Make sure we have a file reference
      if (ref.file === null) {
        // No id supplied so we will create a new FS.File instance and
        // insert the supplied data.
        return FS.HTTP.Handlers.PutInsert.apply(this, [ref]);
      } else {
        if (ref.file) {
          return FS.HTTP.Handlers.PutUpdate.apply(this, [ref]);
        } else {
          throw new Meteor.Error(404, "Not Found", 'No file found');
        }
      }
    },
    'get': function(data) {
      // Use the selector for finding the collection and file reference
      var ref = selectorFunction.call(this);

      // Make sure we have a collection reference
      if (!ref.collection)
        throw new Meteor.Error(404, "Not Found", "No collection found");

      // Make sure we have a file reference
      if (ref.file === null) {
        // No id supplied so we will return the published list of files ala
        // http.publish in json format
        return FS.HTTP.Handlers.GetList.apply(this, [ref]);
      } else {
        if (ref.file) {
          return FS.HTTP.Handlers.Get.apply(this, [ref]);
        } else {
          throw new Meteor.Error(404, "Not Found", 'No file found');
        }
      }
    },
    'delete': function(data) {
      // Use the selector for finding the collection and file reference
      var ref = selectorFunction.call(this);

      // Make sure we have a collection reference
      if (!ref.collection)
        throw new Meteor.Error(404, "Not Found", "No collection found");

      // Make sure we have a file reference
      if (ref.file) {
        return FS.HTTP.Handlers.Del.apply(this, [ref]);
      } else {
        throw new Meteor.Error(404, "Not Found", 'No file found');
      }
    }
  };

  var accessPoints = {};

  // Add debug message
  FS.debug && console.log('Registered HTTP method URLs:');

  FS.Utility.each(mountPoints, function(mountPoint) {
    // Couple mountpoint and accesspoint
    accessPoints[mountPoint] = accessPoint;
    // Remember our mountpoints
    _existingMountPoints[mountPoint] = mountPoint;
    // Add debug message
    FS.debug && console.log(mountPoint);
  });

  // XXX: HTTP:methods should unmount existing mounts in case of overwriting?
  HTTP.methods(accessPoints);

};

/**
 * @method FS.HTTP.unmount
 * @public
 * @param {string | array of string} [mountPoints] Optional, if not specified all mountpoints are unmounted
 *
 */
FS.HTTP.unmount = function(mountPoints) {
  // The mountPoints is optional, can be string or array if undefined then
  // _existingMountPoints will be used
  var unmountList;
  // Container for the mount points to unmount
  var unmountPoints = {};

  if (typeof mountPoints === 'undefined') {
    // Use existing mount points - unmount all
    unmountList = _existingMountPoints;
  } else if (mountPoints === ''+mountPoints) {
    // Got a string
    unmountList = [mountPoints];
  } else if (mountPoints.length) {
    // Got an array
    unmountList = mountPoints;
  }

  // If we have a list to unmount
  if (unmountList) {
    // Iterate over each item
    FS.Utility.each(unmountList, function(mountPoint) {
      // Check _existingMountPoints to make sure the mount point exists in our
      // context / was created by the FS.HTTP.mount
      if (_existingMountPoints[mountPoint]) {
        // Mark as unmount
        unmountPoints[mountPoint] = false;
        // Release
        delete _existingMountPoints[mountPoint];
      }
    });
    FS.debug && console.log('FS.HTTP.unmount:');
    FS.debug && console.log(unmountPoints);
    // Complete unmount
    HTTP.methods(unmountPoints);
  }
};

// ### FS.Collection maps on HTTP pr. default on the following restpoints:
// *
//    baseUrl + '/files/:collectionName/:id/:filename',
//    baseUrl + '/files/:collectionName/:id',
//    baseUrl + '/files/:collectionName'
//
// Change/ replace the existing mount point by:
// ```js
//   // unmount all existing
//   FS.HTTP.unmount();
//   // Create new mount point
//   FS.HTTP.mount([
//    '/cfs/files/:collectionName/:id/:filename',
//    '/cfs/files/:collectionName/:id',
//    '/cfs/files/:collectionName'
//  ]);
//  ```
//
mountUrls = function mountUrls() {
  // We unmount first in case we are calling this a second time
  FS.HTTP.unmount();

  FS.HTTP.mount([
    baseUrl + '/files/:collectionName/:id/:filename',
    baseUrl + '/files/:collectionName/:id',
    baseUrl + '/files/:collectionName'
  ]);
};

// Returns the userId from URL token
var expirationAuth = function expirationAuth() {
  var self = this;

  // Read the token from '/hello?token=base64'
  var encodedToken = self.query.token;

  FS.debug && console.log("token: "+encodedToken);

  if (!encodedToken || !Meteor.users) return false;

  // Check the userToken before adding it to the db query
  // Set the this.userId
  var tokenString = FS.Utility.atob(encodedToken);

  var tokenObject;
  try {
    tokenObject = JSON.parse(tokenString);
  } catch(err) {
    throw new Meteor.Error(400, 'Bad Request');
  }

  // XXX: Do some check here of the object
  var userToken = tokenObject.authToken;
  if (userToken !== ''+userToken) {
    throw new Meteor.Error(400, 'Bad Request');
  }

  // If we have an expiration token we should check that it's still valid
  if (tokenObject.expiration != null) {
    // check if its too old
    var now = Date.now();
    if (tokenObject.expiration < now) {
      FS.debug && console.log('Expired token: ' + tokenObject.expiration + ' is less than ' + now);
      throw new Meteor.Error(500, 'Expired token');
    }
  }

  // We are not on a secure line - so we have to look up the user...
  var user = Meteor.users.findOne({
    $or: [
      {'services.resume.loginTokens.hashedToken': Accounts._hashLoginToken(userToken)},
      {'services.resume.loginTokens.token': userToken}
    ]
  });

  // Set the userId in the scope
  return user && user._id;
};

HTTP.methods(
  {'/cfs/servertime': {
    get: function(data) {
      return Date.now().toString();
    }
  }
});

// Unify client / server api
FS.HTTP.now = function() {
  return Date.now();
};

// Start up the basic mount points
Meteor.startup(function () {
  mountUrls();
});
