// packages/wekan-ldap (a local Meteor package, its own isolated build unit)
// cannot import the app - see packages/wekan-ldap/server/configResolver.js's
// header comment for why. This is the app-side half of that boundary: it hands
// the package the app's resolver for login settings (server/lib/authConfig.js
// authEnv: the Admin Panel / People / LDAP value when one is stored, otherwise
// the LDAP_* environment variable), and reschedules LDAP background sync when
// those settings change.
import { setLdapSettingsAccessor, reconfigureLdapBackgroundSync } from 'meteor/wekan-ldap';
import { authEnv, onAuthConfigChange } from '/server/lib/authConfig';

setLdapSettingsAccessor(authEnv);
onAuthConfigChange('ldap', () => reconfigureLdapBackgroundSync());
