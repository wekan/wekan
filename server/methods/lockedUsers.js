import { ReactiveCache } from '/imports/reactiveCache';

// Method to find locked users and release them if needed
Meteor.methods({
  async getLockedUsers() {
    // Check if user has admin rights
    const userId = Meteor.userId();
    if (!userId) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user');
    }
    const user = ReactiveCache.getUser(userId);
    if (!user || !user.isAdmin) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed');
    }

    // Current time to check against unlockTime
    const currentTime = Number(new Date());

    // Find users that are locked (known users)
    const lockedUsers = await Meteor.users.find(
      {
        'services.accounts-lockout.unlockTime': {
          $gt: currentTime,
        }
      },
      {
        fields: {
          _id: 1,
          username: 1,
          emails: 1,
          'services.accounts-lockout.unlockTime': 1,
          'services.accounts-lockout.failedAttempts': 1
        }
      }
    ).fetchAsync();

    // Format the results for the UI
    return lockedUsers.map(user => {
      const email = user.emails && user.emails.length > 0 ? user.emails[0].address : 'No email';
      const remainingLockTime = Math.round((user.services['accounts-lockout'].unlockTime - currentTime) / 1000);

      return {
        _id: user._id,
        username: user.username || 'No username',
        email,
        failedAttempts: user.services['accounts-lockout'].failedAttempts || 0,
        unlockTime: user.services['accounts-lockout'].unlockTime,
        remainingLockTime // in seconds
      };
    });
  },

  async unlockUser(userId) {
    // Check if user has admin rights
    const adminId = Meteor.userId();
    if (!adminId) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user');
    }
    const admin = ReactiveCache.getUser(adminId);
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
    const adminId = Meteor.userId();
    if (!adminId) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user');
    }
    const admin = ReactiveCache.getUser(adminId);
    if (!admin || !admin.isAdmin) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed');
    }

    // Unlock all users
    await Meteor.users.updateAsync(
      { 'services.accounts-lockout.unlockTime': { $exists: true } },
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
