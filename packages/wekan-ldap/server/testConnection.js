import LDAP from './ldap';
import { runWithLdapDisconnect } from './connectionGuard';

Meteor.methods({
  async ldap_test_connection() {
    const user = Meteor.user();
    if (!user) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'ldap_test_connection' });
    }

    // #(admin-panel LDAP overrides): this was previously commented out, so ANY
    // authenticated user - not only an admin - could trigger an LDAP bind
    // attempt against the configured directory. Fixed to require isAdmin, the
    // same check every other admin-only Meteor method in this codebase uses
    // (see server/models/settings.js's saveMailServer, etc.). A non-admin
    // caller is refused before an LDAP connection is even attempted.
    if (!user.isAdmin) {
      throw new Meteor.Error('error-notAuthorized', 'Not authorized', { method: 'ldap_test_connection' });
    }

    if (LDAP.settings_get('LDAP_ENABLE') !== true) {
      throw new Meteor.Error('LDAP_disabled');
    }

    let ldap;
    try {
      ldap = new LDAP();
      await ldap.connect();
    } catch (error) {
      console.log(error);
      // #6467/#6469: release anything opened before rethrowing, so a failed
      // "Test Connection" does not leak a socket to the directory server.
      if (ldap) {
        await ldap.disconnect();
      }
      throw new Meteor.Error(error.message);
    }

    // #6467/#6469: always disconnect the test connection (success or failure),
    // otherwise repeated admin "Test Connection" clicks leak connections too.
    return await runWithLdapDisconnect(ldap, async () => {
      try {
        await ldap.bindIfNecessary();
      } catch (error) {
        throw new Meteor.Error(error.name || error.message);
      }

      return {
        message: 'Connection_success',
        params: [],
      };
    });
  },
});
