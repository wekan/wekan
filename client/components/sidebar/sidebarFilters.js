BlazeComponent.extendComponent({
  template() {
    return 'filterSidebar';
  },

  events() {
    return [{
      'click .js-toggle-label-filter'(evt) {
        evt.preventDefault();
        Filter.labelIds.toogle(this.currentData()._id);
        Filter.resetExceptions();
      },
      'click .js-toogle-member-filter'(evt) {
        evt.preventDefault();
        Filter.members.toogle(this.currentData()._id);
        Filter.resetExceptions();
      },
      'click .js-clear-all'(evt) {
        evt.preventDefault();
        Filter.reset();
      },
      'click .js-filter-to-selection'(evt) {
        evt.preventDefault();
        const selectedCards = Cards.find(Filter.mongoSelector()).map((c) => {
          return c._id;
        });
        MultiSelection.add(selectedCards);
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
      'click .js-toogle-member-multiselection'(evt) {
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
