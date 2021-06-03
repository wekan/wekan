Package.describe({
  git: 'https://github.com/zcfs/Meteor-cfs-filesystem.git',
  name: 'wekan-cfs-filesystem',
  version: '0.1.2',
  summary: "Filesystem storage adapter for CollectionFS"
});

Npm.depends({
  //chokidar: "0.8.2",
  mkdirp: "0.3.5"
});

Package.onUse(function(api) {
  api.versionsFrom('1.0');

  api.use(['wekan-cfs-base-package@0.0.30', 'wekan-cfs-storage-adapter@0.2.1']);
  api.addFiles('filesystem.server.js', 'server');
  api.addFiles('filesystem.client.js', 'client');
});

Package.onTest(function(api) {
  api.use(['wekan-cfs-filesystem', 'test-helpers', 'tinytest'], 'server');
  api.addFiles('tests.js', 'server');
});
