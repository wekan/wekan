'use strict';

// The REST API inside a Sandstorm grain, reached with a Sandstorm API key
// (webkey; sandstorm-pkgdef.capnp apiPath = "/"). Every request into a grain
// comes through sandstorm-http-bridge, which sets X-Sandstorm-User-Id and
// X-Sandstorm-Permissions itself and removes any a client sent - so in a
// grain, and ONLY in a grain, they say who is calling. WeKan's own login token
// never reaches it (Sandstorm keeps the Authorization header for the key).
//
// Pure, so tests/sandstormApiIdentity.test.cjs checks it without a grain;
// server/apiMiddleware.js finds the WeKan user for the id.

const SANDSTORM_USER_ID = /^[0-9a-f]{32}$/;
const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Who the bridge says is calling, or null. A key without `participate` reads
 * only: anything but GET/HEAD/OPTIONS is answered as nobody.
 * @return {null | {sandstormId: string, readOnly: boolean}}
 */
function sandstormApiIdentity(headers, { sandstorm = false, method = 'GET' } = {}) {
  if (sandstorm !== true || !headers) return null;
  const id = headers['x-sandstorm-user-id'];
  if (typeof id !== 'string' || !SANDSTORM_USER_ID.test(id)) return null;
  const permissions = String(headers['x-sandstorm-permissions'] || '').split(',').map(p => p.trim());
  const readOnly = !permissions.includes('participate');
  if (readOnly && !READ_METHODS.has(String(method).toUpperCase())) return null;
  return { sandstormId: id, readOnly };
}

module.exports = { sandstormApiIdentity };
