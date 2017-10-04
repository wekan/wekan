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
    return Lists.findOne(this.data()._id, { 'wipLimit.enabled': 1 }).wipLimit.enabled;
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

Template.setWipLimitPopup.helpers({
  one() {
    //console.log(this)
    //console.log(Template.instance())
  }
});

BlazeComponent.extendComponent({
  onCreated() {
    this.wipEnabled = new ReactiveVar(Template.currentData().wipLimit.enabled);
  },

  toggleWipEnabled() {
    const list = Lists.findOne(this.data()._id);
    list.wipLimit.enabled ? list.setWipLimitDisabled() : list.setWipLimitEnabled()
  },

  isWipLimitEnabled() {
    return Lists.findOne(this.data()._id, { 'wipLimit.enabled': 1 }).wipLimit.enabled;
  },
  events() {
    return [{
      'click .js-enable-wip-limit'(_, instance) {
        //By default wipLimit.enabled is false or undefined. First click will always be to enable wip limiting
        this.wipEnabled.set(!this.wipEnabled.get());
        //console.log(Template.parentData(2))
        //Template.parentData(2).data.toggleWipLimit(!Template.currentData().wipLimit.enabled); //If wipLimit.enabled is not yet definied, the negation of "undefined" is "true"
        this.toggleWipEnabled()
      },
      'click .wip-limit-apply'(_, instance) {
        const list = Template.currentData();
        const limit = Template.instance().$('.wip-limit-value').val();

        if(limit < list.allCards().count()){
          Template.instance().$('.wip-limit-error').click();
        } else {
          list.setWipLimit(limit);
        }
      },
      'click .wip-limit-error': Popup.open('wipLimitError'),
    }];
  },
}).register('setWipLimitPopup');


/*
Template.setWipLimitPopup.helpers({
  isWipLimitEnabled(instance) {
    console.log(this);
    console.log(Template.currentData());
    console.log(instance);
    return Template.currentData().wipLimit.enabled;
  },
});

Template.setWipLimitPopup.events({
  'click .js-enable-wip-limit'(_, instance) {
    //By default wipLimit.enabled is false or undefined. First click will always be to enable wip limiting
    instance.wipEnabled.set(!instance.wipEnabled.get())
  //  list.toggleWipLimit(!list.wipLimit.enabled); //If wipLimit.enabled is not yet definied, the negation of "undefined" is "true"
  },
  'click .wip-limit-apply'(_, instance) {
    const limit = instance.$('.wip-limit-value').val();
    if(limit < this.allCards().count()){
      instance.$('.wip-limit-error').click(); //open popup with invisible button click
      return;
    }
    this.setWipLimit(limit);
  },
  'click .wip-limit-error': Popup.open('wipLimitError'),
});*/

Template.listMorePopup.events({
  'click .js-delete': Popup.afterConfirm('listDelete', function () {
    Popup.close();
    this.allCards().map((card) => Cards.remove(card._id));
    Lists.remove(this._id);
    Utils.goBoardId(this.boardId);
  }),
});
