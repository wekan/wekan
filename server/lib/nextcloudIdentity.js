'use strict';
const { createHmac, createHash, timingSafeEqual } = require('node:crypto');

// Only the in-container gateway knows this random, per-start key. Nextcloud's
// APP_SECRET never reaches Meteor, the browser, or a login method argument.
function nextcloudIdentity(headers, env = process.env) {
  if (env.NEXTCLOUD_EXAPP !== 'true' || !env.WEKAN_NEXTCLOUD_PROXY_KEY) return null;
  const payload = headers?.['x-wekan-nextcloud-user'];
  const signature = headers?.['x-wekan-nextcloud-signature'];
  if (typeof payload !== 'string' || payload.length > 4096 ||
      typeof signature !== 'string' || !/^[a-f0-9]{64}$/.test(signature)) return null;
  const expected = createHmac('sha256', env.WEKAN_NEXTCLOUD_PROXY_KEY).update(payload).digest();
  if (!timingSafeEqual(expected, Buffer.from(signature, 'hex'))) return null;
  try {
    const identity = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (identity.issuer !== env.NEXTCLOUD_URL || typeof identity.userId !== 'string' ||
        !identity.userId || identity.userId.length > 255 || /[\x00-\x1f\x7f]/.test(identity.userId)) return null;
    return identity;
  } catch (_) { return null; }
}

function nextcloudUserId(identity) {
  return 'nc-' + createHash('sha256').update(JSON.stringify([identity.issuer, identity.userId])).digest('hex');
}

function nextcloudAdmin(userId, env = process.env) {
  try {
    const users = JSON.parse(env.NEXTCLOUD_ADMIN_USERS || '[]');
    return Array.isArray(users) && users.includes(userId);
  } catch (_) { return false; }
}

function matchesNextcloudUser(user, identity) {
  return !!(user && identity && user._id === nextcloudUserId(identity) &&
    user.services?.nextcloud?.id === identity.userId &&
    user.services.nextcloud.issuer === identity.issuer);
}
module.exports = { nextcloudIdentity, nextcloudUserId, nextcloudAdmin, matchesNextcloudUser };
