
var getCardsBetween = function(idA, idB) {

  var pluckId = function(doc) {
    return doc._id;
  };

  var getListsStrictlyBetween = function(id1, id2) {
    return Lists.find({
      $and: [
        { sort: { $gt: Lists.findOne(id1).sort } },
        { sort: { $lt: Lists.findOne(id2).sort } }
      ],
      archived: false
    }).map(pluckId);
  };

  var cards = _.sortBy([Cards.findOne(idA), Cards.findOne(idB)], function(c) {
    return c.sort;
  });

  var selector;
  if (cards[0].listId === cards[1].listId) {
    selector = {
      listId: cards[0].listId,
      sort: {
        $gte: cards[0].sort,
        $lte: cards[1].sort
      },
      archived: false
    };
  } else {
    selector = {
      $or: [{
        listId: cards[0].listId,
        sort: { $lte: cards[0].sort }
      }, {
        listId: {
          $in: getListsStrictlyBetween(cards[0].listId, cards[1].listId)
        }
      }, {
        listId: cards[1].listId,
        sort: { $gte: cards[1].sort }
      }],
      archived: false
    };
  }

  return Cards.find(Filter.mongoSelector(selector)).map(pluckId);
};

MultiSelection = {
  sidebarView: 'multiselection',

  _selectedCards: new ReactiveVar([]),

  _isActive: new ReactiveVar(false),

  startRangeCardId: null,

  reset: function() {
    this._selectedCards.set([]);
  },

  getMongoSelector: function() {
    return Filter.mongoSelector({
      _id: { $in: this._selectedCards.get() }
    });
  },

  isActive: function() {
    return this._isActive.get();
  },

  isEmpty: function() {
    return this._selectedCards.get().length === 0;
  },

  activate: function() {
    if (! this.isActive()) {
      EscapeActions.executeLowerThan('detailsPane');
      this._isActive.set(true);
      Sidebar.setView(this.sidebarView);
      Tracker.flush();
    }
  },

  disable: function() {
    if (this.isActive()) {
      this._isActive.set(false);
      if (Sidebar && Sidebar.getView() === this.sidebarView) {
        Sidebar.setView();
      }
    }
  },

  add: function(cardIds) {
    return this.toogle(cardIds, { add: true, remove: false });
  },

  remove: function(cardIds) {
    return this.toogle(cardIds, { add: false, remove: true });
  },

  toogleRange: function(cardId) {
    var selectedCards = this._selectedCards.get();
    var startRange;
    this.reset();
    if (! this.isActive() || selectedCards.length === 0) {
      this.toogle(cardId);
    } else {
      startRange = selectedCards[selectedCards.length - 1];
      this.toogle(getCardsBetween(startRange, cardId));
    }
  },

  toogle: function(cardIds, options) {
    var self = this;
    cardIds = _.isString(cardIds) ? [cardIds] : cardIds;
    options = _.extend({
      add: true,
      remove: true
    }, options || {});

    if (! self.isActive()) {
      self.reset();
      self.activate();
    }

    var selectedCards = self._selectedCards.get();

    _.each(cardIds, function(cardId) {
      var indexOfCard = selectedCards.indexOf(cardId);

      if (options.remove && indexOfCard > -1)
        selectedCards.splice(indexOfCard, 1);

      else if (options.add)
        selectedCards.push(cardId);
    });

    self._selectedCards.set(selectedCards);
  },

  isSelected: function(cardId) {
    return this._selectedCards.get().indexOf(cardId) > -1;
  }
};

Blaze.registerHelper('MultiSelection', MultiSelection);

EscapeActions.register('multiselection-disable',
  function() { MultiSelection.disable(); },
  function() { return MultiSelection.isActive(); }
);

EscapeActions.register('multiselection-reset',
  function() { MultiSelection.reset(); }
);
