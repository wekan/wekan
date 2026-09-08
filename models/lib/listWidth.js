'use strict';

// List width is a single hardcoded constant. Every list on every board
// renders at this width, for every viewer, and it cannot be changed - not
// per board, not per list, not per viewer, and not by dragging (there is no
// resize handle any more). #5659/#5729/#6409 built up exactly that kind of
// customization over time (a personal per-user width, a per-list shared
// width, a viewer-toggled "same width for all lists" mode, a viewer-toggled
// auto-width mode); all of it is gone in favor of this one number.
//
// Meteor-free so it can be unit tested in plain Node
// (tests/listWidthDefaults.test.cjs) and imported by
// client/components/lists/list.js.

const DEFAULT_LIST_WIDTH = 240;

export { DEFAULT_LIST_WIDTH };
