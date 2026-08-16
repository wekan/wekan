import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { ReactiveCache } from '/imports/reactiveCache';
const { lockSummary } = require('/models/lib/accountLockout');

// Method to find locked users and release them if needed
Meteor.methods({
  async getLockedUsers() {
    // Check if user has admin rights
    const userId = this.userId;
    if (!userId) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user');
    }
    const user = await ReactiveCache.getUser(userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed');
    }

    // Current time to check against unlockTime
    const currentTime = Number(new Date());

    // Find users that are locked (known users)
    const lockedUsers = await Meteor.users.find(
      {
        'services.accounts-lockout.lockedUntil': {
          $gt: currentTime,
        }
      },
      {
        fields: {
          _id: 1,
          username: 1,
          emails: 1,
          'services.accounts-lockout': 1
        }
      }
    ).fetchAsync();

    // Format the results for the UI
    return lockedUsers.map(user => {
      const email = user.emails && user.emails.length > 0 ? user.emails[0].address : 'No email';
      const summary = lockSummary(user, currentTime);
      const remainingLockTime = summary.secondsRemaining || 0;

      return {
        _id: user._id,
        username: user.username || 'No username',
        email,
        failedAttempts: summary.failedAttempts || 0,
        // WHY it is locked: how many addresses were locked out of this account
        // and how many failures they made between them. Which addresses is in
        // Admin Panel -> Problems, where it is a tally rather than a field on
        // every user document.
        lockedAddresses: summary.addresses || 0,
        unlockTime: summary.unlockTime,
        remainingLockTime // in seconds
      };
    });
  },

  async unlockUser(userId) {
    check(userId, String);
    // Check if user has admin rights
    const adminId = this.userId;
    if (!adminId) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user');
    }
    const admin = await ReactiveCache.getUser(adminId);
    if (!admin || !admin.isAdmin) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed');
    }

    // Make sure the user to unlock exists
    const userToUnlock = await Meteor.users.findOneAsync(userId);
    if (!userToUnlock) {
      throw new Meteor.Error('error-user-not-found', 'User not found');
    }

    // Unlock the user
    await Meteor.users.updateAsync(
      { _id: userId },
      {
        $unset: {
          'services.accounts-lockout': 1
        }
      }
    );

    return true;
  },

  async unlockAllUsers() {
    // Check if user has admin rights
    const adminId = this.userId;
    if (!adminId) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user');
    }
    const admin = await ReactiveCache.getUser(adminId);
    if (!admin || !admin.isAdmin) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed');
    }

    // Unlock all users
    await Meteor.users.updateAsync(
      { 'services.accounts-lockout.lockedUntil': { $exists: true } },
      {
        $unset: {
          'services.accounts-lockout': 1
        }
      },
      { multi: true }
    );

    return true;
  }
});
