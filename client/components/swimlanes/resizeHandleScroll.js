// #6903: the swimlane-height resize handle is `position: absolute` across the
// bottom of `.js-swimlane`, and `.js-swimlane` is itself the horizontal scroll
// container of its row of lists. An absolutely positioned child is as wide as
// the container's visible box but moves with the scrolled content, so with
// more lists than fit, scrolling right by N pixels left the last N pixels of
// the swimlane without a handle - the blue line stopped short of the right
// edge. Shifting the handle by the container's own scroll offset keeps it
// under the visible part of the swimlane at every scroll position. In a
// right-to-left board scrollLeft is negative and the same shift is right.
//
// No Meteor imports, so tests/swimlaneResizeHandleScroll6903.test.cjs can
// drive it with plain objects.

export function resizeHandleTransform(scroller) {
  const offset = Number(scroller && scroller.scrollLeft) || 0;
  return offset ? `translateX(${offset}px)` : '';
}

// Keeps `handle` under the visible part of `scroller` from now on. Returns the
// function that applies the shift, for a caller that changes the scroll offset
// itself. A second call for the same pair does not add a second listener.
export function keepResizeHandleInView(handle, scroller) {
  if (!handle || !scroller || !handle.style) return () => {};
  const apply = () => { handle.style.transform = resizeHandleTransform(scroller); };
  if (scroller.__wekanResizeHandleFollow !== handle) {
    scroller.__wekanResizeHandleFollow = handle;
    scroller.addEventListener('scroll', apply, { passive: true });
  }
  apply();
  return apply;
}
