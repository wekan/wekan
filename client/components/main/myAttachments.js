import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import Attachments from '/models/attachments';
import { attachmentKind } from '/models/lib/attachmentKind';
const { filesize } = require('filesize');

// My Attachments (#3461): a third sibling of My Cards / My Due Cards in the
// member menu - every attachment the CURRENT user has uploaded, across every
// board they belong to (their own boards, and public ones), in one place.
// Structurally this mirrors myCards.js: a paged server subscription
// (server/publications/cards.js `myAttachments`, which already filters by
// board visibility the same way dueCards/myCards do), grouped client-side
// into board > swimlane > list > card > attachments, and the same
// "open the card in place" popup mechanism myCards.js's `.js-minicard`
// handler uses (#3640), reused here unchanged.

Template.myAttachments.onCreated(function () {
  const PAGE_SIZE = 200;
  const tpl = this;
  tpl.page = new ReactiveVar(0);
  tpl.pageSize = PAGE_SIZE;
  tpl.isLoading = new ReactiveVar(true);
  tpl.resultCount = new ReactiveVar(0);
  tpl.subscriptionHandle = null;

  tpl.autorun(() => {
    const page = tpl.page.get();
    if (tpl.subscriptionHandle) {
      tpl.subscriptionHandle.stop();
    }
    tpl.isLoading.set(true);
    tpl.subscriptionHandle = Meteor.subscribe(
      'myAttachments',
      PAGE_SIZE,
      page * PAGE_SIZE,
      {
        onReady() {
          tpl.isLoading.set(false);
        },
      },
    );
  });

  // Build the same nested board > swimlane > list > card structure
  // myCards.js builds, except each card carries the attachments THIS user
  // uploaded to it (`card.myAttachments`) rather than being the leaf itself.
  tpl.myAttachmentsList = function () {
    const userId = Meteor.userId();
    if (!userId) return [];

    const attachments = Attachments.find(
      { userId },
      { sort: { _id: -1 } },
    ).each();

    tpl.resultCount.set(attachments.length);

    const byCard = new Map();
    attachments.forEach(attachment => {
      const cardId = attachment.meta && attachment.meta.cardId;
      if (!cardId) return;
      if (!byCard.has(cardId)) byCard.set(cardId, []);
      byCard.get(cardId).push(attachment);
    });

    const boards = [];
    const boardsById = new Map();

    byCard.forEach((cardAttachments, cardId) => {
      const card = ReactiveCache.getCard(cardId);
      if (!card) return;
      const cardBoard = card.getBoard();
      if (!cardBoard || cardBoard.archived) return;
      const cardSwimlane = card.getSwimlane();
      if (!cardSwimlane || cardSwimlane.archived) return;
      const cardList = card.getList();
      if (!cardList || cardList.archived) return;

      let board = boardsById.get(cardBoard._id);
      if (!board) {
        board = cardBoard;
        board.mySwimlanes = [];
        board.mySwimlanesById = new Map();
        boardsById.set(cardBoard._id, board);
        boards.push(board);
      }

      let swimlane = board.mySwimlanesById.get(cardSwimlane._id);
      if (!swimlane) {
        swimlane = cardSwimlane;
        swimlane.myLists = [];
        swimlane.myListsById = new Map();
        board.mySwimlanesById.set(cardSwimlane._id, swimlane);
        board.mySwimlanes.push(swimlane);
      }

      let list = swimlane.myListsById.get(cardList._id);
      if (!list) {
        list = cardList;
        list.myAttachmentCards = [];
        swimlane.myListsById.set(cardList._id, list);
        swimlane.myLists.push(list);
      }

      card.myAttachments = cardAttachments.sort((a, b) =>
        (b._id || '').localeCompare(a._id || ''),
      );
      list.myAttachmentCards.push(card);
    });

    boards.forEach(b => {
      b.mySwimlanes.sort((a, c) => (a.sort || 0) - (c.sort || 0));
      b.mySwimlanes.forEach(s => {
        s.myLists.sort((a, c) => (a.sort || 0) - (c.sort || 0));
        s.myLists.forEach(l => {
          l.myAttachmentCards.sort((a, c) => (a.sort || 0) - (c.sort || 0));
        });
      });
    });

    boards.sort((a, c) => (a.sort || 0) - (c.sort || 0));

    return boards;
  };
});

Template.myAttachments.onDestroyed(function () {
  if (this.subscriptionHandle) {
    this.subscriptionHandle.stop();
  }
});

Template.myAttachments.helpers({
  userId() {
    return Meteor.userId();
  },

  searching() {
    return Template.instance().isLoading;
  },

  hasPreviousPage() {
    return Template.instance().page.get() > 0;
  },

  hasNextPage() {
    const tpl = Template.instance();
    return tpl.resultCount.get() === tpl.pageSize;
  },

  resultsText() {
    const boards = Template.instance().myAttachmentsList() || [];
    let count = 0;
    boards.forEach(board =>
      board.mySwimlanes.forEach(swimlane =>
        swimlane.myLists.forEach(list =>
          list.myAttachmentCards.forEach(card => {
            count += (card.myAttachments || []).length;
          }),
        ),
      ),
    );
    if (count === 1) {
      return TAPi18n.__('one-card-found');
    }
    const baseText = TAPi18n.__('n-cards-found');
    return baseText.replace('%s', count);
  },

  myAttachmentsList() {
    return Template.instance().myAttachmentsList();
  },

  fileSize(size) {
    return filesize(size);
  },

  isImage() {
    return attachmentKind(this).isImage;
  },

  extension() {
    return attachmentKind(this).extension;
  },
});

Template.myAttachments.events({
  // If this bubbles, FlowRouter handles it and empties the page content -
  // the same guard attachments.js's own `.js-download` handler uses (#101).
  'click .js-download'(evt) {
    evt.stopPropagation();
  },
  'click .js-previous-page'(evt, tpl) {
    evt.preventDefault();
    tpl.page.set(Math.max(0, tpl.page.get() - 1));
  },
  'click .js-next-page'(evt, tpl) {
    evt.preventDefault();
    tpl.page.set(tpl.page.get() + 1);
  },

  // Same cross-board "open card in place" popup mechanism myCards.js's
  // `.js-minicard` handler uses (#3640): a plain `<a href="board-url">`
  // would navigate away from this page and lose the reader's place in a
  // list that spans many boards.
  'click .js-my-attachment-card'(evt) {
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
