import { ReactiveCache } from '/imports/reactiveCache';
import { once } from '/imports/lib/collectionHelpers';
import dragscroll from '@wekanteam/dragscroll';
import Lists from '/models/lists';
import { CSSEvents } from '/client/lib/cssEvents';
import { Filter } from '/client/lib/filter';
import { EscapeActions } from '/client/lib/escapeActions';
import { Utils } from '/client/lib/utils';
const { calculateIndex } = Utils;

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
    // In this case, keep the original swimlane
    targetSwimlaneId = list.getEffectiveSwimlaneId ? list.getEffectiveSwimlaneId() : (list.swimlaneId || null);
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

  // Do not update the restricted collection on the client; rely on the server method below.

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
    const boardBodyEl = ui.item[0]?.closest?.('.board-body') || document.querySelector('.board-body');
    const boardView = boardBodyEl && Blaze.getView(boardBodyEl, 'Template.boardBody');
    const boardComponent = boardView?.templateInstance?.();
    if (boardComponent && boardComponent.setIsDragging) {
      if (boardComponent) boardComponent.setIsDragging(false);
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
  if (!currentList) return false;
  // Match the list's own swimlane, or shared/orphaned lists (empty/null
  // swimlaneId are visible in every swimlane as a fallback).
  if (currentList.swimlaneId === swimlaneId || !currentList.swimlaneId) {
    return true;
  }
  // Also match when the list has an orphaned swimlaneId (references a deleted
  // swimlane) and THIS is the first swimlane — orphaned lists are shown there.
  const currentBoard = Utils.getCurrentBoard();
  if (!currentBoard) return false;
  const allSwimlanes = ReactiveCache.getSwimlanes(
    { boardId: currentBoard._id, archived: false },
    { sort: ['sort'] },
  );
  if (!allSwimlanes.length || allSwimlanes[0]._id !== swimlaneId) return false;
  const validIds = new Set(allSwimlanes.map(s => s._id));
  return !validIds.has(currentList.swimlaneId);
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
      // Match cards for this swimlane, AND orphaned/shared cards that have no
      // swimlaneId assigned (null/empty) — they are shown in every swimlane as
      // a fallback so no content is ever invisible.
      (currentCard.swimlaneId === swimlaneId || !currentCard.swimlaneId)
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

function initSortable(boardComponent, $listsDom) {
  // Safety check: ensure we have valid DOM elements
  if (!$listsDom || $listsDom.length === 0) {
    console.error('initSortable: No valid DOM elements provided');
    return;
  }

  // Check if sortable is already initialized
  if ($listsDom.data('uiSortable') || $listsDom.data('sortable')) {
    $listsDom.sortable('destroy');
  }

  // We want to animate the card details window closing. We rely on CSS
  // transition for the actual animation.
  $listsDom._uihooks = {
    removeElement(node) {
      const removeNode = once(() => {
        node.parentNode.removeChild(node);
      });
      if ($(node).hasClass('js-card-details')) {
        $(node).css({
          flexBasis: 0,
          padding: 0,
        });
        $listsDom.one(CSSEvents.transitionend, removeNode);
      } else {
        removeNode();
      }
    },
  };


  // Add click debugging for drag handles
  $listsDom.on('mousedown', '.js-list-handle', function(e) {
    e.stopPropagation();
  });

  $listsDom.on('mousedown', '.js-list-header', function(e) {
  });

  // Add debugging for any mousedown on lists
  $listsDom.on('mousedown', '.js-list', function(e) {
  });

  // Add debugging for sortable events
  $listsDom.on('sortstart', function(e, ui) {
  });

  $listsDom.on('sortbeforestop', function(e, ui) {
  });

  $listsDom.on('sortstop', function(e, ui) {
  });

  try {
    $listsDom.sortable({
      connectWith: '.js-swimlane, .js-lists',
      tolerance: 'pointer',
      appendTo: '.board-canvas',
      helper(evt, item) {
        const helper = item.clone();
        helper.css('z-index', 1000);
        return helper;
      },
      items: '.js-list:not(.js-list-composer)',
      placeholder: 'list placeholder',
      distance: 3,
      forcePlaceholderSize: true,
      cursor: 'move',
      start(evt, ui) {
        ui.helper.css('z-index', 1000);
        ui.placeholder.height(ui.helper.height());
        ui.placeholder.width(ui.helper.width());
        EscapeActions.executeUpTo('popup-close');
        if (boardComponent) boardComponent.setIsDragging(true);

        // Add visual feedback for list being dragged
        ui.item.addClass('ui-sortable-helper');

        // Disable dragscroll during list dragging to prevent interference
        try {
          dragscroll.reset();
        } catch (e) {
        }

        // Also disable dragscroll on all swimlanes during list dragging
        $('.js-swimlane').each(function() {
          $(this).removeClass('dragscroll');
        });
      },
      beforeStop(evt, ui) {
        // Clean up visual feedback
        ui.item.removeClass('ui-sortable-helper');
      },
      stop(evt, ui) {
        saveSorting(ui);
      }
    });
  } catch (error) {
    console.error('Error initializing list sortable:', error);
    return;
  }


  // Check if drag handles exist
  const dragHandles = $listsDom.find('.js-list-handle');

  // Check if lists exist
  const lists = $listsDom.find('.js-list');

  // Skip the complex autorun and options for now
}

Template.swimlane.onCreated(function () {
  this.draggingActive = new ReactiveVar(false);
  this._isDragging = false;
  this._lastDragPositionX = 0;
});

Template.swimlane.onRendered(function () {
  const tpl = this;
  const boardBodyEl = tpl.firstNode?.parentElement?.closest?.('.board-body') || document.querySelector('.board-body');
  const boardView = boardBodyEl && Blaze.getView(boardBodyEl, 'Template.boardBody');
  const boardComponent = boardView?.templateInstance?.();
  const $listsDom = tpl.$('.js-lists');
  // Sync list order from localStorage on board load
  const boardId = Session.get('currentBoard');
  if (boardId) {
    // Small delay to allow pubsub to settle
    Meteor.setTimeout(() => {
      syncListOrderFromStorage(boardId);
    }, 500);
  }

  if (!Utils.getCurrentCardId() && boardComponent) {
    boardComponent.scrollLeft();
  }

  // Try a simpler approach - initialize sortable directly like cards do
  initializeSwimlaneResize(tpl);

  // Wait for DOM to be ready
  setTimeout(() => {
    const handleSelector = Utils.isTouchScreenOrShowDesktopDragHandles()
      ? '.js-list-handle'
      : '.js-list-header';
    const $parent = tpl.$('.js-lists');

    if ($parent.length > 0) {

      // Check for drag handles
      const $handles = $parent.find('.js-list-handle');

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
        items: '.js-list:not(.js-list-composer)',
        placeholder: 'list placeholder',
        distance: 7,
        handle: handleSelector,
        disabled: !Utils.canModifyBoard(),
        dropOnEmpty: true,
        start(evt, ui) {
          ui.helper.css('z-index', 1000);
          ui.placeholder.height(ui.helper.height());
          ui.placeholder.width(ui.helper.width());
          EscapeActions.executeUpTo('popup-close');
          if (boardComponent) boardComponent.setIsDragging(true);
        },
        stop(evt, ui) {
          if (boardComponent) boardComponent.setIsDragging(false);
          saveSorting(ui);
        },
      });
      // Reactively update handle when user toggles desktop drag handles
      tpl.autorun(() => {
        const newHandle = Utils.isTouchScreenOrShowDesktopDragHandles()
          ? '.js-list-handle'
          : '.js-list-header';
        if ($parent.data('uiSortable') || $parent.data('sortable')) {
          try {
            $parent.sortable('option', 'handle', newHandle);
          } catch (e) {}
        }
      });
    }
  }, 100);
});

