function equals(a, b) {
  return !!(EJSON.stringify(a) === EJSON.stringify(b));
}

Tinytest.add('cfs-access-point - client - test environment', function(test) {
  test.isTrue(typeof FS.Collection !== 'undefined', 'test environment not initialized FS.Collection');
  test.isTrue(typeof FS.HTTP !== 'undefined', 'test environment not initialized FS.HTTP');
});

Images = new FS.Collection('images', {
  stores: [
    new FS.Store.GridFS('gridList')
  ]
});

Meteor.subscribe("img");

var id;

Tinytest.addAsync('cfs-access-point - client - addTestImage', function(test, onComplete) {
  Meteor.call('addTestImage', function(err, result) {
    id = result;
    test.equal(typeof id, "string", "Test image was not inserted properly");
    //Don't continue until the data has been stored
    Deps.autorun(function (c) {
      var img = Images.findOne(id);
      if (img && img.hasCopy('gridList')) {
        onComplete();
        c.stop();
      }
    });
  });
});

Tinytest.addAsync('cfs-access-point - client - GET list of files in collection', function(test, onComplete) {

  HTTP.get(Meteor.absoluteUrl('cfs/record/images'), function(err, result) {
    // Test the length of array result
    var len = result.data && result.data.length;
    test.isTrue(!!len, 'Result was empty');
    // Get the object
    var obj = result.data && result.data[0] || {};
    test.equal(obj._id, id, 'Didn\'t get the expected result');
    onComplete();
  });

});

Tinytest.addAsync('cfs-access-point - client - GET filerecord', function(test, onComplete) {

  HTTP.get(Meteor.absoluteUrl('cfs/record/images/' + id), function(err, result) {
    // Get the object
    var obj = result.data;
    test.equal(typeof obj, "object", "Expected object data");
    test.equal(obj._id, id, 'Didn\'t get the expected result');
    onComplete();
  });

});

Tinytest.addAsync('cfs-access-point - client - GET file itself', function(test, onComplete) {

  HTTP.get(Meteor.absoluteUrl('cfs/files/images/' + id), function(err, result) {
    test.isTrue(!!result.content, "Expected content in response");
    console.log(result);
    test.equal(result.statusCode, 200, "Expected 200 OK response");
    onComplete();
  });

});

Tinytest.addAsync('cfs-access-point - client - PUT new file data (update)', function(test, onComplete) {
// TODO
//  HTTP.put(Meteor.absoluteUrl('cfs/files/images/' + id), function(err, result) {
//    test.equal(result.statusCode, 200, "Expected 200 OK response");
  onComplete();
//  });

});

Tinytest.addAsync('cfs-access-point - client - PUT insert a new file', function(test, onComplete) {
// TODO
//  HTTP.put(Meteor.absoluteUrl('cfs/files/images'), function(err, result) {
//    test.equal(result.statusCode, 200, "Expected 200 OK response");
  onComplete();
//  });

});

Tinytest.addAsync('cfs-access-point - client - DELETE filerecord and data', function(test, onComplete) {

  HTTP.del(Meteor.absoluteUrl('cfs/files/images/' + id), function(err, result) {
    test.equal(result.statusCode, 200, "Expected 200 OK response");

    // Make sure it's gone
    HTTP.get(Meteor.absoluteUrl('cfs/record/images/' + id), function(err, result) {
      test.isTrue(!!err, 'Expected 404 error');
      test.equal(result.statusCode, 404, "Expected 404 response");
      onComplete();
    });
  });

});

//TODO test FS.File.prototype.url method with various options

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
