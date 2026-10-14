'use strict';

// #5847: passkey (WebAuthn) login. Shared by the server (server/passkeys.js),
// the browser (client/lib/passkeys.js) and tests/passkeys.test.cjs - pure, no
// Meteor, and the same in Node and the browser.
//
// The relying party is WeKan's own address: its id is ROOT_URL's host name and
// the only origin a response may come from is ROOT_URL's origin, so a passkey
// made for one WeKan cannot sign in to another, nor through any other address.

function relyingParty(rootUrl) {
  let u;
  try { u = new URL(String(rootUrl || '')); } catch (e) { return null; }
  if (u.protocol !== 'https:' && !(u.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(u.hostname))) return null;
  return { rpID: u.hostname, origin: u.origin };
}

// base64url <-> bytes, without Buffer, so the browser can use it too.
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
function bytesToBase64url(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | ((bytes[i + 1] || 0) << 8) | (bytes[i + 2] || 0);
    out += ALPHABET[(n >> 18) & 63] + ALPHABET[(n >> 12) & 63];
    if (i + 1 < bytes.length) out += ALPHABET[(n >> 6) & 63];
    if (i + 2 < bytes.length) out += ALPHABET[n & 63];
  }
  return out;
}
function base64urlToBytes(text) {
  const s = String(text || '');
  if (!/^[A-Za-z0-9_-]*$/.test(s) || s.length % 4 === 1) throw new Error('invalid base64url');
  const out = new Uint8Array(Math.floor((s.length * 3) / 4));
  let o = 0;
  for (let i = 0; i < s.length; i += 4) {
    const n = (ALPHABET.indexOf(s[i]) << 18) | (ALPHABET.indexOf(s[i + 1]) << 12)
      | ((i + 2 < s.length ? ALPHABET.indexOf(s[i + 2]) : 0) << 6) | (i + 3 < s.length ? ALPHABET.indexOf(s[i + 3]) : 0);
    out[o++] = (n >> 16) & 255;
    if (i + 2 < s.length) out[o++] = (n >> 8) & 255;
    if (i + 3 < s.length) out[o++] = n & 255;
  }
  return out.slice(0, o);
}

// The server's JSON options as the browser's navigator.credentials wants them.
function creationOptionsForBrowser(json) {
  return {
    ...json,
    challenge: base64urlToBytes(json.challenge),
    user: { ...json.user, id: base64urlToBytes(json.user.id) },
    excludeCredentials: (json.excludeCredentials || []).map(c => ({ ...c, id: base64urlToBytes(c.id) })),
  };
}
function requestOptionsForBrowser(json) {
  return {
    ...json,
    challenge: base64urlToBytes(json.challenge),
    allowCredentials: (json.allowCredentials || []).map(c => ({ ...c, id: base64urlToBytes(c.id) })),
  };
}

// A PublicKeyCredential as the JSON the server verifies.
function credentialToJSON(credential) {
  const r = credential.response;
  const response = { clientDataJSON: bytesToBase64url(r.clientDataJSON) };
  if (r.attestationObject) {
    response.attestationObject = bytesToBase64url(r.attestationObject);
    if (typeof r.getTransports === 'function') response.transports = r.getTransports();
  }
  if (r.authenticatorData) response.authenticatorData = bytesToBase64url(r.authenticatorData);
  if (r.signature) response.signature = bytesToBase64url(r.signature);
  if (r.userHandle) response.userHandle = bytesToBase64url(r.userHandle);
  return {
    id: credential.id,
    rawId: bytesToBase64url(credential.rawId),
    type: credential.type,
    response,
    clientExtensionResults: typeof credential.getClientExtensionResults === 'function' ? credential.getClientExtensionResults() : {},
    authenticatorAttachment: credential.authenticatorAttachment || undefined,
  };
}

// A passkey's name as the member gave it, or a default.
function passkeyName(name) {
  const n = typeof name === 'string' ? name.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 60) : '';
  return n || 'Passkey';
}

const MAX_PASSKEYS = 20;

module.exports = { relyingParty, bytesToBase64url, base64urlToBytes, creationOptionsForBrowser,
  requestOptionsForBrowser, credentialToJSON, passkeyName, MAX_PASSKEYS };
