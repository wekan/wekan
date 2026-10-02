import Users, { isUserUpdateAllowed, hasForbiddenUserUpdateField, writesNotificationList } from '/models/users';

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
    return denied;
  },
  fetch: [],
});
