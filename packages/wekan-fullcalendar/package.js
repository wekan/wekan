Package.describe({
    name: 'wekan-fullcalendar',
    summary: "Full-sized drag & drop event calendar (jQuery plugin)",
    version: "3.10.5",
    git: "https://github.com/fullcalendar/fullcalendar.git"
});

Package.onUse(function(api) {
    api.use([
        'momentjs:moment',
        'templating'
    ], 'client');
    api.addFiles([
        'template.html',
        'template.js',
        'fullcalendar/fullcalendar.js',
        'fullcalendar/fullcalendar.css',
        'fullcalendar/locale-all.js',
        'fullcalendar/gcal.js',
    ], 'client');
});
