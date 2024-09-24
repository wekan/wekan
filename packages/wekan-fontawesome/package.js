Package.describe({
  name: 'wekan-fontawesome',
  summary: 'Font Awesome (official)',
  version: '6.4.2',
  git: 'https://github.com/MeteorPackaging/Font-Awesome.git',
  documentation: 'README.md'
});


Package.onUse(function(api) {
  api.addAssets([
    'fontawesome-free/webfonts/fa-brands-400.ttf',
    'fontawesome-free/webfonts/fa-brands-400.woff2',
    'fontawesome-free/webfonts/fa-regular-400.ttf',
    'fontawesome-free/webfonts/fa-regular-400.woff2',
    'fontawesome-free/webfonts/fa-solid-900.ttf',
    'fontawesome-free/webfonts/fa-solid-900.woff2',
    'fontawesome-free/webfonts/fa-v4compatibility.ttf',
    'fontawesome-free/webfonts/fa-v4compatibility.woff2',
  ], 'client');

  api.addFiles([
    'fontawesome-free/css/all.css',
    'fontawesome-free/css/brands.css',
    'fontawesome-free/css/fontawesome.css',
    'fontawesome-free/css/regular.css',
    'fontawesome-free/css/solid.css',
    'fontawesome-free/css/svg-with-js.css',
    'fontawesome-free/css/v4-font-face.css',
    'fontawesome-free/css/v4-shims.css',
    'fontawesome-free/css/v5-font-face.css',
  ], 'client');
});
