'use strict';

// #824: a general avatar for users who have not set one - configured only in
// the environment, as the maintainer asked ("There should be no UI in Admin
// Panel"): DEFAULT_AVATAR_URL is a URL template, for example an intranet server
// http://192.168.1.200/avatars/{username}.png, or a Gravatar-style service.
//
//   {username}     the WeKan username
//   {userId}       the WeKan user id
//   {emailMd5}     MD5 of the trimmed, lower-cased first email address
//   {emailSha256}  SHA-256 of it (Gravatar accepts either)
//
// Every value is URL-encoded into the template. Only an http(s) template is
// used; anything else (javascript:, data:, a relative path) gives no avatar.
// Nothing is fetched by the server: /avatar-default/:userId redirects the
// browser there (server/defaultAvatar.js), and only for a user who has no
// avatar of their own.
//
// Pure: tested by tests/defaultAvatarUrl.test.cjs.
const { createHash } = require('node:crypto');

const hash = (algorithm, value) => createHash(algorithm).update(value).digest('hex');

function defaultAvatarUrl(template, user) {
  const text = typeof template === 'string' ? template.trim() : '';
  if (!text || !user || typeof user._id !== 'string') return null;
  let probe;
  try { probe = new URL(text.replace(/\{[A-Za-z0-9]+\}/g, 'x')); } catch (e) { return null; }
  if (probe.protocol !== 'http:' && probe.protocol !== 'https:') return null;
  const email = String((user.emails && user.emails[0] && user.emails[0].address) || '').trim().toLowerCase();
  const values = {
    username: user.username || '',
    userId: user._id,
    emailMd5: email ? hash('md5', email) : '',
    emailSha256: email ? hash('sha256', email) : '',
  };
  if (/\{username\}/.test(text) && !values.username) return null;
  if (/\{email(Md5|Sha256)\}/.test(text) && !email) return null;
  return text.replace(/\{([A-Za-z0-9]+)\}/g, (all, key) =>
    (Object.hasOwn(values, key) ? encodeURIComponent(values[key]) : all));
}

module.exports = { defaultAvatarUrl };
