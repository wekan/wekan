Package.describe({
  name: 'wekan:activities',
  version: '0.0.9'
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
