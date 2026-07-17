import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { EscapeActions } from '/client/lib/escapeActions';
import { MultiSelection } from '/client/lib/multiSelection';
import { Utils } from '/client/lib/utils';
import Cards from '/models/cards';
import {
  isDegenerateSortGap,
  computeRepairedDropIndex,
} from '/models/lib/cardSortRepair';
require('/client/lib/jquery-ui.js')

const { calculateIndex } = Utils;

// ---------------------------------------------------------------------------
// #6409 List width: a single, simple model.
//
//   * Each list has ONE fixed width.
//   * SHARED mode (board default): width lives in `lists.width` and is the same
//     for everyone; only members with board write access can change it.
//   * PERSONAL mode (board setting `allowsPersonalListWidth`): each user keeps
//     their own width in their profile (or localStorage when not logged in),
//     falling back to the shared width and then the default.
//
// The old per-list "min width / max width / automatic" knobs are gone — the
// rendered width is now a single hard value (see list.jade).
//
// #5659: the default/minimum width and the resolution order live in ONE
// Meteor-free module shared with models/users.js, so every path (member,
// anonymous public-board visitor, fixed mode) falls back to the SAME default
// and all lists render the same width when nothing is customized.
// ---------------------------------------------------------------------------
import {
  DEFAULT_LIST_WIDTH,
  MIN_LIST_WIDTH,
  resolveListWidth,
} from '/models/lib/listWidth';

function isPersonalListWidth(boardId) {
  const board = ReactiveCache.getBoard(boardId);
  return !!(board && board.allowsPersonalListWidth);
}

// #6409 Auto-width follows the same scope as fixed widths:
//   * personal mode -> the user's own profile.autoWidthBoards
//   * shared mode   -> the board's `autoWidth` (same for everyone)
function effectiveAutoWidth(boardId) {
  if (isPersonalListWidth(boardId)) {
    const user = ReactiveCache.getCurrentUser();
    return !!(user && user.isAutoWidth(boardId));
  }
  const board = ReactiveCache.getBoard(boardId);
  return !!(board && board.autoWidth);
}

function readAnonListWidth(boardId, listId) {
  try {
    const stored = localStorage.getItem('wekan-list-widths');
    if (stored) {
      const widths = JSON.parse(stored);
      const w = widths[boardId] && widths[boardId][listId];
      if (typeof w === 'number' && w >= MIN_LIST_WIDTH) return w;
    }
  } catch (e) {
    console.warn('Error reading list width from localStorage:', e);
  }
  return null;
}

// ---------------------------------------------------------------------------
// #5729 Fixed (same) width for all lists.
//
// A per-viewer, per-board toggle that makes EVERY list render at a single
// shared value, and makes dragging any list update that one value (so all lists
// change together). Stored exactly like the personal width:
//   * logged-in -> profile.fixedListWidthBoards / profile.fixedListWidths
//   * anonymous  -> localStorage (mirrors readAnonListWidth)
// ---------------------------------------------------------------------------
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

// Whether the current viewer has fixed width mode enabled for this board.
function isFixedListWidth(boardId) {
  const user = ReactiveCache.getCurrentUser();
  if (user) {
    return !!user.isFixedListWidth(boardId);
  }
  return readAnonFixedListWidthEnabled(boardId);
}

// The single width every list should use when fixed width mode is enabled.
function fixedListWidthValue(boardId) {
  const user = ReactiveCache.getCurrentUser();
  if (user) {
    return user.getFixedListWidth(boardId);
  }
  return readAnonFixedListWidth(boardId);
}

// Persist the single fixed width for the whole board (anon localStorage).
function saveAnonFixedListWidth(boardId, width) {
  try {
    const stored = localStorage.getItem('wekan-fixed-list-width');
    const widths = stored ? JSON.parse(stored) : {};
    widths[boardId] = width;
    localStorage.setItem('wekan-fixed-list-width', JSON.stringify(widths));
  } catch (e) {
    console.warn('Error saving fixed list width to localStorage:', e);
  }
}

