import { ReactiveCache } from '/imports/reactiveCache';
// Its templates first: cardDetails.js imports this file for restoreArchivedCard.
import '/client/components/sidebar/sidebarArchives.jade';
import { TAPi18n } from '/imports/i18n';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import Cards from '/models/cards';
import { Utils } from '/client/lib/utils';
import { tabIndexForKey } from '/client/lib/accessibility';
const { wipLimitBlocksRestore } = require('/models/lib/wipRestore');

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
    const user = ReactiveCache.getCurrentUser();
    return user && user.isBoardAdmin();
  },
  isWorker() {
    const currentBoard = Utils.getCurrentBoard();
    if (!currentBoard) return false;
    const userId = Meteor.userId();
    return !currentBoard.hasAdmin(userId) && currentBoard.hasWorker(userId);
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
  'keydown .tab-item'(event, template) {
    const tabs = ['cards', 'lists', 'swimlanes'];
    const current = event.currentTarget.getAttribute('data-tab');
    const currentIndex = tabs.indexOf(current);
    if (currentIndex < 0) return;
    const nextIndex = tabIndexForKey(event, currentIndex, tabs.length);
    if (nextIndex === null) return;
    event.preventDefault();
    const slug = tabs[nextIndex];
    template.activeTab.set(slug);
    Tracker.afterFlush(() => template.find(`#archive-tab-${slug}`)?.focus());
  },

  // #1504: an archived card used to have no way to open beyond the sidebar's
  // own cramped minicard preview. Reuse the SAME full card-detail popup a
  // normal board card opens (client/components/lists/listBody.js's
  // Utils.isMiniScreen() popup branch, and the cross-board myCards.js /
  // resultCard.js minicards) instead of a parallel "archived card preview" -
  // full width/height, every field, and (added alongside this) a Restore
  // action in its own action menu. Skip clicks on the Restore/Delete links
  // themselves so they keep doing their own thing rather than also opening
  // the popup underneath them.
  'click .archived-card-item .js-minicard'(evt) {
    if ($(evt.target).closest('.js-restore-card, .js-delete-card').length) {
      return;
    }
    evt.preventDefault();
    const card = Template.currentData();
    if (!card || !card._id) return;
    Session.set('popupCardId', card._id);
    Session.set('popupCardBoardId', card.boardId);
    if (!Popup.isOpen()) {
      Popup.open('cardDetails')(evt);
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

    await restoreArchivedCard(evt, card);
  },
  // Every card that has room is restored; the rest are counted and the
  // member is told, instead of being left wondering (#6772).
  async 'click .js-restore-all-cards'(evt) {
    // The link the popup opens from, kept now: after the awaits below the
    // browser has already cleared evt.currentTarget, and the popup would
    // have nothing to open against.
    const opener = evt.currentTarget;
    let skipped = 0;
    for (const card of getArchivedCards()) {
      if (card.canBeRestored()) {
        await card.restore();
      } else {
        skipped += 1;
      }
    }
    if (skipped) {
      const openFrom = { currentTarget: opener, target: opener, preventDefault() {}, stopPropagation() {} };
      Popup.open('restoreAllSkipped')(openFrom, { dataContextIfCurrentDataIsUndefined: { count: skipped } });
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

// The lists an archived card can be restored into: the board's open lists,
// less any that a hard WIP limit has filled (#6772) - offering a full list
// would only fail again.
function listsWithRoom(card) {
  const lists = ReactiveCache.getLists(
    { boardId: card.boardId, archived: false },
    { sort: { sort: 1, title: 1 } },
  ) || [];
  return lists.filter(list => !wipLimitBlocksRestore({
    enabled: list.getWipLimit('enabled'),
    soft: list.getWipLimit('soft'),
    value: list.getWipLimit('value'),
  }, list.cardsUnfiltered().length));
}

// "Restore" in the Archive sidebar and in an open archived card. A card whose
// list is gone, or whose list has reached a hard WIP limit, is restored into a
// list the member picks; it used to do nothing at all for a full list (#6772).
export async function restoreArchivedCard(evt, card) {
  const currentList = ReactiveCache.getList(card.listId);
  if (!currentList || !card.canBeRestored()) {
    Popup.open('restoreArchivedCardToList')(evt, {
      dataContextIfCurrentDataIsUndefined: { _id: card._id, wipLimitReached: !!currentList },
    });
    return false;
  }
  await card.restore();
  return true;
}

Template.restoreArchivedCardToListPopup.onCreated(function() {
  this.selectedListId = new ReactiveVar('');

  this.autorun(() => {
    const cardData = Template.currentData() || {};
    const card = Cards.findOne(cardData._id);
    if (!card) return;

    const boardLists = listsWithRoom(card);
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
    return listsWithRoom(card);
  },
  wipLimitReached() {
    return !!(Template.currentData() || {}).wipLimitReached;
  },
  currentListTitle() {
    const card = Cards.findOne((Template.currentData() || {})._id);
    const list = card && ReactiveCache.getList(card.listId);
    return list ? list.title : '';
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
