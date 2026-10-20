#!/usr/bin/env node
// Is the smoke-test database listening? build-target.sh asks before it starts
// WeKan against it, so a database that is gone is reported as that instead of
// as WeKan crashing with "Topology is closed" (v12.56 Bun linux-x64).
//
//   node releases/bun/wait-mongo.mjs <mongodb://host:port/db> [seconds]
//
// A TCP connection is what WeKan's driver needs first and all this checks;
// it needs nothing installed. Exits 0 once one succeeds, 1 after `seconds`.
import net from 'node:net';

export function hostPortOf(url) {
  const m = /^mongodb:\/\/(?:[^@/]*@)?([^/,?]+)/.exec(String(url || ''));
  if (!m) return null;
  const hostPort = m[1];
  const ipv6 = /^\[([^\]]+)\](?::(\d+))?$/.exec(hostPort);
  if (ipv6) return { host: ipv6[1], port: Number(ipv6[2] || 27017) };
  const [host, port] = hostPort.split(':');
  return { host, port: Number(port || 27017) };
}

function tryConnect({ host, port }, timeoutMs = 1000) {
  return new Promise(resolve => {
    const socket = net.connect({ host, port });
    const done = ok => { socket.destroy(); resolve(ok); };
    socket.setTimeout(timeoutMs, () => done(false));
    socket.once('connect', () => done(true));
    socket.once('error', () => done(false));
  });
}

export async function waitForMongo(url, seconds = 30, connect = tryConnect, sleep = ms => new Promise(r => setTimeout(r, ms))) {
  const target = hostPortOf(url);
  if (!target) throw new Error(`not a mongodb:// URL: ${url}`);
  for (let i = 0; i < seconds; i += 1) {
    if (await connect(target)) return true;
    await sleep(1000);
  }
  return false;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const [url, seconds = '30'] = process.argv.slice(2);
  const target = hostPortOf(url);
  if (!target) {
    console.error(`wait-mongo: not a mongodb:// URL: ${url}`);
    process.exit(2);
  }
  if (await waitForMongo(url, Number(seconds))) {
    console.log(`wait-mongo: ${target.host}:${target.port} is listening.`);
  } else {
    console.error(`::error::the smoke-test database ${target.host}:${target.port} is not listening (waited ${seconds}s); WeKan would stop with "Topology is closed".`);
    process.exit(1);
  }
}
