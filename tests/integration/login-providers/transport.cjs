'use strict';
// Test-process-only network boundary. Never loaded by the application normally.
// Built-in social adapters have fixed HTTPS URLs. Redirect only these known
// hosts to our loopback fixture; refuse all other external HTTP requests.
const http = require('node:http');
const https = require('node:https');
const allowed = new Set(['accounts.google.com', 'www.googleapis.com', 'github.com', 'api.github.com',
  'graph.facebook.com', 'api.twitter.com', 'www.meteor.com', 'api.weibo.com',
  'secure.meetup.com', 'api.meetup.com', 'cas.identity.invalid']);
const base = process.env.WEKAN_TEST_IDENTITY_URL;
if (!base || new URL(base).hostname !== '127.0.0.1') throw Error('Identity transport requires a loopback fixture');
const request = http.request.bind(http);
function rewrite(input) {
  const url = new URL(input);
  if (allowed.has(url.hostname)) return `${base}/social/${url.hostname}${url.pathname}${url.search}`;
  if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) throw Error(`External network blocked in identity test: ${url.hostname}`);
  return url.toString();
}
for (const module of [http, https]) {
  module.request = function(input, options, callback) {
    if (typeof options === 'function') { callback = options; options = {}; }
    if (typeof input === 'string' || input instanceof URL) return request(rewrite(input), options, callback);
    const protocol = input.protocol || (module === https ? 'https:' : 'http:');
    const original = `${protocol}//${input.hostname || input.host}${input.port ? ':' + input.port : ''}${input.path || '/'}`;
    const target = new URL(rewrite(original));
    return request({ ...input, protocol: target.protocol, hostname: target.hostname, host: target.host, port: target.port,
      path: target.pathname + target.search, agent: undefined }, callback || options);
  };
  module.get = (...args) => { const req = module.request(...args); req.end(); return req; };
}
const fetch = global.fetch;
global.fetch = (url, options) => fetch(rewrite(typeof url === 'string' || url instanceof URL ? url : url.url), options);
