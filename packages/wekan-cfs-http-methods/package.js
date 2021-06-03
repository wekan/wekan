Package.describe({
  git: 'https://github.com/zcfs/Meteor-http-methods.git',
  name: 'wekan-cfs-http-methods',
  version: '0.0.32',
  summary: 'Adds HTTP.methods RESTful'
});

Package.onUse(function(api) {
  api.versionsFrom('1.0');

  api.use(['webapp', 'underscore', 'ejson'], 'server');

  api.use('http', { weak: true });

  api.export && api.export('HTTP');

  api.export && api.export('_methodHTTP', { testOnly: true });

  api.addFiles('http.methods.client.api.js', 'client');
  api.addFiles('http.methods.server.api.js', 'server');

});

Package.onTest(function (api) {
  api.use('wekan-cfs-http-methods', ['server']);
  api.use('test-helpers', 'server');
  api.use(['tinytest', 'underscore', 'ejson', 'ordered-dict',
           'random', 'deps']);

  api.addFiles('http.methods.tests.js', 'server');
});
