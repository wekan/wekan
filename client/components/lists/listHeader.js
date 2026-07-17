import { ReactiveCache } from '/imports/reactiveCache';
import Lists from '../../../models/lists';
import { TAPi18n } from '/imports/i18n';
import dragscroll from '@wekanteam/dragscroll';
import { BoardSwimlaneListDialog } from '/client/lib/dialogWithBoardSwimlaneList';
import Cards from '/models/cards';
import { LIST_COLORS } from '/models/metadata/colors';
import { isHexColor, toHex } from '/models/lib/contrastColor';
import { MultiSelection } from '/client/lib/multiSelection';
import { Utils } from '/client/lib/utils';
import { lazyListCardCount } from '/client/lib/lazyCards';
// #5659: single source of truth for the default/minimum list width, shared
// with client/components/lists/list.js and models/users.js.
import {
  DEFAULT_LIST_WIDTH,
  MIN_LIST_WIDTH,
  normalizeListWidth,
} from '/models/lib/listWidth';

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
      !ReactiveCache.getCurrentUser()?.isWorker()
    );
  },

  isBoardAdmin() {
    return ReactiveCache.getCurrentUser()?.isBoardAdmin();
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

    // In lazy mode minimongo holds only the loaded window, so use the accurate
    // server count for the same selector; fall back to the loaded length.
    const lazyCount = lazyListCardCount(list, swimlaneId);
    return lazyCount !== null ? lazyCount : list.cards(swimlaneId).length;
  },

  reachedWipLimit() {
    const list = Template.currentData();
    const lazyCount = lazyListCardCount(list, undefined);
    const count = lazyCount !== null ? lazyCount : list.cards().length;
    return list.getWipLimit('enabled') && list.getWipLimit('value') <= count;
  },

  exceededWipLimit() {
    const list = Template.currentData();
    const lazyCount = lazyListCardCount(list, undefined);
    const count = lazyCount !== null ? lazyCount : list.cards().length;
    return list.getWipLimit('enabled') && list.getWipLimit('value') < count;
  },

  // Accurate whole-list card count (used by the badge visibility, WIP-limit
  // number and pluralization in the template). In lazy mode `cards.length`
  // (= list.cards().length) is only the loaded window, so prefer the server count.
  cardsCountWhole() {
    const list = Template.currentData();
    const lazyCount = lazyListCardCount(list, undefined);
    return lazyCount !== null ? lazyCount : list.cards().length;
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
    const lazyCount = lazyListCardCount(list, undefined);
    const count = lazyCount !== null ? lazyCount : list.cards().length;
    return list.getWipLimit('enabled') && list.getWipLimit('value') <= count;
  };
});

// #459: accessible reordering — move a list left/right via sr-only buttons by
// swapping its sort value with the adjacent list (no drag-and-drop required).
function moveListBy(list, delta) {
  const siblings = ReactiveCache.getLists(
    { boardId: list.boardId, archived: false },
    { sort: { sort: 1 } },
  );
  const idx = siblings.findIndex(l => l._id === list._id);
  const target = siblings[idx + delta];
  if (idx < 0 || !target) return;
  // Capture both sort values before either update; the docs are reactive and
  // list.sort would otherwise change after the first update.
  const listSort = list.sort;
  const targetSort = target.sort;
  // Lists are a server-restricted collection; persist the swap through the
  // updateListSort method — the same path the drag-and-drop reorder uses. A raw
  // client Lists.update of `sort` is reverted by the server.
  Meteor.call('updateListSort', list._id, list.boardId, { sort: targetSort });
  Meteor.call('updateListSort', target._id, target.boardId, { sort: listSort });
}

