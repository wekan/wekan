'use strict';

// Docker Desktop on macOS does not share the host loopback with containers.
// Keep the test browser's origin equal to the bundle's ROOT_URL while sending
// HTTP and WebSocket traffic to the host through Docker's gateway name.
const net = require('node:net');

const port = Number(process.env.WEKAN_DOCKER_HOST_PROXY_PORT);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('Invalid WEKAN_DOCKER_HOST_PROXY_PORT');
  process.exit(2);
}

const server = net.createServer(client => {
  const upstream = net.connect(port, 'host.docker.internal');
  client.pipe(upstream);
  upstream.pipe(client);
  client.on('error', () => upstream.destroy());
  upstream.on('error', () => client.destroy());
  client.on('close', () => upstream.destroy());
  upstream.on('close', () => client.destroy());
});
server.on('error', error => {
  console.error('WeKan Docker test proxy:', error);
  process.exit(1);
});
server.listen(port, '127.0.0.1');
