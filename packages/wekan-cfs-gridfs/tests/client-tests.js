function equals(a, b) {
  return !!(EJSON.stringify(a) === EJSON.stringify(b));
}

Tinytest.add('cfs-gridfs - client - test environment', function(test) {
  test.isTrue(typeof FS.Collection !== 'undefined', 'test environment not initialized FS.Collection');
  test.isTrue(typeof CFSErrorType !== 'undefined', 'test environment not initialized CFSErrorType');
});

/*
 * FS.File Client Tests
 *
 * construct FS.File with no arguments
 * construct FS.File passing in File
 * construct FS.File passing in Blob
 * load blob into FS.File and then call FS.File.toDataUrl
 * call FS.File.setDataFromBinary, then FS.File.getBlob(); make sure correct data is returned
 * load blob into FS.File and then call FS.File.getBinary() with and without start/end; make sure correct data is returned
 * construct FS.File, set FS.File.collectionName to a CFS name, and then test FS.File.update/remove/get/put/del/url
 * set FS.File.name to a filename and test that FS.File.getExtension() returns the extension
 * load blob into FS.File and make sure FS.File.saveLocal initiates a download (possibly can't do automatically)
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
