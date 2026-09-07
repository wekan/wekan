import InviteToBoardRolesSettings from '/models/inviteToBoardRolesSettings';

Meteor.publish('inviteToBoardRolesSettings', function() {
  return InviteToBoardRolesSettings.find();
});
