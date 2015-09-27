Package.describe({
  name: 'wekan:attachments',
  version: '0.0.9'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.0.1');
  api.use('ecmascript');
  api.use('wekan:lib');
  api.addFiles('attachments.js');
  api.export('Attachments');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('wekan:attachments');
  api.addFiles('attachments-tests.js');
});
