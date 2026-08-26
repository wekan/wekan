'use strict';

// Claims copied from an access token are optional profile metadata. Identity,
// token and object-prototype fields belong to WeKan or to the trusted userinfo
// response and must never be replaced by an administrator's claim whitelist.
const RESERVED_SERVICE_DATA_FIELDS = new Set([
  '__proto__',
  'constructor',
  'prototype',
  'id',
  'username',
  'email',
  'fullname',
  'email_verified',
  'picture',
  'accessToken',
  'expiresAt',
  'refreshToken',
  'groups',
]);

function mergeWhitelistedClaims(serviceData, tokenContent, whitelist) {
  if (!tokenContent || typeof tokenContent !== 'object') return serviceData;
  const allowed = new Set(Array.isArray(whitelist) ? whitelist : []);
  for (const [key, value] of Object.entries(tokenContent)) {
    if (allowed.has(key) && !RESERVED_SERVICE_DATA_FIELDS.has(key)) {
      serviceData[key] = value;
    }
  }
  return serviceData;
}

module.exports = { RESERVED_SERVICE_DATA_FIELDS, mergeWhitelistedClaims };
