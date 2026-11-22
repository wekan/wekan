import Users, { isUserUpdateAllowed, hasForbiddenUserUpdateField, writesNotificationList } from '/models/users';
const { writesUnsafeAvatarUrl } = require('/models/lib/avatarUrlScheme');

Users.allow({
  update(userId, doc, fields, modifier) {
    // Only the owner can update, and only for allowed fields
    if (!userId || doc._id !== userId) {
      return false;
    }
    if (!Array.isArray(fields) || fields.length === 0) {
      return false;
    }
    // Disallow if any forbidden field present
    if (hasForbiddenUserUpdateField(fields, modifier)) {
      return false;
    }
    // Allow only username and profile.*
    const allowed = isUserUpdateAllowed(fields);
    return allowed;
  },
  remove(userId, doc) {
    // Disable direct client-side user removal for security
    // All user removal should go through the secure server method 'removeUser'
    // This prevents IDOR vulnerabilities and ensures proper authorization checks
    return false;
  },
  fetch: [],
});

// Deny any attempts to touch forbidden fields from client updates
Users.deny({
  update(userId, doc, fields, modifier) {
    const denied = hasForbiddenUserUpdateField(fields, modifier);
    if (denied && fields.some(field => field === 'profile' ||
      field === 'profile.invitedBoards' || field.startsWith('profile.invitedBoards.'))) {
      try {
        require('/server/lib/securityLog').record({
          key: 'authz.invitation-profile', action: 'blocked', source: 'ddp:user-profile',
          detail: 'Client modification of server-issued board invitations denied.',
        });
      } catch (e) { /* logging must never break the guard */ }
    }
    if (writesNotificationList(modifier)) {
      // No client code adds to or rewrites the tray; only an attempt reaches here.
      try {
        require('/server/lib/securityLog').record({
          key: 'authz.notification-tray', action: 'blocked', source: 'ddp:user-notifications', userId,
          detail: 'Client write of server-issued notification entries denied.',
        });
      } catch (e) { /* logging must never break the guard */ }
    }
    // The allow rule above permits every profile.* field, and WeKan's client
    // sets an avatar only through the setAvatarUrl method. A direct write of an
    // avatar URL that method refuses is an attempt, never ordinary use.
    if (writesUnsafeAvatarUrl(modifier)) {
      try {
        require('/server/lib/securityLog').record({
          key: 'file.avatar-url', action: 'blocked', source: 'ddp:user-profile-avatar', userId,
          detail: 'Client write of a profile.avatarUrl that setAvatarUrl refuses denied.',
        });
      } catch (e) { /* logging must never break the guard */ }
      return true;
    }
    return denied;
  },
  fetch: [],
});

// Admin Panel / People / Login / "Username Change" off: the allow rule above
// lets a user write their own `username`, and the setUsername method already
// refuses while the change is not allowed - so a direct client write of it
// is the way round that method, and no WeKan screen makes one. Refused and
// recorded (docs/Features/Admin-Panel/Settings-Enforced-On-Server.md).
Users.deny({
  async update(userId, doc, fields, modifier) {
    const paths = modifier && typeof modifier === 'object'
      ? Object.entries(modifier).flatMap(([op, value]) => (op === '$rename' && value && typeof value === 'object'
        ? [...Object.keys(value), ...Object.values(value)]
        : (value && typeof value === 'object' ? Object.keys(value) : [])))
      : [];
    if (!fields.includes('username') && !paths.includes('username')) return false;
    const AccountSettings = require('/models/accountSettings').default;
    const allowed = (await AccountSettings.findOneAsync('accounts-allowUserNameChange'))?.booleanValue === true;
    if (allowed) return false;
    try {
      require('/server/lib/securityLog').record({
        key: 'authz.disabled-setting', action: 'blocked', source: 'ddp:users.update-username', userId,
        detail: 'Client write of a username refused while username change is not allowed.',
      });
    } catch (e) { /* logging must never break the guard */ }
    return true;
  },
  fetch: [],
});
