function equals(a, b) {
  return !!(EJSON.stringify(a) === EJSON.stringify(b));
}

Tinytest.add('http-publish - server - test environment', function(test) {
  test.isTrue(typeof _publishHTTP !== 'undefined', 'test environment not initialized _publishHTTP');
  test.isTrue(typeof HTTP !== 'undefined', 'test environment not initialized HTTP');
  test.isTrue(typeof HTTP.publish !== 'undefined', 'test environment not initialized HTTP.publish');
  test.isTrue(typeof HTTP.unpublish !== 'undefined', 'test environment not initialized HTTP.unpublish');
  test.isTrue(typeof HTTP.publishFormats !== 'undefined', 'test environment not initialized HTTP.publishFormats');

});

list = new Meteor.Collection('list');
console.log('Server url: ' + Meteor.absoluteUrl());

list.allow({
  insert: function() { return true; },
  update: function() { return true; },
  remove: function() { return true; }
});

console.log('Rig publish');
HTTP.publish({collection: list}, function() {
  return list.find();
});

// Test custom prefix, too
HTTP.publish({collection: list, name: '/api2/list'}, function() {
  return list.find();
});

Meteor.methods({
  clearTest: function() {
    console.log('Client called clearTest');
    // Empty test db
    list.remove({});

    // Insert one text
    list.insert({ text: 'OK' });  

    // Count
    var count = list.find().count();

    return !!(count === 1);  
  },
  unmountCustom: function() {
    console.log('Client called unmountCustom');
    _publishHTTP.unpublish('/api2/list');
    return true;
  }
});


Tinytest.add('http-publish - server - getMethodHandler', function(test) {

  try {
    var methodHandler = _publishHTTP.getMethodHandler(list, 'insert');

    test.isTrue(typeof methodHandler === 'function', 'expected getMethodHandler to return a function');

  } catch(err) {
    test.fail(err.message);
  }

});


Tinytest.add('http-publish - server - formatHandlers', function(test) { 

  test.isTrue(typeof _publishHTTP.formatHandlers.json === 'function', 'Cant find formatHandler for json');

  var testScope = {
    code: 0,
    setContentType: function(code) {
      this.code = code;
    }
  };
  var resultFormatHandler = _publishHTTP.formatHandlers.json.apply(testScope, [{test:'ok'}]);

  test.equal(testScope.code, 'application/json', 'json formatHandler have not set setContentType');

  test.equal(resultFormatHandler, '{"test":"ok"}', 'json formatHandler returned a bad result');

});

Tinytest.add('http-publish - server - getPublishScope', function(test) { 

  var oldScope = {
    userId: '1',
    params: '2',
    query: '3',
    oldStuff: 'hmmm'
  };

  var newScope = _publishHTTP.getPublishScope(oldScope);

  test.isUndefined(newScope.oldStuff, 'This oldStuff should not be in the new scope');

  test.equal(newScope.userId, '1', 'userId not set in the new scope');
  test.equal(newScope.params, '2', 'params not set in the new scope');
  test.equal(newScope.query, '3', 'query not set in the new scope');

});

Tinytest.add('http-publish - server - formatResult', function(test) { 

  var oldScope = {
    statusCode: 200,
    userId: '1',
    params: '2',
    query: '3',
    oldStuff: 'hmmm',
    setStatusCode: function(code) {
      this.statusCode = code;
    },
    code: 0,
    setContentType: function(code) {
      this.code = code;
    }
  };

  var result = _publishHTTP.formatResult({test: 'ok'}, oldScope);

  test.equal(oldScope.code, 'application/json', 'json formatHandler have not set setContentType');

  test.equal(result, '{"test":"ok"}', 'json formatHandler returned a bad result');

});

//Test API:
//test.isFalse(v, msg)
//test.isTrue(v, msg)
//test.equalactual, expected, message, not
//test.length(obj, len)
//test.include(s, v)
//test.isNaN(v, msg)
//test.isUndefined(v, msg)
//test.isNotNull
//test.isNull
//test.throws(func)
//test.instanceOf(obj, klass)
//test.notEqual(actual, expected, message)
//test.runId()
//test.exception(exception)
//test.expect_fail()
//test.ok(doc)
//test.fail(doc)
//test.equal(a, b, msg)
