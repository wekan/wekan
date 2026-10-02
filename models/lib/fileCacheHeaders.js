'use strict';
// CacheBleed (GHSA-w3qg-pf27-g68r): how a stored file - an attachment, an
// avatar, a thumbnail - may be cached. One place, so every route that serves
// one says the same thing.
//
// A file is served only after an access check on the caller's credential
// (cookie, Authorization, X-Auth-Token or ?authToken=). The old answer,
// `public, max-age=31536000`, let a shared cache - a CDN, a caching reverse
// proxy, a corporate proxy - store a member's copy and hand it to anyone who
// asked for the same URL, without credentials and for a year, including after
// the member was removed from the board.
//
// `private` keeps the response out of every shared cache. `no-cache` makes the
// browser's own copy revalidate before each use, so the access check runs again
// and a revocation takes effect at once; the ETag keeps that revalidation a
// bodiless 304. This is the same for a public board: a board can be made
// private later, and a copy cached as public would outlive that change.
// `Vary` names the credential headers for any cache that ignores `private`.
//
// Meteor-Files' own default is `public, max-age=31536000, s-maxage=31536000`,
// so every FilesCollection passes PRIVATE_FILE_CACHE_CONTROL as cacheControl.
// Pure: tested by tests/fileCacheHeaders.test.cjs.
const PRIVATE_FILE_CACHE_CONTROL = 'private, no-cache';
const PRIVATE_FILE_VARY = ['Cookie', 'Authorization', 'X-Auth-Token'];

// Add the credential headers to whatever Vary already holds, once each.
function mergeVary(existing) {
  const current = String(existing || '').split(',').map(v => v.trim()).filter(Boolean);
  if (current.includes('*')) return '*';
  const seen = new Set(current.map(v => v.toLowerCase()));
  for (const name of PRIVATE_FILE_VARY) {
    if (!seen.has(name.toLowerCase())) current.push(name);
  }
  return current.join(', ');
}

// For res.setHeader-style responses (node http, connect).
function setPrivateFileCacheHeaders(res) {
  res.setHeader('Cache-Control', PRIVATE_FILE_CACHE_CONTROL);
  res.setHeader('Vary', mergeVary(res.getHeader && res.getHeader('Vary')));
}

// For res.writeHead(status, headers) responses.
function privateFileCacheHeaders() {
  return { 'Cache-Control': PRIVATE_FILE_CACHE_CONTROL, Vary: mergeVary('') };
}

module.exports = {
  PRIVATE_FILE_CACHE_CONTROL, PRIVATE_FILE_VARY, mergeVary, setPrivateFileCacheHeaders, privateFileCacheHeaders,
};
