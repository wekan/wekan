BlazeComponent.extendComponent({
  canSeeAddCard() {
    const list = Template.currentData();
    return !list.getWipLimit('enabled') || list.getWipLimit('soft') || !this.reachedWipLimit();
  },

  editTitle(evt) {
    evt.preventDefault();
    const newTitle = this.childComponents('inlinedForm')[0].getValue().trim();
    const list = this.currentData();
    if (newTitle) {
      list.rename(newTitle.trim());
    }
  },

  isWatching() {
    const list = this.currentData();
    return list.findWatcher(Meteor.userId());
  },

  limitToShowCardsCount() {
    return Meteor.user().getLimitToShowCardsCount();
  },

  reachedWipLimit() {
    const list = Template.currentData();
    return list.getWipLimit('enabled') && list.getWipLimit('value') <= list.cards().count();
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
      'click .js-unselect-list'() {
        Session.set('currentList', null);
      },
      submit: this.editTitle,
    }];
  },
}).register('listHeader');

Template.listActionPopup.helpers({
  isWipLimitEnabled() {
    return Template.currentData().getWipLimit('enabled');
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
  applyWipLimit() {
    const list = Template.currentData();
    const limit = parseInt(Template.instance().$('.wip-limit-value').val(), 10);

    if(limit < list.cards().count() && !list.getWipLimit('soft')){
      Template.instance().$('.wip-limit-error').click();
    } else {
      Meteor.call('applyWipLimit', list._id, limit);
      Popup.back();
    }
  },

  enableSoftLimit() {
    const list = Template.currentData();

    if(list.getWipLimit('soft') && list.getWipLimit('value') < list.cards().count()){
      list.setWipLimit(list.cards().count());
    }
    Meteor.call('enableSoftLimit', Template.currentData()._id);
  },

  enableWipLimit() {
    const list = Template.currentData();
    // Prevent user from using previously stored wipLimit.value if it is less than the current number of cards in the list
    if(!list.getWipLimit('enabled') && list.getWipLimit('value') < list.cards().count()){
      list.setWipLimit(list.cards().count());
    }
    Meteor.call('enableWipLimit', list._id);
  },

  isWipLimitSoft() {
    return Template.currentData().getWipLimit('soft');
  },

  isWipLimitEnabled() {
    return Template.currentData().getWipLimit('enabled');
  },

  wipLimitValue(){
    return Template.currentData().getWipLimit('value');
  },

  events() {
    return [{
      'click .js-enable-wip-limit': this.enableWipLimit,
      'click .wip-limit-apply': this.applyWipLimit,
      'click .wip-limit-error': Popup.open('wipLimitError'),
      'click .materialCheckBox': this.enableSoftLimit,
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
