'use strict';

// Local-only SMTP capture for notification regressions. No mail is relayed.
const net = require('node:net');

// The test app has ONE MAIL_URL port (build.sh: WEKAN_TEST_SMTP_PORT, 2525),
// and every spec that captures mail opens its sink on it. With more than one
// Playwright worker two of them can run at once, and the second one's listen
// failed with EADDRINUSE (rule-email-linked-source.e2e.js in a two-worker
// run). Wait for the other spec's sink to close instead - it closes in its
// finally - and give the waiting test that time back, so the wait is not
// taken from its own 60 s budget.
const PORT_WAIT_MS = 180_000;
async function listenWhenFree(server, port) {
  const started = Date.now();
  for (;;) {
    try {
      await new Promise((resolve, reject) => {
        const onError = error => { server.off('listening', onListening); reject(error); };
        const onListening = () => { server.off('error', onError); resolve(); };
        server.once('error', onError);
        server.once('listening', onListening);
        server.listen(port, '127.0.0.1');
      });
      break;
    } catch (error) {
      if (error.code !== 'EADDRINUSE' || Date.now() - started > PORT_WAIT_MS) throw error;
      await new Promise(resolve => setTimeout(resolve, 250));
    }
  }
  const waited = Date.now() - started;
  if (waited > 1000) {
    try {
      const info = require('@playwright/test').test.info();
      if (info.timeout > 0) info.setTimeout(info.timeout + waited); // 0 = no limit
    } catch (e) { /* not inside a test: nothing to extend */ }
  }
}
async function smtpSink(port, { accept = () => true, rejectionCode = 451, greet = () => true, onMessage = () => {} } = {}) {
  const messages = [];
  const sockets = new Set();
  const server = net.createServer(socket => {
    sockets.add(socket);
    // Active cancellation may reset the peer while reply bytes are in flight.
    socket.on('error', error => {
      if (!['ECONNRESET', 'EPIPE'].includes(error.code)) throw error;
    });
    socket.on('close', () => sockets.delete(socket));
    socket.setEncoding('utf8');
    if (greet()) socket.write('220 localhost test SMTP\r\n');
    let pending = '', data = null, recipients = [];
    socket.on('data', chunk => {
      pending += chunk;
      let end;
      while ((end = pending.indexOf('\r\n')) !== -1) {
        const line = pending.slice(0, end);
        pending = pending.slice(end + 2);
        if (data !== null) {
          if (line === '.') {
            const message = { recipients: [...recipients], data: data.join('\r\n') };
            messages.push(message);
            onMessage(message, socket);
            data = null; recipients = [];
            Promise.resolve().then(() => accept(message)).then(accepted => {
              if (!socket.destroyed) socket.write(accepted ? '250 captured\r\n' : `${rejectionCode} test rejection\r\n`);
            }).catch(() => socket.destroy());
          } else data.push(line.replace(/^\.\./, '.'));
        } else if (/^(EHLO|HELO)/i.test(line)) socket.write('250 localhost\r\n');
        else if (/^RCPT TO:/i.test(line)) {
          recipients.push(line.slice(8).trim().replace(/^<|>$/g, '').toLowerCase());
          socket.write('250 recipient accepted\r\n');
        } else if (/^DATA$/i.test(line)) {
          data = []; socket.write('354 end with dot\r\n');
        } else if (/^QUIT$/i.test(line)) socket.end('221 bye\r\n');
        else socket.write('250 OK\r\n');
      }
    });
  });
  await listenWhenFree(server, port);
  return { messages, connections: () => sockets.size, close: async () => {
    for (const socket of sockets) socket.destroy();
    await new Promise(resolve => server.close(resolve));
  } };
}
module.exports = { smtpSink };
