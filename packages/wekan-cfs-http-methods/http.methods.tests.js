function equals(a, b) {
  return EJSON.stringify(a) === EJSON.stringify(b);
}

Tinytest.add('http-methods - test environment', function(test) {
  test.isTrue(typeof _methodHTTP !== 'undefined', 'test environment not initialized _methodHTTP');
  test.isTrue(typeof HTTP !== 'undefined', 'test environment not initialized HTTP');
  test.isTrue(typeof HTTP.methods !== 'undefined', 'test environment not initialized HTTP.methods');

});

Tinytest.add('http-methods - nameFollowsConventions', function(test) {
  test.isFalse(_methodHTTP.nameFollowsConventions(), 'Tested methods naming convention 1');
  test.isFalse(_methodHTTP.nameFollowsConventions(''), 'Tested methods naming convention 2');
  test.isFalse(_methodHTTP.nameFollowsConventions({}), 'Tested methods naming convention 3');
  test.isFalse(_methodHTTP.nameFollowsConventions([1]), 'Tested methods naming convention 4');
  test.isFalse(_methodHTTP.nameFollowsConventions(-1), 'Tested methods naming convention 5');
  test.isFalse(_methodHTTP.nameFollowsConventions(1), 'Tested methods naming convention 6');
  test.isFalse(_methodHTTP.nameFollowsConventions(0.1), 'Tested methods naming convention 7');
  test.isFalse(_methodHTTP.nameFollowsConventions(-0.1), 'Tested methods naming convention 8');

  test.isTrue(_methodHTTP.nameFollowsConventions('/test/test'), 'Tested methods naming convention leading slash');
  test.isTrue(_methodHTTP.nameFollowsConventions('test/test'), 'Tested methods naming convention');
});

Tinytest.add('http-methods - getNameList', function(test) {
  test.equal(EJSON.stringify(_methodHTTP.getNameList()), '[]', 'Name list failed');
  test.equal(EJSON.stringify(_methodHTTP.getNameList('')), '[]', 'Name list failed');
  test.equal(EJSON.stringify(_methodHTTP.getNameList('/')), '[]', 'Name list failed');
  test.equal(EJSON.stringify(_methodHTTP.getNameList('//')), '["",""]', 'Name list failed');

  test.equal(EJSON.stringify(_methodHTTP.getNameList('/1/')), '["1",""]', 'Name list failed');
  test.equal(EJSON.stringify(_methodHTTP.getNameList('/1/2')), '["1","2"]', 'Name list failed');
  test.equal(EJSON.stringify(_methodHTTP.getNameList('/1/:name/2')), '["1",":name","2"]', 'Name list failed');
  test.equal(EJSON.stringify(_methodHTTP.getNameList('/1//2')), '["1","","2"]', 'Name list failed');
});


Tinytest.add('http-methods - createObject', function(test) {
  test.equal(EJSON.stringify(_methodHTTP.createObject()), '{}', 'createObject failed');
  test.equal(EJSON.stringify(_methodHTTP.createObject(2, 4)), '{}', 'createObject failed');
  test.equal(EJSON.stringify(_methodHTTP.createObject(['foo'], [])), '{"foo":""}', 'createObject failed');
  test.equal(EJSON.stringify(_methodHTTP.createObject(['foo'], ['bar'])), '{"foo":"bar"}', 'createObject failed');
  test.equal(EJSON.stringify(_methodHTTP.createObject(['foo'], [3])), '{"foo":"3"}', 'createObject failed');
  test.equal(EJSON.stringify(_methodHTTP.createObject(['foo'], ['bar', 3])), '{"foo":"bar"}', 'createObject failed');
  test.equal(EJSON.stringify(_methodHTTP.createObject(['foo', 'foo'], ['bar', 3])), '{"foo":"3"}', 'createObject failed');
  test.equal(EJSON.stringify(_methodHTTP.createObject([''], ['bar', 3])), '{"":"bar"}', 'createObject failed');
  test.equal(EJSON.stringify(_methodHTTP.createObject(['', ''], ['bar', 3])), '{"":"3"}', 'createObject failed');
});

