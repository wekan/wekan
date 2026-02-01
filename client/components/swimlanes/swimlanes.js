import { ReactiveCache } from '/imports/reactiveCache';
import dragscroll from '@wekanteam/dragscroll';
const { calculateIndex } = Utils;

function getBoardComponent() {
  // as list can be rendered from multiple inner elements, feels like a reliable
  // way to get the components having rendered the board
  return BlazeComponent.getComponentForElement(document.getElementsByClassName('board-canvas')[0]);
}

function saveSorting(ui) {
  // To attribute the new index number, we need to get the DOM element
  // of the previous and the following list -- if any.
  const prevListDom = ui.item.prev('.js-list').get(0);
  const nextListDom = ui.item.next('.js-list').get(0);
  const sortIndex = calculateIndex(prevListDom, nextListDom, 1);

  const listDomElement = ui.item.get(0);
  if (!listDomElement) {
    return;
  }

  let list;
  try {
    list = Blaze.getData(listDomElement);
  } catch (error) {
    return;
  }

  if (!list) {
    return;
  }

  // Detect if the list was dropped in a different swimlane
  const targetSwimlaneDom = ui.item.closest('.js-swimlane');
  let targetSwimlaneId = null;

  if (targetSwimlaneDom.length > 0) {
    // List was dropped in a swimlane
    try {
      targetSwimlaneId = targetSwimlaneDom.attr('id').replace('swimlane-', '');
    } catch (error) {
      return;
    }
  } else {
    // List was dropped in lists view (not swimlanes view)
    // In this case, assign to the default swimlane
    const currentBoard = ReactiveCache.getBoard(Session.get('currentBoard'));
    if (currentBoard) {
      const defaultSwimlane = currentBoard.getDefaultSwimline();
      if (defaultSwimlane) {
        targetSwimlaneId = defaultSwimlane._id;
      }
    }
  }

  // Get the original swimlane ID of the list (handle backward compatibility)
  const originalSwimlaneId = list.getEffectiveSwimlaneId ? list.getEffectiveSwimlaneId() : (list.swimlaneId || null);

  // Prepare update object
  const updateData = {
    sort: sortIndex.base,
  };

  // Check if the list was dropped in a different swimlane
  const isDifferentSwimlane = targetSwimlaneId && targetSwimlaneId !== originalSwimlaneId;

  // If the list was dropped in a different swimlane, update the swimlaneId
  if (isDifferentSwimlane) {
    updateData.swimlaneId = targetSwimlaneId;

    // Move all cards in the list to the new swimlane
    const cardsInList = ReactiveCache.getCards({
      listId: list._id,
      archived: false
    });

    cardsInList.forEach(card => {
      card.move(list.boardId, targetSwimlaneId, list._id);
    });

    // Don't cancel the sortable when moving to a different swimlane
    // The DOM move should be allowed to complete
  }
  // Allow reordering within the same swimlane by not canceling the sortable

  try {
    Lists.update(list._id, {
      $set: updateData,
    });
  } catch (error) {
    return;
  }

  // Save to localStorage for non-logged-in users (backup)
  if (!Meteor.userId()) {
    try {
      const boardId = list.boardId;
      const listId = list._id;
      const listOrderKey = `wekan-list-order-${boardId}`;

      let listOrder = JSON.parse(localStorage.getItem(listOrderKey) || '{}');
      if (!listOrder.lists) listOrder.lists = [];

      const listIndex = listOrder.lists.findIndex(l => l.id === listId);
      if (listIndex >= 0) {
        listOrder.lists[listIndex].sort = sortIndex.base;
        listOrder.lists[listIndex].swimlaneId = updateData.swimlaneId;
        listOrder.lists[listIndex].updatedAt = new Date().toISOString();
      } else {
        listOrder.lists.push({
          id: listId,
          sort: sortIndex.base,
          swimlaneId: updateData.swimlaneId
        });
      }

      localStorage.setItem(listOrderKey, JSON.stringify(listOrder));
    } catch (e) {
    }
  }

  // Persist to server
  Meteor.call('updateListSort', list._id, list.boardId, updateData, function (error) {
    if (error) {
      Meteor.subscribe('board', list.boardId, false);
    }
  });

  // Try to get board component
  try {
    const boardComponent = BlazeComponent.getComponentForElement(ui.item[0]);
    if (boardComponent && boardComponent.setIsDragging) {
      boardComponent.setIsDragging(false);
    }
  } catch (e) {
    // Silent fail
  }

  // Re-enable dragscroll after list dragging is complete
  try {
    dragscroll.reset();
  } catch (e) {
    // Silent fail
  }

  // Re-enable dragscroll on all swimlanes
  $('.js-swimlane').each(function () {
    $(this).addClass('dragscroll');
  });
}

