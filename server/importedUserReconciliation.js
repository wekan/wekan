import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { ReactiveCache } from '/imports/reactiveCache';
import Users from '/models/users';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Activities from '/models/activities';
import CardComments from '/models/cardComments';
import { planReconciliation } from '/models/lib/importedUserReconciliationPlan';

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
  });
}
