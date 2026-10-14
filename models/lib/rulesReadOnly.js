'use strict';

// #2217: board members may see a board's Rules, read-only.
//
// Two switches, both off by default, and both needed:
//   - Admin Panel / Settings / Visibility: `rulesReadOnlyForMembers` on the
//     Settings document lets boards offer it at all;
//   - the board's Rules page: `rulesVisibleToMembers`, ticked by a board
//     admin, offers it on that board.
// Board admins (and site admins) edit Rules as before. A member who may read
// them gets the Rules entry in Board Settings and the rules list and rule
// details, with no control that changes anything - and the server methods
// that change rules keep their own board-admin checks, so this grants no
// right. Pure: tests/rulesReadOnly.test.cjs.

function rulesAccess({ setting, board, isBoardAdmin, isSiteAdmin, isActiveMember }) {
  if (isBoardAdmin || isSiteAdmin) return 'edit';
  if (!isActiveMember) return 'none';
  if (!(setting && setting.rulesReadOnlyForMembers === true)) return 'none';
  if (!(board && board.rulesVisibleToMembers === true)) return 'none';
  return 'read';
}

module.exports = { rulesAccess };
