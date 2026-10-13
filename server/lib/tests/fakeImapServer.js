// A small IMAP4rev1 server for the email-to-card runtime tests: real IMAP over
// a real TCP socket, so WeKan's poller (imapflow + mailparser) is exercised
// exactly as against Dovecot or Gmail, without a mail server on the machine.
//
// It knows one user and one mailbox, and enough of RFC 3501 for what a
// client that reads new mail does: CAPABILITY, LOGIN (refused for a wrong
// password, as a real server says it), SELECT/EXAMINE, UID SEARCH (UNSEEN,
// ALL, UID ranges), UID FETCH (UID, FLAGS, RFC822.SIZE, BODY.PEEK[]), UID STORE
// +FLAGS, EXPUNGE / UID EXPUNGE, NOOP and LOGOUT. Anything else is answered
// OK, as a server that ignores it would.
import net from 'node:net';

export function startFakeImapServer({ user = 'cards@example.test', password = 'secret', uidValidity = 7 } = {}) {
  const messages = [];   // { uid, source: Buffer, flags: Set }
  let nextUid = 1;
  const sockets = new Set();
  const log = [];

  const parseSet = (set, all) => {
    const out = new Set();
    for (const part of String(set).split(',')) {
      const [a, b] = part.split(':');
      const max = all.length ? Math.max(...all) : 0;
      const lo = a === '*' ? max : Number(a);
      const hi = b === undefined ? lo : (b === '*' ? Math.max(max, lo) : Number(b));
      for (const uid of all) if (uid >= Math.min(lo, hi) && uid <= Math.max(lo, hi)) out.add(uid);
      // "n:*" with nothing at or above n still names the highest message (RFC 3501 6.4.8)
      if (b === '*' && !all.some(uid => uid >= lo) && all.length) out.add(max);
    }
    return [...out].sort((x, y) => x - y);
  };

  const server = net.createServer(socket => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
    socket.on('error', () => {});
    let authed = false;
    let buffer = '';
    const send = line => socket.write(`${line}\r\n`);
    send('* OK [CAPABILITY IMAP4rev1] fake IMAP ready');

    const handle = line => {
      log.push(line.replace(/LOGIN .*/i, 'LOGIN [hidden]'));
      const m = line.match(/^(\S+)\s+(\S+)\s*(.*)$/);
      if (!m) return;
      const [, tag, rawCommand, rest] = m;
      let command = rawCommand.toUpperCase();
      let args = rest;
      let byUid = false;
      if (command === 'UID') {
        byUid = true;
        const sub = rest.match(/^(\S+)\s*(.*)$/);
        command = sub[1].toUpperCase();
        args = sub[2];
      }
      const uids = messages.map(msg => msg.uid);
      switch (command) {
        case 'CAPABILITY':
          send('* CAPABILITY IMAP4rev1');
          return send(`${tag} OK CAPABILITY completed`);
        case 'LOGIN': {
          const parts = args.match(/^"?([^"\s]*)"?\s+"?([^"]*)"?$/);
          if (parts && parts[1] === user && parts[2] === password) {
            authed = true;
            return send(`${tag} OK [CAPABILITY IMAP4rev1] LOGIN completed`);
          }
          return send(`${tag} NO [AUTHENTICATIONFAILED] Invalid credentials (Failure)`);
        }
        case 'SELECT':
        case 'EXAMINE':
          if (!authed) return send(`${tag} NO not authenticated`);
          send('* FLAGS (\\Seen \\Deleted)');
          send(`* ${messages.length} EXISTS`);
          send('* 0 RECENT');
          send(`* OK [UIDVALIDITY ${uidValidity}] UIDs valid`);
          send(`* OK [UIDNEXT ${nextUid}] Predicted next UID`);
          send('* OK [PERMANENTFLAGS (\\Seen \\Deleted)] Limited');
          return send(`${tag} OK [READ-WRITE] ${command} completed`);
        case 'SEARCH': {
          let found = messages;
          const upper = args.toUpperCase();
          if (/\bUNSEEN\b/.test(upper)) found = found.filter(msg => !msg.flags.has('\\Seen'));
          const uidRange = args.match(/\bUID\s+(\S+)/i);
          if (uidRange) {
            const allowed = new Set(parseSet(uidRange[1], uids));
            found = found.filter(msg => allowed.has(msg.uid));
          }
          const ids = found.map(msg => (byUid ? msg.uid : messages.indexOf(msg) + 1));
          send(`* SEARCH${ids.length ? ` ${ids.join(' ')}` : ''}`);
          return send(`${tag} OK SEARCH completed`);
        }
        case 'FETCH': {
          const [set] = args.split(' ');
          const wanted = byUid ? parseSet(set, uids) : parseSet(set, messages.map((_, i) => i + 1)).map(i => messages[i - 1].uid);
          for (const uid of wanted) {
            const msg = messages.find(item => item.uid === uid);
            if (!msg) continue;
            const seq = messages.indexOf(msg) + 1;
            const flags = [...msg.flags].join(' ');
            const parts = [`UID ${msg.uid}`, `FLAGS (${flags})`, `RFC822.SIZE ${msg.source.length}`];
            if (/BODY(\.PEEK)?\[\]/i.test(args)) {
              socket.write(`* ${seq} FETCH (${parts.join(' ')} BODY[] {${msg.source.length}}\r\n`);
              socket.write(msg.source);
              socket.write(')\r\n');
            } else {
              send(`* ${seq} FETCH (${parts.join(' ')})`);
            }
          }
          return send(`${tag} OK FETCH completed`);
        }
        case 'STORE': {
          const [set, op, ...flagWords] = args.split(' ');
          const flagList = flagWords.join(' ').replace(/[()]/g, '').split(' ').filter(Boolean);
          const wanted = byUid ? parseSet(set, uids) : [];
          for (const uid of wanted) {
            const msg = messages.find(item => item.uid === uid);
            if (!msg) continue;
            for (const flag of flagList) {
              if (/^-/.test(op)) msg.flags.delete(flag); else msg.flags.add(flag);
            }
            if (!/SILENT/i.test(op)) send(`* ${messages.indexOf(msg) + 1} FETCH (UID ${uid} FLAGS (${[...msg.flags].join(' ')}))`);
          }
          return send(`${tag} OK STORE completed`);
        }
        case 'EXPUNGE': {
          for (let i = messages.length - 1; i >= 0; i -= 1) {
            if (messages[i].flags.has('\\Deleted')) {
              send(`* ${i + 1} EXPUNGE`);
              messages.splice(i, 1);
            }
          }
          return send(`${tag} OK EXPUNGE completed`);
        }
        case 'LOGOUT':
          send('* BYE logging out');
          send(`${tag} OK LOGOUT completed`);
          return socket.end();
        default:
          return send(`${tag} OK ${command} completed`);
      }
    };

    socket.on('data', chunk => {
      buffer += chunk.toString('utf8');
      let end;
      while ((end = buffer.indexOf('\r\n')) !== -1) {
        const line = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        try { handle(line); } catch (e) { /* a malformed command is the client's problem */ }
      }
    });
  });

  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({
    port: server.address().port,
    log,
    messages,
    // Deliver a raw RFC 822 message into the mailbox.
    deliver(raw) {
      messages.push({ uid: nextUid, source: Buffer.from(raw.replace(/\r?\n/g, '\r\n')), flags: new Set() });
      nextUid += 1;
    },
    close() {
      for (const socket of sockets) socket.destroy();
      return new Promise(done => server.close(() => done()));
    },
  })));
}
