function equals(a, b) {
  return !!(EJSON.stringify(a) === EJSON.stringify(b));
}

FS.debug = true;

Tinytest.add('cfs-access-point - server - test environment', function(test) {
  test.isTrue(typeof FS.Collection !== 'undefined', 'test environment not initialized FS.Collection');
  test.isTrue(typeof FS.HTTP !== 'undefined', 'test environment not initialized FS.HTTP');
});

Images = new FS.Collection('images', {
  stores: [
    new FS.Store.GridFS('gridList')
  ]
});

Images.allow({
  insert: function() {
    return true;
  },
  update: function() {
    return true;
  },
  remove: function() {
    return true;
  },
  download: function() {
    return true;
  }
});

Meteor.publish("img", function () {
  return Images.find();
});

FS.HTTP.publish(Images, function () {
  return Images.find();
});

Meteor.methods({
  addTestImage: function() {
    Images.remove({});
    var url = "http://cdn.morguefile.com/imageData/public/files/b/bboomerindenial/preview/fldr_2009_04_01/file3301238617907.jpg";
    var fsFile = Images.insert(url);
    return fsFile._id;
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
