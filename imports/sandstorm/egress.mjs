// Outbound HTTP from a Sandstorm grain, through the Powerbox.
//
// A grain has no network of its own. It reaches an external site the way the
// Sandstorm WordPress app reaches wordpress.org for plugin updates: the user
// approves an HTTP API (an ApiSession) in the Powerbox, WeKan exchanges the
// one-time claim token for a permanent access token, and every request is sent
// through sandstorm-http-bridge's proxy with that token as
// `Authorization: Bearer`. The proxy uses the token only to pick the granted
// service and forwards the request path to it; the HOST in the request is
// ignored (sandstorm src/sandstorm/bridge-proxy.c++). See
// docs/Platforms/FOSS/Container/Sandstorm/Powerbox-External-APIs.md.
//
// Two consequences shape the callers:
//   - the Authorization header is the proxy's, so a service whose requests are
//     authenticated by a header of its own cannot be reached this way. Trello's
//     REST API takes `key` and `token` query parameters and works; downloading a
//     file uploaded to Trello needs an `Authorization: OAuth` header and does not;
//   - the external driver forwards only Sandstorm's whitelisted request headers
//     (shell/imports/server/header-whitelist.js), so nothing else may depend on
//     custom request headers either.
//
// No Meteor here: tests/sandstormApiEgress.test.cjs runs it against a fake
// bridge proxy.

import http from 'node:http';
import { Readable } from 'node:stream';

// The external services a user can grant, by the name the client and the
// methods use. canonicalUrl never ends with '/': Sandstorm adds one between it
// and each request's path.
export const EXTERNAL_APIS = Object.freeze({
  trello: Object.freeze({ canonicalUrl: 'https://api.trello.com/1', label: 'Trello' }),
});

export function externalApi(service) {
  return Object.prototype.hasOwnProperty.call(EXTERNAL_APIS, service) ? EXTERNAL_APIS[service] : null;
}

// Which granted service a URL belongs to: the service whose canonicalUrl it
// starts with, followed by a path, a query or nothing. Prefix matching on the
// raw string would also accept a different host whose name merely continues
// the granted one.
export function serviceForUrl(url) {
  for (const [service, { canonicalUrl }] of Object.entries(EXTERNAL_APIS)) {
    if (url === canonicalUrl) return service;
    if (url.startsWith(canonicalUrl) && /^[/?]/.test(url.slice(canonicalUrl.length))) return service;
  }
  return null;
}

// Does a grant cover this URL: its canonicalUrl, followed by a path, a query
// or nothing (not merely a longer host name that starts the same way).
export function grantCovers(grant, url) {
  const base = grant && grant.canonicalUrl;
  if (typeof base !== 'string' || !base || typeof url !== 'string') return false;
  return url === base || (url.startsWith(base) && /^[/?]/.test(url.slice(base.length)));
}

// An outgoing webhook through the Powerbox (docs/Platforms/FOSS/Container/
// Sandstorm/Powerbox-External-APIs.md): the API a board admin is asked to
// approve, for the webhook's URL. The bridge proxy joins canonicalUrl and the
// request path with a '/', so the grant is the URL's PARENT path and the
// request carries its last segment: a webhook at <origin>/services/T/B/X is
// granted as <origin>/services/T/B and requested as /X, which arrives exactly
// as written, without a trailing slash. Only http(s), no user name or
// password in it (the proxy owns Authorization), no fragment.
export function webhookGrantFor(rawUrl) {
  let url;
  try { url = new URL(rawUrl); } catch (e) { return null; }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (url.username || url.password || url.hash) return null;
  const segments = url.pathname.split('/').filter(Boolean);
  const parent = segments.slice(0, -1).map(s => `/${s}`).join('');
  const canonicalUrl = `${url.origin}${parent}`;
  return { canonicalUrl, url: `${url.origin}${url.pathname === '/' ? '' : url.pathname}${url.search}` };
}

// List sync from a grain: the API root a board member approves in the
// Powerbox for one list's tracker - the part of every request URL that
// listSyncFetch.js builds below it. Jira authenticates only with a Basic
// Authorization header, which the bridge proxy replaces with the grant, so it
// cannot be reached from a grain: null, with the reason.
export function syncApiRoot(type, rawUrl) {
  const base = String(rawUrl || '').replace(/\/+$/, '');
  const root = {
    github: () => 'https://api.github.com',
    gitlab: () => `${base || 'https://gitlab.com'}/api/v4`,
    gitea: () => `${base}/api/v1`,
    forgejo: () => `${base}/api/v1`,
  }[type];
  if (!root) return { root: null, reason: type === 'jira' ? 'jira-basic-auth' : 'unknown-type' };
  const value = root();
  try {
    const url = new URL(value);
    if ((url.protocol !== 'https:' && url.protocol !== 'http:') || url.username || url.password || url.search || url.hash) {
      return { root: null, reason: 'bad-url' };
    }
  } catch (e) {
    return { root: null, reason: 'bad-url' };
  }
  return { root: value, reason: null };
}

// The roots a URL could have been granted under, longest first: its path
// cut back one segment at a time, down to the bare origin. A grant is found
// by looking each up, never by searching the grants.
export function grantRootCandidates(rawUrl) {
  let url;
  try { url = new URL(rawUrl); } catch (e) { return []; }
  const segments = url.pathname.split('/').filter(Boolean);
  const out = [];
  for (let n = segments.length; n >= 0; n -= 1) out.push(`${url.origin}${segments.slice(0, n).map(s => `/${s}`).join('')}`);
  return out;
}

