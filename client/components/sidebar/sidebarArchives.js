import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import Cards from '/models/cards';
import { Utils } from '/client/lib/utils';

const ARCHIVE_PAGE_SIZE = 30;
const ARCHIVE_SCROLL_THRESHOLD_PX = 120;


function throttle(func, wait) {
  let timeoutId = null;
  let lastRan = 0;

  return function throttled(...args) {
    const now = Date.now();
    const run = () => {
      lastRan = Date.now();
      timeoutId = null;
      func.apply(this, args);
    };

    if (!lastRan || now - lastRan >= wait) {
      run();
      return;
    }

    if (!timeoutId) {
      timeoutId = setTimeout(run, wait - (now - lastRan));
    }
  };
}

function getArchivedCards() {
  const ret = ReactiveCache.getCards(
    {
      archived: true,
      boardId: Session.get('currentBoard'),
    },
    {
      sort: { archivedAt: -1, modifiedAt: -1 },
    },
  );
  return ret;
}

function getArchivedLists() {
  return ReactiveCache.getLists(
    {
      archived: true,
      boardId: Session.get('currentBoard'),
    },
    {
      sort: { archivedAt: -1, modifiedAt: -1 },
    },
  );
}

function getArchivedSwimlanes() {
  return ReactiveCache.getSwimlanes(
    {
      archived: true,
      boardId: Session.get('currentBoard'),
    },
    {
      sort: { archivedAt: -1, modifiedAt: -1 },
    },
  );
}


Template.archivesSidebar.onCreated(function () {
  this.isArchiveReady = new ReactiveVar(false);
  this.activeTab = new ReactiveVar('cards');
  this.archivedCardsLimit = new ReactiveVar(ARCHIVE_PAGE_SIZE);
  this.archivedListsLimit = new ReactiveVar(ARCHIVE_PAGE_SIZE);
  this.archivedSwimlanesLimit = new ReactiveVar(ARCHIVE_PAGE_SIZE);
  this.isLoadingMore = false;

  this.autorun(() => {
    const currentBoardId = Session.get('currentBoard');
    if (!currentBoardId) return;
    // Read activeTab non-reactively: all three collections are always published
    // regardless of tab, so re-subscribing on tab click only resets basicTabs.
    const tab = Tracker.nonreactive(() => this.activeTab.get());
    const cardsLimit = this.archivedCardsLimit.get();
    const listsLimit = this.archivedListsLimit.get();
    const swimlanesLimit = this.archivedSwimlanesLimit.get();
    const handle = this.subscribe(
      'archiveSidebar',
      currentBoardId,
      tab,
      cardsLimit,
      listsLimit,
      swimlanesLimit,
    );

    this.isArchiveReady.set(handle.ready());
    if (handle.ready()) {
      this.isLoadingMore = false;
    }
  });
});

Template.archivesSidebar.onRendered(function () {
  // The scrollable sidebar container is the parent element, not inside this template.
  const container = document.querySelector('.js-board-sidebar-content');
  if (!container) return;
  this._scrollContainer = container;

  this.loadMoreOnScroll = throttle(() => {
    if (this.isLoadingMore || !this.isArchiveReady.get()) return;

    const nearBottom =
      container.scrollTop + container.clientHeight >=
      container.scrollHeight - ARCHIVE_SCROLL_THRESHOLD_PX;
    if (!nearBottom) return;

    const tab = this.activeTab.get();

    if (tab === 'cards') {
      const currentLimit = this.archivedCardsLimit.get();
      if (getArchivedCards().length < currentLimit) return;
      this.isLoadingMore = true;
      this.archivedCardsLimit.set(currentLimit + ARCHIVE_PAGE_SIZE);
    } else if (tab === 'lists') {
      const currentLimit = this.archivedListsLimit.get();
      if (getArchivedLists().length < currentLimit) return;
      this.isLoadingMore = true;
      this.archivedListsLimit.set(currentLimit + ARCHIVE_PAGE_SIZE);
    } else if (tab === 'swimlanes') {
      const currentLimit = this.archivedSwimlanesLimit.get();
      if (getArchivedSwimlanes().length < currentLimit) return;
      this.isLoadingMore = true;
      this.archivedSwimlanesLimit.set(currentLimit + ARCHIVE_PAGE_SIZE);
    }
  }, 200);

  container.addEventListener('scroll', this.loadMoreOnScroll);
});

Template.archivesSidebar.onDestroyed(function() {
  if (this._scrollContainer && this.loadMoreOnScroll) {
    this._scrollContainer.removeEventListener('scroll', this.loadMoreOnScroll);
  }
});

