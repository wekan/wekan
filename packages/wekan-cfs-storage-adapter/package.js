Package.describe({
  git: 'https://github.com/zcfs/Meteor-cfs-storage-adapter.git',
  name: 'wekan-cfs-storage-adapter',
  version: '0.2.4',
  summary: 'CollectionFS, Class for creating Storage adapters'
});

Npm.depends({
  'length-stream': '0.1.1'
});

Package.onUse(function(api) {
  api.versionsFrom('1.0');

  api.use([
    // CFS
    'wekan-cfs-base-package@0.0.30',
    // Core
    'deps',
    'check',
    'livedata',
    'mongo-livedata',
    'ejson',
    // Other
    'raix:eventemitter@0.1.1'
  ]);

  // We want to make sure that its added to scope for now if installed.
  // We have set a deprecation warning on the transform scope
  api.use('wekan-cfs-graphicsmagick@0.0.17', 'server', { weak: true });

  api.addFiles([
    'storageAdapter.client.js'
  ], 'client');

  api.addFiles([
    'storageAdapter.server.js',
    'transform.server.js'
  ], 'server');
});

Package.onTest(function (api) {
  api.use('wekan-cfs-storage-adapter');
  api.use('test-helpers', 'server');
  api.use(['tinytest', 'underscore', 'ejson', 'ordered-dict',
           'random', 'deps']);

  api.addFiles('tests/server-tests.js', 'server');
  api.addFiles('tests/client-tests.js', 'client');
});
