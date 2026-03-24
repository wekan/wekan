import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { EscapeActions } from '/client/lib/escapeActions';
import { MultiSelection } from '/client/lib/multiSelection';
import { Utils } from '/client/lib/utils';
require('/client/lib/jquery-ui.js')

const { calculateIndex } = Utils;

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
      const sortIndex = calculateIndex(prevCardDom, nextCardDom, nCards);
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
      const $boardCanvas = $('.board-canvas');
      const boardCanvas = $boardCanvas[0];

      if (event.pageX < 10) { // scroll to the left
        boardCanvas.scrollLeft -= 15;
        ui.helper[0].offsetLeft -= 15;
      }
      if (
        event.pageX > boardCanvas.offsetWidth - 10 &&
        boardCanvas.scrollLeft < $boardCanvas.data('scrollLeftMax') // don't scroll more than possible
      ) { // scroll to the right
        boardCanvas.scrollLeft += 15;
      }
      if (
        event.pageY > boardCanvas.offsetHeight - 10 &&
        event.pageY + boardCanvas.scrollTop < $boardCanvas.data('scrollTopMax') // don't scroll more than possible
      ) { // scroll to the bottom
        boardCanvas.scrollTop += 15;
      }
      if (event.pageY < 10) { // scroll to the top
        boardCanvas.scrollTop -= 15;
      }
    },
    activate(event, ui) {
      const $boardCanvas = $('.board-canvas');
      const boardCanvas = $boardCanvas[0];
      // scrollTopMax and scrollLeftMax only available at Firefox (https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollTopMax)
      // https://www.it-swarm.com.de/de/javascript/so-erhalten-sie-den-maximalen-dokument-scrolltop-wert/1069126844/
      $boardCanvas.data('scrollTopMax', boardCanvas.scrollHeight - boardCanvas.clientTop);
      // https://stackoverflow.com/questions/5138373/how-do-i-get-the-max-value-of-scrollleft/5704386#5704386
      $boardCanvas.data('scrollLeftMax', boardCanvas.scrollWidth - boardCanvas.clientWidth);
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
    const user = ReactiveCache.getCurrentUser();
    const list = Template.currentData();
    if (!list) return 270; // Return default width if list is not available

    if (user) {
      // For logged-in users, get from user profile
      return user.getListWidthFromStorage(list.boardId, list._id);
    } else {
      // For non-logged-in users, get from localStorage
      try {
        const stored = localStorage.getItem('wekan-list-widths');
        if (stored) {
          const widths = JSON.parse(stored);
          if (widths[list.boardId] && widths[list.boardId][list._id]) {
            return widths[list.boardId][list._id];
          }
        }
      } catch (e) {
        console.warn('Error reading list width from localStorage:', e);
      }
      return 270; // Return default width if not found
    }
  },

  listConstraint() {
    const user = ReactiveCache.getCurrentUser();
    const list = Template.currentData();
    if (!list) return 550; // Return default constraint if list is not available

    if (user) {
      // For logged-in users, get from user profile
      return user.getListConstraintFromStorage(list.boardId, list._id);
    } else {
      // For non-logged-in users, get from localStorage
      try {
        const stored = localStorage.getItem('wekan-list-constraints');
        if (stored) {
          const constraints = JSON.parse(stored);
          if (constraints[list.boardId] && constraints[list.boardId][list._id]) {
            return constraints[list.boardId][list._id];
          }
        }
      } catch (e) {
        console.warn('Error reading list constraint from localStorage:', e);
      }
      return 550; // Return default constraint if not found
    }
  },

  autoWidth() {
    const user = ReactiveCache.getCurrentUser();
    const list = Template.currentData();
    if (!user) {
      // For non-logged-in users, auto-width is disabled
      return false;
    }
    return user.isAutoWidth(list.boardId);
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

    // Helper to get autoWidth state
    const getAutoWidth = () => {
      const user = ReactiveCache.getCurrentUser();
      if (!user) return false;
      return user.isAutoWidth(list.boardId);
    };

    // Reactively show/hide resize handle based on collapse and auto-width state
    tpl.autorun(() => {
      const isAutoWidth = getAutoWidth();
      const isCollapsed = Utils.getListCollapseState(list);
      if (isCollapsed || isAutoWidth) {
        $resizeHandle.hide();
      } else {
        $resizeHandle.show();
      }
    });

    let isResizing = false;
    let startX = 0;
    let startWidth = 0;
    let minWidth = 270; // Minimum width matching system default

    // Get listConstraint value
    const getListConstraint = () => {
      const user = ReactiveCache.getCurrentUser();
      if (user) {
        return user.getListConstraintFromStorage(list.boardId, list._id);
      }
      try {
        const stored = localStorage.getItem('wekan-list-constraints');
        if (stored) {
          const constraints = JSON.parse(stored);
          if (constraints[list.boardId] && constraints[list.boardId][list._id]) {
            return constraints[list.boardId][list._id];
          }
        }
      } catch (e) {}
      return 550;
    };

    const startResize = (e) => {
      isResizing = true;
      startX = e.pageX || e.originalEvent.touches[0].pageX;
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

      const currentX = e.pageX || e.originalEvent.touches[0].pageX;
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
      const currentX = e.pageX || e.originalEvent.touches[0].pageX;
      const deltaX = currentX - startX;
      const finalWidth = Math.max(minWidth, startWidth + deltaX);
      const listConstraint = getListConstraint();

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

      // Save the new width using the existing system
      const boardId = list.boardId;
      const listId = list._id;

      if (process.env.DEBUG === 'true') {
      }

      const currentUser = ReactiveCache.getCurrentUser();
      if (currentUser) {
        // For logged-in users, use server method
        Meteor.call('applyListWidthToStorage', boardId, listId, finalWidth, listConstraint, (error, result) => {
          if (error) {
            console.error('Error saving list width:', error);
          } else {
            if (process.env.DEBUG === 'true') {
            }
          }
        });
      } else {
        // For non-logged-in users, save to localStorage directly
        try {
          // Save list width
          const storedWidths = localStorage.getItem('wekan-list-widths');
          let widths = storedWidths ? JSON.parse(storedWidths) : {};

          if (!widths[boardId]) {
            widths[boardId] = {};
          }
          widths[boardId][listId] = finalWidth;

          localStorage.setItem('wekan-list-widths', JSON.stringify(widths));

          // Save list constraint
          const storedConstraints = localStorage.getItem('wekan-list-constraints');
          let constraints = storedConstraints ? JSON.parse(storedConstraints) : {};

          if (!constraints[boardId]) {
            constraints[boardId] = {};
          }
          constraints[boardId][listId] = listConstraint;

          localStorage.setItem('wekan-list-constraints', JSON.stringify(constraints));

          if (process.env.DEBUG === 'true') {
          }
        } catch (e) {
          console.warn('Error saving list width/constraint to localStorage:', e);
        }
      }

      e.preventDefault();
    };

    // Mouse events
    $resizeHandle.on('mousedown', startResize);
    $(document).on('mousemove', doResize);
    $(document).on('mouseup', stopResize);

    // Touch events for mobile
    $resizeHandle.on('touchstart', startResize, { passive: false });
    $(document).on('touchmove', doResize, { passive: false });
    $(document).on('touchend', stopResize, { passive: false });

    // Prevent dragscroll interference
    $resizeHandle.on('mousedown', (e) => {
      e.stopPropagation();
    });

    // Reactively update resize handle visibility when auto-width or collapse changes
    tpl.autorun(() => {
      const collapsed = Utils.getListCollapseState(list);
      if (getAutoWidth() || collapsed) {
        $resizeHandle.hide();
      } else {
        $resizeHandle.show();
      }
    });

    // Clean up on component destruction
    tpl.view.onViewDestroyed(() => {
      $(document).off('mousemove', doResize);
      $(document).off('mouseup', stopResize);
      $(document).off('touchmove', doResize);
      $(document).off('touchend', stopResize);
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
