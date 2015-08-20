BlazeComponent.extendComponent({
  template: function() {
    return 'archivesSidebar';
  },

  archivedCards: function() {
    return Cards.find({archived: true});
  },

  cardIsInArchivedList: function() {
    return this.currentData().list().archived;
  },

  onRendered: function() {
    //XXX We should support dragging a card from the sidebar to the board
  },

  events: function() {
    return [{
      'click .js-restore': function() {
        var cardId = this.currentData()._id;
        Cards.update(cardId, {$set: {archived: false}});
      },
      'click .js-delete': Popup.afterConfirm('cardDelete', function() {
        var cardId = this._id;
        Cards.remove(cardId);
        Popup.close();
      })
    }];
  }
}).register('archivesSidebar');
