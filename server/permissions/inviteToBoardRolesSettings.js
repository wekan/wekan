import InviteToBoardRolesSettings from '/models/inviteToBoardRolesSettings';
import securityLog from '/server/lib/securityLog';

// Only global site admins (Admin Panel users) may change which board roles are
// allowed to invite users to a board.
InviteToBoardRolesSettings.allow({
  async update(userId) {
    const user = await Meteor.users.findOneAsync(userId);
    return user && user.isAdmin;
  },
});

InviteToBoardRolesSettings.deny({
  async insert(userId) {
    securityLog.record({ severity: 'high', category: 'authz', bleed: 'RolesBleed',
      action: 'blocked', source: 'Invite roles DDP insert', userId,
      detail: 'refused direct insertion of invite-to-board role policy' });
    return true;
  },
  async update(userId) {
    securityLog.record({ severity: 'high', category: 'authz', bleed: 'RolesBleed',
      action: 'blocked', source: 'Invite roles DDP update', userId,
      detail: 'refused direct update of invite-to-board role policy' });
    return true;
  },
  async remove(userId) {
    securityLog.record({ severity: 'high', category: 'authz', bleed: 'RolesBleed',
      action: 'blocked', source: 'Invite roles DDP remove', userId,
      detail: 'refused direct removal of invite-to-board role policy' });
    return true;
  },
});
