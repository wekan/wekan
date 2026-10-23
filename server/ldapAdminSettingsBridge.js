// packages/wekan-ldap (a local Meteor package, its own isolated build unit)
// cannot import the app: an app-tree import inside packages/ resolves at
// runtime and fails with "Cannot find module" when the app boots. This is the app-side half of that boundary: it hands
// the package the app's resolver for login settings (server/lib/authConfig.js
// authEnv: the Admin Panel / People / LDAP value when one is stored, otherwise
// the LDAP_* environment variable), and reschedules LDAP background sync when
// those settings change.
//
// The Sandstorm .spk is built WITHOUT wekan-ldap (releases/sandstorm-slim.mjs,
// docs/Platforms/FOSS/Container/Sandstorm/Smaller-wekan-spk.md), so the package
// is asked for only when it is there: a static import of a package that is not
// in the build stops the server at its first line.
import { authEnv, onAuthConfigChange } from '/server/lib/authConfig';

if (Package['wekan-ldap']) {
  const { setLdapSettingsAccessor, reconfigureLdapBackgroundSync } = require('meteor/wekan-ldap');
  setLdapSettingsAccessor(authEnv);
  onAuthConfigChange('ldap', () => reconfigureLdapBackgroundSync());
}
