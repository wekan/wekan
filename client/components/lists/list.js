import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { EscapeActions } from '/client/lib/escapeActions';
import { MultiSelection } from '/client/lib/multiSelection';
import { Utils } from '/client/lib/utils';
import {
  suspendBoardDragscroll,
  resumeBoardDragscroll,
} from '/client/lib/boardDragscroll';
import {
  createCardDropPreview,
  retireCardDropPreview,
} from '/client/lib/cardDropPreview';
import Cards from '/models/cards';
import {
  isDegenerateSortGap,
  computeRepairedDropIndex,
} from '/models/lib/cardSortRepair';
require('/client/lib/jquery-ui.js');

const { calculateIndex } = Utils;

// List width is a single hardcoded constant (models/lib/listWidth.js) - every
// list on every board renders at this width, for every viewer, and there is
// no way to change it: no per-board or per-list customization, no personal
// width, no auto-width mode, and no drag-resize handle. #5659/#5729/#6409
// built up exactly that kind of customization over time; all of it is gone.
import { DEFAULT_LIST_WIDTH } from '/models/lib/listWidth';

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
  const boardBodyEl =
    this.firstNode?.parentElement?.closest?.('.board-body') ||
    document.querySelector('.board-body');
  const boardView =
    boardBodyEl && Blaze.getView(boardBodyEl, 'Template.boardBody');
  const boardComponent = boardView?.templateInstance?.();

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
    // The former inline-title form selector remains unnecessary while direct
    // minicard title editing is disabled. Form controls elsewhere still must
    // never arm the sortable.
    cancel: 'input, textarea, button, select, option',
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
      // #6558: the same pointer must not ALSO pan the lane and the canvas -
      // that is what made a card drag scroll the list, scroll the board, and
      // move the card all at once. The `sort` handler below does the one
      // auto-scroll a drag needs, at the edges.
      suspendBoardDragscroll();
    },
    stop(evt, ui) {
      // #6558: panning is available again the moment the drag is over.
      resumeBoardDragscroll();
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
          .map((el) => Blaze.getData(el))
          .filter(Boolean);
      }
      const listData = Blaze.getData(ui.item.parents('.list').get(0));
      const listId = listData._id;
      const targetContainer = ui.item.parent().get(0);
      const cardDomElement = ui.item.get(0);
      const droppedCard = Blaze.getData(cardDomElement);
      // #6430: sortable('cancel') is still necessary to keep jQuery UI from
      // fighting Blaze, but it visibly returns the card to its source until a
      // large board finishes its reactive flush. Leave a presentation-only
      // clone in the drop slot until the real reactive card arrives.
      const dropPreview = !MultiSelection.isActive()
        ? createCardDropPreview(cardDomElement, targetContainer)
        : null;
      const currentBoard = Utils.getCurrentBoard();
      const defaultSwimlaneId = currentBoard.getDefaultSwimline()._id;
      let targetSwimlaneId = null;

      // only set a new swimelane ID if the swimlanes view is active
      if (
        Utils.boardView() === 'board-view-swimlanes' ||
        currentBoard.isTemplatesBoard()
      ) {
        targetSwimlaneId = Blaze.getData(
          ui.item.parents('.swimlane').get(0),
        )._id;
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
        repairedDrop.updates.forEach((u) => {
          Cards.update(u._id, { $set: { sort: u.sort } });
        });
        sortIndex = {
          base: repairedDrop.base,
          increment: repairedDrop.increment,
        };
      }

      if (MultiSelection.isActive()) {
        ReactiveCache.getCards(MultiSelection.getMongoSelector(), {
          sort: ['sort'],
        }).forEach((card, i) => {
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
        const card = droppedCard;
        const newSwimlaneId = targetSwimlaneId
          ? targetSwimlaneId
          : card.swimlaneId || defaultSwimlaneId;
        const moveResult = card.move(
          currentBoard._id,
          newSwimlaneId,
          listId,
          sortIndex.base,
        );
        retireCardDropPreview(
          dropPreview,
          card._id,
          targetContainer,
          moveResult,
        );
      }
      if (boardComponent) boardComponent.setIsDragging(false);
    },
    sort(event, ui) {
      // #443: the HORIZONTAL scroller is the .js-lists lane (.swimlane has
      // overflow: auto), NOT .board-canvas, which only overflows vertically —
      // the old code compared against a scrollLeftMax of 0 and never fired, so
      // dragging a card toward an off-screen list never auto-scrolled the board.
      const {
        computeEdgeScroll,
        findLaneUnderPointer,
      } = require('/imports/lib/boardAutoScroll');
      let scrolled = false;
      const lanes = document.querySelectorAll('.js-lists');
      const rects = Array.prototype.map.call(lanes, (el) =>
        el.getBoundingClientRect(),
      );
      const laneIndex = findLaneUnderPointer(
        rects,
        event.clientX,
        event.clientY,
      );
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
      // #6584: VERTICALLY, the thing to scroll is the LIST the pointer is over,
      // not the board canvas. `.list-body` is `overflow-y: scroll` (list.css) and
      // is what holds the cards; `.board-canvas` is `overflow-y: auto` and holds
      // the swimlanes. Scrolling the canvas moves the whole board, which is what
      // the report describes: "The whole Page/Site scrolls down and not the Line".
      //
      // It only showed up DOWNWARDS, and the asymmetry is the tell. Dragging up,
      // the canvas is usually already at scrollTop 0, so computeEdgeScroll
      // returned null, nothing here fired, and jQuery UI's own `scroll` option -
      // which acts on the placeholder's scrollParent, i.e. the list body - scrolled
      // the list, exactly as expected. Dragging down, the canvas nearly always HAS
      // room, so this fired first and scrolled the board instead of the list.
      //
      // The canvas is still scrolled, but only once the list under the pointer
      // cannot go further that way - so a drag down a long list scrolls the list,
      // and a drag past the end of it moves on to the board. Same shape as the
      // horizontal case above, which already picks the lane under the pointer.
      let scrolledList = false;
      const listBodies = document.querySelectorAll('.list-body');
      const listRects = Array.prototype.map.call(listBodies, (el) =>
        el.getBoundingClientRect(),
      );
      // findLaneUnderPointer is a plain rectangle hit-test; the name is about
      // where it was first used, not what it can be given.
      const listIndex = findLaneUnderPointer(
        listRects,
        event.clientX,
        event.clientY,
      );
      if (listIndex !== -1) {
        const nextListTop = computeEdgeScroll({
          pointer: event.clientY,
          lowEdge: listRects[listIndex].top,
          highEdge: listRects[listIndex].bottom,
          scrollPos: listBodies[listIndex].scrollTop,
          scrollSize: listBodies[listIndex].scrollHeight,
          clientSize: listBodies[listIndex].clientHeight,
        });
        if (nextListTop !== null) {
          listBodies[listIndex].scrollTop = nextListTop;
          scrolled = true;
          scrolledList = true;
        }
      }
      const canvas = scrolledList
        ? null
        : document.querySelector('.board-canvas');
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
    return DEFAULT_LIST_WIDTH;
  },

  collapsed() {
    return Utils.getListCollapseState(this);
  },
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
