import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { ReactiveCache } from '/imports/reactiveCache';
import Users from '/models/users';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Activities from '/models/activities';
import CardComments from '/models/cardComments';
import InviteToBoardRolesSettings from '/models/inviteToBoardRolesSettings';
import { planReconciliation } from '/models/lib/importedUserReconciliationPlan';
import { planBoardMemberMapping } from '/models/lib/boardMemberMapPlan';

// ============================================================================
// Imported-user reconciliation
// ----------------------------------------------------------------------------
// A board import creates inert placeholder users (authenticationMethod:'imported',
// loginDisabled, isActive:false) that preserve the original members with their
// original _id (see models/wekanCreator.js createPlaceholderUsers). Mapping them to
// real, valid accounts is a DELIBERATE, later step — never done at import — because a
// wrong mapping attaches the wrong person and can leak board permissions.
//
// The valid accounts are whatever real WeKan accounts exist — typically provisioned by
// LDAP/OIDC when the person logs in. Reconciliation matches each placeholder to a real
// account by username and MERGES it in (reassigning every reference), or, when no real
// account exists (e.g. the person is not in LDAP), leaves the placeholder inactive.
// ============================================================================

// Reassign every reference from an imported placeholder to a real target account, then
// remove the placeholder. Reuses the target's existing membership when it already is a
// board member. Server-only.
export async function mergeImportedUserInto(placeholderId, targetId) {
  if (!Meteor.isServer) return { ok: false };
  if (!placeholderId || !targetId || placeholderId === targetId) {
    throw new Meteor.Error('bad-merge', 'placeholder and target must differ');
  }
  const placeholder = await ReactiveCache.getUser(placeholderId);
  if (!placeholder || placeholder.authenticationMethod !== 'imported') {
    throw new Meteor.Error('not-a-placeholder', 'source is not an imported placeholder user');
  }
  const target = await ReactiveCache.getUser(targetId);
  if (!target) throw new Meteor.Error('no-target', 'target user does not exist');

  // Board memberships: swap the placeholder for the target, or drop it if the target is
  // already a member (activating that membership).
  const boards = await Boards.find({ 'members.userId': placeholderId }).fetchAsync();
  for (const b of boards) {
    const members = b.members || [];
    const newMembers = members.some(m => m.userId === targetId)
      ? members.filter(m => m.userId !== placeholderId)
      : members.map(m => (m.userId === placeholderId
          ? { ...m, userId: targetId, wekanId: targetId, isActive: true }
          : m));
    await Boards.direct.updateAsync(b._id, { $set: { members: newMembers } });
  }

  // Card member / assignee id arrays (dedupe in case the target was already present).
  for (const field of ['members', 'assignees']) {
    const cards = await Cards.find({ [field]: placeholderId }).fetchAsync();
    for (const c of cards) {
      const arr = Array.from(new Set((c[field] || []).map(id => (id === placeholderId ? targetId : id))));
      await Cards.direct.updateAsync(c._id, { $set: { [field]: arr } });
    }
  }

  // Scalar userId references.
  await Activities.direct.updateAsync({ userId: placeholderId }, { $set: { userId: targetId } }, { multi: true });
  await CardComments.direct.updateAsync({ userId: placeholderId }, { $set: { userId: targetId } }, { multi: true });

  await Users.direct.removeAsync(placeholderId);
  return { ok: true, mergedInto: targetId };
}

// The invite policy a board admin is already subject to when adding someone to a board.
// Mapping onto a user who is not a board member yet CREATES a membership, so it must pass
// exactly the same checks as the normal add-member flow (Users.inviteUserToBoard) — a
// deactivated account is never added, the Admin Panel "roles allowed to invite" setting is
// honoured, and #6116's same-org/team restriction still applies. Site admins bypass, as
// they do everywhere else. Throws the same error keys the invite flow throws.
async function checkMayAddBoardMember(board, caller, target) {
  if (caller && caller.isAdmin) return; // site admin
  if (!target || target.loginDisabled) {
    throw new Meteor.Error('error-user-disabled');
  }

  const allowedRoles = await InviteToBoardRolesSettings.allowedRoles();
  if (!allowedRoles.includes(board.memberRole(caller._id))) {
    throw new Meteor.Error('error-notAllowed');
  }

  const setting = await ReactiveCache.getCurrentSetting();
  if (setting && setting.boardMembersFromSameOrgOrTeamOnly) {
    let shares = caller.sharesOrgOrTeamWith(target);
    if (!shares) {
      // Same fallback as inviteUserToBoard: any ACTIVE board member sharing an
      // org/team is enough, so a caller with no orgs/teams set can still map.
      for (const m of board.members || []) {
        if (!m.isActive || m.userId === caller._id) continue;
        const existingMember = await ReactiveCache.getUser(m.userId);
        if (existingMember && existingMember.sharesOrgOrTeamWith(target)) {
          shares = true;
          break;
        }
      }
    }
    if (!shares) {
      throw new Meteor.Error('error-user-notSameOrgOrTeam');
    }
  }
}