function currentListIsInThisSwimlane(swimlaneId) {
  const currentList = Utils.getCurrentList();
  return (
    currentList &&
    (currentList.swimlaneId === swimlaneId || currentList.swimlaneId === '')
  );
}

function currentList(listId, swimlaneId) {
  const list = Utils.getCurrentList();
  return list && list._id == listId && (list.swimlaneId === swimlaneId || list.swimlaneId === '');
}


function currentCardIsInThisList(listId, swimlaneId) {
  const currentCard = Utils.getCurrentCard();
  //const currentUser = ReactiveCache.getCurrentUser();
  if (
    //currentUser &&
    //currentUser.profile &&
    Utils.boardView() === 'board-view-swimlanes'
  )
    return (
      currentCard &&
      currentCard.listId === listId &&
      currentCard.swimlaneId === swimlaneId
    );
  else if (
    //currentUser &&
    //currentUser.profile &&
    Utils.boardView() === 'board-view-lists'
  )
    return (
      currentCard &&
      currentCard.listId === listId
    );

  // https://github.com/wekan/wekan/issues/1623
  // https://github.com/ChronikEwok/wekan/commit/cad9b20451bb6149bfb527a99b5001873b06c3de
  // TODO: In public board, if you would like to switch between List/Swimlane view, you could
  //       1) If there is no view cookie, save to cookie board-view-lists
  //          board-view-lists / board-view-swimlanes / board-view-cal
  //       2) If public user changes clicks board-view-lists then change view and
  //          then change view and save cookie with view value
  //          without using currentuser above, because currentuser is null.
}

function syncListOrderFromStorage(boardId) {
  if (Meteor.userId()) {
    // Logged-in users: don't use localStorage, trust server
    return;
  }

  try {
    const listOrderKey = `wekan-list-order-${boardId}`;
    const storageData = localStorage.getItem(listOrderKey);

    if (!storageData) return;

    const listOrder = JSON.parse(storageData);
    if (!listOrder.lists || listOrder.lists.length === 0) return;

    // Compare each list's order in localStorage with database
    listOrder.lists.forEach(storedList => {
      const dbList = Lists.findOne(storedList.id);
      if (dbList) {
        // Check if localStorage has newer data (compare timestamps)
        const storageTime = new Date(storedList.updatedAt).getTime();
        const dbTime = new Date(dbList.modifiedAt).getTime();

        // If storage is newer OR db is missing the field, use storage value
        if (storageTime > dbTime || dbList.sort !== storedList.sort) {
          console.debug(`Restoring list ${storedList.id} sort from localStorage (storage: ${storageTime}, db: ${dbTime})`);

          // Update local minimongo first
          Lists.update(storedList.id, {
            $set: {
              sort: storedList.sort,
              swimlaneId: storedList.swimlaneId,
            },
          });
        }
      }
    });
  } catch (e) {
    console.warn('Failed to sync list order from localStorage:', e);
  }
};


