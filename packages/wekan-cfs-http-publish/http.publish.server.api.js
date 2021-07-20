/*

GET /note
GET /note/:id
POST /note
PUT /note/:id
DELETE /note/:id

*/

// Could be cool if we could serve some api doc or even an api script
// user could do <script href="/note/api?token=1&user=2"></script> and be served
// a client-side javascript api?
// Eg.
// HTTP.api.note.create();
// HTTP.api.login(username, password);
// HTTP.api.logout


_publishHTTP = {};

// Cache the names of all http methods we've published
_publishHTTP.currentlyPublished = [];

var defaultAPIPrefix = '/api/';

/**
 * @method _publishHTTP.getPublishScope
 * @private
 * @param {Object} scope
 * @returns {httpPublishGetPublishScope.publishScope}
 * 
 * Creates a nice scope for the publish method
 */
_publishHTTP.getPublishScope = function httpPublishGetPublishScope(scope) {
  var publishScope = {};
  publishScope.userId = scope.userId;
  publishScope.params = scope.params;
  publishScope.query = scope.query;
  // TODO: Additional scoping
  // publishScope.added
  // publishScope.ready
  return publishScope;
};

_publishHTTP.formatHandlers = {};

/**
 * @method _publishHTTP.formatHandlers.json
 * @private
 * @param {Object} result - The result object
 * @returns {String} JSON
 * 
 * Formats the output into JSON and sets the appropriate content type on `this`
 */
_publishHTTP.formatHandlers.json = function httpPublishJSONFormatHandler(result) {
  // Set the method scope content type to json
  this.setContentType('application/json');
  // Return EJSON string
  return EJSON.stringify(result);
};

/**
 * @method _publishHTTP.formatResult
 * @private
 * @param {Object} result - The result object
 * @param {Object} scope
 * @param {String} [defaultFormat='json'] - Default format to use if format is not in query string.
 * @returns {Any} The formatted result
 * 
 * Formats the result into the format selected by querystring eg. "&format=json"
 */
_publishHTTP.formatResult = function httpPublishFormatResult(result, scope, defaultFormat) {

  // Get the format in lower case and default to json
  var format = scope && scope.query && scope.query.format || defaultFormat || 'json';

  // Set the format handler found
  var formatHandlerFound = !!(typeof _publishHTTP.formatHandlers[format] === 'function');

  // Set the format handler and fallback to default json if handler not found
  var formatHandler = _publishHTTP.formatHandlers[(formatHandlerFound) ? format : 'json'];

  // Check if format handler is a function
  if (typeof formatHandler !== 'function') {
    // We break things the user could have overwritten the default json handler
    throw new Error('The default json format handler not found');
  }

  if (!formatHandlerFound) {
    scope.setStatusCode(500);
    return '{"error":"Format handler for: `' + format + '` not found"}';
  }

  // Execute the format handler
  try {
    return formatHandler.apply(scope, [result]);
  } catch(err) {
    scope.setStatusCode(500);
    return '{"error":"Format handler for: `' + format + '` Error: ' + err.message + '"}';
  }
};

/**
 * @method _publishHTTP.error
 * @private
 * @param {String} statusCode - The status code
 * @param {String} message - The message
 * @param {Object} scope
 * @returns {Any} The formatted result
 * 
 * Responds with error message in the expected format
 */
_publishHTTP.error = function httpPublishError(statusCode, message, scope) {
  var result = _publishHTTP.formatResult(message, scope);
  scope.setStatusCode(statusCode);
  return result;
};

/**
 * @method _publishHTTP.getMethodHandler
 * @private
 * @param {Meteor.Collection} collection - The Meteor.Collection instance
 * @param {String} methodName - The method name
 * @returns {Function} The server method
 * 
 * Returns the DDP connection handler, already setup and secured
 */
_publishHTTP.getMethodHandler = function httpPublishGetMethodHandler(collection, methodName) {
  if (collection instanceof Meteor.Collection) {
    if (collection._connection && collection._connection.method_handlers) {
      return collection._connection.method_handlers[collection._prefix + methodName];
    } else {
      throw new Error('HTTP publish does not work with current version of Meteor');
    }
  } else {
    throw new Error('_publishHTTP.getMethodHandler expected a collection');
  }
};

/**
 * @method _publishHTTP.unpublishList
 * @private
 * @param {Array} names - List of method names to unpublish
 * @returns {undefined}
 * 
 * Unpublishes all HTTP methods that have names matching the given list.
 */
_publishHTTP.unpublishList = function httpPublishUnpublishList(names) {
  if (!names.length) {
    return;
  }
  
  // Carry object for methods
  var methods = {};

  // Unpublish the rest points by setting them to false
  for (var i = 0, ln = names.length; i < ln; i++) {
    methods[names[i]] = false;
  }

  HTTP.methods(methods);
  
  // Remove the names from our list of currently published methods
  _publishHTTP.currentlyPublished = _.difference(_publishHTTP.currentlyPublished, names);
};

