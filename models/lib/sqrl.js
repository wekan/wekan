'use strict';

// #2460: SQRL login (https://www.grc.com/sqrl/sqrl.htm). The sign-in page
// shows a sqrl:// link and its QR code; the member's SQRL client signs this
// site's challenge with the identity key it derives for this site, and posts
// it to /sqrl. Nothing secret is stored: the server keeps the identity's
// public key (idk) and its unlock keys (suk, vuk), which only the member's
// rescue code can use.
//
// This module is the protocol itself, with the storage and the signature
// check passed in, so tests/sqrl.test.cjs drives the real handler with real
// Ed25519 signatures. server/sqrl.js gives it MongoDB and node:crypto.
//
// Wire format (GRC "SQRL Semantics"):
//   request  POST <path>?nut=<nut>, form fields client, server, ids[, pids, urs]
//            client = base64url("name=value\r\n" ...): ver, cmd, opt, idk,
//            pidk, suk, vuk; ids signs the client value followed directly by
//            the server value, with the key idk; pids with pidk; urs with the
//            stored vuk. server is the sqrl:// link on the first request and
//            the server's previous reply, unchanged, on every later one.
//   reply    base64url("name=value\r\n" ...): ver, nut, tif, qry[, url, suk]

const TIF = {
  ID_MATCH: 0x01,
  PREVIOUS_ID_MATCH: 0x02,
  IP_MATCH: 0x04,
  SQRL_DISABLED: 0x08,
  NOT_SUPPORTED: 0x10,
  TRANSIENT_ERROR: 0x20,
  COMMAND_FAILED: 0x40,
  CLIENT_FAILURE: 0x80,
  BAD_ID_ASSOCIATION: 0x100,
};

// A session (one sign-in page, or one "add SQRL" in Member Settings) lives
// this long; every nut of it is used once.
const SESSION_MS = 10 * 60 * 1000;
const MAX_BODY_BYTES = 8 * 1024;
const KEY = /^[A-Za-z0-9_-]{43}$/; // 32 bytes, base64url without padding
const SIGNATURE = /^[A-Za-z0-9_-]{86}$/; // 64 bytes
const B64U = /^[A-Za-z0-9_-]*$/;

