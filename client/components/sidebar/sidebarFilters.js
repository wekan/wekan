BlazeComponent.extendComponent({
  template: function() {
    return 'filterSidebar';
  },

  events: function() {
    return [{
      'click .js-toggle-label-filter': function(evt) {
        evt.preventDefault();
        Filter.labelIds.toogle(this.currentData()._id);
        Filter.resetExceptions();
      },
      'click .js-toogle-member-filter': function(evt) {
        evt.preventDefault();
        Filter.members.toogle(this.currentData()._id);
        Filter.resetExceptions();
      },
      'click .js-clear-all': function(evt) {
        evt.preventDefault();
        Filter.reset();
      },
      'click .js-filter-to-selection': function(evt) {
        evt.preventDefault();
        var selectedCards = Cards.find(Filter.mongoSelector()).map(function(c) {
          return c._id;
        });
        MultiSelection.add(selectedCards);
      }
    }];
  }
}).register('filterSidebar');

var updateSelectedCards = function(query) {
  Cards.find(MultiSelection.getMongoSelector()).forEach(function(card) {
    Cards.update(card._id, query);
  });
};

BlazeComponent.extendComponent({
  template: function() {
    return 'multiselectionSidebar';
  },

  mapSelection: function(kind, _id) {
    return Cards.find(MultiSelection.getMongoSelector()).map(function(card) {
      var methodName = kind === 'label' ? 'hasLabel' : 'isAssigned';
      return card[methodName](_id);
    });
  },

  allSelectedElementHave: function(kind, _id) {
    if (MultiSelection.isEmpty())
      return false;
    else
      return _.every(this.mapSelection(kind, _id));
  },

  someSelectedElementHave: function(kind, _id) {
    if (MultiSelection.isEmpty())
      return false;
    else
      return _.some(this.mapSelection(kind, _id));
  },

  events: function() {
    return [{
      'click .js-toggle-label-multiselection': function(evt) {
        var labelId = this.currentData()._id;
        var mappedSelection = this.mapSelection('label', labelId);
        var operation;
        if (_.every(mappedSelection))
          operation = '$pull';
        else if (_.every(mappedSelection, function(bool) { return ! bool; }))
          operation = '$addToSet';
        else {
          var popup = Popup.open('disambiguateMultiLabel');
          // XXX We need to have a better integration between the popup and the
          // UI components systems.
          return popup.call(this.currentData(), evt);
        }

        var query = {};
        query[operation] = {
          labelIds: labelId
        };
        updateSelectedCards(query);
      },
      'click .js-toogle-member-multiselection': function(evt) {
        var memberId = this.currentData()._id;
        var mappedSelection = this.mapSelection('member', memberId);
        var operation;
        if (_.every(mappedSelection))
          operation = '$pull';
        else if (_.every(mappedSelection, function(bool) { return ! bool; }))
          operation = '$addToSet';
        else {
          var popup = Popup.open('disambiguateMultiMember');
          // XXX We need to have a better integration between the popup and the
          // UI components systems.
          return popup.call(this.currentData(), evt);
        }

        var query = {};
        query[operation] = {
          members: memberId
        };
        updateSelectedCards(query);
      },
      'click .js-archive-selection': function() {
        updateSelectedCards({$set: {archived: true}});
      }
    }];
  }
}).register('multiselectionSidebar');

Template.disambiguateMultiLabelPopup.events({
  'click .js-remove-label': function() {
    updateSelectedCards({$pull: {labelIds: this._id}});
    Popup.close();
  },
  'click .js-add-label': function() {
    updateSelectedCards({$addToSet: {labelIds: this._id}});
    Popup.close();
  }
});

Template.disambiguateMultiMemberPopup.events({
  'click .js-unassign-member': function() {
    updateSelectedCards({$pull: {members: this._id}});
    Popup.close();
  },
  'click .js-assign-member': function() {
    updateSelectedCards({$addToSet: {members: this._id}});
    Popup.close();
  }
});

BlazeComponent.extendComponent({
  template: function() {
    return 'boardsearchSidebar';
  },

  events: function() {
    return [{
      'keyup .js-search-text,mouseup .js-search-text': function(evt) {
        var text = this.find('.js-search-text').value;
        Session.set('currentBoardSearchText', text);
        // if( text )
        // {
        //   var boardId = Session.get('currentBoard');
        //   if (boardId) {
        //     board = Boards.findOne(boardId);
        //     for( var j=0;j++;j<board.lists.length )
        //     {
        //       var list = board.lists[j];

        //       var slector = {
        //         listId: this._id,
        //         archived: false
        //       };
        //       list.cards = Cards.find(Filter.mongoSelector(slector));
        //       for( var i=list.cards.length-1;i--;i>=0)
        //       {
                
        //         if( list.cards[i].title.indexOf(text) > 0 )
        //           list.cards.splice(i,1); 
                 
        //       }  
        //     }
            
        //   }  
        // }
        
        
      //   evt.preventDefault();
      //   Filter.labelIds.toogle(this.currentData()._id);
      //   Filter.resetExceptions();
       }
    }];
  }
}).register('boardsearchSidebar');