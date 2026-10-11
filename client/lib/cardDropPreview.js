// Keep a successful card drop visually stable while Blaze catches up with the
// optimistic Minimongo update. jQuery UI's required sortable('cancel') puts the
// real node back at its source first; on a large board the following Blaze flush
// can take long enough for that round trip to look like a one-second flicker.
//
// Two halves, and both are needed (#6430). The preview fills the DROP slot, so
// the target never looks empty. And the real node that sortable('cancel') put
// back at the SOURCE is hidden until Blaze moves or replaces it - otherwise the
// card is drawn twice, once in each place, which is the flicker the reporter's
// second video showed after the preview alone was added.

export function createCardDropPreview(item, targetContainer) {
  if (!item || !targetContainer) return null;

  const preview = item.cloneNode(true);
  preview.removeAttribute('id');
  preview.removeAttribute('href');
  preview.removeAttribute('style');
  preview.setAttribute('aria-hidden', 'true');
  preview.setAttribute('tabindex', '-1');
  preview.classList.remove('ui-sortable-helper', 'ui-sortable-placeholder');
  preview.classList.add('card-drop-preview', 'placeholder');

  targetContainer.insertBefore(preview, item.nextSibling);
  return preview;
}

function isNextTo(node, preview) {
  return (
    preview.previousElementSibling === node ||
    preview.nextElementSibling === node
  );
}

// Has the real card reached the drop slot? `original` is the node
// sortable('cancel') put back at the source. Another node for the card in the
// target is Blaze's render of the moved card (a move to another list or
// swimlane). The original node itself counts only once it sits beside the
// preview: that is Blaze moving it within the same list, or a drop back in the
// place it came from. Until then it is at its OLD position, i.e. still the
// source copy.
export function cardReachedDropSlot(cards, preview, original) {
  return cards.some(
    (card) =>
      card !== preview &&
      !card.classList.contains('card-drop-preview') &&
      (card !== original || isNextTo(card, preview)),
  );
}

export function retireCardDropPreview(
  preview,
  cardId,
  targetContainer,
  moveResult,
  original,
) {
  if (!preview) return;

  // Hidden with an inline style, not a class: Blaze owns this node's class
  // attribute (is-selected/is-checked) and nothing it renders sets `style`.
  const hideOriginal = original && original !== preview;
  const previousDisplay = hideOriginal ? original.style.display : '';
  if (hideOriginal) original.style.display = 'none';
  const showOriginal = () => {
    if (hideOriginal && original.isConnected) {
      original.style.display = previousDisplay;
    }
  };

  let observer;
  let timeout;
  const cleanup = () => {
    if (observer) observer.disconnect();
    if (timeout) clearTimeout(timeout);
    if (preview.isConnected) preview.remove();
  };
  // Failure or timeout: the card stays where it was, so show it there again.
  const restore = () => {
    cleanup();
    showOriginal();
  };
  const realCardArrived = () => {
    const cards = Array.from(
      targetContainer.querySelectorAll(`[data-card-id="${CSS.escape(cardId)}"]`),
    );
    if (!cardReachedDropSlot(cards, preview, original)) return false;
    cleanup();
    if (!hideOriginal || cards.includes(original)) {
      // Blaze moved the original node itself into place.
      showOriginal();
    } else if (original.isConnected) {
      // A new node arrived in another list. The original is the source copy
      // and Blaze removes it, possibly a flush later than it rendered the new
      // one - showing it now would draw the card twice again. Only if Blaze
      // still keeps it after the timeout is it shown, so no card is ever
      // left invisible.
      setTimeout(() => {
        if (original.isConnected) showOriginal();
      }, 10_000);
    }
    return true;
  };

  if (!realCardArrived()) {
    observer = new MutationObserver(realCardArrived);
    observer.observe(targetContainer, { childList: true });
    // Never leave stale UI behind if a rejected write or lost connection does
    // not produce the expected reactive card: the preview goes and the card
    // reappears where it was.
    timeout = setTimeout(restore, 10_000);
  }

  Promise.resolve(moveResult).catch(restore);
}
