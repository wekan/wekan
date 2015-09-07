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
    return Cards.find({ archived: true });
  },

  archivedLists() {
    return Lists.find({ archived: true });
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
        const cardId = this.currentData()._id;
        Cards.update(cardId, {$set: {archived: false}});
      },
      'click .js-delete-card': Popup.afterConfirm('cardDelete', function() {
        const cardId = this._id;
        Cards.remove(cardId);
        Popup.close();
      }),
      'click .js-restore-list'() {
        const listId = this.currentData()._id;
        Lists.update(listId, {$set: {archived: false}});
      },
    }];
  },
}).register('archivesSidebar');
