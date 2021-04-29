Package.describe({
  git: 'https://github.com/zcfs/Meteor-cfs-worker.git',
  name: 'wekan-cfs-worker',
  version: '0.1.5',
  summary: 'CollectionFS, file worker - handles file copies/versions'
});

Package.onUse(function(api) {
  api.use([
    'wekan-cfs-base-package@0.0.30',
    'wekan-cfs-tempstore@0.1.6',
    'wekan-cfs-storage-adapter@0.2.1'
  ]);

  api.use([
    'livedata@1.0.0',
    'mongo-livedata@1.0.0',
    'wekan-cfs-power-queue@0.9.11'
  ]);

  api.addFiles([
    'fileWorker.js'
  ], 'server');
});

// Package.on_test(function (api) {
//   api.use('wekan-cfs-standard-packages@0.0.0');

//   api.use('test-helpers', 'server');
//   api.use(['tinytest', 'underscore', 'ejson', 'ordered-dict', 'random']);

//   api.addFiles('tests/client-tests.js', 'client');
//   api.addFiles('tests/server-tests.js', 'server');
// });
