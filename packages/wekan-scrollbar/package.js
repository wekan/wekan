Package.describe({
  summary: "A wrapper for Malihu Custom Scrollbar. Highly customizable custom scrollbar jQuery plugin",
  version: "3.1.3",
  git: "https://github.com/MaazAli/Meteor-Malihu-Custom-Scrollbar.git"
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@0.9.0.1');

  api.use('jquery');

  // JS
  api.addFiles('jquery.mousewheel.js', 'client');
  api.addFiles('jquery.mCustomScrollbar.js', 'client');

  // CSS

  api.addFiles('jquery.mCustomScrollbar.css', 'client');

});

