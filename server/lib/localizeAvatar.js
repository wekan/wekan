import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import Avatars from '/models/avatars';
import dns from 'dns';
import {
  isExternalAvatarUrl,
  isBlockedIp,
  decodeDataUri,
  checkUrlHostSync,
} from '/models/lib/avatarUrlSafety';

// Re-export so existing importers of isExternalAvatarUrl keep working.
export { isExternalAvatarUrl };

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

// Cap the download so a hostile or broken URL cannot exhaust memory. Avatars are
// tiny; WeKan's own avatar upload limit is ~72 KB, but allow some headroom for
// provider images that WeKan may downscale later.
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 8000;

// Full SSRF guard: synchronous protocol/IP-literal/localhost checks (shared, pure) plus
// hostname DNS resolution that blocks if ANY resolved address is private/loopback.
async function assertSafePublicUrl(url) {
  const res = checkUrlHostSync(url);
  if (!res.ok) throw new Error(res.reason);
  if (!res.needsDnsCheck) return;
  const addrs = await dns.promises.lookup(res.host, { all: true }).catch(() => []);
  if (!addrs.length) throw new Error(`cannot resolve ${res.host}`);
  for (const a of addrs) {
    if (isBlockedIp(a.address)) throw new Error(`blocked resolved address ${a.address} for ${res.host}`);
  }
}

// Fetch bytes for an avatar URL (or decode a data: URI), with SSRF guards, a
// timeout and a size cap. Returns { buffer, type } or null on any failure.
async function fetchAvatarBytes(url) {
  try {
    if (/^data:/i.test(url)) return decodeDataUri(url);
    await assertSafePublicUrl(url);
    // SSRF fix (reported by meifukun): the previous native fetch() used
    // redirect:'follow', so a public URL that passed assertSafePublicUrl could
    // 302 to http://127.0.0.1/… (or a private/metadata address) and the server
    // followed it. fetchSafe() resolves DNS once, PINS the connection to the
    // validated IP (no DNS-rebinding window) and REJECTS every redirect, so the
    // redirect-bypass is closed. It is imported lazily to keep this module usable
    // on the client bundle path that re-exports isExternalAvatarUrl.
    const { fetchSafe } = require('/server/lib/ssrfGuard');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let res;
    try {
      res = await fetchSafe(url, { signal: controller.signal });
    } finally { clearTimeout(timer); }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const type = ((res.headers && res.headers['content-type']) || '').split(';')[0].trim() || 'image/png';
    if (!/^image\//i.test(type)) throw new Error(`not an image (${type})`);
    const ab = await res.arrayBuffer();
    if (ab.byteLength > MAX_AVATAR_BYTES) throw new Error('avatar too large');
    if (!ab.byteLength) throw new Error('empty avatar');
    return { buffer: Buffer.from(ab), type };
  } catch (e) {
    if (process.env.DEBUG === 'true') console.warn('localizeAvatar: fetch failed for', url, '-', e.message);
    // Record only genuine SSRF rejections (blocked IP / refused redirect /
    // disallowed protocol), not ordinary network/404 failures.
    if (/SSRF_GUARD|blocked|redirect|not allowed|private|loopback|metadata/i.test(e && e.message || '')) {
      try {
        require('/server/lib/securityLog').record({
          key: 'ssrf.redirect', action: 'blocked', source: 'localizeAvatar',
          detail: `avatar fetch blocked (${e.message})`,
        });
      } catch (_) { /* logging must never break the guard */ }
    }
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
  // Admin Panel / Features / Security: when import avatars is disabled, block every
  // avatar-import path — this is the single choke point that WeKan JSON import, LDAP,
  // OIDC/OAuth2 login sync and board-open localization all funnel through.
  try {
    const { getImportExportSecuritySettings } = require('/models/lib/importExportSecurity');
    if ((await getImportExportSecuritySettings()).disableImportAvatars) return null;
  } catch (e) { /* if the setting can't be read, fall through (default: allowed) */ }
  const ext = extForType(type);
  const fileName = (name && String(name).replace(/[^a-zA-Z0-9_.\-]/g, '_')) || `avatar.${ext}`;
  try {
    const fileRef = await Avatars.writeAsync(
      buffer,
      { fileName, type, userId, meta: { source: 'localized-external' } },
      true, // proceedAfterUpload → runs onAfterUpload (validation + setAvatarUrl)
    );
    if (!fileRef || !fileRef._id) {
      return null;
    }
    // onAfterUpload has set profile.avatarUrl asynchronously; report the id-based URL.
    return `/cdn/storage/avatars/${fileRef._id}`;
  } catch (e) {
    if (process.env.DEBUG === 'true') console.warn('localizeAvatar: write failed:', e.message);
    return null;
  }
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
