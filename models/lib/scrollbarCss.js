'use strict';

// #5439 "How to have scrollbar always visible on list?". List bodies used
// `overflow-y: auto`, so on browsers/platforms with overlay scrollbars (macOS,
// iOS, Android, Firefox) the scrollbar auto-hid when idle, leaving no visible
// affordance that a list is scrollable. alwaysVisibleScrollbarCss() returns the
// cross-browser (desktop + mobile, all engines) CSS that keeps a scrollbar
// visible for the given selector:
//   - overflow-y: scroll ............ always reserve and show the track (all engines)
//   - ::-webkit-scrollbar (+ thumb/track) . Chrome, Safari, Edge, mobile WebKit/Blink
//   - scrollbar-width + scrollbar-color ... Firefox / Gecko (desktop + Android)
//   - scrollbar-gutter: stable ........... reserve the gutter so content never shifts
//
// It deliberately AVOIDS the values that would hide the scrollbar again
// (scrollbar-width: none, ::-webkit-scrollbar { width: 0 }, overflow: hidden),
// which is what the negative tests assert. Meteor-free so it is unit tested; the
// same declarations are applied in client/components/lists/list.css.
const SCROLLBAR_THUMB = 'rgba(0, 0, 0, 0.35)';
const SCROLLBAR_TRACK = 'rgba(0, 0, 0, 0.08)';
const SCROLLBAR_SIZE_PX = 10;

function alwaysVisibleScrollbarCss(selector = '.list-body') {
  return [
    `${selector} {`,
    `  overflow-y: scroll;`,
    `  scrollbar-width: thin;`,
    `  scrollbar-color: ${SCROLLBAR_THUMB} ${SCROLLBAR_TRACK};`,
    `  scrollbar-gutter: stable;`,
    `}`,
    `${selector}::-webkit-scrollbar {`,
    `  width: ${SCROLLBAR_SIZE_PX}px;`,
    `  height: ${SCROLLBAR_SIZE_PX}px;`,
    `  -webkit-appearance: none;`,
    `}`,
    `${selector}::-webkit-scrollbar-track {`,
    `  background: ${SCROLLBAR_TRACK};`,
    `}`,
    `${selector}::-webkit-scrollbar-thumb {`,
    `  background: ${SCROLLBAR_THUMB};`,
    `  border-radius: ${SCROLLBAR_SIZE_PX / 2}px;`,
    `}`,
  ].join('\n');
}

module.exports = {
  alwaysVisibleScrollbarCss,
  SCROLLBAR_THUMB,
  SCROLLBAR_TRACK,
  SCROLLBAR_SIZE_PX,
};
