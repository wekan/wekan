function equals(a, b) {
  return !!(EJSON.stringify(a) === EJSON.stringify(b));
}

Tinytest.add('cfs-filesystem - server - test environment', function(test) {
  test.isTrue(typeof FS.Collection !== 'undefined', 'test environment not initialized FS.Collection');
  test.isTrue(typeof CFSErrorType !== 'undefined', 'test environment not initialized CFSErrorType');
});

/*
 * FS.File Server Tests
 *
 * construct FS.File with no arguments
 * load data with FS.File.setDataFromBuffer
 * load data with FS.File.setDataFromBinary
 * load data and then call FS.File.toDataUrl with and without callback
 * load buffer into FS.File and then call FS.File.getBinary with and without start/end; make sure correct data is returned
 * construct FS.File, set FS.File.collectionName to a CFS name, and then test FS.File.update/remove/get/put/del/url
 * (call these with and without callback to test sync vs. async)
 * set FS.File.name to a filename and test that FS.File.getExtension() returns the extension
 *
 *
 * FS.Collection Server Tests
 *
 * Make sure options.filter is respected
 *
 *
 */


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
