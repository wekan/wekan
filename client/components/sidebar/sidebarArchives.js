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
        'click .js-restore-card'() {
          const card = this.currentData();
          if (card.canBeRestored()) {
            card.restore();
          }
        },
        'click .js-restore-all-cards'() {
          this.archivedCards().forEach(card => {
            if (card.canBeRestored()) {
              card.restore();
            }
          });
        },

        'click .js-delete-card': Popup.afterConfirm('cardDelete', function() {
          const cardId = this._id;
          Cards.remove(cardId);
          Popup.back();
        }),
        'click .js-delete-all-cards': Popup.afterConfirm('cardDelete', () => {
          this.archivedCards().forEach(card => {
            Cards.remove(card._id);
          });
          Popup.back();
        }),

        'click .js-restore-list'() {
          const list = this.currentData();
          list.restore();
        },
        'click .js-restore-all-lists'() {
          this.archivedLists().forEach(list => {
            list.restore();
          });
        },

        'click .js-delete-list': Popup.afterConfirm('listDelete', function() {
          this.remove();
          Popup.back();
        }),
        'click .js-delete-all-lists': Popup.afterConfirm('listDelete', () => {
          this.archivedLists().forEach(list => {
            list.remove();
          });
          Popup.back();
        }),

        'click .js-restore-swimlane'() {
          const swimlane = this.currentData();
          swimlane.restore();
        },
        'click .js-restore-all-swimlanes'() {
          this.archivedSwimlanes().forEach(swimlane => {
            swimlane.restore();
          });
        },

        'click .js-delete-swimlane': Popup.afterConfirm(
          'swimlaneDelete',
          function() {
            this.remove();
            Popup.back();
          },
        ),
        'click .js-delete-all-swimlanes': Popup.afterConfirm(
          'swimlaneDelete',
          () => {
            this.archivedSwimlanes().forEach(swimlane => {
              swimlane.remove();
            });
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
