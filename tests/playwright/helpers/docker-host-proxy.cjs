'use strict';

// Docker Desktop on macOS does not share the host loopback with containers.
// Keep the test browser's origin equal to the bundle's ROOT_URL while sending
// HTTP and WebSocket traffic to the host through Docker's gateway name.
//
// Docker Desktop's gateway now and then never answers one connect: under a
// whole-suite run a SYN to host.docker.internal sat unanswered through nine
// retransmits while the next connection went through at once. Waiting on it
// left a page with no document for the test's whole timeout. So a connect that
// has not completed in CONNECT_TIMEOUT_MS is dropped and dialled again. The
// browser's bytes are not read until a connection is up (pauseOnConnect), so
// nothing is lost or sent twice.
const net = require('node:net');

const CONNECT_TIMEOUT_MS = 1500;
const ATTEMPTS = 5;

function createProxy({
  port,
  dial = () => net.connect(port, 'host.docker.internal'),
  connectTimeoutMs = CONNECT_TIMEOUT_MS,
  attempts = ATTEMPTS,
}) {
  return net.createServer({ pauseOnConnect: true }, client => {
    let upstream = null;
    client.on('error', () => upstream && upstream.destroy());
    client.on('close', () => upstream && upstream.destroy());
    const attempt = n => {
      if (client.destroyed) return;
      const socket = dial();
      upstream = socket;
      const timer = setTimeout(() => {
        socket.destroy();
        if (n < attempts) attempt(n + 1);
        else client.destroy();
      }, connectTimeoutMs);
      socket.once('connect', () => {
        clearTimeout(timer);
        socket.on('close', () => client.destroy());
        client.pipe(socket);
        socket.pipe(client);
      });
      socket.on('error', () => {
        clearTimeout(timer);
        client.destroy();
      });
    };
    attempt(1);
  });
}

if (require.main === module) {
  const port = Number(process.env.WEKAN_DOCKER_HOST_PROXY_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error('Invalid WEKAN_DOCKER_HOST_PROXY_PORT');
    process.exit(2);
  }
  const server = createProxy({ port });
  server.on('error', error => {
    console.error('WeKan Docker test proxy:', error);
    process.exit(1);
  });
  server.listen(port, '127.0.0.1');
}

module.exports = { createProxy, CONNECT_TIMEOUT_MS, ATTEMPTS };
