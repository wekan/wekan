Tinytest.add('FS.Collection - server - test environment', function(test) {
  test.isTrue(typeof FS.Utility !== 'undefined', 'test environment not initialized FS.Utility');
  test.isTrue(typeof FS.Collection !== 'undefined', 'test environment not initialized FS.Collection');
  test.isTrue(typeof FS.File !== 'undefined', 'test environment not initialized FS.File');
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