function initializeSwimlaneResize(tpl, retryCount = 0) {
  // Avoid accessing Template.currentData() here: this function can run in setTimeout
  // callbacks outside a current Blaze view context.
  if (!tpl || tpl.isDestroyed) {
    return;
  }

  const swimlane = tpl.data;
  if (!swimlane || !swimlane._id) {
    return;
  }

  const $swimlane = $(`#swimlane-${swimlane._id}`);
  const $resizeHandle = $swimlane.find('.js-swimlane-resize-handle');

  // Check if elements exist
  if (!$swimlane.length || !$resizeHandle.length) {
    // Retry briefly while DOM settles, then stop to avoid noisy loops.
    if (retryCount >= 20) {
      return;
    }
    Meteor.setTimeout(() => {
      if (!tpl.isDestroyed) {
        initializeSwimlaneResize(tpl, retryCount + 1);
      }
    }, 100);
    return;
  }

  if ($resizeHandle.length === 0) {
    return;
  }

  let isResizing = false;
  let startY = 0;
  let startHeight = 0;
  const minHeight = 100;
  const maxHeight = 2000;

  const startResize = (e) => {
    isResizing = true;
    startY = e.pageY || e.originalEvent.touches[0].pageY;
    startHeight = parseInt($swimlane.css('height')) || 300;

    $swimlane.addClass('swimlane-resizing');
    $('body').addClass('swimlane-resizing-active');
    $('body').css('user-select', 'none');

    e.preventDefault();
    e.stopPropagation();
  };

  const doResize = (e) => {
    if (!isResizing) {
      return;
    }

    const currentY = e.pageY || e.originalEvent.touches[0].pageY;
    const deltaY = currentY - startY;
    const newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + deltaY));

    // Apply the new height immediately for real-time feedback
    $swimlane[0].style.setProperty('--swimlane-height', `${newHeight}px`);
    $swimlane[0].style.setProperty('height', `${newHeight}px`);
    $swimlane[0].style.setProperty('min-height', `${newHeight}px`);
    $swimlane[0].style.setProperty('max-height', `${newHeight}px`);
    $swimlane[0].style.setProperty('flex', 'none');
    $swimlane[0].style.setProperty('flex-basis', 'auto');
    $swimlane[0].style.setProperty('flex-grow', '0');
    $swimlane[0].style.setProperty('flex-shrink', '0');

    e.preventDefault();
    e.stopPropagation();
  };

  const stopResize = (e) => {
    if (!isResizing) return;

    isResizing = false;

    // Calculate final height
    const currentY = e.pageY || e.originalEvent.touches[0].pageY;
    const deltaY = currentY - startY;
    const finalHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + deltaY));

    // Ensure the final height is applied
    $swimlane[0].style.setProperty('--swimlane-height', `${finalHeight}px`);
    $swimlane[0].style.setProperty('height', `${finalHeight}px`);
    $swimlane[0].style.setProperty('min-height', `${finalHeight}px`);
    $swimlane[0].style.setProperty('max-height', `${finalHeight}px`);
    $swimlane[0].style.setProperty('flex', 'none');
    $swimlane[0].style.setProperty('flex-basis', 'auto');
    $swimlane[0].style.setProperty('flex-grow', '0');
    $swimlane[0].style.setProperty('flex-shrink', '0');

    // Remove visual feedback but keep the height
    $swimlane.removeClass('swimlane-resizing');
    $('body').removeClass('swimlane-resizing-active');
    $('body').css('user-select', '');

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
}