BlazeComponent.extendComponent({

  initializeSortableLists() {
    let boardComponent = getBoardComponent();

    // needs to be run again on uncollapsed
    const handleSelector = Utils.isMiniScreen()
      ? '.js-list-handle'
      : '.list-header-name-container';
    const $lists = this.$('.js-list');
    const $parent = $lists.parent();

    if ($lists.length > 0) {

      // Check for drag handles
      const $handles = $parent.find(handleSelector);

      // Test if drag handles are clickable
      $handles.on('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
      });

      $parent.sortable({
        connectWith: '.js-swimlane, .js-lists',
        tolerance: 'pointer',
        appendTo: '.board-canvas',
        helper: 'clone',
        items: '.js-list',
        placeholder: 'list placeholder',
        distance: 7,
        handle: handleSelector,
        disabled: !Utils.canModifyBoard(),
        start(evt, ui) {
          ui.helper.css('z-index', 1000);
          width = ui.helper.width();
          height = ui.helper.height();
          ui.placeholder.height(height);
          ui.placeholder.width(width);
          ui.placeholder[0].setAttribute('style', `width: ${width}px !important; height: ${height}px !important;`);
          EscapeActions.executeUpTo('popup-close');
          boardComponent.setIsDragging(true);
        },
        stop(evt, ui) {
          boardComponent.setIsDragging(false);
          saveSorting(ui);
        },
        sort(event, ui) {
          Utils.scrollIfNeeded(event);
        },
      });
    }
  },

  onRendered() {
    // can be rendered from either swimlane or board; check with DOM class heuristic,
    const $listsDom = this.$('.js-lists');
        // Sync list order from localStorage on board load
        const boardId = Session.get('currentBoard');
        if (boardId) {
          // Small delay to allow pubsub to settle
          Meteor.setTimeout(() => {
            syncListOrderFromStorage(boardId);
          }, 500);
        }

    // Try a simpler approach - initialize sortable directly like cards do
    this.initializeSwimlaneResize();

    // Wait for DOM to be ready
    setTimeout(this.initializeSortableLists, 100);

    // React to uncollapse (data is always reactive)
    this.autorun(() => {
      if (!this.currentData().isCollapsed()) {
        this.initializeSortableLists();
      }
    });
  },
  onCreated() {
    this.draggingActive = new ReactiveVar(false);

    this._isDragging = false;
    this._lastDragPositionX = 0;
  },
  id() {
    return this._id;
  },
  currentCardIsInThisList(listId, swimlaneId) {
    return currentCardIsInThisList(listId, swimlaneId);
  },
  currentListIsInThisSwimlane(swimlaneId) {
    return currentListIsInThisSwimlane(swimlaneId);
  },
  visible(list) {
    if (list.archived) {
      // Show archived list only when filter archive is on
      if (!Filter.archive.isSelected()) {
        return false;
      }
    }
    if (Filter.lists._isActive()) {
      if (!list.title.match(Filter.lists.getRegexSelector())) {
        return false;
      }
    }
    if (Filter.hideEmpty.isSelected()) {
      // Check for cards in all swimlanes, not just the current one
      // This ensures lists with cards in other swimlanes are still visible
      const cards = list.cards();
      if (cards.length === 0) {
        return false;
      }
    }
    return true;
  },
  events() {
    return [
      {
        // Click-and-drag action
        'mousedown .board-canvas'(evt) {
          // Translating the board canvas using the click-and-drag action can
          // conflict with the build-in browser mechanism to select text. We
          // define a list of elements in which we disable the dragging because
          // the user will legitimately expect to be able to select some text with
          // his mouse.

          const noDragInside = ['a', 'input', 'textarea', 'p'].concat(
            Utils.isMiniScreen()
              ? ['.js-list-handle', '.js-swimlane-header-handle']
              : ['.js-list-header'],
          ).concat([
            '.js-list-resize-handle',
            '.js-swimlane-resize-handle'
          ]);

          const isResizeHandle = $(evt.target).closest('.js-list-resize-handle, .js-swimlane-resize-handle').length > 0;
          const isInNoDragArea = $(evt.target).closest(noDragInside.join(',')).length > 0;

          if (isResizeHandle) {
            //return;
          }

          if (
            !isInNoDragArea &&
            this.$('.swimlane').prop('clientHeight') > evt.offsetY
          ) {
            this._isDragging = true;
            this._lastDragPositionX = evt.clientX;
          }
        },
        mouseup() {
          if (this._isDragging) {
            this._isDragging = false;
          }
        },
        mousemove(evt) {
          if (this._isDragging) {
            // Update the canvas position
            this.listsDom.scrollLeft -= evt.clientX - this._lastDragPositionX;
            this._lastDragPositionX = evt.clientX;
            // Disable browser text selection while dragging
            evt.stopPropagation();
            evt.preventDefault();
            // Don't close opened card or inlined form at the end of the
            // click-and-drag.
            EscapeActions.executeUpTo('popup-close');
            EscapeActions.preventNextClick();
          }
        },
      },
    ];
  },

  swimlaneHeight() {
    // Using previous size with so much collasped/vertical logic will probably
    // be worst that letting layout takes needed space given the opened list each time
    if (Utils.isMiniScreen()) {
      return;
    }
    const user = ReactiveCache.getCurrentUser();
    const swimlane = Template.currentData();

    let height;
    if (user) {
      // For logged-in users, get from user profile
      height = user.getSwimlaneHeightFromStorage(swimlane.boardId, swimlane._id);
    } else {
      // For non-logged-in users, get from localStorage
      try {
        const stored = localStorage.getItem('wekan-swimlane-heights');
        if (stored) {
          const heights = JSON.parse(stored);
          if (heights[swimlane.boardId] && heights[swimlane.boardId][swimlane._id]) {
            height = heights[swimlane.boardId][swimlane._id];
          } else {
            height = -1;
          }
        } else {
          height = -1;
        }
      } catch (e) {
        console.warn('Error reading swimlane height from localStorage:', e);
        height = -1;
      }
    }

    return height == -1 ? "auto" : (height + 5 + "px");
  },


  initializeSwimlaneResize() {
    // Check if we're still in a valid template context
    if (!Template.currentData()) {
      console.warn('No current template data available for swimlane resize initialization');
      return;
    }

    const swimlane = Template.currentData();
    const $swimlane = $(`#swimlane-${swimlane._id}`);
    const $resizeHandle = $swimlane.siblings('.js-swimlane-resize-handle');

    // Check if elements exist
    if (!$swimlane.length || !$resizeHandle.length) {
      console.warn('Swimlane or resize handle not found, retrying in 100ms');
      Meteor.setTimeout(() => {
        if (!this.isDestroyed) {
          this.initializeSwimlaneResize();
        }
      }, 100);
      return;
    }


    if ($resizeHandle.length === 0) {
      return;
    }

    const isTouchScreen = Utils.isTouchScreen();
    let isResizing = false;
    const minHeight = Utils.isMiniScreen() ? 200 : 50;
    const absoluteMaxHeight = 2000;
    let computingHeight;
    let frame;

    let fullHeight, maxHeight;
    let pageY, screenY, deltaY;

    // how to do cleaner?
    const flexContainer = document.getElementsByClassName('swim-flex')[0];
    // only for cosmetic
    let maxHeightWithTolerance;
    const tolerance = 30;
    let previousLimit = false;

    $swimlane[0].style.setProperty('--swimlane-min-height', `${minHeight}px`);
    // avoid jump effect and ensure height stays consistent
    // ⚠️ here, I propose to ignore saved height if it is not filled by content.
    // having large portions of blank lists makes the layout strange and hard to
    // navigate; also, the height changes a lot between different views, so it
    // feels ok to use the size as a hint, not as an absolute (as a user also)
    const unconstraignedHeight = $swimlane[0].getBoundingClientRect().height;
    const userHeight = parseFloat(this.swimlaneHeight(), 10);
    const preferredHeight = Math.min(userHeight, absoluteMaxHeight, unconstraignedHeight);
    $swimlane[0].style.setProperty('--swimlane-height', `${preferredHeight}px`);

    const startResize = (e) => {
      // gain access to modern attributes e.g. isPrimary
      e = e.originalEvent;

      if (isResizing || !(e.isPrimary && (e.pointerType !== 'mouse' || e.button === 0))) {
        return;
      }

      waitHeight(e, startResizeKnowingHeight);
    };

    // unsure about this one; this is a way to compute what would be a "fit-content" height,
    // so that user cannot drag the swimlane too far. to do so, we clone the swimlane add
    // add it to the body, taking care of catching the frame just before it would be rendered.
    // it is well supported by browsers and adds extra-computation only once, when start dragging,
    // but still it feels odd.
    // the reason we cannot use initial, computed height is because it could have changed because
    // on new cards, thus constraining dragging too much. it is simple for list, add "real" unconstrained
    // width do not update on adding cards.
    const waitHeight = (e, callback) => {
      const computeSwimlaneHeight = (_) => {
        if (!computingHeight) {
          computingHeight = $swimlane[0].cloneNode(true);
          computingHeight.id = "clonedSwimlane";
          $(computingHeight).attr('style', 'height: auto !important; position: absolute');
          frame = requestAnimationFrame(computeSwimlaneHeight);
          document.body.appendChild(computingHeight);
          return;
        }
        catchBeforeRender = document.getElementById('clonedSwimlane');
        if (catchBeforeRender) {
          fullHeight = catchBeforeRender.offsetHeight;
          if (fullHeight > 0) {
            cancelAnimationFrame(frame);
            document.body.removeChild(computingHeight);
            computingHeight = undefined;
            frame = undefined;
            callback(e, fullHeight);
            return;
          }
        }
        frame = requestAnimationFrame(computeSwimlaneHeight);
      }
      computeSwimlaneHeight();
    }

    const startResizeKnowingHeight = (e, height) => {
      document.addEventListener('pointermove', doResize);
      // e.g. debugger can cancel event without pointerup being fired
      // document.addEventListener('pointercancel', stopResize);
      document.addEventListener('pointerup', stopResize);
      // unavailable on e.g. Safari but mostly for smoothness
      document.addEventListener('wheel', doResize);

      // --swimlane-height can be either a stored size or "auto"; get actual computed size
      currentHeight = $swimlane[0].offsetHeight;
      $swimlane.addClass('swimlane-resizing');
      $('body').addClass('swimlane-resizing-active');

      // not being able to resize can be frustrating, give a little more room
      maxHeight = Math.max(height, absoluteMaxHeight);
      maxHeightWithTolerance = maxHeight + tolerance;

      $swimlane[0].style.setProperty('--swimlane-max-height', `${maxHeightWithTolerance}px`);

      pageY = e.pageY;

      isResizing = true;
      previousLimit = false;
      deltaY = null;
    }

    const doResize = (e) => {
      if (!isResizing || !(e.isPrimary || e instanceof WheelEvent)) {
        return;
      }
      const { y: handleY, height: handleHeight } = $resizeHandle[0].getBoundingClientRect();
      const containerHeight = flexContainer.offsetHeight;
      const isBlocked = $swimlane[0].classList.contains('cannot-resize');

      // deltaY of WheelEvent is unreliable, do with a simple actual delta with handle and pointer
      deltaY = e.clientY - handleY;

      const candidateHeight = currentHeight + deltaY;
      const oldHeight = currentHeight;
      let stepHeight = Math.max(minHeight, Math.min(maxHeightWithTolerance, candidateHeight));

      const reachingMax = (maxHeightWithTolerance - stepHeight - 20) <= 0;
      const reachingMin = (stepHeight - 20 - minHeight) <= 0;
      if (!previousLimit && (reachingMax && deltaY > 0 || reachingMin && deltaY < 0)) {
        $swimlane[0].classList.add('cannot-resize');
        previousLimit = true;
        if (reachingMax) {
          stepHeight = maxHeightWithTolerance;
        } else {
          stepHeight = minHeight;
        }
      } else if (previousLimit && !reachingMax && !reachingMin) {
        // we want to re-init only below handle if min-size, above if max-size,
        // so computed values are accurate
        if ((deltaY > 0 && pageY >= handleY + handleHeight)
          || (deltaY < 0 && pageY <= handleY)) {
          $swimlane[0].classList.remove('cannot-resize');
          // considered as a new move, changing direction is certain
          previousLimit = false;
        }
      }

      if (!isBlocked) {
        // Ensure container grows and shrinks with swimlanes, so you guess a sense of scrolling something
        if (e.pageY > (containerHeight - window.innerHeight)) {
          document.body.style.height = `${containerHeight + window.innerHeight / 4}px`;
        }
        // helps to scroll at the beginning/end of the page
        let gapToLeave = window.innerHeight / 10;
        const factor = isTouchScreen ? 6 : 7;
        if (e.clientY > factor * gapToLeave) {
          //correct but too laggy
          window.scrollBy({ top: gapToLeave, behavior: "smooth" });
        }
        // special case where scrolling down while
        // swimlane is stuck; feels weird
        else if (e.clientY < (10 - factor) * gapToLeave) {
          window.scrollBy({ top: -gapToLeave , behavior: "smooth"});
        }
      }

      if (oldHeight !== stepHeight && !isBlocked) {
        // Apply the new height immediately for real-time feedback
        $swimlane[0].style.setProperty('--swimlane-height', `${stepHeight}px`);
        currentHeight = stepHeight;
      }
    };

    const stopResize = (e) => {
      if(!isResizing) {
        return;
      }
      if (previousLimit) {
        $swimlane[0].classList.remove('cannot-resize');
      }

      // hopefully be gentler on cpu
      document.removeEventListener('pointermove', doResize);
      document.removeEventListener('pointercancel', stopResize);
      document.removeEventListener('pointerup', stopResize);
      document.removeEventListener('wheel', doResize);

      isResizing = false;

      let finalHeight = Math.min(parseInt($swimlane[0].style.getPropertyValue('--swimlane-height'), 10), maxHeight);
      $swimlane[0].style.setProperty('--swimlane-height', `${finalHeight}px`);

      // Remove visual feedback but keep the height
      $swimlane.removeClass('swimlane-resizing');
      $('body').removeClass('swimlane-resizing-active');

      // Save the new height using the existing system
      const boardId = swimlane.boardId;
      const swimlaneId = swimlane._id;

      if (process.env.DEBUG === 'true') {
      }

      const currentUser = ReactiveCache.getCurrentUser();
      if (currentUser) {
        // For logged-in users, use server method
        Meteor.call('applySwimlaneHeightToStorage', boardId, swimlaneId, finalHeight, (error, result) => {
          if (error) {
            console.error('Error saving swimlane height:', error);
          } else {
            if (process.env.DEBUG === 'true') {
            }
          }
        });
      } else {
        // For non-logged-in users, save to localStorage directly
        try {
          const stored = localStorage.getItem('wekan-swimlane-heights');
          let heights = stored ? JSON.parse(stored) : {};

          if (!heights[boardId]) {
            heights[boardId] = {};
          }
          heights[boardId][swimlaneId] = finalHeight;

          localStorage.setItem('wekan-swimlane-heights', JSON.stringify(heights));

          if (process.env.DEBUG === 'true') {
          }
        } catch (e) {
          console.warn('Error saving swimlane height to localStorage:', e);
        }
      }
    };
    // handle both pointer and touch
    $resizeHandle.on("pointerdown", startResize);
  },
}).register('swimlane');




