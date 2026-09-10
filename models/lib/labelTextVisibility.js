'use strict';

// #4256: whether a minicard shows label TEXT (coloured words) or only the
// coloured bars, resolved the same way the global theme override already is
// (client/components/main/globalThemeColor.js): a per-user override wins when
// set, otherwise the board's own default is used, otherwise the historical
// global default (text shown) applies - which is also what an existing board
// or user that has never touched either setting keeps seeing, so nothing
// changes for them.
//
//   userOverride        true/false when the user has set profile.showLabelTextOverride,
//                       null/undefined when they have not (follow the board)
//   boardShowLabelText  true/false when the board has set Boards.showLabelText,
//                       null/undefined when it has not (use the default)
//
// Order: userOverride > boardShowLabelText > true (the default).
function resolveShowLabelText(userOverride, boardShowLabelText) {
  if (typeof userOverride === 'boolean') return userOverride;
  if (typeof boardShowLabelText === 'boolean') return boardShowLabelText;
  return true;
}

// What clicking the personal-override checkbox writes next, cycling
// no-override -> forced shown -> forced hidden -> no-override (null),
// mirroring the tri-state the global theme override uses (an explicit chosen
// value vs. unset/"no override").
function nextShowLabelTextOverride(userOverride) {
  if (typeof userOverride !== 'boolean') return true;
  if (userOverride === true) return false;
  return null;
}

export { resolveShowLabelText, nextShowLabelTextOverride };
