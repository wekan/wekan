import { ReactiveCache } from '/imports/reactiveCache';
import Lists from '../../../models/lists';
import { TAPi18n } from '/imports/i18n';
import dragscroll from '@wekanteam/dragscroll';
import { BoardSwimlaneListDialog } from '/client/lib/dialogWithBoardSwimlaneList';
import Cards from '/models/cards';
import { LIST_COLORS } from '/models/metadata/colors';
import { MultiSelection } from '/client/lib/multiSelection';
import { Utils } from '/client/lib/utils';

let listsColors;
Meteor.startup(() => {
  listsColors = LIST_COLORS;
});

Template.listHeader.helpers({
  canSeeAddCard() {
    const list = Template.currentData();
    return (
      (!list.getWipLimit('enabled') ||
        list.getWipLimit('soft') ||
        !Template.instance().reachedWipLimit()) &&
      !ReactiveCache.getCurrentUser().isWorker()
    );
  },

  isBoardAdmin() {
    return ReactiveCache.getCurrentUser().isBoardAdmin();
  },

  starred() {
    const list = Template.currentData();
    return list.isStarred();
  },

  collapsed() {
    const list = Template.currentData();
    return Utils.getListCollapseState(list);
  },

  isWatching() {
    const list = Template.currentData();
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
    if (Utils.boardView() === 'board-view-swimlanes') {
      swimlaneId = list.swimlaneId || '';
    }

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
    const currentUser = ReactiveCache.getCurrentUser();
    const limit = currentUser ? currentUser.getLimitToShowCardsCount() : false;
    return limit >= 0 && count >= limit;
  },

  cardsCountForListIsOne(count) {
    if (count === 1) {
      return TAPi18n.__('cards-count-one');
    } else {
      return TAPi18n.__('cards-count');
    }
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

// Helper function on template instance for reachedWipLimit check
Template.listHeader.onCreated(function () {
  this.reachedWipLimit = function () {
    const list = Template.currentData();
    return (
      list.getWipLimit('enabled') &&
      list.getWipLimit('value') <= list.cards().length
    );
  };
});

Template.listHeader.events({
  async 'click .js-list-star'(event) {
    event.preventDefault();
    const list = Template.currentData();
    const status = list.isStarred();
    await list.star(!status);
  },
  'click .js-collapse'(event) {
    event.preventDefault();
    const list = Template.currentData();
    const status = Utils.getListCollapseState(list);
    Utils.setListCollapseState(list, !status);
  },
  'click .js-open-list-menu': Popup.open('listAction'),
  'click .js-add-card.list-header-plus-top'(event) {
    const listDom = $(event.target).parents(
      `#js-list-${Template.currentData()._id}`,
    )[0];
    const view = Blaze.getView(listDom, 'Template.list');
    const listComponent = view?.templateInstance?.();
    if (listComponent) {
      listComponent.openForm({
        position: 'top',
      });
    }
  },
  'click .js-unselect-list'() {
    Session.set('currentList', null);
  },
  async 'submit'(event, tpl) {
    event.preventDefault();
    const newTitle = tpl.$('textarea,input[type=text]').val()?.trim();
    const list = Template.currentData();
    if (newTitle) {
      await list.rename(newTitle.trim());
    }
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
    const view = Blaze.getView(listDom, 'Template.list');
    const listComponent = view?.templateInstance?.();
    if (listComponent) {
      listComponent.openForm({
        position: 'top',
      });
    }
    Popup.back();
  },
  'click .js-add-card.list-header-plus-bottom'(event) {
    const listDom = $(`#js-list-${this._id}`)[0];
    const view = Blaze.getView(listDom, 'Template.list');
    const listComponent = view?.templateInstance?.();
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
  'click .js-close-list': Popup.afterConfirm('listArchive', async function() {
    await this.archive();
    Popup.close();
  }),
  'click .js-set-wip-limit': Popup.open('setWipLimit'),
  'click .js-copy-list': Popup.open('copyList'),
  'click .js-move-list': Popup.open('moveList'),
  'click .js-more': Popup.open('listMore'),
});

Template.setWipLimitPopup.helpers({
  isWipLimitSoft() {
    return Template.currentData().getWipLimit('soft');
  },

  isWipLimitEnabled() {
    return Template.currentData().getWipLimit('enabled');
  },

  wipLimitValue() {
    return Template.currentData().getWipLimit('value');
  },
});

Template.setWipLimitPopup.events({
  async 'click .js-enable-wip-limit'() {
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
  'click .wip-limit-apply'(event, tpl) {
    const list = Template.currentData();
    const limit = parseInt(
      tpl.$('.wip-limit-value').val(),
      10,
    );

    if (limit < list.cards().length && !list.getWipLimit('soft')) {
      tpl.$('.wip-limit-error').click();
    } else {
      Meteor.call('applyWipLimit', list._id, limit);
      Popup.back();
    }
  },
  'click .wip-limit-error': Popup.open('wipLimitError'),
  async 'click .materialCheckBox'() {
    const list = Template.currentData();

    if (
      list.getWipLimit('soft') &&
      list.getWipLimit('value') < list.cards().length
    ) {
      await list.setWipLimit(list.cards().length);
    }
    Meteor.call('enableSoftLimit', Template.currentData()._id);
  },
});

Template.listMorePopup.events({
  'click .js-delete': Popup.afterConfirm('listDelete', function() {
    Popup.back();
    const list = Lists.findOne(this._id);
    if (!list) return;
    const allCards = list.allCards();
    const allCardIds = allCards.map(c => c._id);
    // it's okay if the linked cards are on the same list
    if (
      ReactiveCache.getCards({
        $and: [
          { listId: { $ne: list._id } },
          { linkedId: { $in: allCardIds } },
        ],
      }).length === 0
    ) {
      allCardIds.map(_id => Cards.remove(_id));
      Lists.remove(list._id);
    } else {
      const message = `${TAPi18n.__(
        'delete-linked-cards-before-this-list',
      )} linkedId: ${
        list._id
      } at client/components/lists/listHeader.js and https://github.com/wekan/wekan/issues/2785`;
      alert(message);
    }
    Utils.goBoardId(list.boardId);
  }),
});

function registerListDialogTemplate(templateName) {
  Template[templateName].helpers({
    boards() {
      return Template.instance().dialog.boards();
    },
    swimlanes() {
      return Template.instance().dialog.swimlanes();
    },
    lists() {
      return Template.instance().dialog.lists();
    },
    isDialogOptionBoardId(boardId) {
      return Template.instance().dialog.isDialogOptionBoardId(boardId);
    },
    isDialogOptionSwimlaneId(swimlaneId) {
      return Template.instance().dialog.isDialogOptionSwimlaneId(swimlaneId);
    },
    isDialogOptionListId(listId) {
      return Template.instance().dialog.isDialogOptionListId(listId);
    },
    isTitleDefault(title) {
      return Template.instance().dialog.isTitleDefault(title);
    },
  });

  Template[templateName].events({
    async 'click .js-done'(event, tpl) {
      const dialog = tpl.dialog;
      const boardSelect = tpl.$('.js-select-boards')[0];
      const boardId = boardSelect?.options[boardSelect?.selectedIndex]?.value;
      const swimlaneSelect = tpl.$('.js-select-swimlanes')[0];
      const swimlaneId = swimlaneSelect?.options[swimlaneSelect?.selectedIndex]?.value;
      const listSelect = tpl.$('.js-select-lists')[0];
      const listId = listSelect?.options[listSelect?.selectedIndex]?.value || null;
      const position = tpl.$('input[name="list-position"]:checked').val() || 'right';
      try {
        await dialog.setDone({ boardId, swimlaneId, listId, position });
      } catch (e) {
        console.error('Error in list dialog operation:', e);
      }
      Popup.back(2);
    },
    'change .js-select-boards'(event, tpl) {
      tpl.dialog.getBoardData($(event.currentTarget).val());
    },
    'change .js-select-swimlanes'(event, tpl) {
      tpl.dialog.selectedSwimlaneId.set($(event.currentTarget).val());
      tpl.dialog.setFirstListId();
    },
    'change .js-select-lists'(event, tpl) {
      tpl.dialog.selectedListId.set($(event.currentTarget).val());
    },
  });
}

Template.copyListPopup.onCreated(function () {
  this.dialog = new BoardSwimlaneListDialog(this, {
    getDialogOptions() {
      return null;
    },
    async setDone(options) {
      const tpl = Template.instance();
      const title = tpl.$('#copy-list-title').val().trim();
      if (!title) return;
      const list = Template.currentData();
      await Meteor.callAsync('copyList', list._id, options.boardId, options.swimlaneId, title, options.listId, options.position);
    },
  });
});
registerListDialogTemplate('copyListPopup');

Template.moveListPopup.onCreated(function () {
  this.dialog = new BoardSwimlaneListDialog(this, {
    getDialogOptions() {
      return null;
    },
    async setDone(options) {
      const tpl = Template.instance();
      const title = tpl.$('#move-list-title').val().trim();
      const list = Template.currentData();
      await Meteor.callAsync('moveList', list._id, options.boardId, options.swimlaneId, options.listId, options.position, title);
    },
  });
});
registerListDialogTemplate('moveListPopup');

Template.setListColorPopup.onCreated(function () {
  const data = Template.currentData();
  this.currentList = Lists.findOne(data._id) || data;
  this.currentColor = new ReactiveVar(this.currentList.color);
});

Template.setListColorPopup.helpers({
  colors() {
    return listsColors.map(color => ({ color, name: '' }));
  },

  isSelected(color) {
    const tpl = Template.instance();
    if (tpl.currentColor.get() === null) {
      return color === 'white';
    } else {
      return tpl.currentColor.get() === color;
    }
  },
});

Template.setListColorPopup.events({
  'click .js-palette-color'(event, tpl) {
    const paletteData = Blaze.getData(event.currentTarget);
    tpl.currentColor.set(paletteData?.color);
  },
  async 'submit form'(event, tpl) {
    event.preventDefault();
    console.log('[ListColor] submit form, color:', tpl.currentColor.get(), 'listId:', tpl.currentList?._id, 'setColor type:', typeof tpl.currentList?.setColor);
    try {
      const result = await tpl.currentList.setColor(tpl.currentColor.get());
      console.log('[ListColor] submit form setColor result:', result);
    } catch (err) {
      console.error('[ListColor] submit form setColor error:', err);
    }
    Popup.close();
  },
  async 'click .js-submit'(event, tpl) {
    event.preventDefault();
    console.log('[ListColor] click submit, color:', tpl.currentColor.get(), 'listId:', tpl.currentList?._id, 'setColor type:', typeof tpl.currentList?.setColor);
    try {
      const result = await tpl.currentList.setColor(tpl.currentColor.get());
      console.log('[ListColor] click submit setColor result:', result);
    } catch (err) {
      console.error('[ListColor] click submit setColor error:', err);
    }
    Popup.close();
  },
  async 'click .js-remove-color'(event, tpl) {
    event.preventDefault();
    console.log('[ListColor] remove color, listId:', tpl.currentList?._id);
    try {
      await tpl.currentList.setColor(null);
    } catch (err) {
      console.error('[ListColor] remove color error:', err);
    }
    Popup.close();
  },
});

Template.setListWidthPopup.helpers({
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
});

Template.setListWidthPopup.events({
  'click .js-auto-width-board'() {
    dragscroll.reset();
    ReactiveCache.getCurrentUser().toggleAutoWidth(Utils.getCurrentBoardId());
  },
  'click .list-width-apply'(event, tpl) {
    const list = Template.currentData();
    const board = list.boardId;
    const width = parseInt(
      tpl.$('.list-width-value').val(),
      10,
    );
    const constraint = parseInt(
      tpl.$('.list-constraint-value').val(),
      10,
    );

    // FIXME(mark-i-m): where do we put constants?
    if (width < 270 || !width || constraint < 270 || !constraint) {
      tpl.$('.list-width-error').click();
    } else {
      Meteor.call('applyListWidth', board, list._id, width, constraint);
      Popup.back();
    }
  },
  'click .list-width-error': Popup.open('listWidthError'),
});

Template.addListPopup.onCreated(function () {
  this.currentBoard = Utils.getCurrentBoard();
  this.currentSwimlaneId = new ReactiveVar(null);
  this.currentListId = new ReactiveVar(null);

  // Get the swimlane context from opener
  const openerComponent = Popup.getOpenerComponent();
  const openerData = openerComponent?.data || Popup._getTopStack()?.dataContext;

  // If opened from swimlane menu, openerData is the swimlane
  if (openerData?.type === 'swimlane' || openerData?.type === 'template-swimlane') {
    this.currentSwimlane = openerData;
    this.currentSwimlaneId.set(openerData._id);
  } else if (openerData?._id) {
    // If opened from list menu, get swimlane from the list
    const list = ReactiveCache.getList({ _id: openerData._id });
    if (list) {
      this.currentSwimlane = list.swimlaneId
        ? ReactiveCache.getSwimlane({ _id: list.swimlaneId })
        : null;
      this.currentSwimlaneId.set(this.currentSwimlane?._id || null);
      this.currentListId.set(openerData._id);
    }
  }

  if (!this.currentSwimlaneId.get()) {
    const defaultSwimlane = this.currentBoard.getDefaultSwimline?.();
    if (defaultSwimlane?._id) {
      this.currentSwimlane = defaultSwimlane;
      this.currentSwimlaneId.set(defaultSwimlane._id);
    }
  }
});

Template.addListPopup.helpers({
  currentSwimlaneData() {
    const tpl = Template.instance();
    const swimlaneId = tpl.currentSwimlaneId.get();
    return swimlaneId ? ReactiveCache.getSwimlane({ _id: swimlaneId }) : null;
  },

  currentListIdValue() {
    return Template.instance().currentListId.get();
  },

  swimlaneLists() {
    const tpl = Template.instance();
    const swimlaneId = tpl.currentSwimlaneId.get();
    if (swimlaneId) {
      return ReactiveCache.getLists({ swimlaneId, archived: false }).sort((a, b) => a.sort - b.sort);
    }
    return tpl.currentBoard.lists;
  },
});

Template.addListPopup.events({
  async 'submit .js-add-list-form'(evt, tpl) {
    evt.preventDefault();

    const titleInput = tpl.find('.list-name-input');
    const title = titleInput?.value.trim();

    if (!title) return;

    const positionInput = tpl.find('.list-position-input');
    const afterListId =
      positionInput && positionInput.value ? positionInput.value.trim() : null;
    const nextListId =
      positionInput &&
      positionInput.selectedIndex >= 0 &&
      positionInput.options[positionInput.selectedIndex + 1]
        ? positionInput.options[positionInput.selectedIndex + 1].value
        : null;
    const targetSwimlaneId =
      (tpl.currentSwimlaneId && tpl.currentSwimlaneId.get && tpl.currentSwimlaneId.get()) ||
      (tpl.currentSwimlane && tpl.currentSwimlane._id) ||
      null;

    try {
      await Meteor.callAsync('createListAfter', {
        title,
        boardId: Session.get('currentBoard'),
        swimlaneId: targetSwimlaneId,
        afterListId,
        nextListId,
        type: 'list',
      });
      Popup.back();
    } catch (error) {
      console.error('Failed to create list after selected list:', error);
    }
  },
  'click .js-list-template': Popup.open('searchElement'),
});
