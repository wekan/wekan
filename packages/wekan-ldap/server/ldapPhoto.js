'use strict';

// Extract the raw LDAP photo bytes (jpegPhoto / thumbnailPhoto) as a Buffer, tolerating
// the different shapes ldapjs / the entry wrapper may produce (a Buffer, an array of
// Buffers, a serialized { type:'Buffer', data:[…] }, or a base64 string), from either the
// wrapped `_raw` object or the entry itself. Returns a Buffer or null.
//
// Pure (only Node's Buffer); unit-tested in tests/ldapPhoto.test.cjs.
function getLdapPhotoBuffer(ldapUser) {
  const sources = [ldapUser && ldapUser._raw, ldapUser].filter(Boolean);
  for (const src of sources) {
    for (const key of ['jpegPhoto', 'thumbnailPhoto']) {
      let v = src[key];
      if (Array.isArray(v)) v = v[0];
      if (!v) continue;
      if (Buffer.isBuffer(v)) return v;
      if (v && v.type === 'Buffer' && Array.isArray(v.data)) return Buffer.from(v.data);
      if (typeof v === 'string' && v.length > 32) {
        try { return Buffer.from(v, 'base64'); } catch (e) { /* not base64 */ }
      }
    }
  }
  return null;
}

module.exports = { getLdapPhotoBuffer };