Template.archivesSidebar.helpers({
  isArchiveReady() {
    return Template.instance().isArchiveReady;
  },
  isBoardAdmin() {
    return ReactiveCache.getCurrentUser().isBoardAdmin();
  },
  isWorker() {
    const currentBoard = Utils.getCurrentBoard();
    return (
      !currentBoard.hasAdmin(this.userId) && currentBoard.hasWorker(this.userId)
    );
  },

  tabs() {
    return [
      { name: TAPi18n.__('cards'), slug: 'cards' },
      { name: TAPi18n.__('lists'), slug: 'lists' },
      { name: TAPi18n.__('swimlanes'), slug: 'swimlanes' },
    ];
  },

  archivedCards() {
    return getArchivedCards();
  },

  archivedLists() {
    return getArchivedLists();
  },

  archivedSwimlanes() {
    return getArchivedSwimlanes();
  },

  activeTab() {
    return Template.instance().activeTab ? Template.instance().activeTab.get() : 'cards';
  },

  isArchiveTabActive(slug) {
    return Template.instance().activeTab && Template.instance().activeTab.get() === slug
      ? 'active'
      : '';
  },

  cardIsInArchivedList() {
    const list = Template.currentData().list();
    return list ? list.archived : false;
  },
});

Template.archivesSidebar.events({
  'click .tab-item'(e, t) {
    const slug = e.currentTarget?.getAttribute('data-tab') || this.slug;
    if (slug) {
      t.activeTab.set(slug);
    }
  },

  async 'click .js-restore-card'(evt) {
    evt.preventDefault();
    const data = Template.currentData() || {};
    const cardId = (this && this._id) || data._id;
    if (!cardId) {
      return;
    }

    const card = Cards.findOne(cardId);
    if (!card) {
      return;
    }

    const currentList = ReactiveCache.getList(card.listId);
    if (!currentList) {
      Popup.open('restoreArchivedCardToList')(evt, {
        dataContextIfCurrentDataIsUndefined: { _id: cardId },
      });
      return;
    }

    if (typeof card.canBeRestored === 'function' && card.canBeRestored()) {
      await card.restore();
    }
  },
  async 'click .js-restore-all-cards'() {
    for (const card of getArchivedCards()) {
      if (card.canBeRestored()) {
        await card.restore();
      }
    }
  },

  'click .js-delete-card': Popup.afterConfirm('cardDelete', async function() {
    const cardId = this._id;
    await Cards.removeAsync(cardId);
    Popup.back();
  }),
  'click .js-delete-all-cards': Popup.afterConfirm('cardDelete', async () => {
    for (const card of getArchivedCards()) {
      await Cards.removeAsync(card._id);
    }
    Popup.back();
  }),

  async 'click .js-restore-list'(evt) {
    evt.preventDefault();
    const data = Template.currentData() || {};
    const listId = (this && this._id) || data._id;
    if (!listId) {
      return;
    }

    const list = Lists.findOne(listId);
    if (!list) {
      return;
    }

    const originalSwimlaneId = list.swimlaneId || '';
    const originalSwimlane = originalSwimlaneId
      ? ReactiveCache.getSwimlane(originalSwimlaneId)
      : null;

    if (originalSwimlaneId && !originalSwimlane) {
      Popup.open('restoreArchivedListToSwimlane')(evt, {
        dataContextIfCurrentDataIsUndefined: { _id: listId },
      });
      return;
    }

    if (typeof list.restore === 'function') {
      await list.restore();
    }
  },
  async 'click .js-restore-all-lists'() {
    for (const list of getArchivedLists()) {
      await list.restore();
    }
  },

  'click .js-delete-list': Popup.afterConfirm('listDelete', async function() {
    const list = Lists.findOne(this._id);
    if (list) await list.remove();
    Popup.back();
  }),
  'click .js-delete-all-lists': Popup.afterConfirm('listDelete', async () => {
    for (const list of getArchivedLists()) {
      await list.remove();
    }
    Popup.back();
  }),

  async 'click .js-restore-swimlane'(evt) {
    evt.preventDefault();
    const data = Template.currentData() || {};
    const swimlaneId = (this && this._id) || data._id;
    if (!swimlaneId) {
      return;
    }

    const swimlane = Swimlanes.findOne(swimlaneId);
    if (swimlane && typeof swimlane.restore === 'function') {
      await swimlane.restore();
    }
  },
  async 'click .js-restore-all-swimlanes'() {
    for (const swimlane of getArchivedSwimlanes()) {
      await swimlane.restore();
    }
  },

  'click .js-delete-swimlane': Popup.afterConfirm(
    'swimlaneDelete',
    async function() {
      const swimlane = Swimlanes.findOne(this._id);
      if (swimlane) await swimlane.remove();
      Popup.back();
    },
  ),
  'click .js-delete-all-swimlanes': Popup.afterConfirm(
    'swimlaneDelete',
    async () => {
      for (const swimlane of getArchivedSwimlanes()) {
        await swimlane.remove();
      }
      Popup.back();
    },
  ),
});

