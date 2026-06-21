// Pure helper for the card-details "click outside to close" behaviour.
//
// Regression #5686 ("Chrome: Selecting text in checklist closes card"):
// selecting the text of a checklist item and releasing the mouse OUTSIDE the
// card detail pane closed the card. The card normally protects against this via
// a `cardDetailsIsDragging` session flag set from a `mousedown`/`mousemove` on
// `.js-card-details`, but the checklist items template calls
// `evt.stopPropagation()` on `mousedown`, so that flag never gets set for a
// drag that starts on a checklist item — and the close-on-outside-click handler
// then closed the card.
//
// This helper centralises the robust, propagation-independent check: if there
// is a live (non-collapsed) text selection ANCHORED inside the card detail
// pane, an outside mouseup/click is the tail end of a text selection drag and
// must NOT close the card. A deliberate click on empty space outside the card
// collapses the selection to that outside point first, so its anchor is no
// longer inside the pane and the card closes as expected.
//
// Kept DOM-light so it can be unit-tested with plain objects: `selection` only
// needs `isCollapsed`, `toString()`, `anchorNode` and `focusNode`, and
// `cardDetailsEl` only needs `contains(node)`.

/**
 * @param {{ isCollapsed?: boolean, toString?: function, anchorNode?: *, focusNode?: * }} selection
 *        typically `window.getSelection()`
 * @param {{ contains?: function }} cardDetailsEl the `.js-card-details` element
 * @returns {boolean} true when the card must stay open (selection drag in progress)
 */
export function isTextSelectionInsideCard(selection, cardDetailsEl) {
  if (!selection || !cardDetailsEl) {
    return false;
  }
  // A collapsed (caret-only) selection is not a text selection.
  if (selection.isCollapsed) {
    return false;
  }
  const text =
    typeof selection.toString === 'function' ? selection.toString() : '';
  if (!text || text.trim() === '') {
    return false;
  }
  const contains = node => {
    if (!node) {
      return false;
    }
    if (node === cardDetailsEl) {
      return true;
    }
    return (
      typeof cardDetailsEl.contains === 'function' &&
      cardDetailsEl.contains(node)
    );
  };
  // Anchored inside the pane => the drag started on the card content.
  return contains(selection.anchorNode) || contains(selection.focusNode);
}
