'use strict';
// Docker Desktop has separate loopbacks. Forward the host test app's SMTP
// socket into the named test container without exposing a relay on the LAN.
const net = require('node:net');
const fs = require('node:fs');
const { spawn } = require('node:child_process');

function startProxy({ container, port, readyFile, spawnProcess = spawn }) {
  if (!/^wekan-playwright-[a-z]+-\d+$/.test(container) ||
      !Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid SMTP test proxy target');
  const peers = new Map();
  const server = net.createServer(socket => {
    const source = `const socket=require('node:net').connect(${port},'127.0.0.1');
      process.stdin.pipe(socket);socket.pipe(process.stdout);
      socket.on('error',()=>process.exit(1));socket.on('close',()=>process.exit());`;
    const child = spawnProcess('docker', ['exec', '-i', container, 'node', '-e', source],
      { stdio: ['pipe', 'pipe', 'pipe'] });
    peers.set(socket, child);
    socket.pipe(child.stdin);
    child.stdout.pipe(socket);
    // No SMTP payload or recipient data is logged.
    child.stderr.resume();
    child.stdin.on('error', () => socket.destroy());
    child.on('error', () => socket.destroy());
    child.on('exit', () => socket.destroy());
    socket.on('error', () => child.kill());
    socket.on('close', () => { peers.delete(socket); child.kill(); });
  });
  server.listen(port, '127.0.0.1', () => fs.writeFileSync(readyFile, 'ready\n'));
  return { server, close() {
    for (const [socket, child] of peers) { socket.destroy(); child.kill(); }
    server.close();
  } };
}

if (require.main === module) {
  const [container, port, readyFile] = process.argv.slice(2);
  const proxy = startProxy({ container, port: Number(port), readyFile });
  proxy.server.on('error', error => { console.error(`SMTP test proxy: ${error.code}`); process.exitCode = 1; });
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => proxy.close());
}
module.exports = { startProxy };
