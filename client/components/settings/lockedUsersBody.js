import { ReactiveCache } from '/imports/reactiveCache';
import LockoutSettings from '/models/lockoutSettings';

Template.lockedUsersGeneral.onCreated(function () {
  this.lockedUsers = new ReactiveVar([]);
  this.isLoadingLockedUsers = new ReactiveVar(false);

  // Store refreshLockedUsers on the instance so it can be called from event handlers
  this.refreshLockedUsers = () => {
    // Set loading state initially, but we'll hide it if no users are found
    this.isLoadingLockedUsers.set(true);

    Meteor.call('getLockedUsers', (err, users) => {
      if (err) {
        this.isLoadingLockedUsers.set(false);
        const reason = err.reason || '';
        const message = `${TAPi18n.__(err.error)}\n${reason}`;
        alert(message);
        return;
      }

      // If no users are locked, don't show loading spinner and set empty array
      if (!users || users.length === 0) {
        this.isLoadingLockedUsers.set(false);
        this.lockedUsers.set([]);
        return;
      }

      // Format the remaining time to be more human-readable
      users.forEach(user => {
        if (user.remainingLockTime > 60) {
          const minutes = Math.floor(user.remainingLockTime / 60);
          const seconds = user.remainingLockTime % 60;
          user.remainingTimeFormatted = `${minutes}m ${seconds}s`;
        } else {
          user.remainingTimeFormatted = `${user.remainingLockTime}s`;
        }
      });

      this.lockedUsers.set(users);
      this.isLoadingLockedUsers.set(false);
    });
  };

  // Don't load immediately to prevent unnecessary spinner
  // The data will be loaded when the tab is selected in peopleBody.js switchMenu
});

Template.lockedUsersGeneral.helpers({
  knownFailuresBeforeLockout() {
    return LockoutSettings.findOne('known-failuresBeforeLockout')?.value || 3;
  },

  knownLockoutPeriod() {
    return LockoutSettings.findOne('known-lockoutPeriod')?.value || 60;
  },

  knownFailureWindow() {
    return LockoutSettings.findOne('known-failureWindow')?.value || 15;
  },

  unknownFailuresBeforeLockout() {
    return LockoutSettings.findOne('unknown-failuresBeforeLockout')?.value || 3;
  },

  unknownLockoutPeriod() {
    return LockoutSettings.findOne('unknown-lockoutPeriod')?.value || 60;
  },

  unknownFailureWindow() {
    return LockoutSettings.findOne('unknown-failureWindow')?.value || 15;
  },

  lockedUsers() {
    return Template.instance().lockedUsers.get();
  },

  isLoadingLockedUsers() {
    return Template.instance().isLoadingLockedUsers.get();
  },
});

Template.lockedUsersGeneral.events({
  'click button.js-refresh-locked-users'(event, tpl) {
    tpl.refreshLockedUsers();
  },
  'click button#refreshLockedUsers'(event, tpl) {
    tpl.refreshLockedUsers();
  },
  'click button.js-unlock-user'(event, tpl) {
    const userId = $(event.currentTarget).data('user-id');
    if (!userId) return;

    if (confirm(TAPi18n.__('accounts-lockout-confirm-unlock'))) {
      Meteor.call('unlockUser', userId, (err, result) => {
        if (err) {
          const reason = err.reason || '';
          const message = `${TAPi18n.__(err.error)}\n${reason}`;
          alert(message);
          return;
        }

        if (result) {
          alert(TAPi18n.__('accounts-lockout-user-unlocked'));
          tpl.refreshLockedUsers();
        }
      });
    }
  },
  'click button.js-unlock-all-users'(event, tpl) {
    if (confirm(TAPi18n.__('accounts-lockout-confirm-unlock-all'))) {
      Meteor.call('unlockAllUsers', (err, result) => {
        if (err) {
          const reason = err.reason || '';
          const message = `${TAPi18n.__(err.error)}\n${reason}`;
          alert(message);
          return;
        }

        if (result) {
          alert(TAPi18n.__('accounts-lockout-user-unlocked'));
          tpl.refreshLockedUsers();
        }
      });
    }
  },
  'click button.js-lockout-save'() {
    // Get values from form
    const knownFailuresBeforeLockout = parseInt($('#known-failures-before-lockout').val(), 10) || 3;
    const knownLockoutPeriod = parseInt($('#known-lockout-period').val(), 10) || 60;
    const knownFailureWindow = parseInt($('#known-failure-window').val(), 10) || 15;

    const unknownFailuresBeforeLockout = parseInt($('#unknown-failures-before-lockout').val(), 10) || 3;
    const unknownLockoutPeriod = parseInt($('#unknown-lockout-period').val(), 10) || 60;
    const unknownFailureWindow = parseInt($('#unknown-failure-window').val(), 10) || 15;

    // Update the database
    LockoutSettings.update('known-failuresBeforeLockout', {
      $set: { value: knownFailuresBeforeLockout },
    });
    LockoutSettings.update('known-lockoutPeriod', {
      $set: { value: knownLockoutPeriod },
    });
    LockoutSettings.update('known-failureWindow', {
      $set: { value: knownFailureWindow },
    });

    LockoutSettings.update('unknown-failuresBeforeLockout', {
      $set: { value: unknownFailuresBeforeLockout },
    });
    LockoutSettings.update('unknown-lockoutPeriod', {
      $set: { value: unknownLockoutPeriod },
    });
    LockoutSettings.update('unknown-failureWindow', {
      $set: { value: unknownFailureWindow },
    });

    // Reload the AccountsLockout configuration
    Meteor.call('reloadAccountsLockout', (err, ret) => {
      if (!err && ret) {
        const message = TAPi18n.__('accounts-lockout-settings-updated');
        alert(message);
      } else {
        const reason = err?.reason || '';
        const message = `${TAPi18n.__(err?.error || 'error-updating-settings')}\n${reason}`;
        alert(message);
      }
    });
  },
});
