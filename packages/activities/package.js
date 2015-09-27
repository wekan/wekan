Package.describe({
  name: 'wekan:activities',
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
  api.use([
    'ecmascript',
    'wekan:lib'
  ]);
  api.addFiles('activities.js');
  api.export('Activities');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('wekan:activities');
  api.addFiles('activities-tests.js');
});