Tinytest.add('http-methods - addToMethodTree', function(test) {
  var original = _methodHTTP.methodTree;
  _methodHTTP.methodTree = {};
  _methodHTTP.addToMethodTree('login');
  test.equal(EJSON.stringify(_methodHTTP.methodTree), '{"login":{":ref":{"name":"/login/","params":[]}}}', 'addToMethodTree failed');

  _methodHTTP.methodTree = {};
  _methodHTTP.addToMethodTree('/foo/bar');
  test.equal(EJSON.stringify(_methodHTTP.methodTree), '{"foo":{"bar":{":ref":{"name":"/foo/bar/","params":[]}}}}', 'addToMethodTree failed');

  _methodHTTP.methodTree = {};
  _methodHTTP.addToMethodTree('/foo/:name/bar');
  test.equal(EJSON.stringify(_methodHTTP.methodTree), '{"foo":{":value":{"bar":{":ref":{"name":"/foo/:value/bar/","params":["name"]}}}}}', 'addToMethodTree failed');

  _methodHTTP.addToMethodTree('/foo/:name/bar');
  test.equal(EJSON.stringify(_methodHTTP.methodTree), '{"foo":{":value":{"bar":{":ref":{"name":"/foo/:value/bar/","params":["name"]}}}}}', 'addToMethodTree failed');

  _methodHTTP.addToMethodTree('/foo/name/bar');
  test.equal(EJSON.stringify(_methodHTTP.methodTree), '{"foo":{":value":{"bar":{":ref":{"name":"/foo/:value/bar/","params":["name"]}}},"name":{"bar":{":ref":{"name":"/foo/name/bar/","params":[]}}}}}', 'addToMethodTree failed');

  _methodHTTP.methodTree = original;
});

Tinytest.add('http-methods - getMethod', function(test) {
  // Basic tests
  test.equal(EJSON.stringify(_methodHTTP.getMethod('')), 'null', 'getMethod failed');
  test.equal(EJSON.stringify(_methodHTTP.getMethod('//')), 'null', 'getMethod failed');

  _methodHTTP.addToMethodTree('login');
  test.equal(EJSON.stringify(_methodHTTP.getMethod('login')), '{"name":"/login/","params":{}}', 'getMethod failed');
  test.equal(EJSON.stringify(_methodHTTP.getMethod('/login')), '{"name":"/login/","params":{}}', 'getMethod failed');
  test.equal(EJSON.stringify(_methodHTTP.getMethod('login/')), 'null', 'getMethod failed');
  test.equal(EJSON.stringify(_methodHTTP.getMethod('/login/')), 'null', 'getMethod failed');
  test.equal(EJSON.stringify(_methodHTTP.getMethod('login/test')), 'null', 'getMethod failed');

  _methodHTTP.addToMethodTree('/login/');
  test.equal(EJSON.stringify(_methodHTTP.getMethod('login')), '{"name":"/login/","params":{}}', 'getMethod failed');

  //

  _methodHTTP.addToMethodTree('/login/foo');
  test.equal(EJSON.stringify(_methodHTTP.getMethod('login/foo')), '{"name":"/login/foo/","params":{}}', 'getMethod failed');

  _methodHTTP.addToMethodTree('/login/:name/foo');
  test.equal(EJSON.stringify(_methodHTTP.getMethod('login/bar/foo')), '{"name":"/login/:value/foo/","params":{"name":"bar"}}', 'getMethod failed');
  test.equal(EJSON.stringify(_methodHTTP.getMethod('login/foo')), '{"name":"/login/foo/","params":{}}', 'getMethod failed');

});

//Test API:
//test.isFalse(v, msg)
//test.isTrue(v, msg)
//test.equal(actual, expected, message, not)
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
