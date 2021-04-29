function equals(a, b) {
  return !!(EJSON.stringify(a) === EJSON.stringify(b));
}

var fileCollection = new FS.Collection('files', {
	stores: [
		new FS.Store.GridFS('files')
	]
});

Tinytest.add('cfs-collection - test environment', function(test) {
  test.isTrue(typeof FS.Collection !== 'undefined', 'test environment not initialized FS.Collection');
});

Tinytest.add('cfs-collection - insert URL - sync - one', function (test) {
  // XXX should switch to a local URL we host

  // One
  try {
    fileCollection.insert("http://cdn.morguefile.com/imageData/public/files/b/bboomerindenial/preview/fldr_2009_04_01/file3301238617907.jpg");
    test.isTrue(true);
  } catch (err) {
  	test.isFalse(!!err, "URL insert failed");
  }

});

Tinytest.add('cfs-collection - insert URL - sync - loop', function (test) {
  // XXX should switch to a local URL we host

  try {
  	for (var i = 0, len = 10; i < len; i++) {
      fileCollection.insert("http://cdn.morguefile.com/imageData/public/files/b/bboomerindenial/preview/fldr_2009_04_01/file3301238617907.jpg");
    }
    test.isTrue(true);
  } catch (err) {
  	test.isFalse(!!err, "URL insert failed");
  }
});

Tinytest.addAsync('cfs-collection - insert URL - async - one', function (test, next) {
  // XXX should switch to a local URL we host

  // One
  try {
    fileCollection.insert("http://cdn.morguefile.com/imageData/public/files/b/bboomerindenial/preview/fldr_2009_04_01/file3301238617907.jpg", function (error, result) {
    	test.isNull(error);
    	test.instanceOf(result, FS.File);
    	next();
    });
  } catch (err) {
  	test.isFalse(!!err, "URL insert failed");
  	next();
  }
});

Tinytest.addAsync('cfs-collection - insert URL - async - loop', function (test, next) {
  // XXX should switch to a local URL we host

  try {
  	var done = 0;
  	for (var i = 0, len = 10; i < len; i++) {
      fileCollection.insert("http://cdn.morguefile.com/imageData/public/files/b/bboomerindenial/preview/fldr_2009_04_01/file3301238617907.jpg", function (error, result) {
    	test.isNull(error);
    	test.instanceOf(result, FS.File);
    	done++;
    	if (done === 10) {
    		next();
    	}
      });
    }
  } catch (err) {
  	test.isFalse(!!err, "URL insert failed");
  	next();
  }
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
