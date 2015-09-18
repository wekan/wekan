BlazeComponent.extendComponent({
  template() {
    return 'filterSidebar';
  },
  onRendered() {
    this.find('.js-search-text').value = Filter.title.get();//Session.get('currentBoardSearchText');  
  },
  events() {
    return [{
      'click .js-toggle-label-filter'(evt) {
        evt.preventDefault();
        Filter.labelIds.toggle(this.currentData()._id);
        Filter.resetExceptions();
      },
      'click .js-toggle-member-filter'(evt) {
        evt.preventDefault();
        Filter.members.toggle(this.currentData()._id);
        Filter.resetExceptions();
      },
      'click .js-clear-all'(evt) {
        evt.preventDefault();
        $('.js-search-text').val('');
        Filter.reset();
      },
      'click .js-filter-to-selection'(evt) {
        evt.preventDefault();
        const selectedCards = Cards.find(Filter.mongoSelector()).map((c) => {
          return c._id;
        });
        MultiSelection.add(selectedCards);
      },
      'keyup .js-search-text,mouseup .js-search-text': function(evt) {
        var text = this.find('.js-search-text').value;
        //Session.set('currentBoardSearchText', text);
        Filter.title.set(text);
        //if( Filter.description.checked())
        Filter.description.set(text);
       },
      'click .search-description': function(){
        Filter.description.toogleChecked()
      },
    }];
  },
}).register('filterSidebar');

function updateSelectedCards(query) {
  Cards.find(MultiSelection.getMongoSelector()).forEach((card) => {
    Cards.update(card._id, query);
  });
}

BlazeComponent.extendComponent({
  template() {
    return 'multiselectionSidebar';
  },

  mapSelection(kind, _id) {
    return Cards.find(MultiSelection.getMongoSelector()).map((card) => {
      const methodName = kind === 'label' ? 'hasLabel' : 'isAssigned';
      return card[methodName](_id);
    });
  },

  allSelectedElementHave(kind, _id) {
    if (MultiSelection.isEmpty())
      return false;
    else
      return _.every(this.mapSelection(kind, _id));
  },

  someSelectedElementHave(kind, _id) {
    if (MultiSelection.isEmpty())
      return false;
    else
      return _.some(this.mapSelection(kind, _id));
  },

  events() {
    return [{
      'click .js-toggle-label-multiselection'(evt) {
        const labelId = this.currentData()._id;
        const mappedSelection = this.mapSelection('label', labelId);
        let operation;
        if (_.every(mappedSelection))
          operation = '$pull';
        else if (_.every(mappedSelection, (bool) => !bool))
          operation = '$addToSet';
        else {
          const popup = Popup.open('disambiguateMultiLabel');
          // XXX We need to have a better integration between the popup and the
          // UI components systems.
          return popup.call(this.currentData(), evt);
        }

        updateSelectedCards({
          [operation]: {
            labelIds: labelId,
          },
        });
      },
      'click .js-toggle-member-multiselection'(evt) {
        const memberId = this.currentData()._id;
        const mappedSelection = this.mapSelection('member', memberId);
        let operation;
        if (_.every(mappedSelection))
          operation = '$pull';
        else if (_.every(mappedSelection, (bool) => !bool))
          operation = '$addToSet';
        else {
          const popup = Popup.open('disambiguateMultiMember');
          // XXX We need to have a better integration between the popup and the
          // UI components systems.
          return popup.call(this.currentData(), evt);
        }

        updateSelectedCards({
          [operation]: {
            members: memberId,
          },
        });
      },
      'click .js-archive-selection'() {
        updateSelectedCards({$set: {archived: true}});
      },
      
    }];
  },
}).register('multiselectionSidebar');

Template.disambiguateMultiLabelPopup.events({
  'click .js-remove-label'() {
    updateSelectedCards({$pull: {labelIds: this._id}});
    Popup.close();
  },
  'click .js-add-label'() {
    updateSelectedCards({$addToSet: {labelIds: this._id}});
    Popup.close();
  },
});

Template.disambiguateMultiMemberPopup.events({
  'click .js-unassign-member'() {
    updateSelectedCards({$pull: {members: this._id}});
    Popup.close();
  },
  'click .js-assign-member'() {
    updateSelectedCards({$addToSet: {members: this._id}});
    Popup.close();
  },
});

BlazeComponent.extendComponent({
  template: function() {
    return 'boardsearchSidebar';
  },
  onRendered() {
    this.find('.js-search-text').value = Session.get('currentBoardSearchText');  
  },
  events: function() {
    return [{
      'keyup .js-search-text,mouseup .js-search-text': function(evt) {
        var text = this.find('.js-search-text').value;
        Session.set('currentBoardSearchText', text);
        Filter.title.set(text);
        Filter.description.set(text);
       }
    }];
  }
}).register('boardsearchSidebar');
