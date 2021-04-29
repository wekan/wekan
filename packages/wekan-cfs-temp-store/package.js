 Package.describe({
  git: 'https://github.com/zcfs/Meteor-cfs-tempstore.git',
  name: 'wekan-cfs-tempstore',
  version: '0.1.6',
  summary: 'CollectionFS, temporary storage'
});

Npm.depends({
  'combined-stream': '0.0.4'
});

Package.onUse(function(api) {
  api.use(['wekan-cfs-base-package@0.0.30', 'wekan-cfs-file@0.1.16', 'ecmascript@0.1.0']);

  api.use('wekan-cfs-filesystem@0.1.2', { weak: true });
  api.use('wekan-cfs-gridfs@0.0.30', { weak: true });

  api.use('mongo@1.0.0');

  api.addFiles([
    'tempStore.js'
  ], 'server');
});

// Package.on_test(function (api) {
//   api.use('collectionfs');
//   api.use('test-helpers', 'server');
//   api.use(['tinytest', 'underscore', 'ejson', 'ordered-dict',
//            'random', 'deps']);

//   api.addFiles('tests/server-tests.js', 'server');
// });
