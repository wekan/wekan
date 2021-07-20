var blobData;
var arrayBufferData;
var binaryData;
var dataUriData;
var urlData;

// Init with Blob
Tinytest.addAsync('cfs-data - client - Init with Blob', function(test, onComplete) {
  var blob = new Blob(['Hello World'], {type : 'text/plain'});
  blobData = new DataMan(blob);
  test.instanceOf(blobData.blob, Blob);
  test.equal(blobData.type(), "text/plain");
  onComplete();
});

// Init with ArrayBuffer
Tinytest.addAsync('cfs-data - client - Init with ArrayBuffer', function(test, onComplete) {
  arrayBufferData = new DataMan(str2ab('Hello World'), "text/plain");
  // Should be converted upon init to a Blob
  test.instanceOf(arrayBufferData.blob, Blob);
  test.equal(arrayBufferData.type(), "text/plain");
  onComplete();
});

// Init with Binary
Tinytest.addAsync('cfs-data - client - Init with Binary', function(test, onComplete) {
  binaryData = new DataMan(new Uint8Array(str2ab('Hello World')), "text/plain");
  // Should be converted upon init to a Blob
  test.instanceOf(arrayBufferData.blob, Blob);
  test.equal(binaryData.type(), "text/plain");
  onComplete();
});

// Init with data URI string
Tinytest.addAsync('cfs-data - client - Init with data URI string', function(test, onComplete) {
  var dataUri = 'data:text/plain;base64,SGVsbG8gV29ybGQ='; //'Hello World'
  dataUriData = new DataMan(dataUri);
  // Should be converted upon init to a Blob
  test.instanceOf(dataUriData.blob, Blob);
  test.equal(dataUriData.type(), "text/plain"); //should be extracted from data URI
  onComplete();
});

// Init with URL string
Tinytest.addAsync('cfs-data - client - Init with URL string', function(test, onComplete) {
  urlData = new DataMan(Meteor.absoluteUrl('test'), "text/plain"); //'Hello World'
  // URLs are not converted to Blobs upon init
  test.equal(urlData.url, Meteor.absoluteUrl('test'));
  test.equal(urlData.type(), "text/plain");
  onComplete();
});

// getBlob
Tinytest.addAsync('cfs-data - client - getBlob', function(test, onComplete) {
  var total = 10, done = 0;
  function continueIfDone() {
    done++;
    if (total === done) {
      onComplete();
    }
  }

  function testBlob(error, blob, testType) {
    test.isFalse(!!error, testType + ' got error: ' + (error && error.message));
    test.instanceOf(blob, Blob, testType + ' got no blob');

    if (blob instanceof Blob) {
      var reader = new FileReader();
      reader.addEventListener("load", function(event) {
        test.equal(reader.result, 'Hello World', testType + ' got back blob with incorrect data');
        continueIfDone();
      }, false);
      reader.addEventListener("error", function(err) {
        test.equal(reader.error, null, testType + ' error reading blob as text');
        continueIfDone();
      }, false);
      reader.readAsText(blob, 'utf-8');
    } else {
      continueIfDone();
    }
  }

  // from Blob
  blobData.getBlob(function (error, blob) {
    testBlob(error, blob, 'getBlob from Blob');
  });

  // from Blob (no callback)
  testBlob(false, blobData.getBlob(), 'getBlob from Blob');

  // from ArrayBuffer
  arrayBufferData.getBlob(function (error, blob) {
    testBlob(error, blob, 'getBlob from ArrayBuffer');
  });

  // from ArrayBuffer (no callback)
  testBlob(false, arrayBufferData.getBlob(), 'getBlob from ArrayBuffer');

  // from binary
  binaryData.getBlob(function (error, blob) {
    testBlob(error, blob, 'getBlob from binary');
  });

  // from binary (no callback)
  testBlob(false, binaryData.getBlob(), 'getBlob from binary');

  // from data URI
  dataUriData.getBlob(function (error, blob) {
    testBlob(error, blob, 'getBlob from data URI');
  });

  // from data URI (no callback)
  testBlob(false, dataUriData.getBlob(), 'getBlob from data URI');

  // from URL
  urlData.getBlob(function (error, blob) {
    testBlob(error, blob, 'getBlob from URL');
  });

  // from URL (no callback)
  test.throws(function () {
    // callback is required for URLs on the client
    urlData.getBlob();
  });
  continueIfDone();

});

