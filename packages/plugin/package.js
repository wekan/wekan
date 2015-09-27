Package.describe({
  name: 'wekan:plugin',
  version: '0.0.9'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.0.1');
  api.use('ecmascript');

  api.addFiles('plugin.js','client');

  api.export('Wekan');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('wekan:plugin');
  api.addFiles('plugin-tests.js');
});
