// packages/wekan-ldap (a local Meteor package, its own isolated build unit)
// cannot import the app's Settings collection directly - see
// packages/wekan-ldap/server/configResolver.js's header comment for why.
// This is the app-side half of that boundary: it hands the package a getter
// for the ldap admin-override sub-document, once, at server boot, so
// LDAP.settings_get() can resolve an Admin Panel override the same way
// models/settings.js and server/models/settings.js already do.
import { setLdapSettingsAccessor } from 'meteor/wekan-ldap';
import Settings from '/models/settings';

setLdapSettingsAccessor(() => Settings.findOne({})?.ldap || {});