BlazeComponent.extendComponent({
  onCreated() {
    this.currentBoard = Utils.getCurrentBoard();
    this.isListTemplatesSwimlane =
      this.currentBoard.isTemplatesBoard() &&
      this.currentData().isListTemplatesSwimlane();
    this.currentSwimlane = this.currentData();
    // so that lists can be filtered from Board methods
    this.currentBoard.swimlane = this.currentSwimlane;
  },

  // Proxy
  open() {
    this.childComponents('inlinedForm')[0].open();
  },

  events() {
    return [
      {
        submit(evt) {
            evt.preventDefault();

            const titleInput = this.find('.list-name-input');
            const title = titleInput?.value.trim();

            if (!title) return;

            let sortIndex = 0;
            const lastList = this.currentBoard.getLastList();
            const boardId = Utils.getCurrentBoardId();

            const positionInput = this.find('.list-position-input');

            if (positionInput) {
              const positionId = positionInput.value.trim();
              const selectedList = ReactiveCache.getList({ boardId, _id: positionId, archived: false });

              if (selectedList) {
                sortIndex = selectedList.sort + 1;
              } else {
                sortIndex = Utils.calculateIndexData(lastList, null).base;
              }
            } else {
              sortIndex = Utils.calculateIndexData(lastList, null).base;
            }

            Lists.insert({
              title,
              boardId: Session.get('currentBoard'),
              sort: sortIndex,
              type: this.isListTemplatesSwimlane ? 'template-list' : 'list',
              swimlaneId: this.currentSwimlane._id, // Always set swimlaneId for per-swimlane list titles
            });

            titleInput.value = '';
            titleInput.focus();
        }
      },
      {
        'click .js-list-template': Popup.open('searchElement'),
      },
    ];
  },
}).register('addListForm');