Template.listHeader.events({
  'click .js-list-move-left'(event) {
    event.preventDefault();
    moveListBy(Template.currentData(), -1);
  },
  'click .js-list-move-right'(event) {
    event.preventDefault();
    moveListBy(Template.currentData(), 1);
  },
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
  // #6465: open the inline Add List composer after this list. Record the
  // swimlane it is displayed in (board-wide lists are not bound to one) so the
  // new list is created in the right swimlane; the composer renders after this
  // list in the DOM (right in LTR / left in RTL).
  'click .js-add-list-here'(event) {
    event.preventDefault();
    const list = Template.currentData();
    const swimlaneDom = $(event.currentTarget).closest('.js-swimlane');
    const swimlaneId = swimlaneDom.length
      ? swimlaneDom.attr('id').replace('swimlane-', '')
      : null;
    Session.set('wekan-add-list-swimlane', swimlaneId);
    Session.set('wekan-add-list-after', list._id);
  },
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
    return ReactiveCache.getCurrentUser()?.isBoardAdmin();
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
    // Scope "select all cards" to the current swimlane when invoked from a
    // swimlane context (#5623). In swimlanes board view the list carries its
    // swimlaneId; otherwise there is genuinely no swimlane context and we keep
    // the historical list-wide selection (swimlaneId stays undefined).
    let swimlaneId;
    if (Utils.boardView() === 'board-view-swimlanes' && this.swimlaneId) {
      swimlaneId = this.swimlaneId;
    }
    const cardIds = this.allCards(swimlaneId).map(card => card._id);
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
    const lazyCount = lazyListCardCount(list, undefined);
    const count = lazyCount !== null ? lazyCount : list.cards().length;
    if (!list.getWipLimit('enabled') && list.getWipLimit('value') < count) {
      await list.setWipLimit(count);
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
      // Soft delete (docs/Features/Undo/Undo.md): mark the list + its cards deleted
      // (server cascades) instead of destroying them, so the delete is restorable
      // and undoable (#1023). Replaces the old hard Cards.remove / Lists.remove.
      Meteor.call('lists.softRemove', list._id);
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
  // #5514: current color as a '#rrggbb' hex for the native color wheel <input>.
  currentColorHex() {
    return toHex(Template.instance().currentColor.get()) || '#0079bf';
  },
});

Template.setListColorPopup.events({
  'click .js-palette-color'(event, tpl) {
    const paletteData = Blaze.getData(event.currentTarget);
    tpl.currentColor.set(paletteData?.color);
  },
  // #5514: picking from the native color wheel stores a custom hex.
  'input .js-list-color-wheel'(event, tpl) {
    const value = event.currentTarget.value;
    if (isHexColor(value)) {
      tpl.currentColor.set(value);
    }
  },
  async 'submit form'(event, tpl) {
    event.preventDefault();
    try {
      await tpl.currentList.setColor(tpl.currentColor.get());
    } catch (err) {
      console.error('[ListColor] submit form setColor error:', err);
    }
    Popup.close();
  },
  async 'click .js-submit'(event, tpl) {
    event.preventDefault();
    try {
      await tpl.currentList.setColor(tpl.currentColor.get());
    } catch (err) {
      console.error('[ListColor] click submit setColor error:', err);
    }
    Popup.close();
  },
  async 'click .js-remove-color'(event, tpl) {
    event.preventDefault();
    try {
      await tpl.currentList.setColor(null);
    } catch (err) {
      console.error('[ListColor] remove color error:', err);
    }
    Popup.close();
  },
});

// #6409: the per-list width popup is now a single fixed-width value. Whether it
// affects everyone (shared) or just the current user (personal) follows the
// board setting `allowsPersonalListWidth`.
function isPersonalListWidth(boardId) {
  const board = ReactiveCache.getBoard(boardId);
  return !!(board && board.allowsPersonalListWidth);
}

// #5729 Fixed (same) width for all lists is a per-viewer/per-board setting.
// Logged-in users store it in their profile; anonymous (public board) users in
// localStorage (mirrors the per-list anon storage in list.js).
function readAnonFixedListWidthEnabled(boardId) {
  try {
    const stored = localStorage.getItem('wekan-fixed-list-width-enabled');
    if (stored) {
      const flags = JSON.parse(stored);
      return flags[boardId] === true;
    }
  } catch (e) {
    console.warn('Error reading fixed list width flag from localStorage:', e);
  }
  return false;
}

function readAnonFixedListWidth(boardId) {
  try {
    const stored = localStorage.getItem('wekan-fixed-list-width');
    if (stored) {
      const widths = JSON.parse(stored);
      const w = widths[boardId];
      if (typeof w === 'number' && w >= MIN_LIST_WIDTH) return w;
    }
  } catch (e) {
    console.warn('Error reading fixed list width from localStorage:', e);
  }
  return DEFAULT_LIST_WIDTH;
}

function isFixedListWidth(boardId) {
  const user = ReactiveCache.getCurrentUser();
  if (user) return !!user.isFixedListWidth(boardId);
  return readAnonFixedListWidthEnabled(boardId);
}

function fixedListWidthValue(boardId) {
  const user = ReactiveCache.getCurrentUser();
  if (user) return user.getFixedListWidth(boardId);
  return readAnonFixedListWidth(boardId);
}

function setAnonFixedListWidthEnabled(boardId, enabled) {
  try {
    const stored = localStorage.getItem('wekan-fixed-list-width-enabled');
    const flags = stored ? JSON.parse(stored) : {};
    flags[boardId] = !!enabled;
    localStorage.setItem('wekan-fixed-list-width-enabled', JSON.stringify(flags));
  } catch (e) {
    console.warn('Error saving fixed list width flag to localStorage:', e);
  }
}

function setAnonFixedListWidth(boardId, width) {
  try {
    const stored = localStorage.getItem('wekan-fixed-list-width');
    const widths = stored ? JSON.parse(stored) : {};
    widths[boardId] = width;
    localStorage.setItem('wekan-fixed-list-width', JSON.stringify(widths));
  } catch (e) {
    console.warn('Error saving fixed list width to localStorage:', e);
  }
}

Template.setListWidthPopup.helpers({
  listWidthValue() {
    const list = Template.currentData();
    // #5729 In fixed width mode the input edits the single per-board value.
    if (isFixedListWidth(list.boardId)) {
      return fixedListWidthValue(list.boardId);
    }
    const shared = normalizeListWidth(list.width);
    if (!isPersonalListWidth(list.boardId)) {
      return shared;
    }
    const user = ReactiveCache.getCurrentUser();
    if (user) {
      const widths = user.getListWidths();
      const w = widths[list.boardId] && widths[list.boardId][list._id];
      return normalizeListWidth(w, shared);
    }
    return shared;
  },

  listWidthScopeNote() {
    const list = Template.currentData();
    // #5729 In fixed width mode the note explains the all-lists behaviour.
    if (isFixedListWidth(list.boardId)) {
      return TAPi18n.__('fixed-list-width-note');
    }
    return isPersonalListWidth(list.boardId)
      ? TAPi18n.__('list-width-personal-note')
      : TAPi18n.__('list-width-shared-note');
  },

  // #6409: auto-width follows the same scope as fixed widths.
  isAutoWidth() {
    const list = Template.currentData();
    if (isPersonalListWidth(list.boardId)) {
      const user = ReactiveCache.getCurrentUser();
      return !!(user && user.isAutoWidth(list.boardId));
    }
    const board = ReactiveCache.getBoard(list.boardId);
    return !!(board && board.autoWidth);
  },

  // In shared mode only members with board write access may toggle the shared
  // auto-width; in personal mode any logged-in user may toggle their own.
  canChangeAutoWidth() {
    const list = Template.currentData();
    if (isPersonalListWidth(list.boardId)) {
      return !!ReactiveCache.getCurrentUser();
    }
    return Utils.canModifyBoard();
  },

  // #5729 Whether "same width for all lists" mode is on for the current viewer.
  isFixedListWidth() {
    const list = Template.currentData();
    return isFixedListWidth(list.boardId);
  },
});

Template.setListWidthPopup.events({
  'click .js-toggle-auto-width'(event) {
    event.preventDefault();
    const list = Template.currentData();
    const boardId = list.boardId;
    if (isPersonalListWidth(boardId)) {
      const user = ReactiveCache.getCurrentUser();
      if (user) user.toggleAutoWidth(boardId);
    } else {
      const board = ReactiveCache.getBoard(boardId);
      const current = !!(board && board.autoWidth);
      Meteor.call('setBoardAutoWidth', boardId, !current);
    }
    Popup.back();
  },
  // #5729 Toggle "same width for all lists" (fixed width) for the current
  // viewer. Enabling it turns off auto-width (the two modes are exclusive).
  'click .js-toggle-fixed-list-width'(event) {
    event.preventDefault();
    const list = Template.currentData();
    const boardId = list.boardId;
    const enabled = !isFixedListWidth(boardId);
    const user = ReactiveCache.getCurrentUser();
    if (user) {
      if (enabled && isPersonalListWidth(boardId) && user.isAutoWidth(boardId)) {
        user.toggleAutoWidth(boardId);
      }
      Meteor.call('setFixedListWidthEnabled', boardId, enabled);
    } else {
      setAnonFixedListWidthEnabled(boardId, enabled);
    }
    Popup.back();
  },
  'click .list-width-apply'(event, tpl) {
    const list = Template.currentData();
    const boardId = list.boardId;
    const width = parseInt(tpl.$('.list-width-value').val(), 10);

    if (!width || width < MIN_LIST_WIDTH) {
      tpl.$('.list-width-error').click();
      return;
    }
    const user = ReactiveCache.getCurrentUser();
    // #5729 In fixed width mode the input applies to the single per-board value.
    if (isFixedListWidth(boardId)) {
      if (user) {
        Meteor.call('setFixedListWidth', boardId, width);
      } else {
        setAnonFixedListWidth(boardId, width);
      }
      Popup.back();
      return;
    }
    if (isPersonalListWidth(boardId)) {
      if (user) {
        Meteor.call('applyListWidthToStorage', boardId, list._id, width, width);
      }
    } else if (user) {
      Meteor.call('applyListWidth', boardId, list._id, width, width);
    }
    Popup.back();
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
