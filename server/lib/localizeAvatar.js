import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import Avatars from '/models/avatars';
import dns from 'dns';
import net from 'net';

// ============================================================================
// Avatar localization
// ----------------------------------------------------------------------------
// Copy a user's avatar that lives OUTSIDE WeKan (a Sandstorm profile-picture
// static URL, an LDAP jpegPhoto, an OAuth2/OIDC `picture` claim, a gravatar, …)
// into WeKan's own `avatars` FilesCollection under WRITABLE_PATH/files/avatars,
// and repoint the user's profile.avatarUrl at that local `/cdn/storage/avatars/…`
// copy. Once local, the avatar is served by WeKan itself and is included by the
// board export/import (which embeds avatar files), so an imported board keeps
// showing who the original members were even on a server that cannot reach the
// original identity provider.
//
// Every fetch is guarded against SSRF: only http/https, and never a private,
// loopback, link-local or cloud-metadata address.
// ============================================================================

// A local, already-WeKan-served avatar. Matches both the universal short URL
// (/cdn/storage/avatars/<id>) and the legacy CollectionFS one (/cfs/files/avatars/…),
// with or without an origin/prefix in front.
const LOCAL_AVATAR_RE = /\/(?:cdn\/storage\/avatars|cfs\/files\/avatars)\//i;

// Cap the download so a hostile or broken URL cannot exhaust memory. Avatars are
// tiny; WeKan's own avatar upload limit is ~72 KB, but allow some headroom for
// provider images that WeKan may downscale later.
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 8000;

export function isExternalAvatarUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (LOCAL_AVATAR_RE.test(url)) return false;
  // data: URIs are already self-contained (not fetched over the network); treat
  // them as external so they get materialised to a file too.
  if (/^data:/i.test(url)) return true;
  return /^https?:\/\//i.test(url);
}

// SSRF guard: reject any address that is not a normal public host.
function isBlockedIp(ip) {
  if (net.isIPv4(ip)) {
    const p = ip.split('.').map(Number);
    if (p[0] === 10) return true;                                  // 10.0.0.0/8
    if (p[0] === 127) return true;                                 // loopback
    if (p[0] === 0) return true;                                   // 0.0.0.0/8
    if (p[0] === 169 && p[1] === 254) return true;                 // link-local + cloud metadata
    if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return true;     // 172.16.0.0/12
    if (p[0] === 192 && p[1] === 168) return true;                 // 192.168.0.0/16
    if (p[0] === 100 && p[1] >= 64 && p[1] <= 127) return true;    // 100.64.0.0/10 CGNAT
    if (p[0] >= 224) return true;                                  // multicast / reserved
    return false;
  }
  if (net.isIPv6(ip)) {
    const s = ip.toLowerCase();
    if (s === '::1' || s === '::') return true;                    // loopback / unspecified
    if (s.startsWith('fe80')) return true;                         // link-local
    if (s.startsWith('fc') || s.startsWith('fd')) return true;     // unique local fc00::/7
    if (s.startsWith('::ffff:')) return isBlockedIp(s.slice(7));   // IPv4-mapped
    return false;
  }
  return true; // not a recognisable IP → be safe and block
}

async function assertSafePublicUrl(url) {
  let u;
  try { u = new URL(url); } catch { throw new Error('invalid URL'); }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new Error(`blocked protocol ${u.protocol}`);
  }
  const host = u.hostname.replace(/^\[|\]$/g, ''); // strip IPv6 brackets
  if (net.isIP(host)) {
    if (isBlockedIp(host)) throw new Error(`blocked address ${host}`);
    return;
  }
  if (host === 'localhost' || host.endsWith('.localhost')) throw new Error('blocked host localhost');
  // Resolve the hostname and block if ANY resolved address is private/loopback.
  const addrs = await dns.promises.lookup(host, { all: true }).catch(() => []);
  if (!addrs.length) throw new Error(`cannot resolve ${host}`);
  for (const a of addrs) {
    if (isBlockedIp(a.address)) throw new Error(`blocked resolved address ${a.address} for ${host}`);
  }
}

// Decode a data: URI into { buffer, type }.
function decodeDataUri(url) {
  const m = /^data:([^;,]*)(;base64)?,(.*)$/is.exec(url);
  if (!m) throw new Error('invalid data URI');
  const type = m[1] || 'application/octet-stream';
  const buffer = m[2]
    ? Buffer.from(m[3], 'base64')
    : Buffer.from(decodeURIComponent(m[3]), 'utf8');
  return { buffer, type };
}

