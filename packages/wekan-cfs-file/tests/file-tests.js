function bin2str(bufView) {
  var length = bufView.length;
  var result = '';
  for (var i = 0; i<length; i+=65535) {
    var addition = 65535;
    if(i + 65535 > length) {
      addition = length - i;
    }
    try {
      // this fails on phantomjs due to old webkit bug; hence the try/catch
      result += String.fromCharCode.apply(null, bufView.subarray(i,i+addition));
    } catch (e) {
      var dataArray = [];
      for (var j = i; j < i+addition; j++) {
        dataArray.push(bufView[j]);
      }
      result += String.fromCharCode.apply(null, dataArray);
    }
  }
  return result;
}

//function ab2str(buffer) {
//  return bin2str(new Uint8Array(buffer));
//}

function str2ab(str) {
  var buf = new ArrayBuffer(str.length);
  var bufView = new Uint8Array(buf);
  for (var i=0, strLen=str.length; i<strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

var fileCollection = new FS.Collection('files', {
	stores: [
		new FS.Store.GridFS('files')
	],
	uploader: null
});

// Set up server stuff
if (Meteor.isServer) {
	var fs = Npm.require('fs');
	var temp = Npm.require('temp');
	var path = Npm.require('path');

	// Automatically track and cleanup files at exit
	temp.track();

	// Set up HTTP method URL used by client tests
	var conf = {
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
	  };
	HTTP.methods({
	  'test': conf,
	  'test.txt': conf
	});

	// Save temp file for testing with
	function openTempFile(name, callback) {
	  return temp.open(name, callback);
	}
	var openTempFileSync = Meteor.wrapAsync(openTempFile);

	var info = openTempFileSync({suffix: '.txt'});
	var tempFilePath = info.path;
	var tempFileName = path.basename(tempFilePath);
	fs.writeSync(info.fd, 'Hello World');
	fs.closeSync(info.fd);

	fileCollection.allow({
		insert: function () {
			return true;
		},
		update: function () {
			return true;
		},
		remove: function () {
			return true;
		}
	});

	Meteor.publish("files", function () {
		return fileCollection.find();
	});
}

if (Meteor.isClient) {
	Meteor.subscribe("files");
}

Tinytest.add('cfs-file - test environment', function(test) {
  test.isTrue(typeof FS.Collection !== 'undefined', 'test environment not initialized FS.Collection');
  test.isTrue(typeof FS.File !== 'undefined', 'test environment not initialized FS.File');
});

Tinytest.add('cfs-file - construction', function(test) {
  // Normal object provided will extend the fileObj
  var f = new FS.File({foo: "bar"});
  test.equal(f.foo, "bar");

  // If passed another FS.File instance, we clone it
  var f2 = new FS.File(f);
  test.equal(f2.foo, "bar");
});

// Types of data and how we support attaching:
//
// Type          C/S         Constructor     attachData w/ callback      attachData w/o callback
// ----------------------------------------------------------------------------------------------
// Buffer        Server      No              Yes                         Yes
// ArrayBuffer   Both        No              Yes                         Yes
// Binary        Both        No              Yes                         Yes
// Data URI      Both        Yes             Yes                         Yes
// URL           Both        Yes on Server   Yes                         Yes on Server
// Filepath      Server      Yes             Yes                         Yes
// File          Client      Yes             Yes                         Yes
// Blob          Client      Yes             Yes                         Yes

function doAttachDataConstructorTest(data, name, test) {
	var f = new FS.File(data);
	if (!name) {
		test.isUndefined(f.name());
	} else {
		test.equal(f.name(), name);
	}
	test.equal(f.type(), "text/plain");
	test.equal(f.size(), 11);
}

function doAttachDataSyncTest(data, opts, name, test) {
	var f = new FS.File();
	f.attachData(data, opts);
	if (!name) {
		test.isUndefined(f.name());
	} else {
		test.equal(f.name(), name);
	}
	test.equal(f.type(), "text/plain");
	test.equal(f.size(), 11);
}

function doAttachDataAsyncTest(data, opts, name, test, next) {
	var f = new FS.File();
	f.attachData(data, opts, function (error) {
		test.isFalse(!!error);
		if (!name) {
			test.isUndefined(f.name());
		} else {
			test.equal(f.name(), name);
		}
		test.equal(f.type(), "text/plain");
		test.equal(f.size(), 11);
		next();
	});
}

/*
 * BUFFER
 */
if (Meteor.isServer) {
	Tinytest.add('cfs-file - attachData sync - Buffer', function(test) {
		doAttachDataSyncTest(new Buffer('Hello World'), {type: "text/plain"}, null, test);
	});

	Tinytest.addAsync('cfs-file - attachData async - Buffer', function(test, next) {
	    doAttachDataAsyncTest(new Buffer('Hello World'), {type: "text/plain"}, null, test, next);
	});
}

/*
 * ARRAYBUFFER
 */
Tinytest.add('cfs-file - attachData sync - ArrayBuffer', function(test) {
	doAttachDataSyncTest(str2ab('Hello World'), {type: "text/plain"}, null, test);
});

Tinytest.addAsync('cfs-file - attachData async - ArrayBuffer', function(test, next) {
	doAttachDataAsyncTest(str2ab('Hello World'), {type: "text/plain"}, null, test, next);
});

/*
 * Binary
 */
Tinytest.add('cfs-file - attachData sync - Binary', function(test) {
	doAttachDataSyncTest(new Uint8Array(str2ab('Hello World')), {type: "text/plain"}, null, test);
});

Tinytest.addAsync('cfs-file - attachData async - Binary', function(test, next) {
	doAttachDataAsyncTest(new Uint8Array(str2ab('Hello World')), {type: "text/plain"}, null, test, next);
});

/*
 * Data URI
 */
var dataUri = 'data:text/plain;base64,SGVsbG8gV29ybGQ='; //'Hello World'
Tinytest.add('cfs-file - attachData sync - Data URI', function(test) {
	doAttachDataSyncTest(dataUri, null, null, test);
});

Tinytest.addAsync('cfs-file - attachData async - Data URI', function(test, next) {
	doAttachDataAsyncTest(dataUri, null, null, test, next);
});

Tinytest.add('cfs-file - attachData from constructor - Data URI', function(test) {
	doAttachDataConstructorTest(dataUri, null, test);
});

/*
 * URL
 */
var url = Meteor.absoluteUrl('test');
var url2 = Meteor.absoluteUrl('test.txt');

if (Meteor.isServer) {
	Tinytest.add('cfs-file - attachData sync - URL', function(test) {
		doAttachDataSyncTest(url, null, null, test);
		doAttachDataSyncTest(url2, null, 'test.txt', test);
	});

	Tinytest.add('cfs-file - attachData from constructor - URL', function(test) {
		doAttachDataConstructorTest(url, null, test);
		doAttachDataConstructorTest(url2, 'test.txt', test);
	});
}

Tinytest.addAsync('cfs-file - attachData async - URL', function(test, next) {
	doAttachDataAsyncTest(url, null, null, test, function () {
		doAttachDataAsyncTest(url2, null, 'test.txt', test, next);
	});
});

/*
 * Filepath
 */
if (Meteor.isServer) {
	Tinytest.add('cfs-file - attachData sync - Filepath', function(test) {
		doAttachDataSyncTest(tempFilePath, null, tempFileName, test);
	});

	Tinytest.addAsync('cfs-file - attachData async - Filepath', function(test, next) {
		doAttachDataAsyncTest(tempFilePath, null, tempFileName, test, next);
	});

	Tinytest.add('cfs-file - attachData from constructor - Filepath', function(test) {
		doAttachDataConstructorTest(tempFilePath, tempFileName, test);
	});
}

/*
 * Blob
 */
if (Meteor.isClient) {
	var blob = new Blob(['Hello World'], {type : 'text/plain'});
	Tinytest.add('cfs-file - attachData sync - Blob', function(test) {
		doAttachDataSyncTest(blob, null, null, test);
	});

	Tinytest.addAsync('cfs-file - attachData async - Blob', function(test, next) {
		doAttachDataAsyncTest(blob, null, null, test, next);
	});

	Tinytest.add('cfs-file - attachData from constructor - Blob', function(test) {
		doAttachDataConstructorTest(blob, null, test);
	});
}

/*
 * Collection Mounting
 */
Tinytest.add('cfs-file - isMounted', function(test) {
	var f = new FS.File();
	test.isFalse(!!f.isMounted());
	f.collectionName = "files";
	test.isTrue(!!f.isMounted());
});

/*
 * name/extension
 */
Tinytest.add('cfs-file - name/extension', function(test) {
	var f = new FS.File();
	// Set names
	f.name("foo.pdf");
	f.name("bar.txt", {store: "files"});
	// Get names
	test.equal(f.name(), "foo.pdf");
	test.equal(f.name({store: "files"}), "bar.txt");
	// Get extensions
	test.equal(f.extension(), "pdf");
	test.equal(f.extension({store: "files"}), "txt");
	// Now change extensions
	f.extension("txt");
	f.extension("pdf", {store: "files"});
	// Get changed extensions
	test.equal(f.extension(), "txt");
	test.equal(f.extension({store: "files"}), "pdf");
});

/*
 * size
 */
Tinytest.add('cfs-file - size', function(test) {
	var f = new FS.File();
	// Set size
	f.size(1);
	f.size(2, {store: "files"});
	// Get size
	test.equal(f.size(), 1);
	test.equal(f.size({store: "files"}), 2);
});

/*
 * type
 */
Tinytest.add('cfs-file - type', function(test) {
	var f = new FS.File();
	// Set type
	f.type("image/png");
	f.type("image/jpg", {store: "files"});
	// Get type
	test.equal(f.type(), "image/png");
	test.equal(f.type({store: "files"}), "image/jpg");
});

/*
 * updatedAt
 */
Tinytest.add('cfs-file - updatedAt', function(test) {
	var f = new FS.File();
	var d1 = new Date("2014-01-01");
	var d2 = new Date("2014-02-01");
	// Set updatedAt
	f.updatedAt(d1);
	f.updatedAt(d2, {store: "files"});
	// Get updatedAt
	test.equal(f.updatedAt().getTime(), d1.getTime());
	test.equal(f.updatedAt({store: "files"}).getTime(), d2.getTime());
});

/*
 * update, uploadProgress, and isUploaded
 */
Tinytest.addAsync('cfs-file - update, uploadProgress, and isUploaded', function(test, next) {
	// Progress is based on chunkCount/chunkSum
	var f = new FS.File('data:text/plain;base64,SGVsbG8gV29ybGQ=');
	fileCollection.insert(f, function () {
		f.update({$set: {chunkSum: 2, chunkCount: 1}}, function (error, result) {
			test.isFalse(!!error);
			test.equal(f.uploadProgress(), 50);
			test.isFalse(f.isUploaded());
			// But if uploadedAt is set, we should always get 100
			f.update({$set: {uploadedAt: new Date}}, function (error, result) {
				test.isFalse(!!error);
				test.equal(f.uploadProgress(), 100);
				test.isTrue(f.isUploaded());
				next();
			});
		});
	});
});

/*
 * remove
 */
Tinytest.addAsync('cfs-file - remove', function(test, next) {
	var f = new FS.File('data:text/plain;base64,SGVsbG8gV29ybGQ=');
	var newId;
	fileCollection.insert(f, function (error, fileObj) {
		test.isFalse(!!error);
		test.instanceOf(fileObj, FS.File);
		newId = fileObj._id;
		test.isTrue(!!fileCollection.findOne(newId));
		// Wait 5 seconds to remove; otherwise we could
		// cause errors with the tempstore or SA trying
		// to save.
		Meteor.setTimeout(function () {
			fileObj.remove(function (error, result) {
				test.isFalse(!!error);
				test.equal(result, 1);
				test.isFalse(!!fileCollection.findOne(newId));
				next();
			});
		}, 5000);
	});
});

if (Meteor.isServer) {
	/*
	 * createWriteStream
	 */
	Tinytest.add('cfs-file - createWriteStream', function(test) {
		//TODO
		test.isTrue(true);
	});

	/*
	 * createReadStream
	 */
	Tinytest.add('cfs-file - createReadStream', function(test) {
		//TODO
		test.isTrue(true);
	});
}

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
