import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import InviteToBoardRolesSettings, {
  INVITE_TO_BOARD_ROLES,
  INVITE_TO_BOARD_ROLES_DEFAULT,
  INVITE_TO_BOARD_ROLES_ID,
} from '/models/inviteToBoardRolesSettings';
import securityLog from '/server/lib/securityLog';

async function requireGlobalAdmin(userId, context = {}) {
  const user = userId && await Meteor.users.findOneAsync(userId, {
    fields: { isAdmin: 1, username: 1 },
  });
  if (user?.isAdmin) return user;
  securityLog.record({ severity: 'high', category: 'authz', bleed: 'RolesBleed',
    action: 'blocked', source: 'adminInviteRoles', userId,
    username: user?.username, req: context.req,
    detail: 'refused an attempt to read or change invite-to-board role policy' });
  throw new Meteor.Error('not-authorized');
}

function normalizedRoles(roles) {
  check(roles, [String]);
  const unique = [...new Set(roles)];
  if (unique.some(role => !INVITE_TO_BOARD_ROLES.includes(role))) {
    throw new Meteor.Error('invalid-role');
  }
  return INVITE_TO_BOARD_ROLES.filter(role => unique.includes(role));
}

export async function inviteRolesForAdmin(userId, context = {}) {
  await requireGlobalAdmin(userId, context);
  const doc = await InviteToBoardRolesSettings.findOneAsync(INVITE_TO_BOARD_ROLES_ID, {
    fields: { allowedRoles: 1 },
  });
  return doc?.allowedRoles || INVITE_TO_BOARD_ROLES_DEFAULT;
}

export async function setInviteRolesForAdmin(userId, roles, context = {}) {
  const user = await requireGlobalAdmin(userId, context);
  let allowedRoles;
  try {
    allowedRoles = normalizedRoles(roles);
  } catch (error) {
    securityLog.record({ severity: 'high', category: 'validation', bleed: 'RolesBleed',
      action: 'blocked', source: 'adminInviteRoles', userId: user._id,
      username: user.username, req: context.req,
      detail: `refused invalid invite-to-board role policy: ${error.error || error.message}` });
    throw error;
  }
  const now = new Date();
  const existing = await InviteToBoardRolesSettings.findOneAsync(
    INVITE_TO_BOARD_ROLES_ID, { fields: { _id: 1 } });
  if (existing) {
    await InviteToBoardRolesSettings.direct.updateAsync(existing._id, {
      $set: { allowedRoles, modifiedAt: now },
    });
  } else {
    await InviteToBoardRolesSettings.direct.insertAsync({
      _id: INVITE_TO_BOARD_ROLES_ID, allowedRoles, createdAt: now,
      modifiedAt: now, sort: 0,
    });
  }
  return allowedRoles;
}
