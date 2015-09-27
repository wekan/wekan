Package.describe({
  name: 'wekan:lib',
  version: '0.0.1',
  // Brief, one-line summary of the package.
  summary: '',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.0.1');
  packages = [
    'ecmascript',
    'mongo',
    'aldeed:simple-schema',
    'matb33:collection-hooks@0.8.0',
    'cfs:gridfs@0.0.33',
    'cfs:standard-packages@0.5.9',
  ];
  api.use(packages);
  api.imply(packages);
  api.addFiles('lib.js');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('wekan:lib');
  api.addFiles('lib-tests.js');
});