/**
 * @method _publishHTTP.unpublish
 * @private
 * @param {String|Meteor.Collection} [name] - The method name or collection
 * @returns {undefined}
 * 
 * Unpublishes all HTTP methods that were published with the given name or 
 * for the given collection. Call with no arguments to unpublish all.
 */
_publishHTTP.unpublish = function httpPublishUnpublish(/* name or collection, options */) {
  
  // Determine what method name we're unpublishing
  var name = (arguments[0] instanceof Meteor.Collection) ?
          defaultAPIPrefix + arguments[0]._name : arguments[0];
          
  // Unpublish name and name/id
  if (name && name.length) {
    _publishHTTP.unpublishList([name, name + '/:id']);
  } 
  
  // If no args, unpublish all
  else {
    _publishHTTP.unpublishList(_publishHTTP.currentlyPublished);
  }
  
};

/**
 * @method HTTP.publishFormats
 * @public
 * @param {Object} newHandlers
 * @returns {undefined}
 * 
 * Add publish formats. Example:
 ```js
 HTTP.publishFormats({

    json: function(inputObject) {
      // Set the method scope content type to json
      this.setContentType('application/json');
      // Return EJSON string
      return EJSON.stringify(inputObject);
    }

  });
 ```
 */
HTTP.publishFormats = function httpPublishFormats(newHandlers) {
  _.extend(_publishHTTP.formatHandlers, newHandlers);
};

/**
 * @method HTTP.publish
 * @public
 * @param {Object} options
 * @param {String} [name] - Restpoint name (url prefix). Optional if `collection` is passed. Will mount on `/api/collectionName` by default.
 * @param {Meteor.Collection} [collection] - Meteor.Collection instance. Required for all restpoints except collectionGet
 * @param {String} [options.defaultFormat='json'] - Format to use for responses when `format` is not found in the query string.
 * @param {String} [options.collectionGet=true] - Add GET restpoint for collection? Requires a publish function.
 * @param {String} [options.collectionPost=true] - Add POST restpoint for adding documents to the collection?
 * @param {String} [options.documentGet=true] - Add GET restpoint for documents in collection? Requires a publish function.
 * @param {String} [options.documentPut=true] - Add PUT restpoint for updating a document in the collection?
 * @param {String} [options.documentDelete=true] - Add DELETE restpoint for deleting a document in the collection?
 * @param {Function} [publishFunc] - A publish function. Required to mount GET restpoints.
 * @returns {undefined}
 * @todo this should use options argument instead of optional args
 * 
 * Publishes one or more restpoints, mounted on "name" ("/api/collectionName/"
 * by default). The GET restpoints are subscribed to the document set (cursor)
 * returned by the publish function you supply. The other restpoints forward
 * requests to Meteor's built-in DDP methods (insert, update, remove), meaning
 * that full allow/deny security is automatic.
 * 
 * __Usage:__
 * 
 * Publish only:
 * 
 * HTTP.publish({name: 'mypublish'}, publishFunc);
 * 
 * Publish and mount crud rest point for collection /api/myCollection:
 * 
 * HTTP.publish({collection: myCollection}, publishFunc);
 * 
 * Mount CUD rest point for collection and documents without GET:
 * 
 * HTTP.publish({collection: myCollection});
 * 
 */
