function equals(a, b) {
  return !!(EJSON.stringify(a) === EJSON.stringify(b));
}

Tinytest.add('cfs-tempstore - server - test environment', function(test) {
  test.isTrue(typeof FS.Collection !== 'undefined', 'test environment not initialized FS.Collection');
});

/*
 * This is a server-only package so only server tests are needed.
 * Need to test each API method:
 * FS.TempStore.saveChunk
 * FS.TempStore.getDataForFile
 * FS.TempStore.getDataForFileSync
 * FS.TempStore.deleteChunks
 * FS.TempStore.ensureForFile
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
