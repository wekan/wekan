// #2171: a search result is revealed ON THE BOARD - scrolled into the middle
// of the view and highlighted for a moment - so the card or list found is
// seen where it lives, among its neighbours, and not only opened.
//
// The board may still be drawing (opening a card re-renders it), so the item
// is looked for a few times before giving up quietly. Only the board's own
// minicards and lists are revealed: the copies in the search sidebar itself
// are skipped.

const HIGHLIGHT_CLASS = 'is-search-highlight';
const HIGHLIGHT_MS = 3000;
const TRIES = 20;
const RETRY_MS = 100;

function boardElement(doc, selector) {
  return [...doc.querySelectorAll(selector)].find(el => !el.closest('.js-search-sidebar, .sidebar, .board-sidebar, .pop-over')) || null;
}

/**
 * Reveal a card (`cardId`) or a list (`listId`) on the board.
 * `doc` and the timer functions are parameters so the behaviour can be
 * tested without a browser (tests/revealOnBoard.test.cjs).
 */
export function revealOnBoard({ cardId, listId }, { doc = document, setTimer = setTimeout, smooth = true } = {}) {
  const id = String(cardId || listId || '');
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) return Promise.resolve(false);
  const selector = cardId ? `.js-minicard[data-card-id="${id}"]` : `#js-list-${id}`;
  return new Promise((resolve) => {
    let tries = 0;
    const attempt = () => {
      const el = boardElement(doc, selector);
      if (!el) {
        tries += 1;
        if (tries >= TRIES) { resolve(false); return; }
        setTimer(attempt, RETRY_MS);
        return;
      }
      if (typeof el.scrollIntoView === 'function') {
        el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'center', inline: 'center' });
      }
      el.classList.add(HIGHLIGHT_CLASS);
      setTimer(() => el.classList.remove(HIGHLIGHT_CLASS), HIGHLIGHT_MS);
      resolve(true);
    };
    attempt();
  });
}

export { HIGHLIGHT_CLASS, HIGHLIGHT_MS };
