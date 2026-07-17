'use strict';

// Pure helpers for keeping jQuery UI sortable's cached drag geometry in sync
// with the real card layout. Extracted so the decision logic is unit-testable
// in plain Node without Meteor (mirrors models/lib/cardSortRepair.js).
//
// #2769 "Card moves to wrong swimlane when moving to target column where a
// new card is being added": jQuery UI sortable snapshots the geometry of
// every connected `.js-minicards` container ONCE at drag start
// (sortable._mouseStart calls refreshPositions() BEFORE it fires the `start`
// callback) and only re-snapshots after its OWN placeholder rearranges. It
// never notices DOM changes made by anyone else. Two such changes routinely
// happen DURING a card drag:
//
//   * another user submits the open add-card composer, so Blaze reactively
//     inserts the new minicard into a connected list (the issue's "target
//     column where a new card is being added"), and
//   * the dragging user's own open composer is closed by the `start`
//     callback's EscapeActions.executeUpTo('popup-close')
//     (client/components/lists/list.js) — i.e. AFTER the snapshot was taken.
//
// Either way, every list and swimlane below the change shifts vertically
// while the cached rectangles stay where they were, so the pointer is matched
// against a stale map: the placeholder is parked in the NEIGHBOURING
// swimlane's copy of the list (which is why the reporter saw no drop shadow
// in the column they were aiming at), and the `stop` handler's
// ui.item.parents('.swimlane') then faithfully reports that wrong swimlane —
// the card "disappears and reappears in the swimlane below".
//
// The wiring lives in client/components/lists/listBody.js (a MutationObserver
// per list body that calls sortable('refresh') on the active drag). The
// decisions worth testing in isolation are below:
//   1. whether a mutation batch represents a REAL layout change (a Blaze
//      insertion/removal) as opposed to jQuery UI's own placeholder/helper
//      churn, which happens on every mousemove and must not trigger anything,
//      and
//   2. which sortable instance (if any) is the active card drag whose
//      geometry needs re-caching.

// jQuery UI marks the elements it moves around itself during a drag: the drop
// shadow ("ui-sortable-placeholder") and the dragged clone
// ("ui-sortable-helper"). Their insertions/removals are part of the drag and
// already followed by the library's own refreshPositions; reacting to them
// would just do the same work twice on every mousemove.
function nodeChangesDragGeometry(node) {
  if (!node || node.nodeType !== 1) {
    // Text/comment nodes: no box of their own worth re-snapshotting for.
    return false;
  }
  const classList = node.classList;
  if (!classList || typeof classList.contains !== 'function') {
    // An element we cannot classify still occupies layout space.
    return true;
  }
  return (
    !classList.contains('ui-sortable-placeholder') &&
    !classList.contains('ui-sortable-helper')
  );
}

// Does this MutationObserver batch contain at least one real DOM change
// (an element other than jQuery UI's own drag artefacts was added or
// removed)? Only then is the drag geometry snapshot stale.
function mutationsChangeDragGeometry(mutations) {
  if (!mutations) return false;
  for (let i = 0; i < mutations.length; i += 1) {
    const mutation = mutations[i];
    if (!mutation || mutation.type !== 'childList') continue;
    const added = mutation.addedNodes || [];
    const removed = mutation.removedNodes || [];
    for (let j = 0; j < added.length; j += 1) {
      if (nodeChangesDragGeometry(added[j])) return true;
    }
    for (let j = 0; j < removed.length; j += 1) {
      if (nodeChangesDragGeometry(removed[j])) return true;
    }
  }
  return false;
}

// Given the sortable instances of every card container on the board, return
// the one an active card drag started from — that instance owns the cached
// geometry of ALL connected containers (its refresh() re-collects items and
// re-measures every container). Returns null when no card drag is running,
// e.g. when the observed change was an ordinary reactive update, or the
// leftover DOM churn of sortable('cancel') after the drag already ended
// (sortable sets `dragging` back to false before its stop event fires).
function findActiveCardDrag(instances) {
  if (!instances) return null;
  for (let i = 0; i < instances.length; i += 1) {
    const instance = instances[i];
    if (instance && instance.dragging === true && instance.currentItem) {
      return instance;
    }
  }
  return null;
}

module.exports = {
  nodeChangesDragGeometry,
  mutationsChangeDragGeometry,
  findActiveCardDrag,
};
