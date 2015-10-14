Package.describe({
  name: 'wekan:lists',
  version: '0.0.9'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.0.1');
  api.use('ecmascript');
  api.use('wekan:lib');
  api.addFiles('lists.js');
  api.export('Lists');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('wekan:lists');
  api.addFiles('lists-tests.js');
});
