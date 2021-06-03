var fs = Npm.require('fs');
var temp = Npm.require('temp');

// Automatically track and cleanup files at exit
temp.track();

// Set up HTTP method URL used by client tests
HTTP.methods({
  'test': {
    get: function () {
      var buf = new Buffer('Hello World');
      this.setContentType('text/plain');
      return buf;
    },
    head: function () {
      var buf = new Buffer('Hello World');
      this.setContentType('text/plain');
      this.addHeader('Content-Length', buf.length);
      buf = null;
    }
  }
});

// Save temp file for testing with
function openTempFile(name, callback) {
  return temp.open(name, callback);
}
var openTempFileSync = Meteor.wrapAsync(openTempFile);

var info = openTempFileSync(null);
var tempFilePath = info.path;
fs.writeSync(info.fd, 'Hello World');
fs.closeSync(info.fd);

var bufferData;
var arrayBufferData;
var binaryData;
var dataUriData;
var urlData;
var filePathData;
var streamData;

// Init with Buffer
Tinytest.addAsync('cfs-data - server - Init with Buffer', function(test, onComplete) {
  bufferData = new DataMan(new Buffer('Hello World'), "text/plain");
  test.instanceOf(bufferData.source, DataMan.Buffer);
  test.equal(bufferData.type(), "text/plain");
  onComplete();
});

// Init with ArrayBuffer
Tinytest.addAsync('cfs-data - server - Init with ArrayBuffer', function(test, onComplete) {
  arrayBufferData = new DataMan(str2ab('Hello World'), "text/plain");
  // Should be converted upon init to a Buffer
  test.instanceOf(arrayBufferData.source, DataMan.Buffer);
  test.equal(arrayBufferData.type(), "text/plain");
  onComplete();
});

// Init with Binary
Tinytest.addAsync('cfs-data - server - Init with Binary', function(test, onComplete) {
  binaryData = new DataMan(new Uint8Array(str2ab('Hello World')), "text/plain");
  // Should be converted upon init to a Buffer
  test.instanceOf(arrayBufferData.source, DataMan.Buffer);
  test.equal(binaryData.type(), "text/plain");
  onComplete();
});

// Init with data URI string
Tinytest.addAsync('cfs-data - server - Init with data URI string', function(test, onComplete) {
  var dataUri = 'data:text/plain;base64,SGVsbG8gV29ybGQ='; //'Hello World'
  dataUriData = new DataMan(dataUri);
  // Data URIs are not converted to Buffers upon init
  test.instanceOf(dataUriData.source, DataMan.DataURI);
  test.equal(dataUriData.type(), "text/plain"); //should be extracted from data URI
  onComplete();
});

// Init with URL string
Tinytest.addAsync('cfs-data - server - Init with URL string', function(test, onComplete) {
  var url = Meteor.absoluteUrl('test');
  urlData = new DataMan(url, "text/plain"); //'Hello World'
  // URLs are not converted to Buffers upon init
  test.instanceOf(urlData.source, DataMan.URL);
  test.equal(urlData.type(), "text/plain");
  onComplete();
});

// Init with filepath string
Tinytest.addAsync('cfs-data - server - Init with filepath string', function(test, onComplete) {
  filePathData = new DataMan(tempFilePath, "text/plain");
  // filepaths are not converted to Buffers upon init
  test.instanceOf(filePathData.source, DataMan.FilePath);
  test.equal(filePathData.type(), "text/plain");
  onComplete();
});

// Init with readable stream
Tinytest.addAsync('cfs-data - server - Init with readable stream', function(test, onComplete) {
  streamData = new DataMan(fs.createReadStream(tempFilePath), "text/plain");
  // filepaths are not converted to Buffers upon init
  test.instanceOf(streamData.source, DataMan.ReadStream);
  test.equal(streamData.type(), "text/plain");
  onComplete();
});

// getBuffer
Tinytest.addAsync('cfs-data - server - getBuffer', function(test, onComplete) {
  var total = 12, done = 0;

  function testBuffer(error, buffer, testType) {
    test.isFalse(!!error, testType + ' got error: ' + (error && error.message));
    test.instanceOf(buffer, Buffer);

    if (buffer instanceof Buffer) {
      test.equal(buffer.toString(), 'Hello World', testType + ' got back buffer with incorrect data');
    }

    done++;
    if (total === done) {
      onComplete();
    }
  }

  // from Buffer (async)
  bufferData.getBuffer(function (error, buffer) {
    testBuffer(error, buffer, 'getBuffer from Buffer async');
  });

  // from Buffer (sync)
  testBuffer(null, bufferData.getBuffer(), 'getBuffer from Buffer sync');

  // from ArrayBuffer (async)
  arrayBufferData.getBuffer(function (error, buffer) {
    testBuffer(error, buffer, 'getBuffer from ArrayBuffer async');
  });

  // from ArrayBuffer (sync)
  testBuffer(null, arrayBufferData.getBuffer(), 'getBuffer from ArrayBuffer sync');

  // from binary (async)
  binaryData.getBuffer(function (error, buffer) {
    testBuffer(error, buffer, 'getBuffer from binary async');
  });

  // from binary (sync)
  testBuffer(null, binaryData.getBuffer(), 'getBuffer from binary sync');

  // from data URI (async)
  dataUriData.getBuffer(function (error, buffer) {
    testBuffer(error, buffer, 'getBuffer from data URI async');
  });

  // from data URI (sync)
  testBuffer(null, dataUriData.getBuffer(), 'getBuffer from data URI sync');

  // from URL (async)
  urlData.getBuffer(function (error, buffer) {
    testBuffer(error, buffer, 'getBuffer from URL async');
  });

  // from URL (sync)
  testBuffer(null, urlData.getBuffer(), 'getBuffer from URL sync');

  // from filepath (async)
  filePathData.getBuffer(function (error, buffer) {
    testBuffer(error, buffer, 'getBuffer filepath async');
  });

  // from filepath (sync)
  testBuffer(null, filePathData.getBuffer(), 'getBuffer filepath sync');
});

