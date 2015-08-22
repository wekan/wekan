BlazeComponent.extendComponent({
  template: function() {
    return 'archivesSidebar';
  },

  tabs: function() {
    return [
      { name: 'Cards', slug: 'cards' },
      { name: 'Lists', slug: 'lists' }
    ]
  },

  archivedCards: function() {
    return Cards.find({ archived: true });
  },

  archivedLists: function() {
    return Lists.find({ archived: true });
  },

  cardIsInArchivedList: function() {
    return this.currentData().list().archived;
  },

  onRendered: function() {
    //XXX We should support dragging a card from the sidebar to the board
  },

  events: function() {
    return [{
      'click .js-restore-card': function() {
        var cardId = this.currentData()._id;
        Cards.update(cardId, {$set: {archived: false}});
      },
      'click .js-delete-card': Popup.afterConfirm('cardDelete', function() {
        var cardId = this._id;
        Cards.remove(cardId);
        Popup.close();
      }),
      'click .js-restore-list': function() {
        var listId = this.currentData()._id;
        Lists.update(listId, {$set: {archived: false}});
      }
    }];
  }
}).register('archivesSidebar');
