import Users, { isUserUpdateAllowed, hasForbiddenUserUpdateField } from '/models/users';

Users.allow({
  update(userId, doc, fields /*, modifier */) {
    // Only the owner can update, and only for allowed fields
    if (!userId || doc._id !== userId) {
      return false;
    }
    if (!Array.isArray(fields) || fields.length === 0) {
      return false;
    }
    // Disallow if any forbidden field present
    if (hasForbiddenUserUpdateField(fields)) {
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
  update(userId, doc, fields /*, modifier */) {
    const denied = hasForbiddenUserUpdateField(fields);
    return denied;
  },
  fetch: [],
});