Template.addListForm.helpers({
  lists() {
    return this.myLists();
  }
});

Template.swimlane.helpers({
  canSeeAddList() {
    return ReactiveCache.getCurrentUser().isBoardAdmin();
  },

  lists() {
    // Return per-swimlane lists for this swimlane
    return this.myLists();
  },

  collapseSwimlane() {
    return Utils.getSwimlaneCollapseState(this);
  },
});


// Initialize sortable on DOM elements
setTimeout(() => {
  const $listsGroupElements = $('.list-group');
  const computeHandle = () => Utils.isMiniScreen() ? '.js-list-handle' : '.list-header-name-container';

  // Initialize sortable on ALL listsGroup elements (even empty ones)
  $listsGroupElements.each(function(index) {
    const $listsGroup = $(this);
    const $lists = $listsGroup.find('.js-list');

    // Only initialize on listsGroup elements that have the .js-lists class
    if ($listsGroup.hasClass('js-lists')) {
      $listsGroup.sortable({
        connectWith: '.js-swimlane, .js-lists',
        tolerance: 'pointer',
        appendTo: '.board-canvas',
        helper: 'clone',
        items: '.js-list',
        placeholder: 'list placeholder',
        distance: 7,
        handle: computeHandle(),
        disabled: !Utils.canModifyBoard(),
        start(evt, ui) {
          ui.helper.css('z-index', 1000);
          ui.placeholder.height(ui.helper.height());
          ui.placeholder.width(ui.helper.width());
          EscapeActions.executeUpTo('popup-close');
          // Try to get board component
          try {
            const boardComponent = BlazeComponent.getComponentForElement(ui.item[0]);
            if (boardComponent && boardComponent.setIsDragging) {
              boardComponent.setIsDragging(true);
            }
          } catch (e) {
            // Silent fail
          }
        },
        sort(event, ui) {
          Utils.scrollIfNeeded(event);
        },
        stop(evt, ui) {
          // Detect if the list was dropped in a different swimlane
          const targetSwimlaneDom = ui.item.closest('.js-swimlane');
          let targetSwimlaneId = null;

          if (targetSwimlaneDom.length > 0) {
            // List was dropped in a swimlane
            try {
              targetSwimlaneId = targetSwimlaneDom.attr('id').replace('swimlane-', '');
            } catch (error) {
              return;
            }
          } else {
            // List was dropped in lists view (not swimlanes view)
            // In this case, assign to the default swimlane
            const currentBoard = ReactiveCache.getBoard(Session.get('currentBoard'));
            if (currentBoard) {
              const defaultSwimlane = currentBoard.getDefaultSwimline();
              if (defaultSwimlane) {
                targetSwimlaneId = defaultSwimlane._id;
              }
            }
          }

          // Get the original swimlane ID of the list (handle backward compatibility)
          const originalSwimlaneId = list.getEffectiveSwimlaneId ? list.getEffectiveSwimlaneId() : (list.swimlaneId || null);

          // Prepare update object
          const updateData = {
            sort: sortIndex.base,
          };

          // Check if the list was dropped in a different swimlane
          const isDifferentSwimlane = targetSwimlaneId && targetSwimlaneId !== originalSwimlaneId;

          // If the list was dropped in a different swimlane, update the swimlaneId
          if (isDifferentSwimlane) {
            updateData.swimlaneId = targetSwimlaneId;

            // Move all cards in the list to the new swimlane
            const cardsInList = ReactiveCache.getCards({
              listId: list._id,
              archived: false
            });

            cardsInList.forEach(card => {
              card.move(list.boardId, targetSwimlaneId, list._id);
            });

            // Don't cancel the sortable when moving to a different swimlane
            // The DOM move should be allowed to complete
          }
          // Allow reordering within the same swimlane by not canceling the sortable

          try {
            Lists.update(list._id, {
              $set: updateData,
            });
          } catch (error) {
            return;
          }

          // Save to localStorage for non-logged-in users (backup)
          if (!Meteor.userId()) {
            try {
              const boardId = list.boardId;
              const listId = list._id;
              const listOrderKey = `wekan-list-order-${boardId}`;

              let listOrder = JSON.parse(localStorage.getItem(listOrderKey) || '{}');
              if (!listOrder.lists) listOrder.lists = [];

              const listIndex = listOrder.lists.findIndex(l => l.id === listId);
              if (listIndex >= 0) {
                listOrder.lists[listIndex].sort = sortIndex.base;
                listOrder.lists[listIndex].swimlaneId = updateData.swimlaneId;
                listOrder.lists[listIndex].updatedAt = new Date().toISOString();
              } else {
                listOrder.lists.push({
                  id: listId,
                  sort: sortIndex.base,
                  swimlaneId: updateData.swimlaneId,
                  updatedAt: new Date().toISOString()
                });
              }

              localStorage.setItem(listOrderKey, JSON.stringify(listOrder));
            } catch (e) {
            }
          }

          // Persist to server
          Meteor.call('updateListSort', list._id, list.boardId, updateData, function(error) {
            if (error) {
              Meteor.subscribe('board', list.boardId, false);
            }
          });

          // Try to get board component
          try {
            const boardComponent = BlazeComponent.getComponentForElement(ui.item[0]);
            if (boardComponent && boardComponent.setIsDragging) {
              boardComponent.setIsDragging(false);
            }
          } catch (e) {
            // Silent fail
          }
        }
      });
      // Reactively adjust handle when setting changes
      Tracker.autorun(() => {
        const newHandle = computeHandle();
        if ($listsGroup.data('uiSortable') || $listsGroup.data('sortable')) {
          try { $listsGroup.sortable('option', 'handle', newHandle); } catch (e) {}
        }
      });
    }
  });
}, 1000);



