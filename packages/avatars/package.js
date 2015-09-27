Package.describe({
  name: 'wekan:avatars',
  version: '0.0.9'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.0.1');
  api.use('ecmascript');
  api.use('wekan:lib');
  api.addFiles('avatars.js');
  api.export('Avatars');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('wekan:avatars');
  api.addFiles('avatars-tests.js');
});
