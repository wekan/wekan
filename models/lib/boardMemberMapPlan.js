// Pure decision helper for mapping an imported VIRTUAL (placeholder) board member to an
// existing REAL user on the same board, from the board sidebar member-avatar popup.
//
// Security model — mapping can NEVER be used to gain privileges:
//   - Only a board admin (or a site admin) may map.
//   - The target must be an existing, ACTIVE, real (non-imported) member of THIS board.
//     Mapping never adds a new member and never changes the target's role, so the target
//     keeps exactly the role they already had — nothing is escalated. To give a real
//     user a board role you use the normal add-member / change-permissions flow first
//     (which is itself privilege-checked), then map the virtual member onto them.
//   - The source must be an imported placeholder member of this board.
//
// Returns { ok:true, newMembers, placeholderId, targetId } (newMembers = members with the
// placeholder entry removed) or { ok:false, error } with a stable error key. Pure and
// dependency-free so it is unit-tested without a database.

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
  if (!find(placeholderId)) {
    return { ok: false, error: 'placeholder-not-member' };
  }

  // Target must be a REAL (non-imported), ACTIVE member of this board — so no new
  // membership is created and no role is granted by the mapping itself.
  if (targetIsImported) {
    return { ok: false, error: 'target-not-real' };
  }
  const targetMember = find(targetId);
  if (!targetMember || targetMember.isActive === false) {
    return { ok: false, error: 'target-not-board-member' };
  }

  // Resulting membership: drop the placeholder entry, leave the target's entry (and role)
  // exactly as it was. No entry is added, no flag is raised.
  const newMembers = list.filter(m => m && m.userId !== placeholderId);

  return { ok: true, newMembers, placeholderId, targetId };
}

module.exports = { planBoardMemberMapping };
