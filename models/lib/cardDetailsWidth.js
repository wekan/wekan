'use strict';

// How wide the card details window opens (#6939).
//
// It used to open at min(520px, 90vw) every time: its bottom-right handle could
// widen it to the viewport edge, but the width was forgotten, so people who
// widen every card did it again on every card. Now, in this order:
//
//   1. the width the user dragged it to - kept like the left menu's width, in
//      the profile for a signed-in user (profile.cardDetailsWidth) and in a
//      cookie for a reader who is not; "Reset width" in the card menu, or a
//      double-click on the handle, forgets it;
//   2. else the administrator's default, Admin Panel / Settings / Appearance:
//      a PERCENTAGE of the browser window (cardDetailsDefaultWidthPercent),
//      because the same people work on a laptop and on a large screen, with
//      520px as its floor so a narrow window does not get a tiny card;
//   3. else today's 520px.
//
// Whatever it is, the window never gets wider than the viewport allows (the
// stylesheet's max-width). The answer is one CSS value, set as the custom
// property --wekan-card-details-width that cardDetails.css reads for the
// floating window and for the card opened as a popup; the mobile view and the
// maximized card do not read it. docs/Features/Cards/Card-Details-Width.md
//
// Pure: no Meteor, no DOM. tests/cardDetailsWidth.test.cjs.

const CSS_PROPERTY = '--wekan-card-details-width';
const DEFAULT_PX = 520;
// A dragged width is kept between these. The handle can make the window
// narrower than the default too; it cannot make it unusable.
const MIN_USER_PX = 280;
const MAX_USER_PX = 10000;
// The administrator's percentage of the window width.
const MIN_PERCENT = 30;
const MAX_PERCENT = 95;
// What the viewport leaves: the stylesheet's max-width, 8px each side.
const VIEWPORT_CAP = 'calc(100vw - 16px)';

const finite = n => typeof n === 'number' && Number.isFinite(n);

// A dragged width, rounded and kept in range; null for anything that is not a
// width (NaN passes check(Number), and a stored NaN would be a window no page
// can recover from).
function clampUserWidth(width) {
  if (!finite(width) || width <= 0) return null;
  return Math.round(Math.min(Math.max(width, MIN_USER_PX), MAX_USER_PX));
}

// The administrator's percentage, a whole number in range; null = no default
// of their own, which is "empty" in the Admin Panel.
function clampDefaultPercent(percent) {
  const n = typeof percent === 'string' && percent.trim() !== '' ? Number(percent) : percent;
  if (!finite(n) || n <= 0) return null;
  return Math.round(Math.min(Math.max(n, MIN_PERCENT), MAX_PERCENT));
}

// The CSS width, or null for the stylesheet's own (520px).
function cardDetailsWidthCss({ userWidth, defaultPercent } = {}) {
  const user = clampUserWidth(userWidth);
  if (user !== null) return `min(${user}px, ${VIEWPORT_CAP})`;
  const percent = clampDefaultPercent(defaultPercent);
  if (percent !== null) return `clamp(${DEFAULT_PX}px, ${percent}vw, ${VIEWPORT_CAP})`;
  return null;
}

// Was this pointer press on the window's resize handle? The browser draws it
// in the bottom corner on the inline-end side - bottom-right, or bottom-left
// in a right-to-left page - and a press there is the start of a resize, not of
// a click on the card's content.
const HANDLE_PX = 20;
function onResizeHandle(rect, x, y, rtl = false, handle = HANDLE_PX) {
  if (!rect || !finite(x) || !finite(y)) return false;
  if (y < rect.bottom - handle || y > rect.bottom) return false;
  return rtl
    ? x >= rect.left && x <= rect.left + handle
    : x <= rect.right && x >= rect.right - handle;
}

// After a press on the handle, whether the width is worth keeping: it changed
// by more than a pixel or two of rounding.
function widthChanged(before, after) {
  return finite(before) && finite(after) && Math.abs(after - before) >= 2;
}

module.exports = {
  CSS_PROPERTY,
  DEFAULT_PX,
  MIN_USER_PX,
  MAX_USER_PX,
  MIN_PERCENT,
  MAX_PERCENT,
  clampUserWidth,
  clampDefaultPercent,
  cardDetailsWidthCss,
  onResizeHandle,
  widthChanged,
};
