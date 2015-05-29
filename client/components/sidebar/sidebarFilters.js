BlazeComponent.extendComponent({
  template: function() {
    return 'filterSidebar';
  },

  events: function() {
    return [{
      'click .js-toggle-label-filter': function(event) {
        Filter.labelIds.toogle(this._id);
        Filter.resetExceptions();
        event.preventDefault();
      },
      'click .js-toogle-member-filter': function(event) {
        Filter.members.toogle(this._id);
        Filter.resetExceptions();
        event.preventDefault();
      },
      'click .js-clear-all': function(event) {
        Filter.reset();
        event.preventDefault();
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
      'click .js-toggle-label-multiselection': function(evt, tpl) {
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
          return popup.call(this.currentData(), evt, tpl);
        }

        var query = {};
        query[operation] = {
          labelIds: labelId
        };
        updateSelectedCards(query);
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
