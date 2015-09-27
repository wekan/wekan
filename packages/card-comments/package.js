Package.describe({
  name: 'wekan:card-comments',
  version: '0.0.9'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.0.1');
  api.use('ecmascript');
  api.use('wekan:lib');
  api.use('wekan:cards');
  api.addFiles('card-comments.js');
  api.export('CardComments');
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('wekan:card-comments');
  api.addFiles('card-comments-tests.js');
});