Template.swimlane.helpers({
  canSeeAddList() {
    return ReactiveCache.getCurrentUser().isBoardAdmin();
  },
  lists() {
    const swimlane = this;
    // myLists() already covers:
    //   • lists owned by this swimlane (swimlaneId === this._id)
    //   • shared / pre-migration lists (swimlaneId empty or null)
    const regularLists = swimlane.myLists();

    // Additionally, detect lists whose swimlaneId references a swimlane that
    // no longer exists ("orphaned-swimlane" lists).  These would be invisible
    // in every swimlane without this fallback.  Show them in the FIRST swimlane
    // on the board so they are always accessible without a DB migration.
    const allSwimlanes = ReactiveCache.getSwimlanes(
      { boardId: swimlane.boardId, archived: false },
      { sort: ['sort'] },
    );
    // Only the first swimlane picks up orphaned-swimlane lists.
    if (!allSwimlanes.length || allSwimlanes[0]._id !== swimlane._id) {
      return regularLists;
    }
    const validIds = allSwimlanes.map(s => s._id);
    const orphaned = swimlane.orphanedSwimlaneLists(validIds);
    if (!orphaned.length) return regularLists;

    // Merge, deduplicating by _id (regularLists may already contain some).
    const seen = new Set(regularLists.map(l => l._id));
    const combined = [...regularLists];
    for (const l of orphaned) {
      if (!seen.has(l._id)) {
        seen.add(l._id);
        combined.push(l);
      }
    }
    return combined;
  },
  collapseSwimlane() {
    return Utils.getSwimlaneCollapseState(this);
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
      const cards = list.cards();
      if (cards.length === 0) {
        return false;
      }
    }
    return true;
  },
  swimlaneHeight() {
    const user = ReactiveCache.getCurrentUser();
    const swimlane = Template.currentData();

    let height;
    if (user) {
      height = user.getSwimlaneHeightFromStorage(swimlane.boardId, swimlane._id);
    } else {
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
});

Template.swimlane.events({
  // Click-and-drag action
  'mousedown .board-canvas'(evt, tpl) {
    const noDragInside = ['a', 'input', 'textarea', 'p'].concat(
      Utils.isTouchScreenOrShowDesktopDragHandles()
        ? ['.js-list-handle', '.js-swimlane-header-handle']
        : ['.js-list-header'],
    ).concat([
      '.js-list-resize-handle',
      '.js-swimlane-resize-handle',
    ]);

    const isResizeHandle = $(evt.target).closest('.js-list-resize-handle, .js-swimlane-resize-handle').length > 0;
    const isInNoDragArea = $(evt.target).closest(noDragInside.join(',')).length > 0;

    if (isResizeHandle) {
      return;
    }

    if (
      !isInNoDragArea &&
      tpl.$('.swimlane').prop('clientHeight') > evt.offsetY
    ) {
      tpl._isDragging = true;
      tpl._lastDragPositionX = evt.clientX;
    }
  },
  mouseup(evt, tpl) {
    if (tpl._isDragging) {
      tpl._isDragging = false;
    }
  },
  mousemove(evt, tpl) {
    if (tpl._isDragging) {
      // Update the canvas position
      tpl.listsDom.scrollLeft -= evt.clientX - tpl._lastDragPositionX;
      tpl._lastDragPositionX = evt.clientX;
      // Disable browser text selection while dragging
      evt.stopPropagation();
      evt.preventDefault();
      // Don't close opened card or inlined form at the end of the
      // click-and-drag.
      EscapeActions.executeUpTo('popup-close');
      EscapeActions.preventNextClick();
    }
  },
});


Template.addListForm.onCreated(function () {
  this.currentBoard = Utils.getCurrentBoard();
  this.isListTemplatesSwimlane =
    this.currentBoard.isTemplatesBoard() &&
    Template.currentData().isListTemplatesSwimlane();
  this.currentSwimlane = Template.currentData();
});

Template.addListForm.helpers({
  swimlaneLists() {
    const swimlane = Template.instance().currentSwimlane;
    if (!swimlane?._id) return [];
    return ReactiveCache.getLists(
      { swimlaneId: swimlane._id, archived: false },
      { sort: { sort: 1 } },
    );
  },
});

Template.addListForm.events({
  async submit(evt, tpl) {
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

    try {
      await Meteor.callAsync('createListAfter', {
        title,
        boardId: Session.get('currentBoard'),
        swimlaneId: tpl.currentSwimlane._id,
        afterListId,
        nextListId,
        type: tpl.isListTemplatesSwimlane ? 'template-list' : 'list',
      });

      titleInput.value = '';
      titleInput.focus();
    } catch (error) {
      console.error('Failed to create list after selected list:', error);
    }
  },
  'click .js-list-template': Popup.open('searchElement'),
});

Template.listsGroup.helpers({
  currentCardIsInThisList(listId, swimlaneId) {
    return currentCardIsInThisList(listId, swimlaneId);
  },
  visible(list) {
    if (list.archived) {
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
      const cards = list.cards();
      if (cards.length === 0) {
        return false;
      }
    }
    return true;
  },
});

Template.listsGroup.onRendered(function () {
  const tpl = this;
  const boardBodyEl2 = tpl.firstNode?.parentElement?.closest?.('.board-body') || document.querySelector('.board-body');
  const boardView2 = boardBodyEl2 && Blaze.getView(boardBodyEl2, 'Template.boardBody');
  const boardComponent = boardView2?.templateInstance?.();
  const $listsDom = tpl.$('.js-lists');

  if (!Utils.getCurrentCardId() && boardComponent) {
    boardComponent.scrollLeft();
  }

  // Wait for DOM to be ready
  setTimeout(() => {
    const handleSelector = Utils.isTouchScreenOrShowDesktopDragHandles()
      ? '.js-list-handle'
      : '.js-list-header';
    const $parent = $listsDom;

    // Initialize sortable even if there are no lists (to allow dropping into empty swimlanes)
    if ($parent.length > 0 && $parent.hasClass('js-lists')) {
      if ($parent.data('uiSortable') || $parent.data('sortable')) {
        try {
          $parent.sortable('destroy');
        } catch (e) {}
      }

      // Check for drag handles
      const $handles = $parent.find('.js-list-handle');

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
        items: '.js-list:not(.js-list-composer)',
        placeholder: 'list placeholder',
        distance: 7,
        handle: handleSelector,
        disabled: !Utils.canModifyBoard(),
        dropOnEmpty: true,
        start(evt, ui) {
          ui.helper.css('z-index', 1000);
          ui.placeholder.height(ui.helper.height());
          ui.placeholder.width(ui.helper.width());
          EscapeActions.executeUpTo('popup-close');
          if (boardComponent) boardComponent.setIsDragging(true);
        },
        stop(evt, ui) {
          if (boardComponent) boardComponent.setIsDragging(false);
          saveSorting(ui);
        },
      });
      // Reactively update handle when user toggles desktop drag handles
      tpl.autorun(() => {
        const newHandle = Utils.isTouchScreenOrShowDesktopDragHandles()
          ? '.js-list-handle'
          : '.js-list-header';
        if ($parent.data('uiSortable') || $parent.data('sortable')) {
          try {
            $parent.sortable('option', 'handle', newHandle);
          } catch (e) {}
        }
      });
    }
  }, 100);
});


