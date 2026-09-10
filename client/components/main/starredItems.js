import { ReactiveCache } from '/imports/reactiveCache';

// The "Starred" page (#1172): everything the CURRENT user has starred, across
// every board they belong to, grouped by type - Boards, Swimlanes, Lists,
// Cards. This is the per-user star shape `profile.starredBoards` already has
// (models/users.js), generalized to the other three id-array fields
// (`starredSwimlanes`, `starredLists`, `starredCards`) added alongside it.
//
// Unlike myAttachments.js this needs no paged publication: starring an item
// implies the user already has board access to it, so the docs are already
// in minimongo through the board's own subscription. The reactive query is
// the SAME one the header bookmarks dropdown uses
// (client/components/main/header.js `starredItemsByType`) - see that file's
// comment for why it lives there and is only called from here and there.
import { starredItemsByType } from './header.js';

Template.starredItems.helpers({
  starredBoards() {
    const user = ReactiveCache.getCurrentUser();
    return user ? starredItemsByType(user).boards : [];
  },
  starredSwimlanes() {
    const user = ReactiveCache.getCurrentUser();
    return user ? starredItemsByType(user).swimlanes : [];
  },
  starredLists() {
    const user = ReactiveCache.getCurrentUser();
    return user ? starredItemsByType(user).lists : [];
  },
  starredCards() {
    const user = ReactiveCache.getCurrentUser();
    return user ? starredItemsByType(user).cards : [];
  },
  hasNoStarredItems() {
    const user = ReactiveCache.getCurrentUser();
    if (!user) return true;
    const groups = starredItemsByType(user);
    return (
      groups.boards.length === 0 &&
      groups.swimlanes.length === 0 &&
      groups.lists.length === 0 &&
      groups.cards.length === 0
    );
  },
});

Template.starredItems.events({
  // Reuse the "open card in place" popup mechanism myCards.js/myAttachments.js
  // use (#3640), so opening a starred card does not navigate away and lose
  // the reader's place in this cross-board list.
  'click .js-starred-card'(evt) {
    evt.preventDefault();
    const card = Blaze.getData(evt.currentTarget);
    if (!card || !card._id) return;
    const cardId = card._id;
    const boardId = card.boardId;
    Meteor.subscribe('popupCardData', cardId, {
      onReady() {
        Session.set('popupCardId', cardId);
        Session.set('popupCardBoardId', boardId);
        if (!Popup.isOpen()) {
          Popup.open('cardDetails')(evt);
        }
      },
    });
  },
});
