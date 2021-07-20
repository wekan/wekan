Package.describe({
  name: 'wekan-cfs-gridfs',
  version: '0.0.34',
  summary: 'GridFS storage adapter for CollectionFS',
  git: 'https://github.com/zcfs/Meteor-cfs-gridfs.git'
});

Npm.depends({
  mongodb: '2.2.9',
  'gridfs-stream': '1.1.1'
  //'gridfs-locking-stream': '0.0.3'
});

Package.onUse(function (api) {
  api.use(['wekan-cfs-base-package@0.0.30', 'wekan-cfs-storage-adapter@0.2.3', 'ecmascript@0.1.0']);
  api.addFiles('gridfs.server.js', 'server');
  api.addFiles('gridfs.client.js', 'client');
});

Package.onTest(function (api) {
  api.use(['wekan-cfs-gridfs', 'test-helpers', 'tinytest'], 'server');
  api.addFiles('tests/server-tests.js', 'server');
  api.addFiles('tests/client-tests.js', 'client');
});