function swimlaneBoardsSelector(excludeCurrentBoard) {
  const selector = {
    archived: false,
    'members.userId': Meteor.userId(),
    type: 'board',
  };
  if (excludeCurrentBoard) {
    selector._id = { $ne: Utils.getCurrentBoard()._id };
  }
  return selector;
}

function swimlaneToBoards(excludeCurrentBoard) {
  return ReactiveCache.getBoards(
    swimlaneBoardsSelector(excludeCurrentBoard),
    { sort: { title: 1 } },
  );
}

function getSwimlanesForBoard(boardId) {
  if (!boardId) {
    return [];
  }
  return ReactiveCache.getSwimlanes(
    { boardId, archived: false },
    { sort: { sort: 1 } },
  );
}

function setFirstSelectedSwimlane(tpl) {
  const swimlanes = getSwimlanesForBoard(tpl.selectedBoardId.get());
  const firstSwimlaneId = swimlanes[0]?._id || '';
  tpl.selectedSwimlaneId.set(firstSwimlaneId);
}

function swimlaneDoneEvent(serverMethod, tpl) {
  const bSelect = tpl.$('.js-select-boards')[0];
  const sSelect = tpl.$('.js-select-swimlanes')[0];
  if (!bSelect) {
    Popup.back();
    return;
  }

  const boardId = bSelect.options[bSelect.selectedIndex].value;
  const swimlaneId = sSelect?.options[sSelect.selectedIndex]?.value || null;
  const position = tpl.$('input[name="swimlane-position"]:checked').val() || 'below';
  const titleInputId = serverMethod === 'copySwimlane' ? '#copy-swimlane-title' : '#move-swimlane-title';
  const title = tpl.$(titleInputId).val().trim();
  Meteor.call(
    serverMethod,
    tpl.currentSwimlane._id,
    boardId,
    swimlaneId,
    position,
    title,
    err => {
      if (err) {
        console.error(`${serverMethod} failed`, err);
        return;
      }
      Popup.back();
    },
  );
}

