'use strict';

// Which values profile.avatarUrl may hold, and whether a client modifier tries
// to store anything else. Pure, no Meteor and no Node built-ins, so the
// setAvatarUrl method, the Users deny rule and the tests share one rule.
//
// profile.avatarUrl is rendered as an <img src> and, once external, fetched by
// the server for localization (fetchSafe, http/https only). Accepted: an empty
// value (clearing), a WeKan-local path such as /cdn/storage/avatars/..., an
// http(s) URL, or a data:image URI. Refused: javascript:, data:text/html,
// file:, protocol-relative //host and every other scheme.

function isStorableAvatarUrl(avatarUrl) {
  if (typeof avatarUrl !== 'string') return false;
  if (avatarUrl === '') return true;
  if (avatarUrl.startsWith('/') && !avatarUrl.startsWith('//')) return true;
  const m = /^([a-z][a-z0-9+.\-]*):/i.exec(avatarUrl);
  const scheme = m ? m[1].toLowerCase() : '';
  if (scheme === 'http' || scheme === 'https') return true;
  return scheme === 'data' && /^data:image\//i.test(avatarUrl);
}

function avatarUrlScheme(avatarUrl) {
  const m = /^([a-z][a-z0-9+.\-]*):/i.exec(String(avatarUrl));
  return m ? m[1].toLowerCase() : '';
}

const AVATAR_PATH = 'profile.avatarUrl';

// True when a client modifier would store an avatar URL setAvatarUrl refuses.
// The Users allow rule permits every profile.* field, so without this a direct
// Users.update({$set: {'profile.avatarUrl': 'javascript:...'}}) stored what the
// method rejects. $set and $setOnInsert are checked by value, whether written
// as the dotted path or inside a whole profile object; $unset clears it, which
// is fine; any other operator on the field ($rename onto it, $push, $inc, ...)
// is never how an avatar is set and is refused.
function writesUnsafeAvatarUrl(modifier) {
  if (!modifier || typeof modifier !== 'object') return false;
  return Object.entries(modifier).some(([operator, value]) => {
    if (!value || typeof value !== 'object') return false;
    if (operator === '$rename') {
      return Object.values(value).some(to => to === AVATAR_PATH || to === 'profile');
    }
    return Object.keys(value).some(path => {
      const touchesAvatar = path === AVATAR_PATH || path.startsWith(`${AVATAR_PATH}.`);
      const wholeProfile = path === 'profile';
      if (!touchesAvatar && !wholeProfile) return false;
      if (operator === '$unset') return false;
      if (operator !== '$set' && operator !== '$setOnInsert') return true;
      if (wholeProfile) {
        const profile = value[path];
        if (!profile || typeof profile !== 'object') return false;
        return Object.prototype.hasOwnProperty.call(profile, 'avatarUrl') &&
          !isStorableAvatarUrl(profile.avatarUrl);
      }
      // profile.avatarUrl.something would turn the URL into an object.
      return path !== AVATAR_PATH || !isStorableAvatarUrl(value[path]);
    });
  });
}

module.exports = { isStorableAvatarUrl, avatarUrlScheme, writesUnsafeAvatarUrl };
