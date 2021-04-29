function equals(a, b) {
  return EJSON.stringify(a) === EJSON.stringify(b);
}

Tinytest.add('cfs-base-package - test environment', function(test) {
  test.isTrue(typeof FS !== 'undefined',
              'FS scope not declared');

  test.isTrue(typeof FS.Store !== 'undefined',
              'FS scope "FS.Store" not declared');

  test.isTrue(typeof FS.AccessPoint !== 'undefined',
              'FS scope "FS.AccessPoint" not declared');

  test.isTrue(typeof FS.Utility !== 'undefined',
              'FS scope "FS.Utility" not declared');

  test.isTrue(typeof FS._collections !== 'undefined',
              'FS scope "FS._collections" not declared');

  test.isTrue(typeof _Utility !== 'undefined',
              '_Utility test scope not declared');
});

Tinytest.add('cfs-base-package - _Utility.defaultZero', function(test) {
  test.equal(_Utility.defaultZero(), 0, 'Failes to return 0 when (undefined)');
  test.equal(_Utility.defaultZero(undefined), 0, 'Failes to return 0 when undefined');
  test.equal(_Utility.defaultZero(null), 0, 'Failes to return 0 when null');
  test.equal(_Utility.defaultZero(false), 0, 'Failes to return 0 when false');
  test.equal(_Utility.defaultZero(0), 0, 'Failes to return 0 when 0');
  test.equal(_Utility.defaultZero(-1), -1, 'Failes to return -1');
  test.equal(_Utility.defaultZero(1), 1, 'Failes to return 1');
  test.equal(_Utility.defaultZero(-0.1), -0.1, 'Failes to return -0.1');
  test.equal(_Utility.defaultZero(0.1), 0.1, 'Failes to return 0.1');
  test.equal(_Utility.defaultZero(''), 0, 'Failes to return ""');
  test.equal(_Utility.defaultZero({}), NaN, 'Failes to return NaN when object');
  test.equal(_Utility.defaultZero("dfdsfs"), NaN, 'Failes to return NaN when string');
  test.equal(_Utility.defaultZero("1"), 1, 'Failes to return 1 when string "1"');
});

Tinytest.add('cfs-base-package - FS.Utility.cloneFileRecord', function(test) {
  // Given an object with any props, should filter out 'collectionName',
  // 'collection', 'data', and 'createdByTransform'
  var result = FS.Utility.cloneFileRecord({a: 1, b: {c: 1}, d: [1, 2], collectionName: 'test', collection: {}, data: {}, createdByTransform: false});
  test.equal(result, {a: 1, b: {c: 1}, d: [1, 2]});

  // Given an FS.File instance, should filter out 'collectionName',
  // 'collection', 'data', and 'createdByTransform' and return a plain Object
  var fileObj = new FS.File({a: 1, b: {c: 1}, d: [1, 2], name: 'name.png', type: 'image/png', size: 100, collectionName: 'test', collection: {}, data: {}, createdByTransform: false});
  test.isTrue(fileObj instanceof FS.File);
  var result = FS.Utility.cloneFileRecord(fileObj);
  test.isFalse(result instanceof FS.File);
  test.isTrue(equals(result, {a: 1, b: {c: 1}, d: [1, 2], name: 'name.png', type: 'image/png', size: 100}));
});

Tinytest.add('cfs-base-package - FS.Utility.defaultCallback', function(test) {
  // should throw an error passed in, but not a Meteor.Error
  test.throws(function () {
    var cb = FS.Utility.defaultCallback;
    cb(new Error('test'));
  });

  var cb2 = FS.Utility.defaultCallback;
  test.isUndefined(cb2(new Meteor.Error('test')));
});

Tinytest.add('cfs-base-package - FS.Utility.handleError', function(test) {
  test.isTrue(true);
  // TODO
});

Tinytest.add('cfs-base-package - FS.Utility.binaryToBuffer', function(test) {
  test.isTrue(true);
  // TODO
});

Tinytest.add('cfs-base-package - FS.Utility.bufferToBinary', function(test) {
  test.isTrue(true);
  // TODO
});

Tinytest.add('cfs-base-package - FS.Utility.connectionLogin', function(test) {
  test.isTrue(true);
  // TODO
});

Tinytest.add('cfs-base-package - FS.Utility.getFileName', function(test) {

  function t(input, expected) {
    var ext = FS.Utility.getFileName(input);
    test.equal(ext, expected, 'Got incorrect filename');
  }

  t('bar.png', 'bar.png');
  t('foo/bar.png', 'bar.png');
  t('/foo/foo/bar.png', 'bar.png');
  t('http://foobar.com/file.png', 'file.png');
  t('http://foobar.com/file', 'file');
  t('http://foobar.com/file.png?a=b', 'file.png');
  t('http://foobar.com/.file?a=b', '.file');
  t('file', 'file');
  t('.file', '.file');
  t('foo/.file', '.file');
  t('/foo/foo/.file', '.file');
});

Tinytest.add('cfs-base-package - FS.Utility.getFileExtension', function(test) {

  function t(input, expected) {
    var ext = FS.Utility.getFileExtension(input);
    test.equal(ext, expected, 'Got incorrect extension');
  }

  t('bar.png', 'png');
  t('foo/bar.png', 'png');
  t('/foo/foo/bar.png', 'png');
  t('http://foobar.com/file.png', 'png');
  t('http://foobar.com/file', '');
  t('http://foobar.com/file.png?a=b', 'png');
  t('http://foobar.com/file?a=b', '');
  t('file', '');
  t('.file', '');
  t('foo/.file', '');
  t('/foo/foo/.file', '');
});

Tinytest.add('cfs-base-package - FS.Utility.setFileExtension', function(test) {

  function t(name, ext, expected) {
    var newName = FS.Utility.setFileExtension(name, ext);
    test.equal(newName, expected, 'Extension was not set correctly');
  }

  t('bar.png', 'jpeg', 'bar.jpeg');
  t('bar', 'jpeg', 'bar.jpeg');
  t('.bar', 'jpeg', '.bar.jpeg');
  t('', 'jpeg', '');
  t(null, 'jpeg', null);
});

//Test API:
//Tinytest.add('', function(test) {});
//Tinytest.addAsync('', function(test, onComplete) {});
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
