'use strict';

// Cross-site request forgery: a page on another site makes the browser send a
// state-changing request to WeKan, and the browser attaches WeKan's login
// cookie to it. Several HTTP routes accept that cookie as the login - the
// Trello import (POST /import-trello) among them - so the request would run as
// the signed-in user without them knowing.
//
// The login cookie is SameSite=Strict, which today's browsers already keep off
// a request started by another site. This is the second line, for an older
// browser, a same-site sibling host, and a route added later: a request that
// changes something and carries the login ONLY as a cookie must come from
// WeKan's own origin.
//
//   - GET, HEAD and OPTIONS change nothing, and are not checked;
//   - a request with an Authorization or X-Auth-Token header, or an authToken
//     in its query, proved the login itself - another site cannot read it;
//   - a request with no login cookie has no ambient login to misuse;
//   - Meteor's own /_accounts/cookie/ routes check the origin themselves, and
//     DDP (/sockjs, /websocket) carries its login in the protocol;
//   - otherwise the Origin header, or the Referer when there is no Origin,
//     must name this site: the host of ROOT_URL, or the Host / X-Forwarded-Host
//     the request was sent to. "Origin: null" (a sandboxed frame, a data: URL)
//     is not this site. A request with neither header is a client that is not
//     a browser - a browser sends Origin on every cross-site POST - and is let
//     through.
//
// Pure: no Meteor. `req` needs method, url and headers.

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const LOGIN_COOKIES = ['meteor_login_token', 'wekan_login_token'];
const EXEMPT_PREFIXES = ['/_accounts/cookie/', '/sockjs/', '/websocket'];

function header(req, name) {
  const value = req && req.headers ? req.headers[name] : undefined;
  if (Array.isArray(value)) return value[0];
  return typeof value === 'string' ? value : undefined;
}

function pathOf(req) {
  return String((req && req.url) || '').split('?')[0];
}

function hasLoginCookie(req) {
  const cookie = header(req, 'cookie');
  if (!cookie) return false;
  return cookie.split(';').some(part => {
    const name = part.split('=')[0].trim();
    const value = part.slice(part.indexOf('=') + 1).trim();
    return LOGIN_COOKIES.includes(name) && value !== '';
  });
}

function hasExplicitToken(req) {
  if (header(req, 'authorization') || header(req, 'x-auth-token')) return true;
  const query = String((req && req.url) || '').split('?')[1] || '';
  return query.split('&').some(pair => pair.split('=')[0] === 'authToken' && pair.split('=')[1]);
}

// host[:port] of a URL or an Origin value, lower-case; null when there is none.
function hostOf(value) {
  if (!value || value === 'null') return null;
  try {
    return new URL(value).host.toLowerCase() || null;
  } catch (e) {
    return null;
  }
}

function ownHosts(req, rootUrl) {
  const hosts = new Set();
  const root = hostOf(rootUrl);
  if (root) hosts.add(root);
  for (const name of ['host', 'x-forwarded-host']) {
    const value = header(req, name);
    if (value) for (const h of value.split(',')) if (h.trim()) hosts.add(h.trim().toLowerCase());
  }
  return hosts;
}

// { block: false } or { block: true, origin, reason }.
function crossSiteCookieRequest(req, rootUrl) {
  const method = String((req && req.method) || 'GET').toUpperCase();
  if (SAFE_METHODS.has(method)) return { block: false };
  const path = pathOf(req);
  if (EXEMPT_PREFIXES.some(prefix => path.startsWith(prefix))) return { block: false };
  if (hasExplicitToken(req) || !hasLoginCookie(req)) return { block: false };

  const origin = header(req, 'origin');
  const referer = header(req, 'referer');
  if (origin === undefined && referer === undefined) return { block: false };
  const claimed = origin !== undefined ? origin : referer;
  const host = hostOf(claimed);
  if (host && ownHosts(req, rootUrl).has(host)) return { block: false };
  return {
    block: true,
    origin: claimed === 'null' ? 'null' : (host || 'unparseable'),
    reason: origin !== undefined ? 'origin' : 'referer',
  };
}

module.exports = { crossSiteCookieRequest, hasLoginCookie, hasExplicitToken, hostOf };