// The absolute-form request target the bridge proxy expects. Only the part
// after canonicalUrl is meaningful to it; the host is informational.
export function proxyTarget(canonicalUrl, url) {
  let rest = url.slice(canonicalUrl.length);
  if (!rest || rest[0] === '?') rest = `/${rest}`;
  return `http://${new URL(canonicalUrl).host}${rest}`;
}

// Where the bridge's proxy listens: HTTP_PROXY / http_proxy, set by
// sandstorm-http-bridge in every grain.
export function proxyAddress(env = process.env) {
  const value = env.HTTP_PROXY || env.http_proxy;
  if (!value) throw new Error('sandstorm-no-http-proxy');
  const parsed = new URL(value);
  return { host: parsed.hostname, port: Number(parsed.port) || 80 };
}

// A Sandstorm session id goes into the claim URL's path; refuse anything that
// could change which path that is.
export function isSessionId(sessionId) {
  return typeof sessionId === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(sessionId);
}

function send({ method, target, headers, body, timeoutMs, signal }, { env, request = http.request }) {
  const { host, port } = proxyAddress(env);
  return new Promise((resolve, reject) => {
    const req = request({ host, port, method, path: target, headers }, resolve);
    req.setTimeout(timeoutMs, () => req.destroy(new Error('sandstorm-egress-timeout')));
    req.on('error', reject);
    if (signal) {
      if (signal.aborted) req.destroy(new Error('aborted'));
      else signal.addEventListener('abort', () => req.destroy(new Error('aborted')), { once: true });
    }
    req.end(body);
  });
}

// A request body as bytes plus the content type it implies. FormData (a file
// upload) is serialized by the platform's own Response, which picks the
// multipart boundary.
async function encodeBody(body, headers) {
  if (body == null) return { bytes: undefined, headers };
  if (typeof body === 'string' || body instanceof Uint8Array) return { bytes: body, headers };
  if (body instanceof URLSearchParams) {
    return { bytes: body.toString(), headers: { 'content-type': 'application/x-www-form-urlencoded', ...headers } };
  }
  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    const encoded = new Response(body);
    return {
      bytes: Buffer.from(await encoded.arrayBuffer()),
      headers: { ...headers, 'content-type': encoded.headers.get('content-type') },
    };
  }
  throw new Error('sandstorm-egress-unsupported-body');
}

// fetch() through the bridge proxy, for a URL under a granted canonicalUrl.
// Resolves to a standard Response; with `stream: true` its body is a Node
// stream instead, as fetchSafe's is.
export async function proxyFetch(url, {
  grant, method = 'GET', headers = {}, body, stream = false, signal, timeoutMs = 30000,
} = {}, { env = process.env, request } = {}) {
  if (!grant || !grant.cap || !grant.canonicalUrl) throw new Error('sandstorm-api-not-granted');
  // The grant, not a fixed list, decides where a request may go: a Trello
  // grant reaches Trello, a webhook's grant reaches that webhook.
  if (!grantCovers(grant, url)) {
    throw new Error('sandstorm-egress-url-not-granted');
  }
  const lowered = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  // The proxy owns Authorization; a caller's own would be swallowed by it.
  delete lowered.authorization;
  const encoded = await encodeBody(body, lowered);
  const res = await send({
    method,
    target: proxyTarget(grant.canonicalUrl, url),
    headers: { ...encoded.headers, authorization: `Bearer ${grant.cap}` },
    body: encoded.bytes,
    timeoutMs,
    signal,
  }, { env, request });
  const responseHeaders = new Headers();
  for (const [name, value] of Object.entries(res.headers)) {
    for (const v of [].concat(value)) responseHeaders.append(name, v);
  }
  if (stream) {
    return {
      ok: res.statusCode >= 200 && res.statusCode < 300,
      status: res.statusCode,
      headers: responseHeaders,
      body: res,
    };
  }
  const nullBody = [101, 204, 205, 304].includes(res.statusCode) || method === 'HEAD';
  if (nullBody) res.resume();
  return new Response(nullBody ? null : Readable.toWeb(res), {
    status: res.statusCode,
    headers: responseHeaders,
  });
}

// Exchange a Powerbox claim token for a permanent access token: the
// `POST http://http-bridge/session/<id>/claim` route of the bridge's proxy.
// requiredPermissions ties the grant to the user's access: if they lose it,
// Sandstorm revokes the connection.
export async function claimApiGrant(sessionId, requestToken, {
  requiredPermissions = ['participate'], env = process.env, request, timeoutMs = 30000,
} = {}) {
  if (!isSessionId(sessionId)) throw new Error('sandstorm-invalid-session');
  if (typeof requestToken !== 'string' || !requestToken) throw new Error('sandstorm-invalid-claim');
  const body = JSON.stringify({ requestToken, requiredPermissions });
  const res = await send({
    method: 'POST',
    target: `http://http-bridge/session/${sessionId}/claim`,
    headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) },
    body,
    timeoutMs,
  }, { env, request });
  const chunks = [];
  for await (const chunk of res) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString('utf8');
  if (res.statusCode !== 200) throw new Error(`sandstorm-claim-failed: HTTP ${res.statusCode}`);
  let cap;
  try { ({ cap } = JSON.parse(text)); } catch (e) { cap = null; }
  if (typeof cap !== 'string' || !cap) throw new Error('sandstorm-claim-failed: no access token');
  return cap;
}
