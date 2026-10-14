// Optional APIs (models/lib/optionalApis.js): REST APIs in the shape of
// Trello's, Jira's, GitHub's and Gitea's, so their clients can use WeKan as
// their backend.
//
// THEY HAVE NO RIGHTS OF THEIR OWN. Each one is a translator: a request in
// the other tracker's shape becomes the matching request to WeKan's own REST
// API, made with the caller's own credential, and WeKan's answer becomes the
// other tracker's JSON. So every check WeKan's REST API makes - who may read
// a board, who may write it, list permissions, assigned-only members, read-
// only roles, the import switch, rate limits, Admin Panel / Problems - applies
// to these APIs unchanged, and nothing here can let a caller do what WeKan's
// REST API would refuse them. There is no write in this directory that is not
// a call to WeKan's REST API.
import { WebApp } from 'meteor/webapp';
import { ReactiveCache } from '/imports/reactiveCache';

const { OPTIONAL_APIS, isOptionalApiEnabled, compatToken } = require('/models/lib/optionalApis');

// The headers that say who is calling, forwarded to WeKan's REST API as they
// came: a Sandstorm grain's bridge identifies an API key's user by these.
const SANDSTORM_HEADERS = ['x-sandstorm-user-id', 'x-sandstorm-username', 'x-sandstorm-permissions',
  'x-sandstorm-tab-id', 'x-sandstorm-session-id', 'x-sandstorm-session-type', 'x-sandstorm-api'];

function loopbackBase() {
  const prefix = (typeof __meteor_runtime_config__ !== 'undefined' && __meteor_runtime_config__.ROOT_URL_PATH_PREFIX) || '';
  return `http://127.0.0.1:${process.env.PORT || 3000}${prefix}`;
}

export class CompatError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

/**
 * A call to WeKan's own REST API as the caller: { status, body }.
 * `path` is built from ids the translator checked are ids, never from a URL
 * the caller wrote.
 */
async function wekan(ctx, method, path, body) {
  if (!/^\/api\/[A-Za-z0-9/_:.-]*$/.test(path)) throw new CompatError(400, 'invalid path');
  const headers = { Accept: 'application/json' };
  if (ctx.token) headers.Authorization = `Bearer ${ctx.token}`;
  for (const name of SANDSTORM_HEADERS) if (ctx.req.headers[name]) headers[name] = ctx.req.headers[name];
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  // Our own server, at a fixed loopback address: not an outbound request.
  // eslint-disable-next-line no-restricted-globals
  const res = await fetch(`${loopbackBase()}${path}`, { method, headers, redirect: 'manual',
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
  if (res.status >= 400) throw new CompatError(res.status, (data && (data.error || data.reason || data.message)) || `HTTP ${res.status}`);
  return data;
}

const ID = /^[A-Za-z0-9_-]{1,64}$/;
export function id(value) {
  const s = String(value == null ? '' : value);
  if (!ID.test(s)) throw new CompatError(404, 'not found');
  return s;
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(body === undefined ? '' : JSON.stringify(body));
}

/**
 * Register one optional API: `routes` is [{ method, path: RegExp, run(ctx, match) }],
 * matched against the path after the API's base. `errorBody(status, message)`
 * shapes an error the way that tracker's clients expect.
 */
export function registerCompatApi(key, routes, { errorBody = (status, message) => ({ message }) } = {}) {
  const api = OPTIONAL_APIS.find(a => a.key === key);
  WebApp.handlers.use(async function compatApi(req, res, next) {
    let pathname = String(req.url || '').split('?')[0];
    if (!pathname.toLowerCase().startsWith(api.base.toLowerCase())) return next();
    try {
      // Off unless an administrator ticked it: as if it were not there.
      const setting = await ReactiveCache.getCurrentSetting();
      if (!isOptionalApiEnabled(setting, key)) return send(res, 404, errorBody(404, 'Not Found'));
      pathname = pathname.slice(api.base.length) || '/';
      const route = routes.find(r => r.method === req.method && r.path.test(pathname));
      if (!route) return send(res, 404, errorBody(404, 'Not Found'));
      const token = req.authToken || compatToken(key, { authorization: req.headers.authorization, query: req.query || {} });
      // Who is calling is WeKan's REST API's decision too: without a
      // credential there is nothing to forward, and it answers 401 itself.
      const ctx = { req, token, query: req.query || {}, body: req.body || {}, wekan: null };
      ctx.wekan = (method, path, body) => wekan(ctx, method, path, body);
      const result = await route.run(ctx, pathname.match(route.path));
      // A route answers its body, or { status, body, headers } (pagination).
      if (result && result.status) return send(res, result.status, result.body, result.headers || {});
      return send(res, 200, result);
    } catch (error) {
      const status = error instanceof CompatError ? error.status : 500;
      if (status === 500) console.error(`[compatApi:${key}]`, error && error.message);
      return send(res, status, errorBody(status, status === 500 ? 'Internal Server Error' : error.message));
    }
  });
}

export default registerCompatApi;