function effectiveListWidth(list) {
  if (!list) return DEFAULT_LIST_WIDTH;
  // #5659: all inputs are gathered here, but the fallback order and the ONE
  // default width live in models/lib/listWidth.js (shared + unit tested).
  const fixedEnabled = isFixedListWidth(list.boardId);
  const personalMode = isPersonalListWidth(list.boardId);
  let personalWidth = null;
  if (personalMode) {
    const user = ReactiveCache.getCurrentUser();
    if (user) {
      const widths = user.getListWidths();
      personalWidth = widths[list.boardId] && widths[list.boardId][list._id];
    } else {
      personalWidth = readAnonListWidth(list.boardId, list._id);
    }
  }
  return resolveListWidth({
    // #5729 In fixed width mode every list renders at the single shared value.
    fixedEnabled,
    fixedWidth: fixedEnabled ? fixedListWidthValue(list.boardId) : null,
    sharedWidth: list.width,
    personalMode,
    personalWidth,
  });
}

// Can the current user change THIS list's width by dragging?
//  - never while the board/list is in auto-width mode (the width is computed)
//  - personal mode: always (it only affects their own view)
//  - shared mode: only with board write access
function canResizeList(list) {
  if (!list) return false;
  if (effectiveAutoWidth(list.boardId)) return false;
  // #5729 Fixed width is the viewer's own per-board setting, so any viewer
  // (logged-in or anonymous) may drag-resize; the change applies to all lists.
  if (isFixedListWidth(list.boardId)) return true;
  if (isPersonalListWidth(list.boardId)) return true;
  return Utils.canModifyBoard();
}

// Persist a new width to the place that matches the current board mode.
function saveListWidth(list, width) {
  if (!list) return;
  const boardId = list.boardId;
  const listId = list._id;
  const user = ReactiveCache.getCurrentUser();
  // #5729 In fixed width mode, persist to the single per-board value instead of
  // the per-list width, so EVERY list re-renders at the new width.
  if (isFixedListWidth(boardId)) {
    if (user) {
      Meteor.call('setFixedListWidth', boardId, width, error => {
        if (error) console.error('Error saving fixed list width:', error);
      });
    } else {
      saveAnonFixedListWidth(boardId, width);
    }
    return;
  }
  if (isPersonalListWidth(boardId)) {
    if (user) {
      Meteor.call('applyListWidthToStorage', boardId, listId, width, width);
    } else {
      try {
        const stored = localStorage.getItem('wekan-list-widths');
        const widths = stored ? JSON.parse(stored) : {};
        if (!widths[boardId]) widths[boardId] = {};
        widths[boardId][listId] = width;
        localStorage.setItem('wekan-list-widths', JSON.stringify(widths));
      } catch (e) {
        console.warn('Error saving personal list width to localStorage:', e);
      }
    }
  } else if (user) {
    // Shared width: server also enforces board membership.
    Meteor.call('applyListWidth', boardId, listId, width, width, error => {
      if (error) console.error('Error saving shared list width:', error);
    });
  }
}

Template.list.onCreated(function () {
  this.newCardFormIsVisible = new ReactiveVar(true);

  // Proxy - find the listBody child template instance via the DOM
  this.openForm = (options) => {
    const listBodyEl = this.find('.list-body');
    const view = listBodyEl && Blaze.getView(listBodyEl, 'Template.listBody');
    const listBodyInstance = view?.templateInstance?.();
    if (listBodyInstance) listBodyInstance.openForm(options);
  };
});