HTTP.publish = function httpPublish(options, publishFunc) {
  options = _.extend({
    name: null,
    auth: null,
    collection: null,
    defaultFormat: null,
    collectionGet: true,
    collectionPost: true,
    documentGet: true,
    documentPut: true,
    documentDelete: true
  }, options || {});
  
  var collection = options.collection;
  
  // Use provided name or build one
  var name = (typeof options.name === "string") ? options.name : defaultAPIPrefix + collection._name;

  // Make sure we have a name
  if (typeof name !== "string") {
    throw new Error('HTTP.publish expected a collection or name option');
  }
  
  var defaultFormat = options.defaultFormat;

  // Rig the methods for the CRUD interface
  var methods = {};

  // console.log('HTTP restpoint: ' + name);

  // list and create
  methods[name] = {};

  if (options.collectionGet && publishFunc) {
    // Return the published documents
    methods[name].get = function(data) {
      // Format the scope for the publish method
      var publishScope = _publishHTTP.getPublishScope(this);
      // Get the publish cursor
      var cursor = publishFunc.apply(publishScope, [data]);

      // Check if its a cursor
      if (cursor && cursor.fetch) {
        // Fetch the data fron cursor
        var result = cursor.fetch();
        // Return the data
        return _publishHTTP.formatResult(result, this, defaultFormat);
      } else {
        // We didnt get any
        return _publishHTTP.error(200, [], this);
      }
    };
  }

  if (collection) {
    // If we have a collection then add insert method
    if (options.collectionPost) {
      methods[name].post = function(data) {
        var insertMethodHandler = _publishHTTP.getMethodHandler(collection, 'insert');
        // Make sure that _id isset else create a Meteor id
        data._id = data._id || Random.id();
        // Create the document
        try {
          // We should be passed a document in data
          insertMethodHandler.apply(this, [data]);
          // Return the data
          return _publishHTTP.formatResult({ _id: data._id }, this, defaultFormat);
        } catch(err) {
          // This would be a Meteor.error?
          return _publishHTTP.error(err.error, { error: err.message }, this);
        }
      };
    }

    // We also add the findOne, update and remove methods
    methods[name + '/:id'] = {};
    
    if (options.documentGet && publishFunc) {
      // We have to have a publish method inorder to publish id? The user could
      // just write a publish all if needed - better to make this explicit
      methods[name + '/:id'].get = function(data) {
        // Get the mongoId
        var mongoId = this.params.id;

        // We would allways expect a string but it could be empty
        if (mongoId !== '') {

          // Format the scope for the publish method
          var publishScope = _publishHTTP.getPublishScope(this);

          // Get the publish cursor
          var cursor = publishFunc.apply(publishScope, [data]);

          // Result will contain the document if found
          var result;

          // Check to see if document is in published cursor
          if (cursor) {
            cursor.forEach(function(doc) {
              if (!result) {
                if (doc._id === mongoId) {
                  result = doc;
                }
              }
            });
          }

          // If the document is found the return
          if (result) {
            return _publishHTTP.formatResult(result, this, defaultFormat);
          } else {
            // We do a check to see if the doc id exists
            var exists = collection.findOne({ _id: mongoId });
            // If it exists its not published to the user
            if (exists) {
              // Unauthorized
              return _publishHTTP.error(401, { error: 'Unauthorized' }, this);
            } else {
              // Not found
              return _publishHTTP.error(404, { error: 'Document with id ' + mongoId + ' not found' }, this);
            }
          }

        } else {
          return _publishHTTP.error(400, { error: 'Method expected a document id' }, this);
        }
      };
    }

    if (options.documentPut) {
      methods[name + '/:id'].put = function(data) {
        // Get the mongoId
        var mongoId = this.params.id;

        // We would allways expect a string but it could be empty
        if (mongoId !== '') {

          var updateMethodHandler = _publishHTTP.getMethodHandler(collection, 'update');
          // Create the document
          try {
            // We should be passed a document in data
            updateMethodHandler.apply(this, [{ _id: mongoId }, data]);
            // Return the data
            return _publishHTTP.formatResult({ _id: mongoId }, this, defaultFormat);
          } catch(err) {
            // This would be a Meteor.error?
            return _publishHTTP.error(err.error, { error: err.message }, this);
          }

        } else {
          return _publishHTTP.error(400, { error: 'Method expected a document id' }, this);
        }      
      };
    }

    if (options.documentDelete) {
      methods[name + '/:id'].delete = function(data) {
         // Get the mongoId
        var mongoId = this.params.id;

        // We would allways expect a string but it could be empty
        if (mongoId !== '') {

          var removeMethodHandler = _publishHTTP.getMethodHandler(collection, 'remove');
          // Create the document
          try {
            // We should be passed a document in data
            removeMethodHandler.apply(this, [{ _id: mongoId }]);
            // Return the data
            return _publishHTTP.formatResult({ _id: mongoId }, this, defaultFormat);
          } catch(err) {
            // This would be a Meteor.error?
            return _publishHTTP.error(err.error, { error: err.message }, this);
          }

        } else {
          return _publishHTTP.error(400, { error: 'Method expected a document id' }, this);
        }     
      };
    }

  }

  // Authenticate with our own auth method: https://github.com/zcfs/Meteor-http-methods#authentication
  if (options.auth) {
    if (methods[name]) {
      methods[name].auth = options.auth;
    }
    if (methods[name + '/:id']) {
      methods[name + '/:id'].auth = options.auth;
    }
  }

  // Publish the methods
  HTTP.methods(methods);
  
  // Mark these method names as currently published
  _publishHTTP.currentlyPublished = _.union(_publishHTTP.currentlyPublished, _.keys(methods));
  
}; // EO Publish

/**
 * @method HTTP.unpublish
 * @public
 * @param {String|Meteor.Collection} [name] - The method name or collection
 * @returns {undefined}
 * 
 * Unpublishes all HTTP methods that were published with the given name or 
 * for the given collection. Call with no arguments to unpublish all.
 */
HTTP.unpublish = _publishHTTP.unpublish;