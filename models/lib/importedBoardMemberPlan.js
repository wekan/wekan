'use strict';

// Pure decision for how an original member of an imported board becomes a member of the
// newly created board (see models/wekanCreator.js). Split out so it is unit-testable.
//
// Returns the member entry to add, or null when there is no id or the member is the
// importer (who is already the board's active admin). Without an explicit deliberate
// mapping (wekanMember.wekanId), the ORIGINAL member is kept — reusing their original id
// — but added INACTIVE and non-admin, so they are visible in the member list yet hold no
// board permission until reconciled later. A real mapping preserves the mapped role.
function planImportedBoardMember(wekanMember, importerId) {
  if (!wekanMember) return null;
  const memberId = wekanMember.wekanId || wekanMember.userId || wekanMember.id;
  if (!memberId || memberId === importerId) return null;
  const mapped = !!wekanMember.wekanId;
  return {
    ...wekanMember,
    userId: memberId,
    wekanId: memberId,
    isActive: mapped ? wekanMember.isActive !== false : false,
    isAdmin: mapped ? !!wekanMember.isAdmin : false,
  };
}

module.exports = { planImportedBoardMember };
