// A local SMTP server for the email runtime tests: WeKan's real mail
// transport (nodemailer, as the Admin Panel's SMTP settings install it) talks
// to it over a real TCP socket, and every message it accepts is kept for the
// test to read. `reject` makes it refuse the message after DATA, the way a
// mail server refuses a sender or a size. Nothing is relayed anywhere.
import net from 'node:net';

export function startFakeSmtpServer({ reject = null } = {}) {
  const messages = [];
  const sockets = new Set();
  let rejectWith = reject;
  const server = net.createServer(socket => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
    socket.on('error', () => {});
    socket.setEncoding('utf8');
    const send = line => socket.write(`${line}\r\n`);
    send('220 localhost fake SMTP');
    let pending = '';
    let data = null;
    let envelope = { from: '', to: [] };
    socket.on('data', chunk => {
      pending += chunk;
      let end;
      while ((end = pending.indexOf('\r\n')) !== -1) {
        const line = pending.slice(0, end);
        pending = pending.slice(end + 2);
        if (data !== null) {
          if (line === '.') {
            const raw = data.join('\r\n');
            data = null;
            if (rejectWith) {
              send(rejectWith);
            } else {
              messages.push({ ...envelope, raw });
              send('250 2.0.0 queued');
            }
            envelope = { from: '', to: [] };
          } else {
            data.push(line.startsWith('..') ? line.slice(1) : line);
          }
          continue;
        }
        const command = line.slice(0, 4).toUpperCase();
        if (command === 'EHLO') { send('250-localhost'); send('250 8BITMIME'); }
        else if (command === 'HELO') send('250 localhost');
        else if (command === 'MAIL') { envelope.from = (line.match(/<([^>]*)>/) || [])[1] || ''; send('250 OK'); }
        else if (command === 'RCPT') { envelope.to.push((line.match(/<([^>]*)>/) || [])[1] || ''); send('250 OK'); }
        else if (command === 'DATA') { data = []; send('354 go ahead'); }
        else if (command === 'QUIT') { send('221 bye'); socket.end(); }
        else if (command === 'RSET') { envelope = { from: '', to: [] }; send('250 OK'); }
        else send('250 OK');
      }
    });
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({
    port: server.address().port,
    messages,
    rejectWith(line) { rejectWith = line; },
    close() {
      for (const socket of sockets) socket.destroy();
      return new Promise(done => server.close(() => done()));
    },
  })));
}
