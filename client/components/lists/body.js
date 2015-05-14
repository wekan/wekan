BlazeComponent.extendComponent({
  template: function() {
    return 'listBody';
  },

  isSelected: function() {
    return Session.equals('currentCard', this.currentData()._id);
  },

  addCard: function(evt) {
    evt.preventDefault();
    var textarea = $(evt.currentTarget).find('textarea');
    var title = textarea.val();
    var position = this.currentData().position;
    var sortIndex;
    if (position === 'top') {
      sortIndex = Utils.getSortIndex(null, this.find('.js-minicard:first'));
    } else if (position === 'bottom') {
      sortIndex = Utils.getSortIndex(this.find('.js-minicard:last'), null);
    }

    // Clear the form in-memory cache
    // var inputCacheKey = "addCard-" + this.listId;
    // InputsCache.set(inputCacheKey, '');

    // title trim if not empty then
    if ($.trim(title)) {
      Cards.insert({
        title: title,
        listId: this.data()._id,
        boardId: this.data().board()._id,
        sort: sortIndex
      }, function(err, _id) {
        // In case the filter is active we need to add the newly
        // inserted card in the list of exceptions -- cards that are
        // not filtered. Otherwise the card will disappear instantly.
        // See https://github.com/libreboard/libreboard/issues/80
        Filter.addException(_id);
      });

      // We keep the form opened, empty it, and scroll to it.
      textarea.val('').focus();
      Utils.Scroll(this.find('.js-minicards')).top(1000, true);
    }
  },

  events: function() {
    return [{
      submit: this.addCard,
      'keydown form textarea': function(evt) {
        // Pressing Enter should submit the card
        if (evt.keyCode === 13) {
          evt.preventDefault();
          $(evt.currentTarget).parents('form:first').submit();

        // Pressing Tab should open the form of the next column, and Maj+Tab go
        // in the reverse order
        } else if (evt.keyCode === 9) {
          evt.preventDefault();
          var isReverse = evt.shiftKey;
          var list = $('#js-list-' + this.data()._id);
          var nextList = list[isReverse ? 'prev' : 'next']('.js-list').get(0) ||
            $('.js-list:' + (isReverse ? 'last' : 'first')).get(0);
          var nextListComponent =
                                BlazeComponent.getComponentForElement(nextList);

          // XXX Get the real position
          var position = 'bottom';
          nextListComponent.openForm({position: position});
        }
      }
    }];
  }
}).register('listBody');
