// Who is making this plain HTTP request?
//
// `Meteor.userId()` CANNOT ANSWER THAT. It reads the current DDP invocation's
// environment, which exists inside a method or a publication and nowhere else. In
// a WebApp/connect handler there is no such environment, so it does not return
// "nobody" - it throws:
//
//     Meteor.userId can only be invoked in method calls or publications.
//
// Two file routes called it anyway, and because both wrap their body in a
// try/catch that turns any error into a 500, the failure looked like a broken
// file rather than broken authentication:
//
//   server/routes/avatarServer.js       /cdn/storage/avatars/:fileName
//   server/routes/legacyAttachments.js
//
// That is why profile pictures came back as broken images after upgrading from an
// old MongoDB snap: the stored `profile.avatarUrl` of a 6.x install is
// `/cfs/files/avatars/<id>`, the legacy route redirects it to
// `/cdn/storage/avatars/<id>`, and that route could never serve anybody. The
// avatar files themselves migrated fine - the request for them was answered 500
// before a byte was read.
//
// An HTTP request carries its identity in the request: a bearer token, an
// X-Auth-Token header, an ?authToken= parameter, or the login cookie. This is
// the same resolution server/routes/universalFileServer.js has always done -
// lifted here so the routes that were guessing can share it rather than grow a
// third copy.

import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

export function parseCookies(req) {
  const header = req && req.headers && req.headers.cookie;
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    try {
      out[decodeURIComponent(part.slice(0, idx).trim())] =
        decodeURIComponent(part.slice(idx + 1).trim());
    } catch (_) {
      // A cookie we cannot decode is not a reason to fail the request.
    }
  }
  return out;
}

export function parseQuery(req) {
  const out = {};
  const q = ((req && req.url) || '').split('?')[1] || '';
  if (!q) return out;
  for (const pair of q.split('&')) {
    if (!pair) continue;
    const [rawK, rawV] = pair.split('=');
    try {
      out[decodeURIComponent((rawK || '').trim())] =
        decodeURIComponent((rawV || '').trim());
    } catch (_) {
      // ditto
    }
  }
  return out;
}

/** The login token this request carries, or null. Priority order matches
 *  universalFileServer's, so a request that works for an attachment works for an
 *  avatar. */
export function extractLoginToken(req) {
  const authz = req && req.headers &&
    (req.headers.authorization || req.headers.Authorization);
  if (authz && typeof authz === 'string') {
    const m = authz.match(/^Bearer\s+(.+)$/i);
    if (m && m[1]) return m[1].trim();
  }

  const xAuth = req && req.headers &&
    (req.headers['x-auth-token'] || req.headers['X-Auth-Token']);
  if (xAuth && typeof xAuth === 'string') return xAuth.trim();

  const q = parseQuery(req);
  if (q.authToken && typeof q.authToken === 'string') return q.authToken.trim();

  const cookies = parseCookies(req);
  if (cookies.meteor_login_token) return cookies.meteor_login_token.trim();
  if (cookies.wekan_login_token) return cookies.wekan_login_token.trim();

  return null;
}

/** On Sandstorm the platform has already authorized the request and injects the
 *  user id as a header; there is no Meteor login token in that model at all. */
export function isSandstormRequest(req) {
  return !!(
    Meteor.settings &&
    Meteor.settings.public &&
    Meteor.settings.public.sandstorm &&
    req && req.headers && req.headers['x-sandstorm-user-id']
  );
}

/** The user id behind this request, or null. Never throws: a caller deciding
 *  whether to serve a file wants an answer, not an exception that its own
 *  try/catch will turn into a 500. */
export async function getUserIdFromRequest(req) {
  try {
    if (isSandstormRequest(req)) {
      return req.headers['x-sandstorm-user-id'];
    }
    const raw = extractLoginToken(req);
    if (!raw || typeof raw !== 'string' || raw.length < 10) return null;
    const hashed = Accounts._hashLoginToken(raw);
    const user = await Meteor.users.findOneAsync(
      { 'services.resume.loginTokens.hashedToken': hashed },
      { fields: { _id: 1 } },
    );
    return user ? user._id : null;
  } catch (error) {
    if (process.env.DEBUG === 'true') {
      console.warn('requestUser: could not resolve the request user:', error);
    }
    return null;
  }
}

export default {
  parseCookies,
  parseQuery,
  extractLoginToken,
  isSandstormRequest,
  getUserIdFromRequest,
};
