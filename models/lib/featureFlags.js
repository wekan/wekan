import { Meteor } from 'meteor/meteor';
import Settings from '/models/settings';

// Synchronously-readable cache of the Admin Panel / Features / Notifications GDPR
// toggles (issue #5820). A collection `before.insert` hook (models/activities.js)
// runs in a synchronous context and cannot await a Settings lookup, so the server
// keeps this small cache up to date with a Settings observer and exposes it via a
// plain getter. On the client the flags stay at their defaults (false); the server
// is authoritative for the actual enforcement.
const flags = {
  disableActivities: false,
  disableNotifications: false,
  disableWatch: false,
};

export function getFeatureFlags() {
  return flags;
}

function applyFields(fields) {
  if (!fields) return;
  if ('disableActivities' in fields) flags.disableActivities = !!fields.disableActivities;
  if ('disableNotifications' in fields) flags.disableNotifications = !!fields.disableNotifications;
  if ('disableWatch' in fields) flags.disableWatch = !!fields.disableWatch;
}

if (Meteor.isServer) {
  Meteor.startup(async () => {
    // observeChanges' `changed` reports only the changed fields, so applyFields
    // merges rather than replaces — correct for the single Settings document.
    await Settings.find(
      {},
      { fields: { disableActivities: 1, disableNotifications: 1, disableWatch: 1 } },
    ).observeChangesAsync({
      added(id, fields) { applyFields(fields); },
      changed(id, fields) { applyFields(fields); },
      removed() {
        flags.disableActivities = false;
        flags.disableNotifications = false;
        flags.disableWatch = false;
      },
    });
  });
}
