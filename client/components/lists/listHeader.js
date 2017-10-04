BlazeComponent.extendComponent({
  editTitle(evt) {
    evt.preventDefault();
    const newTitle = this.childComponents('inlinedForm')[0].getValue().trim();
    const list = this.currentData();
    if (newTitle) {
      list.rename(newTitle.trim());
    }
  },

  isWipLimitEnabled() {
    const limit = this.currentData().wipLimit
    return limit.enabled && limit.value > 0;
  },

  isWatching() {
    const list = this.currentData();
    return list.findWatcher(Meteor.userId());
  },

  limitToShowCardsCount() {
    return Meteor.user().getLimitToShowCardsCount();
  },

  showCardsCountForList(count) {
    return count > this.limitToShowCardsCount();
  },

  events() {
    return [{
      'click .js-open-list-menu': Popup.open('listAction'),
      'click .js-add-card' () {
        const listDom = document.getElementById(`js-list-${this.currentData()._id}`);
        const listComponent = BlazeComponent.getComponentForElement(listDom);
        listComponent.openForm({
          position: 'top',
        });
      },
      submit: this.editTitle,
    }];
  },
}).register('listHeader');

Template.listActionPopup.helpers({
  isWipLimitEnabled() {
    const prevState = Template.parentData(4).stack[0].dataContext.wipEnableState;
    // If user was already inside setWipLimitPopup, return previous state. Popup stack not reacting to database mutations
    if(typeof prevState !== "undefined") {
      return prevState;
    }
    return Template.currentData().wipLimit.enabled;
  },

  isWatching() {
    return this.findWatcher(Meteor.userId());
  },
});

Template.listActionPopup.events({
  'click .js-list-subscribe' () {},
  'click .js-select-cards' () {
    const cardIds = this.allCards().map((card) => card._id);
    MultiSelection.add(cardIds);
    Popup.close();
  },
  'click .js-toggle-watch-list' () {
    const currentList = this;
    const level = currentList.findWatcher(Meteor.userId()) ? null : 'watching';
    Meteor.call('watch', 'list', currentList._id, level, (err, ret) => {
      if (!err && ret) Popup.close();
    });
  },
  'click .js-close-list' (evt) {
    evt.preventDefault();
    this.archive();
    Popup.close();
  },
  'click .js-set-wip-limit': Popup.open('setWipLimit'),
  'click .js-more': Popup.open('listMore'),
});

BlazeComponent.extendComponent({
  onCreated() {
    const prevState = Template.parentData(4).stack[0].dataContext.wipEnableState;
    // Check if the user as already opened this popup before and retrieve previous state
    // This check is necessary due to the fact that database mutations inside popups are not reactive inside the popup stack.
    //The use of ReactiveVar is due to the same reason.
    if(typeof prevState !== "undefined") {
      this.wipEnabled = new ReactiveVar(prevState)
    } else {
      this.wipEnabled = new ReactiveVar(Template.currentData().wipLimit.enabled);
    }
  },

  onDestroyed() {
    // Save current wipEnabled state in the first element of the popup stack to maintain UI coherence if user returns to popup
    Template.parentData(4).stack[0].dataContext.wipEnableState = this.wipEnabled.get();
  },

  applyWipLimit() {
    const list = Template.currentData();
    const limit = Template.instance().$('.wip-limit-value').val();

    if(limit < list.cards().count()){
      Template.instance().$('.wip-limit-error').click();
    } else {
      list.setWipLimit(limit);
    }
  },

  enableWipLimit() {
    const list = Template.currentData();
    // Prevent user from using previously stored wipLimit.value if it is less than the current number of cards in the list
    if(!list.wipLimit.enabled && list.wipLimit.value < list.cards().count()){
      list.setWipLimit(list.cards().count());
    }

    this.wipEnabled.set(!this.wipEnabled.get()); //If wipLimit.enabled is not yet definied, the negation of "undefined" is "true"
    list.toggleWipLimit(this.wipEnabled.get());
  },

  events() {
    return [{
      'click .js-enable-wip-limit': this.enableWipLimit,
      'click .wip-limit-apply': this.applyWipLimit,
      'click .wip-limit-error': Popup.open('wipLimitError'),
    }];
  },
}).register('setWipLimitPopup');

Template.listMorePopup.events({
  'click .js-delete': Popup.afterConfirm('listDelete', function () {
    Popup.close();
    this.allCards().map((card) => Cards.remove(card._id));
    Lists.remove(this._id);
    Utils.goBoardId(this.boardId);
  }),
});
