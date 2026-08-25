// Keep a successful card drop visually stable while Blaze catches up with the
// optimistic Minimongo update. jQuery UI's required sortable('cancel') puts the
// real node back at its source first; on a large board the following Blaze flush
// can take long enough for that round trip to look like a one-second flicker.

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

export function retireCardDropPreview(
  preview,
  cardId,
  targetContainer,
  moveResult,
) {
  if (!preview) return;

  let observer;
  let timeout;
  const remove = () => {
    if (observer) observer.disconnect();
    if (timeout) clearTimeout(timeout);
    if (preview.isConnected) preview.remove();
  };
  const realCardArrived = () => {
    const cards = targetContainer.querySelectorAll(
      `[data-card-id="${CSS.escape(cardId)}"]`,
    );
    if (
      Array.from(cards).some(
        (card) =>
          card !== preview && !card.classList.contains('card-drop-preview'),
      )
    ) {
      remove();
      return true;
    }
    return false;
  };

  if (!realCardArrived()) {
    observer = new MutationObserver(realCardArrived);
    observer.observe(targetContainer, { childList: true });
    // Never leave stale UI behind if a rejected write or lost connection does
    // not produce the expected reactive card.
    timeout = setTimeout(remove, 10_000);
  }

  Promise.resolve(moveResult).catch(remove);
}
