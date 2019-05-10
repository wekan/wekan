BlazeComponent.extendComponent({
  tabs() {
    return [
      { name: TAPi18n.__('cards'), slug: 'cards' },
      { name: TAPi18n.__('lists'), slug: 'lists' },
      { name: TAPi18n.__('swimlanes'), slug: 'swimlanes' },
    ];
  },

  archivedCards() {
    return Cards.find({
      archived: true,
      boardId: Session.get('currentBoard'),
    });
  },

  archivedLists() {
    return Lists.find({
      archived: true,
      boardId: Session.get('currentBoard'),
    });
  },

  archivedSwimlanes() {
    return Swimlanes.find({
      archived: true,
      boardId: Session.get('currentBoard'),
    });
  },

  cardIsInArchivedList() {
    return this.currentData().list().archived;
  },

  onRendered() {
    // XXX We should support dragging a card from the sidebar to the board
  },

  events() {
    return [{
      'click .js-restore-card'() {
        const card = this.currentData();
        if(card.canBeRestored()){
          card.restore();
        }
      },
      'click .js-restore-all-cards'() {
        this.archivedCards().forEach((card) => {
          if(card.canBeRestored()){
            card.restore();
          }
        });
      },

      'click .js-delete-card': Popup.afterConfirm('cardDelete', function() {
        const cardId = this._id;
        Cards.remove(cardId);
        Popup.close();
      }),
      'click .js-delete-all-cards': Popup.afterConfirm('cardDelete', () => {
        this.archivedCards().forEach((card) => {
          Cards.remove(card._id);
        });
        Popup.close();
      }),

      'click .js-restore-list'() {
        const list = this.currentData();
        list.restore();
      },
      'click .js-restore-all-lists'() {
        this.archivedLists().forEach((list) => {
          list.restore();
        });
      },

      'click .js-delete-list': Popup.afterConfirm('listDelete', function() {
        this.remove();
        Popup.close();
      }),
      'click .js-delete-all-lists': Popup.afterConfirm('listDelete', () => {
        this.archivedLists().forEach((list) => {
          list.remove();
        });
        Popup.close();
      }),

      'click .js-restore-swimlane'() {
        const swimlane = this.currentData();
        swimlane.restore();
      },
      'click .js-restore-all-swimlanes'() {
        this.archivedSwimlanes().forEach((swimlane) => {
          swimlane.restore();
        });
      },

      'click .js-delete-swimlane': Popup.afterConfirm('swimlaneDelete', function() {
        this.remove();
        Popup.close();
      }),
      'click .js-delete-all-swimlanes': Popup.afterConfirm('swimlaneDelete', () => {
        this.archivedSwimlanes().forEach((swimlane) => {
          swimlane.remove();
        });
        Popup.close();
      }),
    }];
  },
}).register('archivesSidebar');