// Fetch bytes for an avatar URL (or decode a data: URI), with SSRF guards, a
// timeout and a size cap. Returns { buffer, type } or null on any failure.
async function fetchAvatarBytes(url) {
  try {
    if (/^data:/i.test(url)) return decodeDataUri(url);
    await assertSafePublicUrl(url);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let res;
    try {
      res = await fetch(url, { redirect: 'follow', signal: controller.signal });
    } finally { clearTimeout(timer); }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const type = (res.headers.get('content-type') || '').split(';')[0].trim() || 'image/png';
    if (!/^image\//i.test(type)) throw new Error(`not an image (${type})`);
    const ab = await res.arrayBuffer();
    if (ab.byteLength > MAX_AVATAR_BYTES) throw new Error('avatar too large');
    if (!ab.byteLength) throw new Error('empty avatar');
    return { buffer: Buffer.from(ab), type };
  } catch (e) {
    if (process.env.DEBUG === 'true') console.warn('localizeAvatar: fetch failed for', url, '-', e.message);
    return null;
  }
}

function extForType(type) {
  const map = {
    'image/png': 'png', 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/gif': 'gif',
    'image/webp': 'webp', 'image/bmp': 'bmp', 'image/svg+xml': 'svg', 'image/avif': 'avif',
  };
  return map[(type || '').toLowerCase()] || 'png';
}

// Write raw bytes into the Avatars FilesCollection for `userId`. onAfterUpload
// (models/avatars.server.js) sets the user's profile.avatarUrl to the resulting
// local /cdn/storage/avatars/<id> URL. Returns the new local URL, or null.
export async function localizeAvatarFromBuffer(userId, buffer, { type = 'image/png', name } = {}) {
  if (!Meteor.isServer || !userId || !buffer || !buffer.length) return null;
  const ext = extForType(type);
  const fileName = (name && String(name).replace(/[^a-zA-Z0-9_.\-]/g, '_')) || `avatar.${ext}`;
  return await new Promise((resolve) => {
    try {
      Avatars.write(
        buffer,
        { fileName, type, userId, meta: { source: 'localized-external' } },
        (writeErr, fileRef) => {
          if (writeErr || !fileRef) {
            if (process.env.DEBUG === 'true') console.warn('localizeAvatar: write failed:', writeErr && writeErr.message);
            return resolve(null);
          }
          // onAfterUpload has set profile.avatarUrl asynchronously; report the id-based URL.
          resolve(`/cdn/storage/avatars/${fileRef._id}`);
        },
        true, // proceedAfterUpload → runs onAfterUpload (validation + setAvatarUrl)
      );
    } catch (e) {
      if (process.env.DEBUG === 'true') console.warn('localizeAvatar: write threw:', e.message);
      resolve(null);
    }
  });
}

// Fetch an external avatar URL and store it locally for `userId`.
export async function localizeAvatarFromUrl(userId, url) {
  if (!Meteor.isServer || !userId || !isExternalAvatarUrl(url)) return null;
  const got = await fetchAvatarBytes(url);
  if (!got) return null;
  return await localizeAvatarFromBuffer(userId, got.buffer, {
    type: got.type,
    name: `${userId}.${extForType(got.type)}`,
  });
}

// If the user's current avatar lives outside WeKan, copy it in. Best-effort and
// idempotent: a user whose avatarUrl is already local is left untouched.
export async function localizeUserAvatarIfExternal(userOrId) {
  if (!Meteor.isServer) return null;
  const user = typeof userOrId === 'string' ? await ReactiveCache.getUser(userOrId) : userOrId;
  if (!user) return null;
  const url = user.profile && user.profile.avatarUrl;
  if (!isExternalAvatarUrl(url)) return null;
  return await localizeAvatarFromUrl(user._id, url);
}

// Guards against re-fetching the same user's avatar while a localization is already
// running (e.g. rapid board re-subscribes), so a member's external avatar is copied
// in at most once.
const inProgress = new Set();

// Localize every board member's external avatar. Best-effort, fire-and-forget: this
// is the universal catch-all trigger — no matter how a member's avatar became external
// (Sandstorm, LDAP, OAuth2/OIDC, a pasted URL), opening the board copies it into
// WeKan's own files/avatars so it displays without the provider and is exportable.
export async function localizeBoardMemberAvatars(boardId) {
  if (!Meteor.isServer || !boardId) return;
  const board = await ReactiveCache.getBoard(boardId);
  if (!board || !Array.isArray(board.members)) return;
  for (const m of board.members) {
    const uid = m && m.userId;
    if (!uid || inProgress.has(uid)) continue;
    const user = await ReactiveCache.getUser(uid);
    if (!user || !isExternalAvatarUrl(user.profile && user.profile.avatarUrl)) continue;
    inProgress.add(uid);
    try { await localizeUserAvatarIfExternal(user); }
    catch (e) { if (process.env.DEBUG === 'true') console.warn('localizeBoardMemberAvatars:', uid, e.message); }
    finally { inProgress.delete(uid); }
  }
}
