Package.describe({
  name: 'wekan:boards',
  version: '0.0.9'
});

Package.onUse(function(api) {
  api.versionsFrom('1.2.0.1');
  api.use('ecmascript');
  api.use('wekan:lib');

  api.addFiles('boards.js');

  api.addFiles([
    'server/utils.js'
  ],'server');

  api.export('Boards');
  api.export( 'allowIsBoardMember' );
});

Package.onTest(function(api) {
  api.use('ecmascript');
  api.use('tinytest');
  api.use('wekan:boards');
  api.addFiles('boards-tests.js');
});
