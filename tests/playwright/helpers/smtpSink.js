'use strict';

// Local-only SMTP capture for notification regressions. No mail is relayed.
const net = require('node:net');
async function smtpSink(port) {
  const messages = [];
  const sockets = new Set();
  const server = net.createServer(socket => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
    socket.setEncoding('utf8');
    socket.write('220 localhost test SMTP\r\n');
    let pending = '', data = null, recipients = [];
    socket.on('data', chunk => {
      pending += chunk;
      let end;
      while ((end = pending.indexOf('\r\n')) !== -1) {
        const line = pending.slice(0, end);
        pending = pending.slice(end + 2);
        if (data !== null) {
          if (line === '.') {
            messages.push({ recipients: [...recipients], data: data.join('\r\n') });
            data = null; recipients = [];
            socket.write('250 captured\r\n');
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
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });
  return { messages, close: async () => {
    for (const socket of sockets) socket.destroy();
    await new Promise(resolve => server.close(resolve));
  } };
}
module.exports = { smtpSink };
