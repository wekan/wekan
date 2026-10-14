self.addEventListener('install', function(event) {
  // Dummy service worker that does nothing,
  // for mobile browsers "Add to home screen".
});

// #2026 / #1377: browser push notifications (server/webPush.js). The payload
// is { title, body, url }; url is a path of this WeKan.
self.addEventListener('push', function(event) {
  var data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = {}; }
  var url = typeof data.url === 'string' && data.url.charAt(0) === '/' ? data.url : '/';
  event.waitUntil(self.registration.showNotification(data.title || 'WeKan', {
    body: data.body || '',
    icon: 'android-chrome-192x192.png',
    data: { url: url },
  }));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windows) {
    for (var i = 0; i < windows.length; i++) {
      if ('focus' in windows[i]) {
        windows[i].navigate(url);
        return windows[i].focus();
      }
    }
    return self.clients.openWindow(url);
  }));
});
