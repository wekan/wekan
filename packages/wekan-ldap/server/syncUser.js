import { runLdapSync } from './sync';
import LDAP from './ldap';

// Admin Panel / People / LDAP / Sync now (maintainer decision of 2026-10-08):
// runs the background sync once, now - the same work, gated by the same
// settings: LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS imports directory users that
// are not in WeKan yet, LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED
// refreshes the ones that are. LDAP_BACKGROUND_SYNC itself (the schedule) does
// not have to be on. Before, this method was never loaded and imported every
// directory user regardless of those settings.
Meteor.methods({
  async ldap_sync_now() {
    const user = await Meteor.userAsync();
    if (!user) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'ldap_sync_now' });
    }

    if (user.isAdmin !== true || user.loginDisabled === true) {
      throw new Meteor.Error('error-notAuthorized', 'Not authorized', { method: 'ldap_sync_now' });
    }

    if (LDAP.settings_get('LDAP_ENABLE') !== true) {
      throw new Meteor.Error('LDAP_disabled');
    }

    const importNew = LDAP.settings_get('LDAP_BACKGROUND_SYNC_IMPORT_NEW_USERS') === true;
    const updateExisting = LDAP.settings_get('LDAP_BACKGROUND_SYNC_KEEP_EXISTANT_USERS_UPDATED') === true;
    if (!importNew && !updateExisting) {
      throw new Meteor.Error('LDAP_sync_nothing_to_do');
    }

    this.unblock();

    // sync() logs a failure and returns the error instead of throwing it.
    const result = await runLdapSync();
    if (result instanceof Error) {
      throw new Meteor.Error('LDAP_sync_failed', result.message);
    }

    return { importNew, updateExisting };
  },
});
