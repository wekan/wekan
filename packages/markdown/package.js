// Source: https://github.com/chjj/marked

Package.describe({
	name: 'wekan-markdown',
	summary: "GitHub flavored markdown parser for Meteor based on marked.js",
	version: "1.0.7",
	git: "https://github.com/wekan/markdown.git"
});

// Before Meteor 0.9?
if(!Package.onUse) Package.onUse = Package.on_use;

Package.onUse(function (api) {
	if(api.versionsFrom) api.versionsFrom('METEOR@0.9.0');

	api.use('templating');

	api.add_files('marked/lib/marked.js', ['server', 'client']);
	api.add_files('markdown.js', ['server', 'client']);
	api.export('Markdown', ['server', 'client']);

	api.use("ui", "client", {weak: true});
	api.add_files("template-integration.js", "client");
});
