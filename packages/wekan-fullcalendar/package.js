Package.describe({
  name: 'wekan-fullcalendar',
  summary: 'Full-sized drag & drop event calendar (jQuery plugin)',
  version: '5.11.5',
  git: 'https://github.com/fullcalendar/fullcalendar.git',
});

Npm.depends({
  '@fullcalendar/core': '5.11.5',
  '@fullcalendar/daygrid': '5.11.5',
  '@fullcalendar/interaction': '5.11.5',
  '@fullcalendar/list': '5.11.5',
  '@fullcalendar/timegrid': '5.11.5',
});

Package.onUse(function(api) {
  api.versionsFrom(['2.16', '3.0']);
  api.use(['ecmascript', 'templating', 'tracker'], 'client');
  api.addFiles(
    [
      '.npm/package/node_modules/@fullcalendar/common/main.min.css',
      '.npm/package/node_modules/@fullcalendar/daygrid/main.min.css',
      '.npm/package/node_modules/@fullcalendar/timegrid/main.min.css',
      '.npm/package/node_modules/@fullcalendar/list/main.min.css',
      'template.html',
      'template.js',
    ],
    'client',
  );
});
