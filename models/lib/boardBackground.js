'use strict';

// #4978 "Favorite-Switch of board. The board-background does not change."
//
// Switching directly from one board to another via the favorites bar reuses the
// same boardBody template instance (currentBoard goes A -> B, never null), so
// boardBody.onRendered never fires again and the one-shot Utils.setBackgroundImage()
// call never re-ran — the previous board's inline `background:url(...)` on
// `.board-wrapper` stuck. Switching via the "all boards" list worked only
// because it destroys and re-creates boardBody.
//
// The fix has two parts: (1) call setBackgroundImage() inside a reactive autorun
// so it recomputes when the current board changes; (2) this pure helper decides
// what to apply, INCLUDING a 'none' result that clears a stale inline background.
// The old code only ever SET a background and never reset it, so an
// image -> color or image -> plain switch kept showing the old image.
//
// Board *color* is applied separately and reactively through the `.board-wrapper`
// colorClass in boardBody.jade, so this helper does not need to set colors; for
// a color board it just reports 'color' and the caller clears the stale inline
// image background so the color class shows through.

// Returns the background descriptor for `board`:
//   { type: 'image', url }   - board has a background image (apply inline url)
//   { type: 'color' }        - board has a color but no image (clear inline bg;
//                              colorClass shows the color)
//   { type: 'none' }         - board has neither: clear any stale inline bg
function computeBoardBackground(board) {
  if (!board) return { type: 'none' };
  const url = board.backgroundImageURL;
  if (typeof url === 'string' && url.length > 0) {
    return { type: 'image', url };
  }
  // `background-color` is the legacy custom-color field; `color` drives colorClass.
  if (board['background-color'] || board.color) {
    return { type: 'color' };
  }
  return { type: 'none' };
}

module.exports = { computeBoardBackground };
