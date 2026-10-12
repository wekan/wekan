'use strict';

// Wait for the database listener, not a guessed startup duration. Mongo's driver
// and the app's database readiness hook still perform protocol-level checks.
module.exports = function waitForPort(port, { timeoutMs = 30000, retryMs = 50 } = {}) {
  const net = require('net');
  return new Promise((resolve, reject) => {
    let socket;
    let retry;
    let settled = false;
    const deadline = setTimeout(() => finish(new Error(
      `Timed out waiting for database listener on 127.0.0.1:${port}`)), timeoutMs);
    function finish(error) {
      if (settled) return;
      settled = true;
      clearTimeout(deadline);
      clearTimeout(retry);
      if (socket) socket.destroy();
      if (error) reject(error); else resolve();
    }
    function connect() {
      socket = net.createConnection({ host: '127.0.0.1', port: Number(port) });
      socket.once('connect', () => finish());
      socket.once('error', () => {
        socket.destroy();
        if (settled) return;
        retry = setTimeout(connect, retryMs);
      });
    }
    connect();
  });
};
