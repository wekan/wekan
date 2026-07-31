'use strict';

// Which way the "Selected: ★" button goes, and which boards it has to touch.
//
// The button used to only ever ADD stars: it walked the selection and starred
// whatever was not starred yet, so once every selected board was starred there
// was no way to undo it from here - clicking again did nothing at all.
//
// It is a toggle now, and the rule is the one a mixed selection makes obvious:
//
//   every selected board is starred  ->  UNSTAR all of them
//   none of them is starred          ->  star all of them
//   some are starred, some are not   ->  star the REST, leaving the rest alone
//
// So "star" is the action whenever there is anything left to star, and the
// boards to touch are exactly the unstarred ones; "unstar" happens only when
// there is nothing left to star, and then every selected board is touched. The
// mixed case deliberately does NOT flip each board independently: that would
// star some and unstar others from one click, which no button should do.
//
// Pure: no Meteor, no collections, so it can be unit-tested and so the click
// handler and the tooltip cannot answer this question differently.

const SELECTED_STAR_STAR = 'star';
const SELECTED_STAR_UNSTAR = 'unstar';

// boardIds: the selected board ids. isStarred(id): whether that board is
// starred by the current user.
// Returns { action, boardIds } - the ids being the ones to TOGGLE, which is
// what the server method does to one board.
function selectedStarAction(boardIds, isStarred) {
  const ids = (Array.isArray(boardIds) ? boardIds : []).filter(Boolean);
  if (!ids.length) {
    // Nothing selected: the button is not drawn, but a caller must still get an
    // answer it can act on rather than undefined.
    return { action: SELECTED_STAR_STAR, boardIds: [] };
  }
  const unstarred = ids.filter(id => !isStarred(id));
  return unstarred.length
    ? { action: SELECTED_STAR_STAR, boardIds: unstarred }
    : { action: SELECTED_STAR_UNSTAR, boardIds: ids };
}

// The translation key for what a click would do right now.
function selectedStarTitleKey(action) {
  return action === SELECTED_STAR_UNSTAR
    ? 'set-selected-unstarred'
    : 'set-selected-starred';
}

module.exports = {
  SELECTED_STAR_STAR,
  SELECTED_STAR_UNSTAR,
  selectedStarAction,
  selectedStarTitleKey,
};
