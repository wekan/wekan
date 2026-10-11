'use strict';

// The address a browser loads an uploaded avatar from.
//
// profile.avatarUrl is stored in more than one shape, depending on what wrote
// it and when:
//   /cdn/storage/avatars/<id>                  Change Avatar, the server's own
//                                              migrations and imports
//   /wekan/cdn/storage/avatars/<id>            older clients, with the
//                                              ROOT_URL path they ran under
//   <scheme>://<old host>/wekan/cdn/storage/...  absolute, from an older ROOT_URL
//   /cfs/files/avatars/<id>                    CollectionFS, before Meteor-Files
//
// Rendered as stored, the first shape is outside WeKan on every sub-path
// install. Univention (UCS) serves WeKan at /wekan, so after an upgrade every
// avatar asked the UCS web server for /cdn/storage/avatars/<id> and showed an
// empty circle - while Change Avatar, which builds its own link, showed the
// picture. The absolute shape fails whenever the browser reaches WeKan by a
// name other than the one ROOT_URL had when the avatar was chosen.
//
// So the stored value is treated as a NAME for the avatar, not as an address:
// whatever stood before /cdn/storage/avatars/ or /cfs/files/avatars/ - a host,
// an old path prefix - is dropped, and the path WeKan is served under now is
// put in its place. The result is relative to the page's own origin, which is
// the one origin the browser has proved it can reach. Anything that is not a
// WeKan avatar (an external picture, a data: URL) is returned unchanged.

const AVATAR_PATH = /\/(?:cdn\/storage|cfs\/files)\/avatars\/[^?#]+/;

// rootPathPrefix: the path WeKan is served under, e.g. "/wekan", or "" at the
// root - Meteor puts it in __meteor_runtime_config__.ROOT_URL_PATH_PREFIX.
function avatarDisplayUrl(stored, rootPathPrefix) {
  if (!stored || typeof stored !== 'string') return '';
  const match = stored.match(AVATAR_PATH);
  if (!match) return stored;
  const before = stored.slice(0, match.index);
  // Only a host and/or a plain path may stand before it: an avatar path that is
  // part of some other URL's query string is not WeKan's avatar.
  if (/[?#]/.test(before)) return stored;
  if (before && !/^(?:https?:\/\/[^/?#]+)?(?:\/[^?#]*)?$/.test(before)) return stored;
  const prefix = String(rootPathPrefix || '').replace(/\/+$/, '');
  return `${prefix}${match[0]}`;
}

module.exports = { avatarDisplayUrl };