Template.moveSwimlanePopup.onCreated(function () {
  this.currentSwimlane = Template.currentData();
  this.selectedBoardId = new ReactiveVar(Utils.getCurrentBoard()._id);
  this.selectedSwimlaneId = new ReactiveVar('');
  setFirstSelectedSwimlane(this);
});

Template.moveSwimlanePopup.helpers({
  board() {
    return Utils.getCurrentBoard();
  },
  toBoards() {
    return swimlaneToBoards(false);
  },
  toSwimlanes() {
    return getSwimlanesForBoard(Template.instance().selectedBoardId.get());
  },
  isSelectedBoard(boardId) {
    return Template.instance().selectedBoardId.get() === boardId;
  },
  isSelectedSwimlane(swimlaneId) {
    return Template.instance().selectedSwimlaneId.get() === swimlaneId;
  },
});

Template.moveSwimlanePopup.events({
  'click .js-done'(event, tpl) {
    swimlaneDoneEvent('moveSwimlane', tpl);
  },
  'change .js-select-boards'(event, tpl) {
    tpl.selectedBoardId.set($(event.currentTarget).val());
    setFirstSelectedSwimlane(tpl);
  },
  'change .js-select-swimlanes'(event, tpl) {
    tpl.selectedSwimlaneId.set($(event.currentTarget).val());
  },
});

