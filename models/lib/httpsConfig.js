'use strict';

// Optional HTTPS in WeKan's own server (#916, maintainer decision 2026-10-14).
// Pure: which settings turn it on and what they mean, tested without a server
// (tests/httpsServer.test.cjs). server/httpsServer.js does the listening.
//
//   HTTPS_PORT         the port to serve HTTPS on; HTTPS is off without it
//   HTTPS_CERT_FILE    the certificate (chain) - a path, or the PEM itself
//   HTTPS_KEY_FILE     its private key - a path, or the PEM itself
//   HTTPS_BIND_IP      the address to listen on (default: BIND_IP, else all)
//   HTTPS_REDIRECT     true: answer plain-HTTP requests with a redirect to HTTPS
//
// Without HTTPS_PORT nothing changes: WeKan serves HTTP on PORT, as always,
// and a proxy (Caddy, nginx) stays the recommendation for production.

function pemOrPath(value, readFile) {
  const v = String(value || '').trim();
  if (!v) return null;
  if (v.includes('-----BEGIN ')) return v;
  return readFile(v);
}

/**
 * @return {null | {port: number, host: string|undefined, cert: string|Buffer,
 *   key: string|Buffer, redirect: boolean, certPath: string|null, keyPath: string|null}}
 */
function httpsConfig(env = process.env, readFile = path => require('fs').readFileSync(path)) {
  const portText = String(env.HTTPS_PORT || '').trim();
  if (!portText) return null;
  const port = Number(portText);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`HTTPS_PORT must be a port number (got "${portText}")`);
  }
  if (!env.HTTPS_CERT_FILE || !env.HTTPS_KEY_FILE) {
    throw new Error('HTTPS_PORT is set, so HTTPS_CERT_FILE and HTTPS_KEY_FILE are needed too');
  }
  const cert = pemOrPath(env.HTTPS_CERT_FILE, readFile);
  const key = pemOrPath(env.HTTPS_KEY_FILE, readFile);
  const isPath = v => !String(v).includes('-----BEGIN ');
  return {
    port,
    host: (env.HTTPS_BIND_IP || env.BIND_IP || '').trim() || undefined,
    cert,
    key,
    redirect: String(env.HTTPS_REDIRECT || '').trim() === 'true',
    certPath: isPath(env.HTTPS_CERT_FILE) ? String(env.HTTPS_CERT_FILE).trim() : null,
    keyPath: isPath(env.HTTPS_KEY_FILE) ? String(env.HTTPS_KEY_FILE).trim() : null,
  };
}

const HTTPS_SCHEME = 'https:';

/**
 * Where a plain-HTTP request is redirected. ROOT_URL's host when ROOT_URL is
 * an https:// address (it names the server); otherwise the host the browser
 * asked for, on the HTTPS port. Only the path of the request is kept.
 */
function redirectLocation(hostHeader, url, httpsPort, rootUrl = '') {
  let root = null;
  try {
    root = rootUrl ? new URL(rootUrl) : null;
  } catch (e) {
    root = null;
  }
  const path = String(url || '/').startsWith('/') && !String(url).startsWith('//') ? String(url || '/') : '/';
  if (root && root.protocol === HTTPS_SCHEME) return `${root.origin}${path}`;
  const host = String(hostHeader || '').replace(/:\d+$/, '');
  if (!/^[A-Za-z0-9.-]+$|^\[[0-9A-Fa-f:.]+\]$/.test(host)) return null;
  const port = Number(httpsPort) === 443 ? '' : `:${httpsPort}`;
  return `${HTTPS_SCHEME}//${host}${port}${path}`;
}

module.exports = { httpsConfig, redirectLocation };
