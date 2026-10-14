'use strict';

// Outgoing requests through an HTTP proxy (#1455): which proxy a request uses,
// from the usual environment variables. Pure, so it is tested without a
// network (tests/outboundProxy.test.cjs); server/lib/ssrfGuard.js does the
// connecting.
//
//   HTTPS_PROXY / https_proxy   for https:// destinations
//   HTTP_PROXY  / http_proxy    for http:// destinations
//   NO_PROXY    / no_proxy      destinations that go direct: comma- or
//                               space-separated host names (a leading dot or
//                               none matches subdomains too), host:port,
//                               IP addresses, or `*` for all
//
// The proxy never decides WHERE a request goes. The SSRF guard resolves and
// checks the destination first, and the proxy is given that checked IP
// address, never the name, so it cannot resolve the name to somewhere else.

const DEFAULT_PROXY_SCHEME = 'http:';

function firstSet(env, names) {
  for (const name of names) {
    const value = env[name];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function parseNoProxy(value) {
  return String(value || '')
    .split(/[\s,]+/)
    .map(entry => entry.trim().toLowerCase())
    .filter(Boolean);
}

function stripBrackets(host) {
  return String(host || '').replace(/^\[|\]$/g, '').toLowerCase();
}

/** Does NO_PROXY send this destination direct? */
function noProxyMatches(hostname, port, noProxy) {
  const host = stripBrackets(hostname);
  for (const raw of parseNoProxy(noProxy)) {
    if (raw === '*') return true;
    let entry = raw;
    let entryPort = '';
    // host:port, but not an IPv6 address (which has several colons).
    const colon = entry.lastIndexOf(':');
    if (colon > 0 && entry.indexOf(':') === colon) {
      entryPort = entry.slice(colon + 1);
      entry = entry.slice(0, colon);
    }
    entry = stripBrackets(entry).replace(/^\*\./, '.');
    if (entryPort && String(port) !== entryPort) continue;
    if (entry.startsWith('.')) {
      if (host === entry.slice(1) || host.endsWith(entry)) return true;
    } else if (host === entry || host.endsWith(`.${entry}`)) {
      return true;
    }
  }
  return false;
}

/**
 * The proxy for a destination, or null to connect directly.
 * @param {URL} target the destination
 * @param {object} env process.env, or a fake one
 * @return {URL|null}
 */
function proxyFor(target, env = process.env) {
  const isHttps = target.protocol === 'https:';
  const value = isHttps
    ? firstSet(env, ['HTTPS_PROXY', 'https_proxy'])
    : firstSet(env, ['HTTP_PROXY', 'http_proxy']);
  if (!value) return null;
  const port = target.port || (isHttps ? '443' : '80');
  if (noProxyMatches(target.hostname, port, firstSet(env, ['NO_PROXY', 'no_proxy']))) return null;
  let proxy;
  try {
    // A bare host:port, as many tools accept, is an http proxy.
    proxy = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `${DEFAULT_PROXY_SCHEME}//${value}`);
  } catch (e) {
    throw new Error('SSRF_GUARD: the proxy setting is not a URL');
  }
  if (proxy.protocol !== 'http:' && proxy.protocol !== 'https:') {
    throw new Error(`SSRF_GUARD: proxy protocol not supported: ${proxy.protocol}`);
  }
  return proxy;
}

/** The Proxy-Authorization header for a proxy URL with credentials, or null. */
function proxyAuthorization(proxy) {
  if (!proxy || (!proxy.username && !proxy.password)) return null;
  const user = decodeURIComponent(proxy.username);
  const pass = decodeURIComponent(proxy.password);
  return `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`;
}

/** The host:port a proxy is asked to reach - the checked IP, never the name. */
function pinnedAuthority(resolvedIp, port) {
  return `${resolvedIp.includes(':') ? `[${resolvedIp}]` : resolvedIp}:${port}`;
}

module.exports = { parseNoProxy, noProxyMatches, proxyFor, proxyAuthorization, pinnedAuthority };
