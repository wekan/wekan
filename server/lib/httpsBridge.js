'use strict';

// The TLS listener of optional HTTPS (#916): encrypted connections in, each
// decrypted socket handed to an existing HTTP server - Meteor's, in WeKan -
// which serves it exactly as a plain connection, websocket upgrades included.
// No Meteor here, so tests/httpsServer.test.cjs runs it with a real
// certificate and a plain http.Server.
const fs = require('fs');
const tls = require('tls');

function startHttpsBridge(httpServer, config, { readConfig = null, log = console } = {}) {
  const server = tls.createServer({ cert: config.cert, key: config.key, ALPNProtocols: ['http/1.1'] }, socket => {
    httpServer.emit('connection', socket);
  });
  server.on('tlsClientError', () => { /* a client that cannot speak TLS: its problem */ });
  server.on('error', error => log.error(`HTTPS server: ${error.message}`));

  // Renewed certificates are picked up without a restart.
  const watched = [];
  if (readConfig) {
    const reload = () => {
      try {
        const next = readConfig();
        if (next) server.setSecureContext({ cert: next.cert, key: next.key });
        log.log('HTTPS certificate reloaded.');
      } catch (error) {
        log.error(`HTTPS certificate not reloaded, keeping the current one: ${error.message}`);
      }
    };
    for (const file of [config.certPath, config.keyPath].filter(Boolean)) {
      fs.watchFile(file, { interval: 60000 }, (now, before) => {
        if (now.mtimeMs !== before.mtimeMs) reload();
      });
      watched.push(file);
    }
  }
  const close = () => {
    for (const file of watched) fs.unwatchFile(file);
    server.close();
  };
  return { server, close };
}

module.exports = { startHttpsBridge };
