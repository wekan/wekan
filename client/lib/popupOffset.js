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

  if (isMiniScreen) return { left: 0, top: 0 };

  // Actual popup width from CSS: min(380px, 55vw).
  const popupWidth = Math.min(380, viewportWidth * 0.55);

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
  const preferBelow = spaceBelow >= spaceAbove;

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

module.exports = { computePopupOffset };