Template.restoreArchivedCardToListPopup.onCreated(function() {
  this.selectedListId = new ReactiveVar('');

  this.autorun(() => {
    const cardData = Template.currentData() || {};
    const card = Cards.findOne(cardData._id);
    if (!card) return;

    const boardLists = ReactiveCache.getLists(
      {
        boardId: card.boardId,
        archived: false,
      },
      {
        sort: { sort: 1, title: 1 },
      },
    ) || [];

    if (!this.selectedListId.get() && boardLists.length > 0) {
      this.selectedListId.set(boardLists[0]._id);
    }
  });
});

Template.restoreArchivedCardToListPopup.helpers({
  availableLists() {
    const cardData = Template.currentData() || {};
    const card = Cards.findOne(cardData._id);
    if (!card) return [];

    return ReactiveCache.getLists(
      {
        boardId: card.boardId,
        archived: false,
      },
      {
        sort: { sort: 1, title: 1 },
      },
    ) || [];
  },

  isSelectedList(listId) {
    return Template.instance().selectedListId.get() === listId;
  },
});

Template.restoreArchivedCardToListPopup.events({
  'change .js-select-restore-target-list'(evt, tpl) {
    tpl.selectedListId.set(evt.currentTarget.value);
  },

  async 'click .js-restore-card-to-list'(evt, tpl) {
    evt.preventDefault();
    const cardData = Template.currentData() || {};
    const card = Cards.findOne(cardData._id);
    if (!card) {
      Popup.back();
      return;
    }

    const listId = tpl.selectedListId.get() || evt.currentTarget
      .closest('.js-pop-over')
      ?.querySelector('.js-select-restore-target-list')
      ?.value;
    if (!listId) {
      return;
    }

    const targetList = Lists.findOne(listId);
    if (!targetList) {
      return;
    }

    const board = ReactiveCache.getBoard(card.boardId);
    const swimlaneId =
      targetList.swimlaneId ||
      card.swimlaneId ||
      (board && board.getDefaultSwimline && board.getDefaultSwimline()._id) ||
      '';

    await card.moveOptionalArgs({
      boardId: card.boardId,
      swimlaneId,
      listId,
    });
    await card.restore();
    Popup.back();
  },
});

Template.restoreArchivedListToSwimlanePopup.onCreated(function() {
  this.selectedSwimlaneId = new ReactiveVar('');

  this.autorun(() => {
    const listData = Template.currentData() || {};
    const list = Lists.findOne(listData._id);
    if (!list) return;

    const swimlanes = ReactiveCache.getSwimlanes(
      {
        boardId: list.boardId,
        archived: false,
      },
      {
        sort: { sort: 1, title: 1 },
      },
    ) || [];

    if (!this.selectedSwimlaneId.get() && swimlanes.length > 0) {
      this.selectedSwimlaneId.set(swimlanes[0]._id);
    }
  });
});

Template.restoreArchivedListToSwimlanePopup.helpers({
  availableSwimlanes() {
    const listData = Template.currentData() || {};
    const list = Lists.findOne(listData._id);
    if (!list) return [];

    return ReactiveCache.getSwimlanes(
      {
        boardId: list.boardId,
        archived: false,
      },
      {
        sort: { sort: 1, title: 1 },
      },
    ) || [];
  },

  isSelectedSwimlane(swimlaneId) {
    return Template.instance().selectedSwimlaneId.get() === swimlaneId;
  },
});

Template.restoreArchivedListToSwimlanePopup.events({
  'change .js-select-restore-target-swimlane'(evt, tpl) {
    tpl.selectedSwimlaneId.set(evt.currentTarget.value);
  },

  async 'click .js-restore-list-to-swimlane'(evt, tpl) {
    evt.preventDefault();
    const listData = Template.currentData() || {};
    const list = Lists.findOne(listData._id);
    if (!list) {
      Popup.back();
      return;
    }

    const swimlaneId = tpl.selectedSwimlaneId.get() || evt.currentTarget
      .closest('.js-pop-over')
      ?.querySelector('.js-select-restore-target-swimlane')
      ?.value;
    if (!swimlaneId) {
      return;
    }

    const swimlane = Swimlanes.findOne(swimlaneId);
    if (!swimlane) {
      return;
    }

    await Lists.updateAsync(list._id, {
      $set: {
        swimlaneId,
      },
    });
    await list.restore();
    Popup.back();
  },
});

