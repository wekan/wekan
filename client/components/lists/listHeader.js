import { Cookies } from 'meteor/ostrio:cookies';
const cookies = new Cookies();
let listsColors;
Meteor.startup(() => {
  listsColors = Lists.simpleSchema()._schema.color.allowedValues;
});

BlazeComponent.extendComponent({
  canSeeAddCard() {
    const list = Template.currentData();
    return (
      (!list.getWipLimit('enabled') ||
        list.getWipLimit('soft') ||
        !this.reachedWipLimit()) &&
      !Meteor.user().isWorker()
    );
  },

  isBoardAdmin() {
    return Meteor.user().isBoardAdmin();
  },
  starred(check = undefined) {
    const list = Template.currentData();
    const status = list.isStarred();
    if (check === undefined) {
      // just check
      return status;
    } else {
      list.star(!status);
      return !status;
    }
  },
  editTitle(event) {
    event.preventDefault();
    const newTitle = this.childComponents('inlinedForm')[0]
      .getValue()
      .trim();
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
    const currentUser = Meteor.user();
    if (currentUser) {
      return Meteor.user().getLimitToShowCardsCount();
    } else {
      return false;
    }
  },

  cardsCount() {
    const list = Template.currentData();
    let swimlaneId = '';
    if (Utils.boardView() === 'board-view-swimlanes')
      swimlaneId = this.parentComponent()
        .parentComponent()
        .data()._id;

    return list.cards(swimlaneId).count();
  },

  reachedWipLimit() {
    const list = Template.currentData();
    return (
      list.getWipLimit('enabled') &&
      list.getWipLimit('value') <= list.cards().count()
    );
  },

  showCardsCountForList(count) {
    const limit = this.limitToShowCardsCount();
    return limit > 0 && count > limit;
  },

  events() {
    return [
      {
        'click .js-list-star'(event) {
          event.preventDefault();
          this.starred(!this.starred());
        },
        'click .js-open-list-menu': Popup.open('listAction'),
        'click .js-add-card'(event) {
          const listDom = $(event.target).parents(
            `#js-list-${this.currentData()._id}`,
          )[0];
          const listComponent = BlazeComponent.getComponentForElement(listDom);
          listComponent.openForm({
            position: 'top',
          });
        },
        'click .js-unselect-list'() {
          Session.set('currentList', null);
        },
        submit: this.editTitle,
      },
    ];
  },
}).register('listHeader');

Template.listHeader.helpers({
  showDesktopDragHandles() {
    currentUser = Meteor.user();
    if (currentUser) {
      return (currentUser.profile || {}).showDesktopDragHandles;
    } else if (cookies.has('showDesktopDragHandles')) {
      return true;
    } else {
      return false;
    }
  },
});

Template.listActionPopup.helpers({
  isWipLimitEnabled() {
    return Template.currentData().getWipLimit('enabled');
  },

  isWatching() {
    return this.findWatcher(Meteor.userId());
  },
});

Template.listActionPopup.events({
  'click .js-list-subscribe'() {},
  'click .js-set-color-list': Popup.open('setListColor'),
  'click .js-select-cards'() {
    const cardIds = this.allCards().map(card => card._id);
    MultiSelection.add(cardIds);
    Popup.close();
  },
  'click .js-toggle-watch-list'() {
    const currentList = this;
    const level = currentList.findWatcher(Meteor.userId()) ? null : 'watching';
    Meteor.call('watch', 'list', currentList._id, level, (err, ret) => {
      if (!err && ret) Popup.close();
    });
  },
  'click .js-close-list'(event) {
    event.preventDefault();
    this.archive();
    Popup.close();
  },
  'click .js-set-wip-limit': Popup.open('setWipLimit'),
  'click .js-more': Popup.open('listMore'),
});

BlazeComponent.extendComponent({
  applyWipLimit() {
    const list = Template.currentData();
    const limit = parseInt(
      Template.instance()
        .$('.wip-limit-value')
        .val(),
      10,
    );

    if (limit < list.cards().count() && !list.getWipLimit('soft')) {
      Template.instance()
        .$('.wip-limit-error')
        .click();
    } else {
      Meteor.call('applyWipLimit', list._id, limit);
      Popup.back();
    }
  },

  enableSoftLimit() {
    const list = Template.currentData();

    if (
      list.getWipLimit('soft') &&
      list.getWipLimit('value') < list.cards().count()
    ) {
      list.setWipLimit(list.cards().count());
    }
    Meteor.call('enableSoftLimit', Template.currentData()._id);
  },

  enableWipLimit() {
    const list = Template.currentData();
    // Prevent user from using previously stored wipLimit.value if it is less than the current number of cards in the list
    if (
      !list.getWipLimit('enabled') &&
      list.getWipLimit('value') < list.cards().count()
    ) {
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

  wipLimitValue() {
    return Template.currentData().getWipLimit('value');
  },

  events() {
    return [
      {
        'click .js-enable-wip-limit': this.enableWipLimit,
        'click .wip-limit-apply': this.applyWipLimit,
        'click .wip-limit-error': Popup.open('wipLimitError'),
        'click .materialCheckBox': this.enableSoftLimit,
      },
    ];
  },
}).register('setWipLimitPopup');

Template.listMorePopup.events({
  'click .js-delete': Popup.afterConfirm('listDelete', function() {
    Popup.close();
    // TODO how can we avoid the fetch call?
    const allCards = this.allCards().fetch();
    const allCardIds = _.pluck(allCards, '_id');
    // it's okay if the linked cards are on the same list
    if (
      Cards.find({
        $and: [
          { listId: { $ne: this._id } },
          { linkedId: { $in: allCardIds } },
        ],
      }).count() === 0
    ) {
      allCardIds.map(_id => Cards.remove(_id));
      Lists.remove(this._id);
    } else {
      // TODO: Figure out more informative message.
      // Popup with a hint that the list cannot be deleted as there are
      // linked cards. We can adapt the query above so we can list the linked
      // cards.
      // Related:
      //   client/components/cards/cardDetails.js about line 969
      //   https://github.com/wekan/wekan/issues/2785
      const message = `${TAPi18n.__(
        'delete-linked-cards-before-this-list',
      )} linkedId: ${
        this._id
      } at client/components/lists/listHeader.js and https://github.com/wekan/wekan/issues/2785`;
      alert(message);
    }
    Utils.goBoardId(this.boardId);
  }),
});

BlazeComponent.extendComponent({
  onCreated() {
    this.currentList = this.currentData();
    this.currentColor = new ReactiveVar(this.currentList.color);
  },

  colors() {
    return listsColors.map(color => ({ color, name: '' }));
  },

  isSelected(color) {
    return this.currentColor.get() === color;
  },

  events() {
    return [
      {
        'click .js-palette-color'() {
          this.currentColor.set(this.currentData().color);
        },
        'click .js-submit'() {
          this.currentList.setColor(this.currentColor.get());
          Popup.close();
        },
        'click .js-remove-color'() {
          this.currentList.setColor(null);
          Popup.close();
        },
      },
    ];
  },
}).register('setListColorPopup');
