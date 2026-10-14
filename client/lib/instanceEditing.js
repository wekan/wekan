import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import TableVisibilityModeSettings from '/models/tableVisibilityModeSettings';

// Boards every signed-in user may edit (#4575), the client half: whether Admin
// Panel allows them, read from the published setting, so the capability checks
// in models/lib/boardRoleCapabilities.js - and with them every edit control -
// follow it at once.
const { setInstanceEditingLookup } = require('/models/lib/boardRoleCapabilities');

setInstanceEditingLookup(() => TableVisibilityModeSettings.findOne('tableVisibilityMode-allowInstanceEditing')?.booleanValue === true);

Meteor.startup(() => {
  Tracker.autorun(() => {
    if (Meteor.userId()) Meteor.subscribe('tableVisibilityModeSettings');
  });
});
