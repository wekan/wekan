// #2217: 'edit', 'read' or 'none' for the current user on the current board
// (models/lib/rulesReadOnly.js). The Rules page, Board Settings and the rule
// details all ask this one function.
import { ReactiveCache } from '/imports/reactiveCache';
import { Utils } from '/client/lib/utils';
const { rulesAccess } = require('/models/lib/rulesReadOnly');

export function currentRulesAccess() {
  const user = ReactiveCache.getCurrentUser();
  const board = Utils.getCurrentBoard();
  if (!user || !board) return 'none';
  return rulesAccess({
    setting: ReactiveCache.getCurrentSetting(),
    board,
    isBoardAdmin: !!user.isBoardAdmin(),
    isSiteAdmin: user.isAdmin === true,
    isActiveMember: !!board.hasMember(user._id),
  });
}
