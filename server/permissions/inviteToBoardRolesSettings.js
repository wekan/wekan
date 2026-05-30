import InviteToBoardRolesSettings from '/models/inviteToBoardRolesSettings';

// Only global site admins (Admin Panel users) may change which board roles are
// allowed to invite users to a board.
InviteToBoardRolesSettings.allow({
  async update(userId) {
    const user = await Meteor.users.findOneAsync(userId);
    return user && user.isAdmin;
  },
});