// The jquery UI sortable library is the best solution I've found so far. I
// tried sortable and dragula but they were not powerful enough four our use
// case. I also considered writing/forking a drag-and-drop + sortable library
// but it's probably too much work.
// By calling asking the sortable library to cancel its move on the `stop`
// callback, we basically solve all issues related to reactive updates. A
// comment below provides further details.
Template.list.onRendered(function () {
  const boardBodyEl = this.firstNode?.parentElement?.closest?.('.board-body') ||
    document.querySelector('.board-body');
  const boardView = boardBodyEl && Blaze.getView(boardBodyEl, 'Template.boardBody');
  const boardComponent = boardView?.templateInstance?.();

  // Initialize list resize functionality immediately
  this.initializeListResize();

  const itemsSelector = '.js-minicard:not(.placeholder, .js-card-composer)';
  const $cards = this.$('.js-minicards');

  // Destroy any existing sortable before re-initializing. Without this, a
  // re-render of the list (e.g. when a Card Details panel opens) binds a SECOND
  // sortable to the same .js-minicards element, so dragging a card from its
  // handle fires the `stop` handler twice and the card appears to duplicate.
  // Mirrors the guard in swimlanes.js initSortable().
  if ($cards.data('uiSortable') || $cards.data('sortable')) {
    $cards.sortable('destroy');
  }

  $cards.sortable({
    connectWith: '.js-minicards:not(.js-list-full)',
    tolerance: 'pointer',
    appendTo: '.board-canvas',
    helper(evt, item) {
      const helper = item.clone();
      if (MultiSelection.isActive()) {
        const andNOthers = $cards.find('.js-minicard.is-checked').length - 1;
        if (andNOthers > 0) {
          helper.append(
            $(
              Blaze.toHTML(
                HTML.DIV(
                  { class: 'and-n-other' },
                  TAPi18n.__('and-n-other-card', { count: andNOthers }),
                ),
              ),
            ),
          );
        }
      }
      return helper;
    },
    distance: 7,
    items: itemsSelector,
    placeholder: 'minicard-wrapper placeholder',
    scrollSpeed: 10,
    start(evt, ui) {
      ui.helper.css('z-index', 1000);
      ui.placeholder.height(ui.helper.height());
      EscapeActions.executeUpTo('popup-close');
      if (boardComponent) boardComponent.setIsDragging(true);
    },
    stop(evt, ui) {
      // To attribute the new index number, we need to get the DOM element
      // of the previous and the following card -- if any.
      const prevCardDom = ui.item.prev('.js-minicard').get(0);
      const nextCardDom = ui.item.next('.js-minicard').get(0);
      const nCards = MultiSelection.isActive() ? MultiSelection.count() : 1;
      let sortIndex = calculateIndex(prevCardDom, nextCardDom, nCards);

      // #3826: cards created by the "add subtask" flow were all inserted with
      // a constant sort of -1, so a list full of subtask cards contains only
      // ties. No number lies strictly between two equal sorts, so
      // calculateIndex returns base === neighbour sort with increment 0: the
      // write is then discarded by Card.move()'s no-op guard and the card
      // snaps back (and a multi-selection drop would give every selected card
      // the SAME sort, losing their relative order). When the drop landed in
      // such a degenerate gap, capture the target list's sibling cards in
      // their current visual order (before sortable('cancel') reshuffles the
      // DOM) so their sorts can be repaired below.
      const prevCardData = prevCardDom ? Blaze.getData(prevCardDom) : null;
      const nextCardData = nextCardDom ? Blaze.getData(nextCardDom) : null;
      let orderedSiblingCards = null;
      if (
        isDegenerateSortGap(
          prevCardData ? prevCardData.sort : null,
          nextCardData ? nextCardData.sort : null,
        )
      ) {
        orderedSiblingCards = ui.item
          .parent()
          .children(itemsSelector)
          .not(ui.item)
          .toArray()
          .map(el => Blaze.getData(el))
          .filter(Boolean);
      }
      const listData = Blaze.getData(ui.item.parents('.list').get(0));
      const listId = listData._id;
      const currentBoard = Utils.getCurrentBoard();
      const defaultSwimlaneId = currentBoard.getDefaultSwimline()._id;
      let targetSwimlaneId = null;

      // only set a new swimelane ID if the swimlanes view is active
      if (
        Utils.boardView() === 'board-view-swimlanes' ||
        currentBoard.isTemplatesBoard()
      ) {
        targetSwimlaneId = Blaze.getData(ui.item.parents('.swimlane').get(0))
          ._id;
      } else if (listData.swimlaneId) {
        targetSwimlaneId = listData.swimlaneId;
      }

      // Normally the jquery-ui sortable library moves the dragged DOM element
      // to its new position, which disrupts Blaze reactive updates mechanism
      // (especially when we move the last card of a list, or when multiple
      // users move some cards at the same time). To prevent these UX glitches
      // we ask sortable to gracefully cancel the move, and to put back the
      // DOM in its initial state. The card move is then handled reactively by
      // Blaze with the below query.
      $cards.sortable('cancel');

      // #3826: the drop landed between two cards whose sorts do not strictly
      // increase (duplicate -1 sorts from subtask creation, or legacy data).
      // Repair the sibling sorts with the minimal bumps that make the visible
      // order strictly increasing, then recompute the drop index from the
      // repaired neighbours: base now falls strictly between them and the
      // increment is strictly positive (distinct sorts for a multi-selection).
      if (orderedSiblingCards && prevCardData && nextCardData) {
        const repairedDrop = computeRepairedDropIndex(
          orderedSiblingCards,
          prevCardData,
          nextCardData,
          nCards,
        );
        repairedDrop.updates.forEach(u => {
          Cards.update(u._id, { $set: { sort: u.sort } });
        });
        sortIndex = { base: repairedDrop.base, increment: repairedDrop.increment };
      }

      if (MultiSelection.isActive()) {
        ReactiveCache.getCards(MultiSelection.getMongoSelector(), { sort: ['sort'] }).forEach((card, i) => {
          const newSwimlaneId = targetSwimlaneId
            ? targetSwimlaneId
            : card.swimlaneId || defaultSwimlaneId;
          card.move(
            currentBoard._id,
            newSwimlaneId,
            listId,
            sortIndex.base + i * sortIndex.increment,
          );
        });
      } else {
        const cardDomElement = ui.item.get(0);
        const card = Blaze.getData(cardDomElement);
        const newSwimlaneId = targetSwimlaneId
          ? targetSwimlaneId
          : card.swimlaneId || defaultSwimlaneId;
        card.move(currentBoard._id, newSwimlaneId, listId, sortIndex.base);
      }
      if (boardComponent) boardComponent.setIsDragging(false);
    },
    sort(event, ui) {
      // #443: the HORIZONTAL scroller is the .js-lists lane (.swimlane has
      // overflow: auto), NOT .board-canvas, which only overflows vertically —
      // the old code compared against a scrollLeftMax of 0 and never fired, so
      // dragging a card toward an off-screen list never auto-scrolled the board.
      const { computeEdgeScroll, findLaneUnderPointer } = require('/imports/lib/boardAutoScroll');
      let scrolled = false;
      const lanes = document.querySelectorAll('.js-lists');
      const rects = Array.prototype.map.call(lanes, el => el.getBoundingClientRect());
      const laneIndex = findLaneUnderPointer(rects, event.clientX, event.clientY);
      if (laneIndex !== -1) {
        const nextLeft = computeEdgeScroll({
          pointer: event.clientX,
          lowEdge: rects[laneIndex].left,
          highEdge: rects[laneIndex].right,
          scrollPos: lanes[laneIndex].scrollLeft,
          scrollSize: lanes[laneIndex].scrollWidth,
          clientSize: lanes[laneIndex].clientWidth,
        });
        if (nextLeft !== null) {
          lanes[laneIndex].scrollLeft = nextLeft;
          scrolled = true;
        }
      }
      // vertical auto-scroll stays on the board canvas
      const canvas = document.querySelector('.board-canvas');
      if (canvas) {
        const crect = canvas.getBoundingClientRect();
        const nextTop = computeEdgeScroll({
          pointer: event.clientY,
          lowEdge: crect.top,
          highEdge: crect.bottom,
          scrollPos: canvas.scrollTop,
          scrollSize: canvas.scrollHeight,
          clientSize: canvas.clientHeight,
        });
        if (nextTop !== null) {
          canvas.scrollTop = nextTop;
          scrolled = true;
        }
      }
      // #6477: after an auto-scroll, jQuery UI sortable's cached container/item
      // geometry is STALE — it snapshots positions at drag start and on its own
      // placeholder moves, never on our manual scroll here. With long/overflowing
      // lists (exactly what triggers auto-scroll) the drop then resolved against a
      // stale map and parked the placeholder in the WRONG swimlane's copy of the
      // list, so a card dragged between swimlanes snapped back into its source
      // swimlane (the stop handler's ui.item.parents('.swimlane') faithfully
      // persisted it). Re-cache positions so the placeholder and drop resolve
      // against the scrolled layout. Complements the DOM-mutation refresh in
      // listBody.js (#2769), which does not fire on scroll.
      if (scrolled) {
        $cards.sortable('refreshPositions');
      }
    },
  });

  this.autorun(() => {
    if ($cards.data('uiSortable') || $cards.data('sortable')) {
      if (Utils.isTouchScreenOrShowDesktopDragHandles()) {
        $cards.sortable('option', 'handle', '.handle');
      } else {
        $cards.sortable('option', 'handle', '.minicard');
      }

      $cards.sortable(
        'option',
        'disabled',
        // Disable drag-dropping when user is not member
        !Utils.canModifyBoard(),
        // Not disable drag-dropping while in multi-selection mode
        // MultiSelection.isActive() || !Utils.canModifyBoard(),
      );
    }
  });

  // We want to re-run this function any time a card is added.
  this.autorun(() => {
    const currentBoardId = Tracker.nonreactive(() => {
      return Session.get('currentBoard');
    });
    // #1554: reactive dependency so newly added / re-rendered minicards are
    // (re)initialized as droppable for label/member drags. The dependency
    // (Cards.find(...).fetch()) was dropped in 7673c77c5, so the autorun ran
    // ONCE per list render and cards added afterwards silently rejected
    // sidebar label/member drops until the board was re-entered. Re-running
    // .droppable() on initialized elements is an idempotent option refresh.
    ReactiveCache.getCards({ boardId: currentBoardId });
    Tracker.afterFlush(() => {
      $cards.find(itemsSelector).droppable({
        hoverClass: 'draggable-hover-card',
        accept: '.js-member,.js-label',
        drop(event, ui) {
          const cardId = Blaze.getData(this)._id;
          const card = ReactiveCache.getCard(cardId);

          if (ui.draggable.hasClass('js-member')) {
            const memberId = Blaze.getData(ui.draggable.get(0)).userId;
            card.assignMember(memberId);
          } else {
            const labelId = Blaze.getData(ui.draggable.get(0))._id;
            card.addLabel(labelId);
          }
        },
      });
    });
  });
});

