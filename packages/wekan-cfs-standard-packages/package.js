Package.describe({
  git: 'https://github.com/zcfs/Meteor-CollectionFS.git',
  name: 'wekan-cfs-standard-packages',
  version: '0.5.10',
  summary: 'Filesystem for Meteor, collectionFS'
});

Package.onUse(function(api) {
  // Rig the collectionFS package v2
  api.imply([
    // Base util rigs the basis for the FS scope and some general helper mehtods
    'wekan-cfs-base-package@0.0.30',
    // Want to make use of the file object and its api, yes!
    'wekan-cfs-file@0.1.17',
    // Add the FS.Collection to keep track of everything
    'wekan-cfs-collection@0.5.5',
    // Support filters for easy rules about what may be inserted
    'wekan-cfs-collection-filters@0.2.4',
    // Add the option to have ddp and http access point
    'wekan-cfs-access-point@0.1.49',
    // We might also want to have the server create copies of our files?
    'wekan-cfs-worker@0.1.5',
    // By default we want to support uploads over HTTP
    'wekan-cfs-upload-http@0.0.20',
  ]);
});

Package.onTest(function (api) {
  api.use('wekan-cfs-standard-packages');
  api.use('test-helpers@1.0.0', 'server');
  api.use([
    'tinytest@1.0.0',
    'underscore@1.0.0',
    'ejson@1.0.0',
    'ordered-dict@1.0.0',
    'random@1.0.0',
    'tracker@1.0.3'
  ]);

  api.addFiles('tests/server-tests.js', 'server');
  api.addFiles('tests/client-tests.js', 'client');
});
