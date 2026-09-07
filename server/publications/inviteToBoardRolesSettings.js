import { inviteRolesForAdmin } from '/server/lib/adminInviteRoles';
import { ReactiveCache } from '/imports/reactiveCache';
import InviteToBoardRolesSettings, {
  INVITE_TO_BOARD_ROLES_ID,
} from '/models/inviteToBoardRolesSettings';

Meteor.publish('inviteToBoardRolesSettings', async function() {
  const user = await ReactiveCache.getCurrentUser();
  if (!user?.isAdmin) return [];
  // Keep the service as the single read projection and authorization contract;
  // resolving it here also makes direct publication use obey that boundary.
  await inviteRolesForAdmin(user._id);
  return InviteToBoardRolesSettings.find(INVITE_TO_BOARD_ROLES_ID, {
    fields: { allowedRoles: 1 },
  });
});