// getDataUri
Tinytest.addAsync('cfs-data - server - getDataUri', function(test, onComplete) {
  var total = 12, done = 0;
  function testURI(error, uri, testType) {
    test.isFalse(!!error, testType + ' got error: ' + (error && error.message));
    test.equal(typeof uri, "string", testType + ' got no URI string');
    test.equal(uri, 'data:text/plain;base64,SGVsbG8gV29ybGQ=', testType + ' got invalid URI');

    done++;
    if (total === done) {
      onComplete();
    }
  }

  // from Buffer (async)
  bufferData.getDataUri(function (error, uri) {
    testURI(error, uri, 'getDataUri from Buffer async');
  });

  // from Buffer (sync)
  testURI(null, bufferData.getDataUri(), 'getDataUri from Buffer sync');

  // from ArrayBuffer (async)
  arrayBufferData.getDataUri(function (error, uri) {
    testURI(error, uri, 'getDataUri from ArrayBuffer async');
  });

  // from ArrayBuffer (sync)
  testURI(null, arrayBufferData.getDataUri(), 'getDataUri from ArrayBuffer sync');

  // from binary (async)
  binaryData.getDataUri(function (error, uri) {
    testURI(error, uri, 'getDataUri from binary async');
  });

  // from binary (sync)
  testURI(null, binaryData.getDataUri(), 'getDataUri from binary sync');

  // from data URI (async)
  dataUriData.getDataUri(function (error, uri) {
    testURI(error, uri, 'getDataUri from data URI async');
  });

  // from data URI (sync)
  testURI(null, dataUriData.getDataUri(), 'getDataUri from data URI sync');

  // from URL (async)
  urlData.getDataUri(function (error, uri) {
    testURI(error, uri, 'getDataUri from URL async');
  });

  // from URL (sync)
  testURI(null, urlData.getDataUri(), 'getDataUri from URL sync');

  // from filepath (async)
  filePathData.getDataUri(function (error, uri) {
    testURI(error, uri, 'getDataUri filepath async');
  });

  // from filepath (sync)
  testURI(null, filePathData.getDataUri(), 'getDataUri filepath sync');
});

// size
Tinytest.addAsync('cfs-data - server - size', function(test, onComplete) {
  var total = 6, done = 0;
  function testSize(size, testType) {
    test.equal(size, 11, testType + ' got wrong size');

    done++;
    if (total === done) {
      onComplete();
    }
  }

  // from Buffer
  testSize(bufferData.size(), 'size from Buffer');

  // from ArrayBuffer
  testSize(arrayBufferData.size(), 'size from ArrayBuffer');

  // from binary
  testSize(binaryData.size(), 'size from binary');

  // from data URI
  testSize(dataUriData.size(), 'size from data URI');

  // from URL
  testSize(urlData.size(), 'size from URL');

  // from filepath
  testSize(filePathData.size(), 'size from filepath');
});

// saveToFile
// Since saveToFile uses createReadStream, this tests that function also
Tinytest.addAsync('cfs-data - server - saveToFile', function(test, onComplete) {
  var total = 12, done = 0;
  function testSave(dataInstance) {
    var tempName = temp.path({suffix: '.txt'});
    dataInstance.saveToFile(tempName, function (error) {
      test.isFalse(!!error);
      test.equal(fs.readFileSync(tempName, {encoding: 'utf8'}), 'Hello World', 'file was not saved with correct data');
      done++;
      if (total === done) {
        onComplete();
      }
    });
  }

  function testSaveSync(dataInstance) {
    var tempName = temp.path({suffix: '.txt'});
    dataInstance.saveToFile(tempName);
    test.equal(fs.readFileSync(tempName, {encoding: 'utf8'}), 'Hello World', 'file was not saved with correct data');
    done++;
    if (total === done) {
      onComplete();
    }
  }

  // from Buffer
  testSave(bufferData);
  testSaveSync(bufferData);

  // from ArrayBuffer
  testSave(arrayBufferData);
  testSaveSync(arrayBufferData);

  // from binary
  testSave(binaryData);
  testSaveSync(binaryData);

  // from data URI
  testSave(dataUriData);
  testSaveSync(dataUriData);

  // from URL
  testSave(urlData);
  testSaveSync(urlData);

  // from filepath
  testSave(filePathData);
  testSaveSync(filePathData);
});

// Ensure that URL createReadStream can be piped after delay
// https://github.com/mikeal/request/issues/887
Tinytest.addAsync('cfs-data - server - createReadStream delay', function(test, onComplete) {
  var readStream = urlData.createReadStream();

  // wait for 5 seconds, then pipe
  Meteor.setTimeout(function() {
    var tempName = temp.path({suffix: '.txt'});

    try {
      var writeStream = readStream.pipe(fs.createWriteStream(tempName));

      writeStream.on('finish', Meteor.bindEnvironment(function() {
        test.equal(fs.readFileSync(tempName, {encoding: 'utf8'}), 'Hello World', 'file was not saved with correct data');
        onComplete();
      }));
      
      writeStream.on('error', Meteor.bindEnvironment(function(err) {
        test.isFalse(!!err);
      }));
    } catch (err) {
      test.isFalse(!!err);
      onComplete();
    }    
    
  }, 5000);

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
