Package.describe({
  name: 'wekan-cfs-collection',
  version: '0.5.5',
  summary: 'CollectionFS, FS.Collection object',
  git: 'https://github.com/zcfs/Meteor-cfs-collection.git'
});

Package.onUse(function(api) {
  api.versionsFrom('1.0');

  api.use([
    // CFS
    'wekan-cfs-base-package@0.0.30',
    'wekan-cfs-tempstore@0.1.4',
    // Core
    'deps',
    'check',
    'livedata',
    'mongo-livedata',
    // Other
    'raix:eventemitter@0.1.1'
  ]);

  // Weak dependencies for uploaders
  api.use(['wekan-cfs-upload-http@0.0.20', 'wekan-cfs-upload-ddp@0.0.17'], { weak: true });

  api.addFiles([
    'common.js',
    'api.common.js'
  ], 'client');

  api.addFiles([
    'common.js',
    'api.common.js'
  ], 'server');
});

Package.onTest(function (api) {
  api.use(['wekan-cfs-standard-packages', 'wekan-cfs-gridfs', 'tinytest', 'underscore', 'test-helpers']);

  api.addFiles('tests/server-tests.js', 'server');
  api.addFiles('tests/client-tests.js', 'client');
});
