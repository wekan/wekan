Package.describe({
  name: 'wekan:cards',
  version: '0.0.9'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.0.1');
  api.use('ecmascript');
  api.use('wekan:lib');
  api.addFiles('cards.js');
  api.export('Cards');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('wekan:cards');
  api.addFiles('cards-tests.js');
});
