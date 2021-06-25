Package.describe({
  name: 'wekan-tap-i18n',
  summary: 'A comprehensive internationalization solution for Meteor',
  version: '1.8.1',
  git: 'https://github.com/TAPevents/tap-i18n'
});

both = ['server', 'client'];
server = 'server';
client = 'client';

Package.onUse(function (api) {
  api.versionsFrom('0.9.4');

  api.use('coffeescript', both);
  api.use('underscore', both);
  api.use('meteor', both);

  api.use('raix:eventemitter@0.1.1', both);
  api.use('meteorspark:util@0.2.0', both);

  api.use('tracker', both);
  api.use('session', client);
  api.use('jquery', client);
  api.use('templating', client);

  // load TAPi18n
  api.addFiles('lib/globals.js', both);

  // load and init TAPi18next
  api.addFiles('lib/tap_i18next/tap_i18next-1.7.3.js', both);
  api.export('TAPi18next');
  api.addFiles('lib/tap_i18next/tap_i18next_init.js', both);

  api.addFiles('lib/tap_i18n/tap_i18n-helpers.coffee', both);

  // We use the bare option since we need TAPi18n in the package level and
  // coffee adds vars to all (so without bare all vars are in the file level)
  api.addFiles('lib/tap_i18n/tap_i18n-common.coffee', server);
  api.addFiles('lib/tap_i18n/tap_i18n-common.coffee', client, {bare: true});

  api.addFiles('lib/tap_i18n/tap_i18n-server.coffee', server);
  api.addFiles('lib/tap_i18n/tap_i18n-client.coffee', client, {bare: true});

  api.addFiles('lib/tap_i18n/tap_i18n-init.coffee', server);
  api.addFiles('lib/tap_i18n/tap_i18n-init.coffee', client, {bare: true});

  api.export('TAPi18n');
});

Package.registerBuildPlugin({
  name: 'tap-i18n-compiler',
  use: ['coffeescript', 'underscore', 'aldeed:simple-schema@1.3.0', 'check@1.0.3', 'templating'],
  npmDependencies: {
    "node-json-minify": "0.1.3-a",
    "yamljs": "0.2.4"
  },
  sources: [
    'lib/globals.js',

    'lib/plugin/etc/language_names.js',

    'lib/plugin/compiler_configuration.coffee',

    'lib/plugin/helpers/helpers.coffee',
    'lib/plugin/helpers/load_json.coffee',
    'lib/plugin/helpers/load_yml.coffee',
    'lib/plugin/helpers/compile_step_helpers.coffee',

    'lib/plugin/compilers/share.coffee',
    'lib/plugin/compilers/i18n.coffee',
    'lib/plugin/compilers/project-tap.i18n.coffee',
    'lib/plugin/compilers/package-tap.i18n.coffee',
    'lib/plugin/compilers/i18n.generic_compiler.coffee',
    'lib/plugin/compilers/i18n.json.coffee',
    'lib/plugin/compilers/i18n.yml.coffee'
  ]
});
