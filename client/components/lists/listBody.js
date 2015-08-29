BlazeComponent.extendComponent({
  template: function() {
    return 'listBody';
  },

  mixins: function() {
    return [Mixins.PerfectScrollbar];
  },

  openForm: function(options) {
    options = options || {};
    options.position = options.position || 'top';

    var forms = this.componentChildren('inlinedForm');
    var form = _.find(forms, function(component) {
      return component.data().position === options.position;
    });
    if (! form && forms.length > 0) {
      form = forms[0];
    }
    form.open();
  },

  addCard: function(evt) {
    evt.preventDefault();
    var textarea = $(evt.currentTarget).find('textarea');
    var title = textarea.val();
    var position = Blaze.getData(evt.currentTarget).position;
    var sortIndex;
    var firstCard = this.find('.js-minicard:first');
    var lastCard = this.find('.js-minicard:last');
    if (position === 'top') {
      sortIndex = Utils.calculateIndex(null, firstCard).base;
    } else if (position === 'bottom') {
      sortIndex = Utils.calculateIndex(lastCard, null).base;
    }

    if ($.trim(title)) {
      var _id = Cards.insert({
        title: title,
        listId: this.data()._id,
        boardId: this.data().board()._id,
        sort: sortIndex
      });
      // In case the filter is active we need to add the newly inserted card in
      // the list of exceptions -- cards that are not filtered. Otherwise the
      // card will disappear instantly.
      // See https://github.com/wekan/wekan/issues/80
      Filter.addException(_id);

      // We keep the form opened, empty it, and scroll to it.
      textarea.val('').focus();
      if (position === 'bottom') {
        this.scrollToBottom();
      }
    }
  },

  scrollToBottom: function() {
    var container = this.firstNode();
    $(container).animate({
      scrollTop: container.scrollHeight
    });
  },

  clickOnMiniCard: function(evt) {
    if (MultiSelection.isActive() || evt.shiftKey) {
      evt.stopImmediatePropagation();
      evt.preventDefault();
      var methodName = evt.shiftKey ? 'toogleRange' : 'toogle';
      MultiSelection[methodName](this.currentData()._id);

    // If the card is already selected, we want to de-select it.
    // XXX We should probably modify the minicard href attribute instead of
    // overwriting the event in case the card is already selected.
    } else if (Session.equals('currentCard', this.currentData()._id)) {
      evt.stopImmediatePropagation();
      evt.preventDefault();
      Utils.goBoardId(Session.get('currentBoard'));
    }
  },

  cardIsSelected: function() {
    return Session.equals('currentCard', this.currentData()._id);
  },

  toggleMultiSelection: function(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    MultiSelection.toogle(this.currentData()._id);
  },

  events: function() {
    return [{
      'click .js-minicard': this.clickOnMiniCard,
      'click .js-toggle-multi-selection': this.toggleMultiSelection,
      'click .open-minicard-composer': this.scrollToBottom,
      submit: this.addCard
    }];
  }
}).register('listBody');

BlazeComponent.extendComponent({
  template: function() {
    return 'addCardForm';
  },

  pressKey: function(evt) {
    // Pressing Enter should submit the card
    if (evt.keyCode === 13) {
      evt.preventDefault();
      var $form = $(evt.currentTarget).closest('form');
      // XXX For some reason $form.submit() does not work (it's probably a bug
      // of blaze-component related to the fact that the submit event is non-
      // bubbling). This is why we click on the submit button instead -- which
      // work.
      $form.find('button[type=submit]').click();

    // Pressing Tab should open the form of the next column, and Maj+Tab go
    // in the reverse order
    } else if (evt.keyCode === 9) {
      evt.preventDefault();
      var isReverse = evt.shiftKey;
      var list = $('#js-list-' + this.data().listId);
      var listSelector = '.js-list:not(.js-list-composer)';
      var nextList = list[isReverse ? 'prev' : 'next'](listSelector).get(0);
      // If there is no next list, loop back to the beginning.
      if (! nextList) {
        nextList = $(listSelector + (isReverse ? ':last' : ':first')).get(0);
      }

      BlazeComponent.getComponentForElement(nextList).openForm({
        position:this.data().position
      });
    }
  },

  events: function() {
    return [{
      keydown: this.pressKey
    }];
  }
}).register('addCardForm');
