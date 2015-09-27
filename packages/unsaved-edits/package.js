Package.describe({
  name: 'wekan:unsaved-edits',
  version: '0.0.9'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.0.1');
  api.use('ecmascript');
  api.use('wekan:lib');
  api.addFiles('unsaved-edits.js');
  api.export('UnsavedEditCollection');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('wekan:unsaved-edits');
  api.addFiles('unsaved-edits-tests.js');
});