// Board-scoped mapping of one imported VIRTUAL (placeholder) member to a REAL user, done
// by a board admin from the sidebar member-avatar popup. Unlike mergeImportedUserInto
// (global, site-admin-only), this only ever touches the one board and can never grant
// privileges: an existing active member keeps their own role untouched, and a user who is
// not a member yet is added with the PLACEHOLDER's role — never a higher one — after
// passing the same invite policy as the normal add-member flow (see
// models/lib/boardMemberMapPlan.js and checkMayAddBoardMember above). The placeholder's
// work ON THIS BOARD (card membership/assignment, activities, comments) is reassigned to
// the target, and the placeholder is removed from this board's members. Server-only.
export async function mapImportedBoardMemberInto(boardId, placeholderId, targetId, callerId) {
  if (!Meteor.isServer) return { ok: false };

  const board = await ReactiveCache.getBoard(boardId);
  if (!board) throw new Meteor.Error('no-board', 'board does not exist');

  const caller = await ReactiveCache.getUser(callerId);
  const placeholder = await ReactiveCache.getUser(placeholderId);
  const target = await ReactiveCache.getUser(targetId);

  const plan = planBoardMemberMapping({
    members: board.members || [],
    placeholderId,
    targetId,
    callerId,
    placeholderIsImported: !!placeholder && placeholder.authenticationMethod === 'imported',
    targetIsImported: !target || target.authenticationMethod === 'imported',
    callerIsSiteAdmin: !!(caller && caller.isAdmin),
  });
  if (!plan.ok) {
    throw new Meteor.Error(plan.error || 'not-authorized');
  }

  // #6519: mapping onto a non-member adds them to the board, so it must clear the same
  // bar as inviting them would. Checked BEFORE anything is written.
  if (plan.addedMember) {
    await checkMayAddBoardMember(board, caller, target);
  }

  // Reassign the placeholder's references, scoped to THIS board only.
  for (const field of ['members', 'assignees']) {
    const cards = await Cards.find({ boardId, [field]: placeholderId }).fetchAsync();
    for (const c of cards) {
      const arr = Array.from(
        new Set((c[field] || []).map(id => (id === placeholderId ? targetId : id))),
      );
      await Cards.direct.updateAsync(c._id, { $set: { [field]: arr } });
    }
  }
  await Activities.direct.updateAsync(
    { boardId, userId: placeholderId }, { $set: { userId: targetId } }, { multi: true },
  );
  await CardComments.direct.updateAsync(
    { boardId, userId: placeholderId }, { $set: { userId: targetId } }, { multi: true },
  );

  // Drop the placeholder from this board's members (target keeps their own role).
  await Boards.direct.updateAsync(boardId, { $set: { members: plan.newMembers } });

  // If the placeholder is no longer a member of any board, remove the now-orphaned
  // virtual user so it does not linger; otherwise leave it for its other boards.
  const stillMember = await Boards.find(
    { 'members.userId': placeholderId }, { fields: { _id: 1 } },
  ).fetchAsync();
  if (stillMember.length === 0 && placeholder && placeholder.authenticationMethod === 'imported') {
    await Users.direct.removeAsync(placeholderId);
  }

  return { ok: true, mappedInto: targetId };
}

// Deactivate a placeholder and all its board memberships (used when no valid account
// matches — e.g. the person is not in LDAP).
async function deactivatePlaceholder(placeholderId) {
  await Users.direct.updateAsync(placeholderId, { $set: { isActive: false } });
  const boards = await Boards.find({ 'members.userId': placeholderId }).fetchAsync();
  for (const b of boards) {
    const members = (b.members || []).map(m => (m.userId === placeholderId ? { ...m, isActive: false } : m));
    await Boards.direct.updateAsync(b._id, { $set: { members } });
  }
}

// Reconcile every imported placeholder: merge into a matching real account (same
// username, not itself, not another placeholder), else leave inactive. Returns a report.
export async function reconcileImportedUsers() {
  if (!Meteor.isServer) return { merged: 0, deactivated: 0 };
  const placeholders = await Users.find(
    { authenticationMethod: 'imported' },
    { fields: { _id: 1, username: 1 } },
  ).fetchAsync();
  const usernames = placeholders.map(p => p.username).filter(Boolean);
  const realUsers = usernames.length
    ? await Users.find(
        { username: { $in: usernames } },
        { fields: { _id: 1, username: 1, authenticationMethod: 1 } },
      ).fetchAsync()
    : [];
  // Decide merges/deactivations with the pure planner (unit-tested separately), then act.
  const { merges, deactivations } = planReconciliation(placeholders, realUsers);
  for (const { placeholderId, targetId } of merges) {
    await mergeImportedUserInto(placeholderId, targetId);
  }
  for (const placeholderId of deactivations) {
    await deactivatePlaceholder(placeholderId);
  }
  return { merged: merges.length, deactivated: deactivations.length, total: placeholders.length };
}

if (Meteor.isServer) {
  Meteor.methods({
    // Reconcile all imported placeholders against the valid accounts (admin only).
    async reconcileImportedUsers() {
      const user = await ReactiveCache.getUser(this.userId);
      if (!user || !user.isAdmin) throw new Meteor.Error('not-authorized');
      return await reconcileImportedUsers();
    },
    // Deliberately map/merge one imported placeholder into a chosen real account.
    async mergeImportedUser(placeholderId, targetId) {
      check(placeholderId, String);
      check(targetId, String);
      const user = await ReactiveCache.getUser(this.userId);
      if (!user || !user.isAdmin) throw new Meteor.Error('not-authorized');
      return await mergeImportedUserInto(placeholderId, targetId);
    },
    // Board-scoped: a board admin maps one imported VIRTUAL member of a board to an
    // existing REAL, active member of the SAME board (from the sidebar avatar popup).
    // Authorization and the no-escalation guarantee are enforced in
    // planBoardMemberMapping (called inside mapImportedBoardMemberInto): the target keeps
    // their own role, and only board admins (or site admins) may map.
    async mapImportedBoardMember(boardId, placeholderId, targetId) {
      check(boardId, String);
      check(placeholderId, String);
      check(targetId, String);
      if (!this.userId) throw new Meteor.Error('not-authorized');
      return await mapImportedBoardMemberInto(boardId, placeholderId, targetId, this.userId);
    },
  });
}