BlazeComponent.extendComponent({
  currentCardIsInThisList(listId, swimlaneId) {
    return currentCardIsInThisList(listId, swimlaneId);
  },

  visible(list) {
    if (list.archived) {
      // Show archived list only when filter archive is on
      if (!Filter.archive.isSelected()) {
        return false;
      }
    }
    if (Filter.lists._isActive()) {
      if (!list.title.match(Filter.lists.getRegexSelector())) {
        return false;
      }
    }
    if (Filter.hideEmpty.isSelected()) {
      // Check for cards in all swimlanes, not just the current one
      // This ensures lists with cards in other swimlanes are still visible
      const cards = list.cards();
      if (cards.length === 0) {
        return false;
      }
    }
    return true;
  },
  onRendered() {
    let boardComponent = getBoardComponent();
    const $listsDom = this.$('.js-lists');


    if (!Utils.getCurrentCardId()) {
      boardComponent.scrollLeft();
    }

    // Try a simpler approach for listsGroup too

    // Wait for DOM to be ready
    setTimeout(() => {
      const handleSelector = Utils.isMiniScreen()
        ? '.js-list-handle'
        : '.list-header-name-container';
      const $lists = this.$('.js-list');
      const parent = $lists.parent();

      if ($lists.length > 0) {

        // Check for drag handles
        const handles = $(parent).find(handleSelector);

        // Test if drag handles are clickable
        handles.on('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
        });

        parent.sortable({
          connectWith: '.js-swimlane, .js-lists',
          tolerance: 'pointer',
          appendTo: '.board-canvas',
          helper: 'clone',
          items: '.js-list:not(.js-list-composer)',
          placeholder: 'list placeholder',
          distance: 7,
          handle: handleSelector,
          disabled: !Utils.canModifyBoard(),
          start(evt, ui) {
            ui.helper.css('z-index', 1000);
            width = ui.helper.width();
            height = ui.helper.height();
            ui.placeholder.height(height);
            ui.placeholder.width(width);
            ui.placeholder[0].setAttribute('style', `width: ${width}px !important; height: ${height}px !important;`);
            EscapeActions.executeUpTo('popup-close');
            boardComponent.setIsDragging(true);
          },
          stop(evt, ui) {
            boardComponent.setIsDragging(false);
            saveSorting(ui);
          },
          sort(event, ui) {
            Utils.scrollIfNeeded(event);
          },
        });
        // Reactively update handle when user toggles desktop drag handles
        this.autorun(() => {
          const newHandle = Utils.isMiniScreen()
            ? '.js-list-handle'
            : '.js-list-header';
          if ($parent.data('uiSortable') || $parent.data('sortable')) {
            try { $parent.sortable('option', 'handle', newHandle); } catch (e) {}
          }
        });
      } else {
      }
    }, 100);
  },
}).register('listsGroup');


class MoveSwimlaneComponent extends BlazeComponent {
  serverMethod = 'moveSwimlane';

  onCreated() {
    this.currentSwimlane = this.currentData();
  }

  board() {
    return Utils.getCurrentBoard();
  }

  toBoardsSelector() {
    return {
      archived: false,
      'members.userId': Meteor.userId(),
      type: 'board',
      _id: { $ne: this.board()._id },
    };
  }

  toBoards() {
    const ret = ReactiveCache.getBoards(this.toBoardsSelector(), { sort: { title: 1 } });
    return ret;
  }

  events() {
    return [
      {
        'click .js-done'() {
          const bSelect = $('.js-select-boards')[0];
          let boardId;
          if (bSelect) {
            boardId = bSelect.options[bSelect.selectedIndex].value;
            Meteor.call(this.serverMethod, this.currentSwimlane._id, boardId);
          }
          Popup.back();
        },
      },
    ];
  }
}
MoveSwimlaneComponent.register('moveSwimlanePopup');

(class extends MoveSwimlaneComponent {
  serverMethod = 'copySwimlane';
  toBoardsSelector() {
    const selector = super.toBoardsSelector();
    delete selector._id;
    return selector;
  }
}.register('copySwimlanePopup'));
