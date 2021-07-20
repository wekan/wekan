Package.describe({
  name: 'wekan-cfs-data-man',
  version: '0.0.6',
  summary: 'A data manager, allowing you to attach various types of data and get it back in various other types',
  git: 'https://github.com/zcfs/Meteor-data-man.git'
});

Npm.depends({
  mime: "1.2.11",
  'buffer-stream-reader': "0.1.1",
  //request: "2.44.0",
  // We use a specific commit from a fork of "request" package for now; we need fix for
  // https://github.com/mikeal/request/issues/887 (https://github.com/zcfs/Meteor-CollectionFS/issues/347)
  request: "https://github.com/wekan/request",
  temp: "0.7.0" // for tests only
});

Package.onUse(function(api) {
  api.versionsFrom('1.0');

  api.use(['ejson']);

  api.use(['wekan-cfs-filesaver@0.0.6'], {weak: true});

  api.export('DataMan');

  api.addFiles([
    'client/Blob.js', //polyfill for browsers without Blob constructor; currently necessary for phantomjs support, too
    'client/data-man-api.js'
  ], 'client');

  api.addFiles([
    'server/data-man-api.js',
    'server/data-man-buffer.js',
    'server/data-man-datauri.js',
    'server/data-man-filepath.js',
    'server/data-man-url.js',
    'server/data-man-readstream.js'
  ], 'server');

});

Package.onTest(function (api) {
  api.use(['wekan-cfs-data-man', 'http', 'tinytest', 'test-helpers', 'wekan-cfs-http-methods@0.0.29']);

  api.addFiles(['tests/common.js', 'tests/client-tests.js'], 'client');
  api.addFiles(['tests/common.js', 'tests/server-tests.js'], 'server');
});
