// Load the transport fix from source into a published bundle for native regression
// testing. No generated bundle is modified. A rebuilt image needs no such preload.
const { installNextcloudTransport } = require('../../server/lib/nextcloudTransport');
const deadline = Date.now() + 60000;
const timer = setInterval(() => {
  const Meteor = global.Package?.meteor?.Meteor;
  const WebApp = global.Package?.webapp?.WebApp;
  if (Meteor?.server?.stream_server && WebApp?.httpServer) {
    clearInterval(timer);
    installNextcloudTransport(WebApp.httpServer, Meteor.server.stream_server);
    console.log('Nextcloud source transport hook loaded');
  } else if (Date.now() > deadline) {
    console.error('Could not load Nextcloud source transport hook'); process.exit(1);
  }
}, 10);
