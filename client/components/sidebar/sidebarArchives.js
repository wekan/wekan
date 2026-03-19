import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';

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
    const tab = this.activeTab.get();
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
      // Reset limits when switching tabs so fresh data is loaded
      t.archivedCardsLimit.set(ARCHIVE_PAGE_SIZE);
      t.archivedListsLimit.set(ARCHIVE_PAGE_SIZE);
      t.archivedSwimlanesLimit.set(ARCHIVE_PAGE_SIZE);
      t.isLoadingMore = false;
    }
  },

  async 'click .js-restore-card'() {
    const card = Template.currentData();
    if (card.canBeRestored()) {
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

  async 'click .js-restore-list'() {
    const data = Template.currentData();
    const list = Lists.findOne(data._id) || data;
    await list.restore();
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

  async 'click .js-restore-swimlane'() {
    const data = Template.currentData();
    const swimlane = Swimlanes.findOne(data._id) || data;
    await swimlane.restore();
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