Template.list.helpers({
  listWidth() {
    return effectiveListWidth(Template.currentData());
  },

  // Whether to show the drag-resize handle for this list.
  canResizeList() {
    return canResizeList(Template.currentData());
  },

  autoWidth() {
    const list = Template.currentData();
    return !!list && effectiveAutoWidth(list.boardId);
  },

  collapsed() {
    return Utils.getListCollapseState(this);
  },
});

// initializeListResize as a method on the template instance
Template.list.onCreated(function () {
  const tpl = this;

  tpl.initializeListResize = function () {
    // Resolve list data from the template instance to avoid relying on
    // Template.currentData() from async callbacks where no current view exists.
    const list = tpl.data || Blaze.getData(tpl.firstNode);
    if (!list) {
      console.warn('No list data available for list resize initialization');
      return;
    }
    const $list = tpl.$('.js-list');
    const $resizeHandle = tpl.$('.js-list-resize-handle');

    const isCollapsed = Utils.getListCollapseState(list);
    if (isCollapsed) {
      // Collapsed lists do not render a resize handle by design.
      return;
    }

    // Check if elements exist
    if (!$list.length || !$resizeHandle.length) {
      console.warn('List or resize handle not found, retrying in 100ms');
      Meteor.setTimeout(() => {
        if (!tpl.view.isDestroyed) {
          tpl.initializeListResize();
        }
      }, 100);
      return;
    }

    // #6409: show the resize handle only when the list is not collapsed and the
    // user is allowed to change this list's width (always in personal mode; only
    // with board write access in shared mode).
    tpl.autorun(() => {
      const isCollapsed = Utils.getListCollapseState(list);
      if (isCollapsed || !canResizeList(list)) {
        $resizeHandle.hide();
      } else {
        $resizeHandle.show();
      }
    });

    let isResizing = false;
    let startX = 0;
    let startWidth = 0;
    let minWidth = MIN_LIST_WIDTH; // Minimum width matching system default

    // Read the horizontal page coordinate from either a jQuery mouse event
    // or a native touch event (touchstart/move expose `touches`, touchend
    // exposes `changedTouches`).
    const getEventPageX = (e) => {
      const oe = e.originalEvent || e;
      if (oe.touches && oe.touches.length) return oe.touches[0].pageX;
      if (oe.changedTouches && oe.changedTouches.length) return oe.changedTouches[0].pageX;
      return e.pageX;
    };

    const startResize = (e) => {
      isResizing = true;
      startX = getEventPageX(e);
      startWidth = $list.outerWidth();

      // Add visual feedback
      $list.addClass('list-resizing');
      $('body').addClass('list-resizing-active');

      // Prevent text selection during resize
      $('body').css('user-select', 'none');

      e.preventDefault();
      e.stopPropagation();
    };

    const doResize = (e) => {
      if (!isResizing) {
        return;
      }

      const currentX = getEventPageX(e);
      const deltaX = currentX - startX;
      const newWidth = Math.max(minWidth, startWidth + deltaX);

      // Apply the new width immediately for real-time feedback
      $list[0].style.setProperty('--list-width', `${newWidth}px`);
      $list[0].style.setProperty('width', `${newWidth}px`);
      $list[0].style.setProperty('min-width', `${newWidth}px`);
      $list[0].style.setProperty('max-width', `${newWidth}px`);
      $list[0].style.setProperty('flex', 'none');
      $list[0].style.setProperty('flex-basis', 'auto');
      $list[0].style.setProperty('flex-grow', '0');
      $list[0].style.setProperty('flex-shrink', '0');

      e.preventDefault();
      e.stopPropagation();
    };

    const stopResize = (e) => {
      if (!isResizing) return;

      isResizing = false;

      // Calculate final width
      const currentX = getEventPageX(e);
      const deltaX = currentX - startX;
      const finalWidth = Math.max(minWidth, startWidth + deltaX);

      // Ensure the final width is applied
      $list[0].style.setProperty('--list-width', `${finalWidth}px`);
      $list[0].style.setProperty('width', `${finalWidth}px`);
      $list[0].style.setProperty('min-width', `${finalWidth}px`);
      $list[0].style.setProperty('max-width', `${finalWidth}px`);
      $list[0].style.setProperty('flex', 'none');
      $list[0].style.setProperty('flex-basis', 'auto');
      $list[0].style.setProperty('flex-grow', '0');
      $list[0].style.setProperty('flex-shrink', '0');

      // Remove visual feedback but keep the width
      $list.removeClass('list-resizing');
      $('body').removeClass('list-resizing-active');
      $('body').css('user-select', '');

      // #6409: persist to the shared list width or the user's personal width,
      // depending on the board's mode.
      saveListWidth(list, finalWidth);

      e.preventDefault();
    };

    // Mouse events
    $resizeHandle.on('mousedown', startResize);
    $(document).on('mousemove', doResize);
    $(document).on('mouseup', stopResize);

    // Touch events for mobile.
    // NOTE: jQuery's .on() does not accept an addEventListener-style options
    // object — passing { passive: false } made jQuery bind the object itself
    // as the handler, throwing "handler.apply is not a function" on every
    // touch. Use the native API so { passive: false } actually applies and
    // preventDefault() works during the resize.
    $resizeHandle[0].addEventListener('touchstart', startResize, { passive: false });
    document.addEventListener('touchmove', doResize, { passive: false });
    document.addEventListener('touchend', stopResize, { passive: false });

    // Prevent dragscroll interference
    $resizeHandle.on('mousedown', (e) => {
      e.stopPropagation();
    });

    // Clean up on component destruction
    tpl.view.onViewDestroyed(() => {
      $(document).off('mousemove', doResize);
      $(document).off('mouseup', stopResize);
      document.removeEventListener('touchmove', doResize);
      document.removeEventListener('touchend', stopResize);
    });
  };
});

Template.miniList.events({
  'click .js-select-list'() {
    const listId = this._id;
    Session.set('currentList', listId);
  },
});

// NOTE: Collapsed list drag-reorder was previously here but referenced
// boardComponent from an outer scope. If needed, this should be moved
// into Template.list.onRendered where boardComponent is available.