function toBase64url(text) {
  return Buffer.from(text, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64url(value) {
  if (typeof value !== 'string' || !B64U.test(value) || value.length % 4 === 1) return null;
  return Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

// "name=value\r\n" lines; the value may itself contain "=".
function parseNameValues(text) {
  if (typeof text !== 'string') return null;
  const out = {};
  for (const line of text.split('\r\n')) {
    if (!line) continue;
    const at = line.indexOf('=');
    if (at < 1) return null;
    out[line.slice(0, at)] = line.slice(at + 1);
  }
  return out;
}

function encodeNameValues(fields) {
  return toBase64url(Object.entries(fields).filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}=${v}\r\n`).join(''));
}

// The site WeKan is: ROOT_URL must be https, as for passkeys - SQRL's
// identity is per site, and over http the challenge could be read and
// answered by anybody on the way.
function siteOf(rootUrl) {
  let url;
  try {
    url = new URL(rootUrl);
  } catch (e) {
    return null;
  }
  if (url.protocol !== 'https:' || url.username || url.password) return null;
  const path = url.pathname.replace(/\/+$/, '');
  return { host: url.host, path, origin: `${url.protocol}//${url.host}`, rootUrl: `${url.protocol}//${url.host}${path}` };
}

// The link a SQRL client opens. x= makes the identity per WeKan when several
// are on one host (example.org/wekan): the client includes that many
// characters of the path in the site key. sfn is the site's friendly name.
function sqrlLink(site, nut, siteName) {
  const x = site.path ? `&x=${site.path.length}` : '';
  return `sqrl://${site.host}${site.path}/sqrl?nut=${nut}${x}&sfn=${toBase64url(siteName || 'WeKan')}`;
}

function qryFor(site, nut) {
  return `${site.path}/sqrl?nut=${nut}`;
}

function options(opt) {
  return new Set(String(opt || '').split('~').filter(Boolean));
}

// One request. `store` is the server's storage (see server/sqrl.js), `verify`
// checks an Ed25519 signature (message, signature base64url, key base64url)
// and `newNut` makes an unpredictable nut. Resolves to the reply's body.
async function handleSqrlRequest({ site, nut, body, ip, now = new Date(), store, verify, newNut }) {
  let tif = 0;
  let session = null;
  const extra = {};

  const fail = bits => respond(bits | TIF.COMMAND_FAILED);

  async function respond(bits) {
    const next = newNut();
    const reply = encodeNameValues({ ver: 1, nut: next, tif: bits.toString(16).toUpperCase(), qry: qryFor(site, next), ...extra });
    // The next request must send this reply back as its `server` value.
    if (session) await store.putNut({ _id: next, session: session._id, expect: reply, expiresAt: session.expiresAt });
    return reply;
  }

  const form = typeof body === 'string' && body.length <= MAX_BODY_BYTES ? new URLSearchParams(body) : null;
  const clientValue = form && form.get('client');
  const serverValue = form && form.get('server');
  const ids = form && form.get('ids');
  if (!clientValue || !serverValue || !SIGNATURE.test(ids || '') || !B64U.test(clientValue) || !B64U.test(serverValue)) {
    return fail(TIF.CLIENT_FAILURE);
  }

  // Each nut is used once, and only with the reply it was issued in.
  const issued = typeof nut === 'string' && B64U.test(nut) ? await store.takeNut(nut) : null;
  if (!issued || issued.expiresAt <= now) return fail(TIF.TRANSIENT_ERROR);
  session = await store.getSession(issued.session);
  if (!session || session.expiresAt <= now || session.state !== 'pending') {
    session = null;
    return fail(TIF.TRANSIENT_ERROR);
  }
  if (serverValue !== issued.expect) return fail(TIF.CLIENT_FAILURE);

  const client = parseNameValues(fromBase64url(clientValue));
  if (!client || !String(client.ver || '').split(',').includes('1') || !KEY.test(client.idk || '')) {
    return fail(TIF.CLIENT_FAILURE);
  }
  const signed = clientValue + serverValue;
  if (!verify(signed, ids, client.idk)) return fail(TIF.CLIENT_FAILURE);
  const pids = form.get('pids');
  if (client.pidk && !(KEY.test(client.pidk) && SIGNATURE.test(pids || '') && verify(signed, pids, client.pidk))) {
    return fail(TIF.CLIENT_FAILURE);
  }
  const urs = form.get('urs');
  const unlocked = user => !!(user && user.vuk && SIGNATURE.test(urs || '') && verify(signed, urs, user.vuk));

  if (session.ip && session.ip === ip) tif |= TIF.IP_MATCH;
  const opt = options(client.opt);
  const ipOk = (tif & TIF.IP_MATCH) || opt.has('noiptest');

  const current = await store.findIdentity(client.idk);
  const previous = !current && client.pidk ? await store.findIdentity(client.pidk) : null;
  if (current) tif |= TIF.ID_MATCH;
  if (previous) tif |= TIF.PREVIOUS_ID_MATCH;
  const known = current || previous;
  if (known && known.disabled) tif |= TIF.SQRL_DISABLED;
  // The unlock key goes back when the client asks for it or needs it to
  // re-enable a disabled identity; it is not a secret (only the rescue code
  // makes a signature it verifies), but it is only for its own identity.
  if (known && (opt.has('suk') || known.disabled)) extra.suk = known.suk;

  switch (client.cmd) {
    case 'query':
      return respond(tif);

    case 'ident': {
      if (!ipOk) return fail(tif);
      if (known && known.disabled) return fail(tif);
      if (session.purpose === 'associate') {
        // Member Settings: the signed-in member adds this identity.
        if (known && known.userId !== session.userId) return fail(tif | TIF.BAD_ID_ASSOCIATION | TIF.CLIENT_FAILURE);
        if (!known) {
          if (!KEY.test(client.suk || '') || !KEY.test(client.vuk || '')) return fail(tif | TIF.CLIENT_FAILURE);
          if (!(await store.associate(session.userId, { idk: client.idk, suk: client.suk, vuk: client.vuk }))) return fail(tif);
          tif |= TIF.ID_MATCH;
        }
        await store.complete(session._id, { userId: session.userId });
        return respond(tif);
      }
      // The sign-in page: only an identity a member has already added.
      if (!known) return fail(tif);
      if (previous) {
        // A rekeyed identity: the old one vouches for the new with its
        // unlock request signature, and the new keys replace the old.
        if (!unlocked(previous) || !KEY.test(client.suk || '') || !KEY.test(client.vuk || '')) return fail(tif | TIF.CLIENT_FAILURE);
        await store.replace(previous.userId, { idk: client.idk, suk: client.suk, vuk: client.vuk });
        tif = (tif & ~TIF.PREVIOUS_ID_MATCH) | TIF.ID_MATCH;
      }
      // Same device (cps): the client opens the returned url in the browser,
      // which signs in with its one-time token, and the waiting sign-in page
      // is abandoned. Otherwise the waiting page is the one that signs in.
      const cpsToken = await store.complete(session._id, { userId: known.userId, cps: opt.has('cps') });
      if (cpsToken) extra.url = `${site.rootUrl}/sign-in?sqrl=${encodeURIComponent(cpsToken)}`;
      return respond(tif);
    }

    case 'disable':
      // An emergency stop: the identity's own signature is enough.
      if (!current) return fail(tif);
      await store.setDisabled(current.userId, true);
      extra.suk = current.suk;
      return respond(tif | TIF.SQRL_DISABLED);

    case 'enable':
      if (!current || !unlocked(current)) return fail(tif | (current ? TIF.CLIENT_FAILURE : 0));
      await store.setDisabled(current.userId, false);
      return respond(tif & ~TIF.SQRL_DISABLED);

    case 'remove':
      if (!current || !unlocked(current)) return fail(tif | (current ? TIF.CLIENT_FAILURE : 0));
      await store.remove(current.userId);
      return respond(tif & ~(TIF.ID_MATCH | TIF.SQRL_DISABLED));

    default:
      return fail(tif | TIF.NOT_SUPPORTED);
  }
}

module.exports = {
  TIF, SESSION_MS, MAX_BODY_BYTES,
  toBase64url, fromBase64url, parseNameValues, encodeNameValues,
  siteOf, sqrlLink, qryFor, handleSqrlRequest,
};
