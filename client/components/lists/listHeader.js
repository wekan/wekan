import { ReactiveCache } from '/imports/reactiveCache';
import Lists from '../../../models/lists';
import { TAPi18n } from '/imports/i18n';
import dragscroll from '@wekanteam/dragscroll';

let listsColors;
Meteor.startup(() => {
  listsColors = Lists.simpleSchema()._schema.color.allowedValues;
});

BlazeComponent.extendComponent({
  onRendered() {
    /* #FIXME I have no idea why this exact same
    event won't fire when in event maps */
    $(this.find('.js-collapse')).on('click', (e) => {
      e.preventDefault();
      this.collapsed(!this.collapsed());
    });
  },

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
    const list = this.data();
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
  currentList() {
    const currentList = Utils.getCurrentList();
    const list = Template.currentData();
    return currentList && currentList._id == list._id;
  },
  events() {
    return [
      {
        'click .js-list-star'(event) {
          event.preventDefault();
          this.starred(!this.starred());
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
  'click .js-add-card.list-header-plus-top'(event) {
    const listDom = $(`#js-list-${this._id}`)[0];
    const listComponent = BlazeComponent.getComponentForElement(listDom);
    if (listComponent) {
      listComponent.openForm({
        position: 'top',
      });
    }
    Popup.back();
  },
  'click .js-add-card.list-header-plus-bottom'(event) {
    const listDom = $(`#js-list-${this._id}`)[0];
    const listComponent = BlazeComponent.getComponentForElement(listDom);
    if (listComponent) {
      listComponent.openForm({
        position: 'bottom',
      });
    }
    Popup.back();
  },
  'click .js-add-list': Popup.open('addList'),
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
    if (width < 270 || !width || constraint < 270 || !constraint) {
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

BlazeComponent.extendComponent({
  onCreated() {
    this.currentBoard = Utils.getCurrentBoard();
    this.currentSwimlaneId = new ReactiveVar(null);
    this.currentListId = new ReactiveVar(null);

    // Get the swimlane context from opener
    const openerData = Popup.getOpenerComponent()?.data();

    // If opened from swimlane menu, openerData is the swimlane
    if (openerData?.type === 'swimlane' || openerData?.type === 'template-swimlane') {
      this.currentSwimlane = openerData;
      this.currentSwimlaneId.set(openerData._id);
    } else if (openerData?._id) {
      // If opened from list menu, get swimlane from the list
      const list = ReactiveCache.getList({ _id: openerData._id });
      this.currentSwimlane = list?.swimlaneId ? ReactiveCache.getSwimlane({ _id: list.swimlaneId }) : null;
      this.currentSwimlaneId.set(this.currentSwimlane?._id || null);
      this.currentListId.set(openerData._id);
    }
  },

  currentSwimlaneData() {
    const swimlaneId = this.currentSwimlaneId.get();
    return swimlaneId ? ReactiveCache.getSwimlane({ _id: swimlaneId }) : null;
  },

  currentListIdValue() {
    return this.currentListId.get();
  },

  swimlaneLists() {
    const swimlaneId = this.currentSwimlaneId.get();
    if (swimlaneId) {
      return ReactiveCache.getLists({ swimlaneId, archived: false }).sort((a, b) => a.sort - b.sort);
    }
    return this.currentBoard.lists;
  },

  events() {
    return [
      {
        'submit .js-add-list-form'(evt) {
          evt.preventDefault();

          const titleInput = this.find('.list-name-input');
          const title = titleInput?.value.trim();

          if (!title) return;

          let sortIndex = 0;
          const boardId = Utils.getCurrentBoardId();
          const swimlaneId = this.currentSwimlane?._id;

          const positionInput = this.find('.list-position-input');

          if (positionInput && positionInput.value) {
            const positionId = positionInput.value.trim();
            const selectedList = ReactiveCache.getList({ boardId, _id: positionId, archived: false });

            if (selectedList) {
              sortIndex = selectedList.sort + 1;
            } else {
              // No specific position, add at end of swimlane
              if (swimlaneId) {
                const swimlaneLists = ReactiveCache.getLists({ swimlaneId, archived: false });
                const lastSwimlaneList = swimlaneLists.sort((a, b) => b.sort - a.sort)[0];
                sortIndex = Utils.calculateIndexData(lastSwimlaneList, null).base;
              } else {
                const lastList = this.currentBoard.getLastList();
                sortIndex = Utils.calculateIndexData(lastList, null).base;
              }
            }
          } else {
            // No position input, add at end of swimlane
            if (swimlaneId) {
              const swimlaneLists = ReactiveCache.getLists({ swimlaneId, archived: false });
              const lastSwimlaneList = swimlaneLists.sort((a, b) => b.sort - a.sort)[0];
              sortIndex = Utils.calculateIndexData(lastSwimlaneList, null).base;
            } else {
              const lastList = this.currentBoard.getLastList();
              sortIndex = Utils.calculateIndexData(lastList, null).base;
            }
          }

          Lists.insert({
            title,
            boardId: Session.get('currentBoard'),
            sort: sortIndex,
            type: 'list',
            swimlaneId: swimlaneId,
          });

          Popup.back();
        },
        'click .js-list-template': Popup.open('searchElement'),
      },
    ];
  },
}).register('addListPopup');
