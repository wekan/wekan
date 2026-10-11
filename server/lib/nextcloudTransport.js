'use strict';
const { nextcloudIdentity } = require('./nextcloudIdentity');

// SockJS deliberately exposes only a small header allowlist on DDP connections.
// Preserve verified identity from the actual upgrade socket before that filtering.
// Never accept identity from a DDP message or a browser-visible token.
function installNextcloudTransport(httpServer, streamServer, env = process.env) {
  if (env.NEXTCLOUD_EXAPP !== 'true') return;
  const handshakes = new WeakMap();
  httpServer.prependListener('upgrade', (request, socket) => {
    handshakes.delete(socket);
    if (!nextcloudIdentity(request.headers, env)) return;
    handshakes.set(socket, {
      'x-wekan-nextcloud-user': request.headers['x-wekan-nextcloud-user'],
      'x-wekan-nextcloud-signature': request.headers['x-wekan-nextcloud-signature'],
    });
  });
  // The callback runs when SockJS creates its stream, before any DDP connect/login
  // messages. Meteor's session then uses this same socket.headers object.
  streamServer.register(socket => {
    const rawSocket = socket._session?.recv?.connection;
    const identity = rawSocket && handshakes.get(rawSocket);
    if (identity) Object.assign(socket.headers, identity);
  });
}
module.exports = { installNextcloudTransport };
