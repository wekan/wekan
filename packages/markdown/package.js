Package.describe({
	name: 'wekan-markdown',
	summary: 'GitHub flavored markdown parser for Meteor based on markdown-it',
	version: '1.0.9',
	git: 'https://github.com/wekan/markdown.git',
});

// Before Meteor 0.9?
if(!Package.onUse) Package.onUse = Package.on_use;

Package.onUse(function (api) {
	if(api.versionsFrom) api.versionsFrom('1.8.2');

	api.use('templating');
  api.use("ecmascript", ['server', 'client']);

	api.export('Markdown', ['server', 'client']);

  api.use('ui', 'client', {weak: true});

	api.add_files('src/template-integration.js', 'client');
});
