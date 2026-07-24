// Pure decision helper for mapping an imported VIRTUAL (placeholder) board member to a
// real user, from the board sidebar member-avatar popup.
//
// Security model — mapping can NEVER be used to gain privileges:
//   - Only a board admin (or a site admin) may map.
//   - The source must be an imported placeholder member of this board.
//   - The target must be a real (non-imported) user.
//   - When the target is ALREADY an active member, their entry and role are left
//     EXACTLY as they were: mapping only removes the placeholder.
//   - When the target is NOT a member yet (#6519 — after a Trello/CSV import the real
//     people usually have no membership at all, so the old "must already be an active
//     board member" rule left the picker showing nobody but the admin), the target is
//     added with the PLACEHOLDER's OWN role — the role the import gave that person —
//     never a higher one. Adding a board member with a chosen role is something the
//     board admin doing the mapping can already do through the normal add-member flow,
//     so this grants no capability that caller did not have; it just does it in one
//     step and with the imported role rather than an arbitrary one. The caller-side
//     invite policy (Admin Panel roles allowed to invite, same-org/team restriction,
//     deactivated accounts) is enforced by the server before this plan is applied — see
//     server/importedUserReconciliation.js.
//
// Returns { ok:true, newMembers, placeholderId, targetId, addedMember } or
// { ok:false, error } with a stable error key. `addedMember` tells the caller whether
// the plan CREATES/reactivates a membership, so it can run the invite-policy checks only
// then. Pure and dependency-free so it is unit-tested without a database.

function planBoardMemberMapping({
  members,
  placeholderId,
  targetId,
  callerId,
  placeholderIsImported,
  targetIsImported,
  callerIsSiteAdmin = false,
} = {}) {
  const list = Array.isArray(members) ? members : [];
  const find = id => list.find(m => m && m.userId === id);

  if (!placeholderId || !targetId || placeholderId === targetId) {
    return { ok: false, error: 'bad-map' };
  }

  // Authorization: board admin of THIS board, or a site admin.
  const caller = find(callerId);
  const callerIsBoardAdmin = !!(caller && caller.isActive !== false && caller.isAdmin);
  if (!callerIsSiteAdmin && !callerIsBoardAdmin) {
    return { ok: false, error: 'not-authorized' };
  }

  // Source must be an imported placeholder that is a member of this board.
  if (!placeholderIsImported) {
    return { ok: false, error: 'not-a-placeholder' };
  }
  const placeholderMember = find(placeholderId);
  if (!placeholderMember) {
    return { ok: false, error: 'placeholder-not-member' };
  }

  // Target must be a REAL (non-imported) user. Mapping one placeholder onto another
  // would just move the problem and could chain into an unintended identity.
  if (targetIsImported) {
    return { ok: false, error: 'target-not-real' };
  }

  const targetMember = find(targetId);
  const targetIsActiveMember = !!(targetMember && targetMember.isActive !== false);

  // Drop the placeholder entry in every case.
  const withoutPlaceholder = list.filter(m => m && m.userId !== placeholderId);

  if (targetIsActiveMember) {
    // Existing active member: nothing about them changes, not even a flag.
    return {
      ok: true,
      newMembers: withoutPlaceholder,
      placeholderId,
      targetId,
      addedMember: false,
    };
  }

  // Not a member yet (or an inactive membership): give them the PLACEHOLDER's role.
  // Copying the placeholder's flags is what makes this a "this virtual member IS this
  // person" operation rather than a role grant — and it can only ever equal the role the
  // import already recorded, never exceed it.
  const entry = {
    ...(targetMember || {}),
    userId: targetId,
    isActive: true,
    isAdmin: placeholderMember.isAdmin === true,
    isNoComments: placeholderMember.isNoComments === true,
    isCommentOnly: placeholderMember.isCommentOnly === true,
    isWorker: placeholderMember.isWorker === true,
  };
  const newMembers = targetMember
    ? withoutPlaceholder.map(m => (m.userId === targetId ? entry : m))
    : withoutPlaceholder.concat([entry]);

  return { ok: true, newMembers, placeholderId, targetId, addedMember: true };
}

module.exports = { planBoardMemberMapping };
