'use strict';
// Minimal LDAPv3 wire fixture: bind, search and unbind, not a production directory.
const net = require('node:net');
const tlv = (tag, body) => {
  body = Buffer.isBuffer(body) ? body : Buffer.from(body);
  const length = body.length < 128 ? Buffer.from([body.length]) : Buffer.from([0x82, body.length >> 8, body.length & 255]);
  return Buffer.concat([Buffer.from([tag]), length, body]);
};
const str = value => tlv(4, String(value));
function read(buffer, start = 0) {
  if (buffer.length < start + 2) return null;
  let length = buffer[start + 1], offset = start + 2;
  if (length & 128) {
    const count = length & 127;
    if (buffer.length < offset + count) return null;
    length = buffer.readUIntBE(offset, count); offset += count;
  }
  if (buffer.length < offset + length) return null;
  return { tag: buffer[start], body: buffer.subarray(offset, offset + length), end: offset + length };
}
function parts(buffer) {
  const result = []; let offset = 0;
  while (offset < buffer.length) { const item = read(buffer, offset); if (!item) throw Error('Incomplete BER'); result.push(item); offset = item.end; }
  return result;
}
module.exports.startLdap = async state => {
  const sockets = new Set();
  const server = net.createServer(socket => {
    sockets.add(socket); socket.on('close', () => sockets.delete(socket));
    let pending = Buffer.alloc(0);
    socket.on('data', data => {
      pending = Buffer.concat([pending, data]);
      for (let frame; (frame = read(pending));) {
        pending = pending.subarray(frame.end);
        const [id, op] = parts(frame.body);
        const send = (tag, body) => socket.write(tlv(0x30, Buffer.concat([tlv(2, id.body), tlv(tag, body)])));
        const done = (tag, code = 0) => send(tag, Buffer.concat([tlv(10, Buffer.from([code])), str(''), str(code ? 'Invalid credentials' : '')]));
        if (op.tag === 0x60) {
          const [, dn, password] = parts(op.body);
          const name = dn.body.toString();
          const accepted = (name === 'cn=reader,dc=example,dc=invalid' && password.body.toString() === 'reader-test-password') ||
            (name === 'uid=alice,dc=example,dc=invalid' && password.body.toString() === 'Alice-test-password' && state.mode !== 'deny');
          state.events.push({ protocol: 'ldap', operation: 'bind', dn: name, accepted });
          done(0x61, accepted ? 0 : 49);
        } else if (op.tag === 0x63) {
          const fields = parts(op.body); const filter = fields[6].body.toString();
          state.events.push({ protocol: 'ldap', operation: 'search', base: fields[0].body.toString(), filter });
          if (filter.includes('alice') && state.mode !== 'missing') {
            const attrs = { objectClass: ['inetOrgPerson'], uid: ['alice'], cn: ['Alice Directory'], mail: ['alice.ldap@example.invalid'], entryUUID: ['fixture-ldap-alice'] };
            const attributes = Object.entries(attrs).map(([key, values]) => tlv(0x30, Buffer.concat([str(key), tlv(0x31, Buffer.concat(values.map(str)))])));
            send(0x64, Buffer.concat([str('uid=alice,dc=example,dc=invalid'), tlv(0x30, Buffer.concat(attributes))]));
          }
          done(0x65);
        } else if (op.tag === 0x42) socket.end();
        else done(0x65, 2);
      }
    });
    socket.on('error', () => {});
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { port: server.address().port, close: async () => { for (const socket of sockets) socket.destroy(); await new Promise(resolve => server.close(resolve)); } };
};
