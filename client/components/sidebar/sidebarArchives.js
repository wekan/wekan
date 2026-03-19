import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';

const ARCHIVE_PAGE_SIZE = 30;
const ARCHIVE_SCROLL_THRESHOLD_PX = 120;

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
  this.archivedCardsLimit = new ReactiveVar(ARCHIVE_PAGE_SIZE);
  this.isLoadingMoreCards = false;

  this.autorun(() => {
    const currentBoardId = Session.get('currentBoard');
    if (!currentBoardId) return;
    const currentLimit = this.archivedCardsLimit.get();
    const handle = this.subscribe('archiveSidebar', currentBoardId, currentLimit);
    this.isArchiveReady.set(handle.ready());
    if (handle.ready()) {
      this.isLoadingMoreCards = false;
    }
  });
});

Template.archivesSidebar.onRendered(function () {
  const container = this.find('.js-board-sidebar-content');
  if (!container) return;

  this.loadMoreArchivedCardsOnScroll = _.throttle(() => {
    if (this.isLoadingMoreCards || !this.isArchiveReady.get()) return;

    const nearBottom =
      container.scrollTop + container.clientHeight >=
      container.scrollHeight - ARCHIVE_SCROLL_THRESHOLD_PX;
    if (!nearBottom) return;

    const loadedCardCount = getArchivedCards().length;
    const currentLimit = this.archivedCardsLimit.get();

    // If there are fewer cards than requested, we've likely reached the end.
    if (loadedCardCount < currentLimit) return;

    this.isLoadingMoreCards = true;
    this.archivedCardsLimit.set(currentLimit + ARCHIVE_PAGE_SIZE);
  }, 200);

  container.addEventListener('scroll', this.loadMoreArchivedCardsOnScroll);
});

Template.archivesSidebar.onDestroyed(function() {
  const container = this.find('.js-board-sidebar-content');
  if (container && this.loadMoreArchivedCardsOnScroll) {
    container.removeEventListener('scroll', this.loadMoreArchivedCardsOnScroll);
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