Template.copySwimlanePopup.onCreated(function () {
  this.currentSwimlane = Template.currentData();
  this.selectedBoardId = new ReactiveVar(Utils.getCurrentBoard()._id);
  this.selectedSwimlaneId = new ReactiveVar('');
  setFirstSelectedSwimlane(this);
});

Template.copySwimlanePopup.helpers({
  board() {
    return Utils.getCurrentBoard();
  },
  toBoards() {
    return swimlaneToBoards(false);
  },
  toSwimlanes() {
    return getSwimlanesForBoard(Template.instance().selectedBoardId.get());
  },
  isSelectedBoard(boardId) {
    return Template.instance().selectedBoardId.get() === boardId;
  },
  isSelectedSwimlane(swimlaneId) {
    return Template.instance().selectedSwimlaneId.get() === swimlaneId;
  },
});

Template.copySwimlanePopup.events({
  'click .js-done'(event, tpl) {
    swimlaneDoneEvent('copySwimlane', tpl);
  },
  'change .js-select-boards'(event, tpl) {
    tpl.selectedBoardId.set($(event.currentTarget).val());
    setFirstSelectedSwimlane(tpl);
  },
  'change .js-select-swimlanes'(event, tpl) {
    tpl.selectedSwimlaneId.set($(event.currentTarget).val());
  },
});
