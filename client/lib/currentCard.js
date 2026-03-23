import { Blaze } from 'meteor/blaze';
import { Template } from 'meteor/templating';
import Cards from '/models/cards';

function getCardIdFromData(data) {
  if (!data || !data._id) {
    return null;
  }

  if (
    data.boardId ||
    data.listId ||
    typeof data.absoluteUrl === 'function' ||
    typeof data.getTitle === 'function'
  ) {
    return data._id;
  }

  return null;
}

function getCardIdFromElement(element) {
  if (!element || typeof element.closest !== 'function') {
    return null;
  }

  const cardDetails = element.closest('.js-card-details');
  if (!cardDetails) {
    return null;
  }

  return getCardIdFromData(Blaze.getData(cardDetails));
}

function getCardIdFromParentData(maxDepth = 8) {
  for (let depth = 1; depth <= maxDepth; depth += 1) {
    try {
      const cardId = getCardIdFromData(Template.parentData(depth));
      if (cardId) {
        return cardId;
      }
    } catch (error) {
      break;
    }
  }

  return null;
}

function getPopupStack() {
  if (typeof Popup !== 'undefined' && typeof Popup._getTopStack === 'function') {
    return Popup._getTopStack();
  }

  return null;
}

export function getCurrentCardIdFromContext({ ignorePopupCard = false } = {}) {
  let cardId;

  try {
    cardId = getCardIdFromData(Template.currentData());
    if (cardId) {
      return cardId;
    }
  } catch (error) {
    // No active Blaze view.
  }

  cardId = getCardIdFromParentData();
  if (cardId) {
    return cardId;
  }

  const popupStack = getPopupStack();

  cardId = getCardIdFromData(popupStack?.dataContext);
  if (cardId) {
    return cardId;
  }

  cardId = getCardIdFromElement(popupStack?.openerElement);
  if (cardId) {
    return cardId;
  }

  cardId = getCardIdFromElement(document.activeElement);
  if (cardId) {
    return cardId;
  }

  cardId = Session.get('currentCard');
  if (cardId) {
    return cardId;
  }

  if (!ignorePopupCard) {
    cardId = Session.get('popupCardId');
    if (cardId) {
      return cardId;
    }
  }

  const cardDetails = document.querySelectorAll('.js-card-details');
  if (cardDetails.length === 1) {
    return getCardIdFromElement(cardDetails[0]);
  }

  return null;
}

export function getCurrentCardFromContext(options) {
  const cardId = getCurrentCardIdFromContext(options);
  if (!cardId) {
    return null;
  }

  return Cards.findOne(cardId);
}
