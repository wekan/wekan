import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';

//archivedRequested = false;
const subManager = new SubsManager();

BlazeComponent.extendComponent({
  onCreated() {
    this.isArchiveReady = new ReactiveVar(false);

    // The pattern we use to manually handle data loading is described here:
    // https://kadira.io/academy/meteor-routing-guide/content/subscriptions-and-data-management/using-subs-manager
    // XXX The boardId should be readed from some sort the component "props",
    // unfortunatly, Blaze doesn't have this notion.
    this.autorun(() => {
      const currentBoardId = Session.get('currentBoard');
      if (!currentBoardId) return;
      const handle = subManager.subscribe('board', currentBoardId, true);
      //archivedRequested = true;
      Tracker.nonreactive(() => {
        Tracker.autorun(() => {
          this.isArchiveReady.set(handle.ready());
        });
      });
    });
  },

  tabs() {
    return [
      { name: TAPi18n.__('cards'), slug: 'cards' },
      { name: TAPi18n.__('lists'), slug: 'lists' },
      { name: TAPi18n.__('swimlanes'), slug: 'swimlanes' },
    ];
  },

  archivedCards() {
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
  },

  archivedLists() {
    return ReactiveCache.getLists(
      {
        archived: true,
        boardId: Session.get('currentBoard'),
      },
      {
        sort: { archivedAt: -1, modifiedAt: -1 },
      },
    );
  },

  archivedSwimlanes() {
    return ReactiveCache.getSwimlanes(
      {
        archived: true,
        boardId: Session.get('currentBoard'),
      },
      {
        sort: { archivedAt: -1, modifiedAt: -1 },
      },
    );
  },

  cardIsInArchivedList() {
    return this.currentData().list().archived;
  },

  onRendered() {
    // XXX We should support dragging a card from the sidebar to the board
  },

  events() {
    return [
      {
        async 'click .js-restore-card'() {
          const card = this.currentData();
          if (card.canBeRestored()) {
            await card.restore();
          }
        },
        async 'click .js-restore-all-cards'() {
          for (const card of this.archivedCards()) {
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
          for (const card of this.archivedCards()) {
            await Cards.removeAsync(card._id);
          }
          Popup.back();
        }),

        async 'click .js-restore-list'() {
          const list = this.currentData();
          await list.restore();
        },
        async 'click .js-restore-all-lists'() {
          for (const list of this.archivedLists()) {
            await list.restore();
          }
        },

        'click .js-delete-list': Popup.afterConfirm('listDelete', async function() {
          await this.remove();
          Popup.back();
        }),
        'click .js-delete-all-lists': Popup.afterConfirm('listDelete', async () => {
          for (const list of this.archivedLists()) {
            await list.remove();
          }
          Popup.back();
        }),

        async 'click .js-restore-swimlane'() {
          const swimlane = this.currentData();
          await swimlane.restore();
        },
        async 'click .js-restore-all-swimlanes'() {
          for (const swimlane of this.archivedSwimlanes()) {
            await swimlane.restore();
          }
        },

        'click .js-delete-swimlane': Popup.afterConfirm(
          'swimlaneDelete',
          async function() {
            await this.remove();
            Popup.back();
          },
        ),
        'click .js-delete-all-swimlanes': Popup.afterConfirm(
          'swimlaneDelete',
          async () => {
            for (const swimlane of this.archivedSwimlanes()) {
              await swimlane.remove();
            }
            Popup.back();
          },
        ),
      },
    ];
  },
}).register('archivesSidebar');

Template.archivesSidebar.helpers({
  isBoardAdmin() {
    return ReactiveCache.getCurrentUser().isBoardAdmin();
  },
  isWorker() {
    const currentBoard = Utils.getCurrentBoard();
    return (
      !currentBoard.hasAdmin(this.userId) && currentBoard.hasWorker(this.userId)
    );
  },
});
