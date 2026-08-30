'use strict';

const dgram = require('dgram');
const net = require('net');
const os = require('os');

function interfaceIPv4() {
  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries || []) {
      if (entry.family === 'IPv4' && !entry.internal && !entry.address.startsWith('169.254.')) {
        return entry.address;
      }
    }
  }
  return '127.0.0.1';
}

function currentIPv4() {
  return new Promise(resolve => {
    const socket = dgram.createSocket('udp4');
    const done = address => {
      try { socket.close(); } catch (_) {}
      resolve(address || interfaceIPv4());
    };
    const timer = setTimeout(() => done(), 500);
    socket.once('error', () => { clearTimeout(timer); done(); });
    socket.connect(53, '1.1.1.1', () => {
      clearTimeout(timer);
      const address = socket.address().address;
      done(address === '0.0.0.0' ? undefined : address);
    });
  });
}

function canListen(host, port) {
  return new Promise(resolve => {
    const server = net.createServer();
    server.unref();
    server.once('error', () => resolve(false));
    server.listen({ host, port, exclusive: true }, () => server.close(() => resolve(true)));
  });
}

async function freePort(host, preferred, excluded) {
  for (let port = preferred; port <= 65535; port += 1) {
    if (port !== excluded && await canListen(host, port)) return port;
  }
  throw new Error(`no free TCP port at or above ${preferred}`);
}

async function main() {
  const mode = process.argv[2] || 'posix';
  const withFerret = process.argv.includes('--ferretdb');
  const configuredRootURL = process.env.ROOT_URL || '';
  let port = Number.parseInt(process.env.PORT || '', 10);
  if ((!Number.isInteger(port) || port < 1 || port > 65535) && configuredRootURL) {
    const parsed = new URL(configuredRootURL);
    port = Number(parsed.port || (parsed.protocol === 'https:' ? 443 : 80));
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    port = await freePort('0.0.0.0', Number(process.env.WEKAN_PORT_START) || 80);
  }
  const rootURL = configuredRootURL ||
    `http://${await currentIPv4()}${port === 80 ? '' : `:${port}`}`;

  let ferretAddress = process.env.FERRETDB_LISTEN_ADDR || '';
  let mongoURL = process.env.MONGO_URL || '';
  if (withFerret) {
    if (!ferretAddress) {
      const ferretPort = await freePort('127.0.0.1',
        Number(process.env.WEKAN_FERRETDB_PORT_START) || 27017, port);
      ferretAddress = `127.0.0.1:${ferretPort}`;
    }
    if (!/^127\.0\.0\.1:\d+$/.test(ferretAddress)) {
      throw new Error('bundled FerretDB must listen on 127.0.0.1:<port>');
    }
    if (!mongoURL) mongoURL = `mongodb://${ferretAddress}/wekan`;
  }

  const values = { PORT: String(port), ROOT_URL: rootURL };
  if (ferretAddress) values.FERRETDB_LISTEN_ADDR = ferretAddress;
  if (mongoURL) values.MONGO_URL = mongoURL;
  for (const [key, value] of Object.entries(values)) {
    if (!/^[\x20-\x7e]+$/.test(value) || /[\r\n]/.test(value)) throw new Error(`unsafe ${key}`);
    if (mode === 'cmd') console.log(`set "${key}=${value.replace(/%/g, '%%')}"`);
    else console.log(`export ${key}='${value.replace(/'/g, `'"'"'`)}'`);
  }
}

main().catch(error => {
  console.error(`WeKan startup network selection failed: ${error.message}`);
  process.exitCode = 1;
});