// getBinary
Tinytest.addAsync('cfs-data - client - getBinary', function(test, onComplete) {
  var total = 5, done = 0;
  function continueIfDone() {
    done++;
    if (total === done) {
      onComplete();
    }
  }

  function testBinary(error, binary, testType) {
    test.isFalse(!!error, testType + ' got error: ' + (error && error.message));
    test.isTrue(EJSON.isBinary(binary), testType + ' got no binary');

    if (EJSON.isBinary(binary)) {
      test.equal(bin2str(binary), 'Hello World', testType + ' got back binary with incorrect data');
      continueIfDone();
    } else {
      continueIfDone();
    }
  }

  // from Blob
  blobData.getBinary(function (error, binary) {
    testBinary(error, binary, 'getBinary from Blob');
  });

  // from ArrayBuffer
  arrayBufferData.getBinary(function (error, binary) {
    testBinary(error, binary, 'getBinary from ArrayBuffer');
  });

  // from binary
  binaryData.getBinary(function (error, binary) {
    testBinary(error, binary, 'getBinary from binary');
  });

  // from data URI
  dataUriData.getBinary(function (error, binary) {
    testBinary(error, binary, 'getBinary from data URI');
  });

  // from URL
  urlData.getBinary(function (error, binary) {
    testBinary(error, binary, 'getBinary from URL');
  });
});

// getDataUri
Tinytest.addAsync('cfs-data - client - getDataUri', function(test, onComplete) {
  var total = 5, done = 0;
  function testURI(error, uri, testType) {
    test.isFalse(!!error, testType + ' got error: ' + (error && error.message));
    test.equal(typeof uri, "string", testType + ' got no URI string');
    test.equal(uri, 'data:text/plain;base64,SGVsbG8gV29ybGQ=', testType + ' got invalid URI');

    done++;
    if (total === done) {
      onComplete();
    }
  }

  // from Blob
  blobData.getDataUri(function (error, uri) {
    testURI(error, uri, 'getDataUri from Blob');
  });

  // from ArrayBuffer
  arrayBufferData.getDataUri(function (error, uri) {
    testURI(error, uri, 'getDataUri from ArrayBuffer');
  });

  // from binary
  binaryData.getDataUri(function (error, uri) {
    testURI(error, uri, 'getDataUri from binary');
  });

  // from data URI
  dataUriData.getDataUri(function (error, uri) {
    testURI(error, uri, 'getDataUri from data URI');
  });

  // from URL
  urlData.getDataUri(function (error, uri) {
    testURI(error, uri, 'getDataUri from URL');
  });
});

// size
Tinytest.addAsync('cfs-data - client - size', function(test, onComplete) {
  var total = 10, done = 0;
  function continueIfDone() {
    done++;
    if (total === done) {
      onComplete();
    }
  }

  function testSize(error, size, testType) {
    test.isFalse(!!error, testType + ' got error: ' + (error && error.message));
    test.equal(size, 11, testType + ' got wrong size');
    continueIfDone();
  }

  // from Blob
  blobData.size(function (error, size) {
    testSize(error, size, 'size from Blob');
  });

  // from Blob (no callback)
  testSize(false, blobData.size(), 'size from Blob');

  // from ArrayBuffer
  arrayBufferData.size(function (error, size) {
    testSize(error, size, 'size from ArrayBuffer');
  });

  // from ArrayBuffer (no callback)
  testSize(false, arrayBufferData.size(), 'size from ArrayBuffer');

  // from binary
  binaryData.size(function (error, size) {
    testSize(error, size, 'size from binary');
  });

  // from binary (no callback)
  testSize(false, binaryData.size(), 'size from binary');

  // from data URI
  dataUriData.size(function (error, size) {
    testSize(error, size, 'size from data URI');
  });

  // from data URI (no callback)
  testSize(false, dataUriData.size(), 'size from data URI');

  // from URL
  urlData.size(function (error, size) {
    testSize(error, size, 'size from URL');
  });

  // from URL (no callback)
  test.throws(function () {
    // callback is required for URLs on the client
    urlData.size();
  });
  continueIfDone();
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
