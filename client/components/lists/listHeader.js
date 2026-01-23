import { ReactiveCache } from '/imports/reactiveCache';
import Lists from '../../../models/lists';
import { TAPi18n } from '/imports/i18n';
import dragscroll from '@wekanteam/dragscroll';

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
      !ReactiveCache.getCurrentUser().isWorker()
    );
  },

  isBoardAdmin() {
    return ReactiveCache.getCurrentUser().isBoardAdmin();
  },
  async starred(check = undefined) {
    const list = Template.currentData();
    const status = list.isStarred();
    if (check === undefined) {
      // just check
      return status;
    } else {
      await list.star(!status);
      return !status;
    }
  },
  collapsed(check = undefined) {
    const list = Template.currentData();
    const status = Utils.getListCollapseState(list);
    if (check === undefined) {
      // just check
      return status;
    } else {
      const next = typeof check === 'boolean' ? check : !status;
      Utils.setListCollapseState(list, next);
      return next;
    }
  },
  async editTitle(event) {
    event.preventDefault();
    const newTitle = this.childComponents('inlinedForm')[0]
      .getValue()
      .trim();
    const list = this.currentData();
    if (newTitle) {
      await list.rename(newTitle.trim());
    }
  },

  isWatching() {
    const list = this.currentData();
    return list.findWatcher(Meteor.userId());
  },

  limitToShowCardsCount() {
    const currentUser = ReactiveCache.getCurrentUser();
    if (currentUser) {
      return currentUser.getLimitToShowCardsCount();
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

    const ret = list.cards(swimlaneId).length;
    return ret;
  },

  reachedWipLimit() {
    const list = Template.currentData();
    return (
      list.getWipLimit('enabled') &&
      list.getWipLimit('value') <= list.cards().length
    );
  },

  exceededWipLimit() {
    const list = Template.currentData();
    return (
      list.getWipLimit('enabled') &&
      list.getWipLimit('value') < list.cards().length
    );
  },

  showCardsCountForList(count) {
    const limit = this.limitToShowCardsCount();
    return limit >= 0 && count >= limit;
  },

  cardsCountForListIsOne(count) {
    if (count === 1) {
      return TAPi18n.__('cards-count-one');
    } else {
      return TAPi18n.__('cards-count');
    }
  },

  events() {
    return [
      {
        'click .js-list-star'(event) {
          event.preventDefault();
          this.starred(!this.starred());
        },
        'click .js-collapse'(event) {
          event.preventDefault();
          this.collapsed(!this.collapsed());
        },
        'click .js-open-list-menu': Popup.open('listAction'),
        'click .js-add-card.list-header-plus-top'(event) {
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
  isBoardAdmin() {
    return ReactiveCache.getCurrentUser().isBoardAdmin();
  },
  numberFieldsSum() {
    const list = Template.currentData();
    if (!list) return 0;
    const boardId = Session.get('currentBoard');
    const fields = ReactiveCache.getCustomFields({
      boardIds: { $in: [boardId] },
      showSumAtTopOfList: true,
      type: 'number',
    });
    if (!fields || !fields.length) return 0;
    const cards = ReactiveCache.getCards({ listId: list._id, archived: false });
    let total = 0;
    if (cards && cards.length) {
      cards.forEach(card => {
        const cfs = (card.customFields || []);
        fields.forEach(field => {
          const cf = cfs.find(f => f && f._id === field._id);
          if (!cf || cf.value === null || cf.value === undefined) return;
          let v = cf.value;
          if (typeof v === 'string') {
            const parsed = parseFloat(v.replace(',', '.'));
            if (isNaN(parsed)) return;
            v = parsed;
          }
          if (typeof v === 'number' && isFinite(v)) {
            total += v;
          }
        });
      });
    }
    return total;
  },
  hasNumberFieldsSum() {
    const boardId = Session.get('currentBoard');
    const fields = ReactiveCache.getCustomFields({
      boardIds: { $in: [boardId] },
      showSumAtTopOfList: true,
      type: 'number',
    });
    return !!(fields && fields.length);
  },
});

Template.listActionPopup.helpers({
  isBoardAdmin() {
    return ReactiveCache.getCurrentUser().isBoardAdmin();
  },

  isWipLimitEnabled() {
    return Template.currentData().getWipLimit('enabled');
  },

  isWatching() {
    return this.findWatcher(Meteor.userId());
  }
});

Template.listActionPopup.events({
  'click .js-list-subscribe'() {},
  'click .js-add-card.list-header-plus-bottom'(event) {
    const listDom = $(`#js-list-${this._id}`)[0];
    const listComponent = BlazeComponent.getComponentForElement(listDom);
    listComponent.openForm({
      position: 'bottom',
    });
    Popup.back();
  },
  'click .js-set-list-width': Popup.open('setListWidth'),
  'click .js-set-color-list': Popup.open('setListColor'),
  'click .js-select-cards'() {
    const cardIds = this.allCards().map(card => card._id);
    MultiSelection.add(cardIds);
    Popup.back();
  },
  'click .js-toggle-watch-list'() {
    const currentList = this;
    const level = currentList.findWatcher(Meteor.userId()) ? null : 'watching';
    Meteor.call('watch', 'list', currentList._id, level, (err, ret) => {
      if (!err && ret) Popup.back();
    });
  },
  async 'click .js-close-list'(event) {
    event.preventDefault();
    await this.archive();
    Popup.back();
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

    if (limit < list.cards().length && !list.getWipLimit('soft')) {
      Template.instance()
        .$('.wip-limit-error')
        .click();
    } else {
      Meteor.call('applyWipLimit', list._id, limit);
      Popup.back();
    }
  },

  async enableSoftLimit() {
    const list = Template.currentData();

    if (
      list.getWipLimit('soft') &&
      list.getWipLimit('value') < list.cards().length
    ) {
      await list.setWipLimit(list.cards().length);
    }
    Meteor.call('enableSoftLimit', Template.currentData()._id);
  },

  async enableWipLimit() {
    const list = Template.currentData();
    // Prevent user from using previously stored wipLimit.value if it is less than the current number of cards in the list
    if (
      !list.getWipLimit('enabled') &&
      list.getWipLimit('value') < list.cards().length
    ) {
      await list.setWipLimit(list.cards().length);
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
    Popup.back();
    const allCards = this.allCards();
    const allCardIds = _.pluck(allCards, '_id');
    // it's okay if the linked cards are on the same list
    if (
      ReactiveCache.getCards({
        $and: [
          { listId: { $ne: this._id } },
          { linkedId: { $in: allCardIds } },
        ],
      }).length === 0
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

Template.listHeader.helpers({
  isBoardAdmin() {
    return ReactiveCache.getCurrentUser().isBoardAdmin();
  },
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
    if (this.currentColor.get() === null) {
      return color === 'white';
    } else {
      return this.currentColor.get() === color;
    }
  },

  events() {
    return [
      {
        'click .js-palette-color'() {
          this.currentColor.set(this.currentData().color);
        },
        async 'click .js-submit'() {
          await this.currentList.setColor(this.currentColor.get());
          Popup.close();
        },
        async 'click .js-remove-color'() {
          await this.currentList.setColor(null);
          Popup.close();
        },
      },
    ];
  },
}).register('setListColorPopup');

BlazeComponent.extendComponent({
  applyListWidth() {
    const list = Template.currentData();
    const board = list.boardId;
    const width = parseInt(
      Template.instance()
        .$('.list-width-value')
        .val(),
      10,
    );
    const constraint = parseInt(
      Template.instance()
        .$('.list-constraint-value')
        .val(),
      10,
    );

    // FIXME(mark-i-m): where do we put constants?
    if (width < 100 || !width || constraint < 100 || !constraint) {
      Template.instance()
        .$('.list-width-error')
        .click();
    } else {
      Meteor.call('applyListWidth', board, list._id, width, constraint);
      Popup.back();
    }
  },

  listWidthValue() {
    const list = Template.currentData();
    const board = list.boardId;
    return ReactiveCache.getCurrentUser().getListWidth(board, list._id);
  },

  listConstraintValue() {
    const list = Template.currentData();
    const board = list.boardId;
    return ReactiveCache.getCurrentUser().getListConstraint(board, list._id);
  },

  isAutoWidth() {
    const boardId = Utils.getCurrentBoardId();
    const user = ReactiveCache.getCurrentUser();
    return user && user.isAutoWidth(boardId);
  },

  events() {
    return [
      {
        'click .js-auto-width-board'() {
          dragscroll.reset();
          ReactiveCache.getCurrentUser().toggleAutoWidth(Utils.getCurrentBoardId());
        },
        'click .list-width-apply': this.applyListWidth,
        'click .list-width-error': Popup.open('listWidthError'),
      },
    ];
  },
}).register('setListWidthPopup');
