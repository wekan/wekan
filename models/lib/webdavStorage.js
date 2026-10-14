'use strict';

// #687: the addresses of WebDAV attachment storage (server/lib/webdavAdapter.js).
// An object key is its file's path under the configured folder; each segment
// is URL-encoded, and a key that tries to climb out ("..") is refused.
// Pure: tests/webdavStorage.test.cjs.

function segments(path) {
  const parts = String(path || '').split('/').filter(Boolean);
  if (parts.some(p => p === '.' || p === '..')) throw new Error('invalid WebDAV path');
  return parts.map(p => encodeURIComponent(p));
}

function base(endpoint) {
  return String(endpoint || '').replace(/\/+$/, '');
}

function webdavObjectUrl(endpoint, folder, key) {
  return [base(endpoint), ...segments(folder), ...segments(key)].join('/');
}

// The collections to make, outermost first, so `key` can be stored.
function webdavCollectionUrls(endpoint, folder, key) {
  const parts = [...segments(folder), ...segments(key).slice(0, -1)];
  return parts.map((_, i) => `${[base(endpoint), ...parts.slice(0, i + 1)].join('/')}/`);
}

function validWebdavConfig(cfg) {
  if (!cfg || !cfg.endpoint) return 'WebDAV endpoint is required.';
  let u;
  try { u = new URL(cfg.endpoint); } catch (e) { return 'WebDAV endpoint must be an http:// or https:// address.'; }
  if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password) return 'WebDAV endpoint must be an http:// or https:// address, without a user name or password in it.';
  if (!cfg.bucket) return 'WebDAV folder is required.';
  return null;
}

module.exports = { webdavObjectUrl, webdavCollectionUrls, validWebdavConfig };
