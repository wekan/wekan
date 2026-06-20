// Small, dependency-free helpers for responsive / mobile behaviour.
//
// Kept deliberately tiny and pure so it can be unit-tested without a DOM
// (see client/lib/tests/responsive.tests.js). UI code (e.g. the mobile popup
// fix in client/components/main/popup.js) imports these helpers instead of
// hard-coding viewport breakpoints in several places.

// Default breakpoint (px) below which we treat the viewport as "mobile".
// Matches the 768px tablet/phone boundary used across the responsive CSS.
export const MOBILE_BREAKPOINT = 768;

/**
 * Decide whether a given viewport width should be treated as a mobile/narrow
 * layout.
 *
 * @param {number} width      viewport width in CSS pixels
 * @param {number} breakpoint width at/below which we consider it mobile
 * @returns {boolean} true when width is a valid number <= breakpoint
 */
export function isMobileViewport(width, breakpoint = MOBILE_BREAKPOINT) {
  if (typeof width !== 'number' || Number.isNaN(width)) {
    return false;
  }
  return width <= breakpoint;
}

/**
 * Convenience wrapper that reads the current browser width. Falls back to a
 * desktop width when there is no window object (e.g. during unit tests / SSR).
 *
 * @param {number} breakpoint width at/below which we consider it mobile
 * @returns {boolean}
 */
export function isMobileViewportNow(breakpoint = MOBILE_BREAKPOINT) {
  if (typeof window === 'undefined' || typeof window.innerWidth !== 'number') {
    return false;
  }
  return isMobileViewport(window.innerWidth, breakpoint);
}

// Also expose on window for non-module callers / debugging, mirroring the
// pattern used by client/lib/utils.js and client/lib/popup.js.
if (typeof window !== 'undefined') {
  window.isMobileViewport = isMobileViewport;
  window.isMobileViewportNow = isMobileViewportNow;
}
