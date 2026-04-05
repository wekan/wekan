import { ReactiveCache } from '/imports/reactiveCache';

Template.resultCard.helpers({
  userId() {
    return Meteor.userId();
  },
  getBoard() {
    const card = Template.currentData();
    try {
      if (card && card.boardId) {
        const board = ReactiveCache.getBoard(card.boardId);
        return board || null;
      }
    } catch (err) {
      // Silently handle errors
    }
    return null;
  },
  getSwimlane() {
    const card = Template.currentData();
    try {
      if (card && card.swimlaneId) {
        const swimlane = ReactiveCache.getSwimlane(card.swimlaneId);
        return swimlane || null;
      }
    } catch (err) {
      // Silently handle errors
    }
    return null;
  },
  getList() {
    const card = Template.currentData();
    try {
      if (card && card.listId) {
        const list = ReactiveCache.getList(card.listId);
        return list || null;
      }
    } catch (err) {
      // Silently handle errors
    }
    return null;
  },
  originRelativeUrl() {
    const card = Template.currentData();
    if (card && card.boardId && card._id) {
      return `/board/${card.boardId}?cardId=${card._id}`;
    }
    return '#';
  },
});

Template.resultCard.events({
  'click .js-minicard'(event) {
    event.preventDefault();
    const cardId = Template.currentData()._id;
    const boardId = Template.currentData().boardId;
    Meteor.subscribe('popupCardData', cardId, {
      onReady() {
        Session.set('popupCardId', cardId);
        Session.set('popupCardBoardId', boardId);
        if (!Popup.isOpen()) {
          Popup.open("cardDetails")(event);
        }
      },
    });
  },
});
