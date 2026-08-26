'use strict';

// Pure geometry for Popup._getOffset — extracted so the positioning math is
// unit-testable without a DOM / Meteor (see tests/popupOffset.test.cjs).
//
// #5667 ("Problem when scrolling in a map with date fields"): a date-picker
// calendar (due/start/end date, or a date custom field) opened low on the screen
// appeared partly outside the visible area, and — because the pop-over is
// `position: absolute` (document coordinates) — trying to scroll it into view
// moved it along with the page, so the calendar could never be seen fully.
//
// Root cause: _getOffset computed the space above / below the opener (and the
// clamped `top`) from the opener's DOCUMENT offset (`$el.offset()`) mixed with
// the VIEWPORT height, ignoring the page scroll. On a scrolled page that placed
// the anchored popup outside the visible viewport.
//
// Fix: do the space / clamp math in VIEWPORT coordinates (subtract
// scrollTop/scrollLeft), then convert the chosen top/left back to DOCUMENT
// coordinates (add the scroll back) for the absolute style. The popup box is then
// always laid out fully within the visible viewport. When the page is not
// scrolled (scrollTop === scrollLeft === 0) the output is identical to the
// previous behaviour, so nothing regresses in the common case.

// The width below which popup.css lays a popup out as a full-screen sheet.
// Keep in step with the `@media screen and (max-width: 800px)` block there.
const MOBILE_POPUP_MAX_WIDTH = 800;

