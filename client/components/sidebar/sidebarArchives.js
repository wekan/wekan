BlazeComponent.extendComponent({
  template() {
    return 'archivesSidebar';
  },

  tabs() {
    return [
      { name: TAPi18n.__('cards'), slug: 'cards' },
      { name: TAPi18n.__('lists'), slug: 'lists' },
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
        card.restore();
      },
      'click .js-delete-card': Popup.afterConfirm('cardDelete', function() {
        const cardId = this._id;
        Cards.remove(cardId);
        Popup.close();
      }),
      'click .js-restore-list'() {
        const list = this.currentData();
        list.restore();
      },
    }];
  },
}).register('archivesSidebar');
