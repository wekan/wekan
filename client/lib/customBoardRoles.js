import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import CustomBoardRoles from '/models/customBoardRoles';

// Custom board roles (#3022), the client half: what the capability checks in
// models/lib/boardRoleCapabilities.js read here. The lookup goes to the
// published collection, so a helper that asks what a member may do re-runs
// when an administrator changes the role.
const { setCustomRoleLookup } = require('/models/lib/boardRoleCapabilities');

setCustomRoleLookup(id => CustomBoardRoles.findOne(id) || null);

Meteor.startup(() => {
  Tracker.autorun(() => {
    if (Meteor.userId()) {
      Meteor.subscribe('customBoardRoles');
      // Shared labels (#2761, #4698): the catalogs this user may use.
      Meteor.subscribe('sharedLabels');
    }
  });
});