function computePopupOffset(params) {
  const {
    viewportWidth,
    viewportHeight,
    scrollTop = 0,
    scrollLeft = 0,
    // Opener document offset { top, left, height }, or null for a programmatic
    // open with no reference element.
    opener = null,
    popupName,
    isMiniScreen = false,
    isAdminEditPopup = false,
    isLanguagePopup = false,
    viewportPadding = 10,
  } = params;

  // A popup is FULL SCREEN below 800px - `@media (max-width: 800px)` in
  // popup.css gives it the whole width and its own 48px header with a back
  // button. So the geometry has to agree with the CSS: pin it to the top left
  // corner. It used to agree only when the user was in mobile mode; a phone in
  // desktop mode got a popup laid out for a 380px-wide box that the CSS then
  // made 375px wide starting 160px in, so its right half was off the screen and
  // the buttons in it could not be reached.
  if (isMiniScreen || viewportWidth <= MOBILE_POPUP_MAX_WIDTH) {
    return { left: 0, top: 0 };
  }

  // Actual popup width from CSS: min(380px, 55vw)...
  //
  // ...except for the popups that lay their content out in COLUMNS, which are
  // given more width in popup.css so more of it is visible at once. The clamp
  // below has to know the REAL width: computed for 380px, a 720px popup opened
  // from a button near the right edge is placed with 340px of itself off the
  // screen. Keep these in step with the width rules in popup.css.
  const WIDE_POPUP_WIDTHS = {
    // Select Color: the swatches are a grid, so width buys columns.
    changeColorPopup: 720,       // Member Settings / Change Color
    boardChangeColorPopup: 720,  // Board Settings / Change Color
    // Stickers: the same, and more of them - a hundred and fifty icons.
    cardStickersPopup: 720,      // Card / Stickers
    // Show on Card / Show on Minicard: two dozen settings laid out in columns
    // instead of one long list. Same numbers as popup.css.
    showOnCardPopup: 900,
    showOnMinicardPopup: 900,
  };
  // The export popups are one popup with one scope each (#1173): same panes,
  // same formats table, same panel.
  const FULL_WIDTH_POPUPS = [
    'exportBoardPopup', 'exportSwimlanePopup', 'exportListPopup', 'exportCardPopup',
  ];
  const wide = WIDE_POPUP_WIDTHS[popupName];
  const popupWidth = wide
    ? Math.min(wide, viewportWidth * 0.9)
    : Math.min(380, viewportWidth * 0.55);

  // Every export popup - board, swimlane, list, card: a full-width PANEL, not a
  // menu hanging off its button. It has
  // two panes - what to include, and what to export to - and anchored to its
  // button its trailing edge went past the edge of the window, taking the
  // pop-over's own X with it: the only way to shut it was Escape or clicking
  // away. Pinned to the viewport's own padding at the top left, and given
  // `calc(100vw - 20px)` by popup.css - the same 10px on each side - so the
  // whole panel, header and X included, is always on screen.
  if (FULL_WIDTH_POPUPS.includes(popupName)) {
    return {
      left: viewportPadding + scrollLeft,
      top: viewportPadding + scrollTop,
      maxHeight: viewportHeight - viewportPadding * 2,
    };
  }

  // #6636: date editors are forms, not menus attached to the date badge. Keep
  // their fixed-width shell centred in the visible viewport. Anchoring one to a
  // date near either card edge made the form look off-centre and, together with
  // its formerly non-shrinking fields, exposed a horizontal scrollbar.
  const DATE_EDITOR_POPUPS = [
    'editCardReceivedDatePopup',
    'editCardStartDatePopup',
    'editCardDueDatePopup',
    'editCardEndDatePopup',
    'editVoteEndDatePopup',
    'editPokerEndDatePopup',
    'cardCustomField-datePopup',
  ];
  if (DATE_EDITOR_POPUPS.includes(popupName)) {
    // popup.css gives these forms a 400px desktop shell, wider than the
    // ordinary 380px popup used above. Centre the width the browser actually
    // renders; using the default width shifts the shell right by 10px.
    const dateEditorWidth = Math.min(400, viewportWidth * 0.9);
    return {
      left: Math.max(viewportPadding, (viewportWidth - dateEditorWidth) / 2) + scrollLeft,
      top: viewportPadding + scrollTop,
      maxHeight: viewportHeight - viewportPadding * 2,
    };
  }

  // Card details popup: docked to the top of the viewport (CSS also forces
  // top:0) so it overlays the header bars instead of opening from the minicard.
  if (popupName === 'cardDetailsPopup') {
    const cardWidth = Math.min(600, viewportWidth * 0.8);
    const centeredLeft = (viewportWidth - cardWidth) / 2;
    return {
      left: Math.max(viewportPadding, centeredLeft),
      top: scrollTop, // viewport top in document coords
      maxHeight: viewportHeight,
    };
  }

  // No opener element: fall back to the top-left of the VISIBLE viewport.
  if (!opener) {
    return {
      left: viewportPadding + scrollLeft,
      top: viewportPadding + scrollTop,
      maxHeight: viewportHeight - viewportPadding * 2,
    };
  }

  // Opener position in viewport coordinates (this is the #5667 fix: the previous
  // code used the raw document offset here).
  const openerTopVp = opener.top - scrollTop;
  const openerBottomVp = openerTopVp + opener.height;
  const openerLeftVp = opener.left - scrollLeft;

  const clampedLeftVp = Math.max(
    viewportPadding,
    Math.min(openerLeftVp, viewportWidth - popupWidth - viewportPadding),
  );
  const clampedLeft = clampedLeftVp + scrollLeft;

  // Admin panel edit popups: horizontally centered, anchored to the viewport top.
  if (isAdminEditPopup) {
    const centeredLeft = (viewportWidth - popupWidth) / 2;
    return {
      left: Math.max(viewportPadding, centeredLeft),
      top: viewportPadding + scrollTop,
      maxHeight: viewportHeight - viewportPadding * 2,
    };
  }

  const spaceBelow = viewportHeight - openerBottomVp - viewportPadding;
  const spaceAbove = openerTopVp - viewportPadding;
  // People pickers belong directly under the + they edit. Choosing the larger
  // side made Requested/Assigned By jump to the top of the card while Members
  // and Assignee happened to stay below, despite being the same control.
  const BELOW_OPENER_POPUPS = [
    'cardMembersPopup', 'cardAssigneesPopup',
    'cardRequestedByPopup', 'cardAssignedByPopup',
  ];
  const preferBelow = BELOW_OPENER_POPUPS.includes(popupName)
    || spaceBelow >= spaceAbove;

  // Language popup: fixed-ish height below the opener, capped at 50% viewport.
  if (isLanguagePopup) {
    const languageTopVp = openerBottomVp;
    const languageAvailable = Math.max(
      0,
      viewportHeight - languageTopVp - viewportPadding,
    );
    const calculatedHeight = Math.min(languageAvailable, viewportHeight * 0.5);
    return {
      left: clampedLeft,
      top: languageTopVp + scrollTop,
      maxHeight: Math.max(calculatedHeight, 0),
    };
  }

  // Other popups: open on the side with more room and stay fully in the viewport.
  if (preferBelow) {
    const maxHeight = Math.max(0, Math.min(spaceBelow, viewportHeight * 0.8));
    return { left: clampedLeft, top: openerBottomVp + scrollTop, maxHeight };
  }

  const maxHeight = Math.max(0, Math.min(spaceAbove, viewportHeight * 0.8));
  const topVp = Math.max(viewportPadding, openerTopVp - maxHeight);
  return { left: clampedLeft, top: topVp + scrollTop, maxHeight };
}

export { computePopupOffset, MOBILE_POPUP_MAX_WIDTH };
