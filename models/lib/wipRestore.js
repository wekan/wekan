'use strict';

// Does a list's HARD WIP limit stop a card from being restored into it (#6772)?
//
// A soft limit only warns, so it never blocks. A hard one blocks once the list
// holds as many cards as the limit allows - or MORE: a limit lowered below a
// list's count left it over the limit, and the old `===` let a card in there.
//
// wip: the list's wipLimit { enabled, soft, value }; count: its cards now.
// Pure, no Meteor: tests/wipRestore.test.cjs.
function wipLimitBlocksRestore(wip, count) {
  if (!wip || !wip.enabled || wip.soft) return false;
  const value = Number(wip.value);
  if (!Number.isFinite(value)) return false;
  return Number(count) >= value;
}

module.exports = { wipLimitBlocksRestore };
