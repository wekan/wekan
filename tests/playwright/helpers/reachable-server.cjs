'use strict';
// Start a spec's mock server (a Jira or GitLab the list-sync specs answer as)
// where the WeKan server can reach it, and return its base URL.
//
// Normally that is any free port on 127.0.0.1: the specs and WeKan share the
// loopback. When the browsers run in Docker on macOS they do not, and WeKan's
// fetch from the host failed ("fetch failed"). build.sh then forwards a small
// pool of ports from the host into the container and names them in
// WEKAN_TEST_REVERSE_PORTS; a server takes the first one no other is using.

function reversePorts(env = process.env) {
  return String(env.WEKAN_TEST_REVERSE_PORTS || '').split(/[\s,]+/).filter(Boolean).map(Number)
    .filter(port => Number.isInteger(port) && port > 0 && port < 65536);
}

function listenOn(server, port) {
  return new Promise((resolve, reject) => {
    const failed = error => { server.removeListener('listening', listening); reject(error); };
    const listening = () => { server.removeListener('error', failed); resolve(); };
    server.once('error', failed);
    server.once('listening', listening);
    server.listen(port, '127.0.0.1');
  });
}

async function listenReachable(server, env = process.env) {
  const pool = reversePorts(env);
  if (pool.length === 0) {
    await listenOn(server, 0);
  } else {
    let listening = false;
    for (const port of pool) {
      try {
        await listenOn(server, port);
        listening = true;
        break;
      } catch (error) {
        if (error.code !== 'EADDRINUSE') throw error;
      }
    }
    if (!listening) throw new Error(`Every forwarded test port is in use: ${pool.join(', ')}`);
  }
  return `http://127.0.0.1:${server.address().port}`;
}

module.exports = { listenReachable, reversePorts };
