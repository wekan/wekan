import { ReactiveCache } from '/imports/reactiveCache';
import dragscroll from '@wekanteam/dragscroll';
const { calculateIndex } = Utils;

function currentListIsInThisSwimlane(swimlaneId) {
  const currentList = Utils.getCurrentList();
  return (
    currentList &&
    (currentList.swimlaneId === swimlaneId || currentList.swimlaneId === '')
  );
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

function initSortable(boardComponent, $listsDom) {
  // Safety check: ensure we have valid DOM elements
  if (!$listsDom || $listsDom.length === 0) {
    console.error('initSortable: No valid DOM elements provided');
    return;
  }
  
  // Check if sortable is already initialized
  if ($listsDom.data('uiSortable') || $listsDom.data('sortable')) {
    console.log('initSortable: Sortable already initialized, skipping');
    return;
  }
  
  console.log('initSortable: Initializing sortable for', $listsDom.length, 'elements');
  
  // We want to animate the card details window closing. We rely on CSS
  // transition for the actual animation.
  $listsDom._uihooks = {
    removeElement(node) {
      const removeNode = _.once(() => {
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

  console.log('Initializing list sortable with', $listsDom.length, 'elements');
  console.log('Connected elements:', $('.js-swimlane, .js-lists').length);
  console.log('Available swimlanes:', $('.js-swimlane').map(function() { return $(this).attr('id'); }).get());
  
  // Add click debugging for drag handles
  $listsDom.on('mousedown', '.js-list-handle', function(e) {
    console.log('List drag handle clicked!', e.target);
    e.stopPropagation();
  });
  
  $listsDom.on('mousedown', '.js-list-header', function(e) {
    console.log('List header clicked!', e.target);
  });
  
  // Add debugging for sortable events
  $listsDom.on('sortstart', function(e, ui) {
    console.log('Sortable start event fired!', ui.item);
  });
  
  $listsDom.on('sortbeforestop', function(e, ui) {
    console.log('Sortable beforeStop event fired!', ui.item);
  });
  
  $listsDom.on('sortstop', function(e, ui) {
    console.log('Sortable stop event fired!', ui.item);
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
      console.log('List drag started');
      ui.helper.css('z-index', 1000);
      ui.placeholder.height(ui.helper.height());
      ui.placeholder.width(ui.helper.width());
      EscapeActions.executeUpTo('popup-close');
      boardComponent.setIsDragging(true);
      
      // Add visual feedback for list being dragged
      ui.item.addClass('ui-sortable-helper');
      
      // Disable dragscroll during list dragging to prevent interference
      console.log('Disabling dragscroll for list dragging');
      dragscroll.reset();
      
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
      console.log('List drag stopped');
      // To attribute the new index number, we need to get the DOM element
      // of the previous and the following card -- if any.
      const prevListDom = ui.item.prev('.js-list').get(0);
      const nextListDom = ui.item.next('.js-list').get(0);
      const sortIndex = calculateIndex(prevListDom, nextListDom, 1);

      const listDomElement = ui.item.get(0);
      if (!listDomElement) {
        console.error('List DOM element not found during drag stop');
        return;
      }
      
      let list;
      try {
        list = Blaze.getData(listDomElement);
      } catch (error) {
        console.error('Error getting list data:', error);
        return;
      }
      
      if (!list) {
        console.error('List data not found for element:', listDomElement);
        return;
      }

      // Detect if the list was dropped in a different swimlane
      const targetSwimlaneDom = ui.item.closest('.js-swimlane');
      let targetSwimlaneId = null;

      console.log('Target swimlane DOM:', targetSwimlaneDom.length, targetSwimlaneDom.attr('id'));

      if (targetSwimlaneDom.length > 0) {
        // List was dropped in a swimlane
        try {
          targetSwimlaneId = targetSwimlaneDom.attr('id').replace('swimlane-', '');
          console.log('List dropped in swimlane:', targetSwimlaneId);
        } catch (error) {
          console.error('Error getting target swimlane ID:', error);
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
            console.log('List dropped in lists view, using default swimlane:', targetSwimlaneId);
          }
        }
      }

      // Get the original swimlane ID of the list (handle backward compatibility)
      const originalSwimlaneId = list.getEffectiveSwimlaneId ? list.getEffectiveSwimlaneId() : (list.swimlaneId || null);

      /*
            Reverted incomplete change list width,
            removed from below Lists.update:
             https://github.com/wekan/wekan/issues/4558
                $set: {
                  width: list._id.width(),
                  height: list._id.height(),
      */

      // Prepare update object
      const updateData = {
        sort: sortIndex.base,
      };

      // Check if the list was dropped in a different swimlane
      const isDifferentSwimlane = targetSwimlaneId && targetSwimlaneId !== originalSwimlaneId;
      console.log('Cross-swimlane check:', {
        originalSwimlaneId,
        targetSwimlaneId,
        isDifferentSwimlane
      });

      // If the list was dropped in a different swimlane, update the swimlaneId
      if (isDifferentSwimlane) {
        updateData.swimlaneId = targetSwimlaneId;
        if (process.env.DEBUG === 'true') {
          console.log(`Moving list "${list.title}" from swimlane ${originalSwimlaneId} to swimlane ${targetSwimlaneId}`);
        }

        // Move all cards in the list to the new swimlane
        const cardsInList = ReactiveCache.getCards({
          listId: list._id,
          archived: false
        });

        cardsInList.forEach(card => {
          card.move(list.boardId, targetSwimlaneId, list._id);
        });

        if (process.env.DEBUG === 'true') {
          console.log(`Moved ${cardsInList.length} cards to swimlane ${targetSwimlaneId}`);
        }

        // Don't cancel the sortable when moving to a different swimlane
        // The DOM move should be allowed to complete
      } else {
        // If staying in the same swimlane, cancel the sortable to prevent DOM manipulation issues
        $listsDom.sortable('cancel');
      }

      try {
        Lists.update(list._id, {
          $set: updateData,
        });
        console.log('List updated successfully:', list._id, updateData);
      } catch (error) {
        console.error('Error updating list:', error);
        return;
      }

      boardComponent.setIsDragging(false);
      
      // Re-enable dragscroll after list dragging is complete
      console.log('Re-enabling dragscroll after list dragging');
      dragscroll.reset();
      
      // Re-enable dragscroll on all swimlanes
      $('.js-swimlane').each(function() {
        $(this).addClass('dragscroll');
      });
    },
  });
  } catch (error) {
    console.error('Error initializing list sortable:', error);
    return;
  }
  
  console.log('List sortable initialization completed successfully');
  console.log('Sortable data after init:', $listsDom.data('uiSortable') || $listsDom.data('sortable'));

  boardComponent.autorun(() => {
    const $listDom = $listsDom;
    console.log('Autorun running, checking sortable status...');
    console.log('Has uiSortable:', $listDom.data('uiSortable'));
    console.log('Has sortable:', $listDom.data('sortable'));
    if ($listDom.data('uiSortable') || $listDom.data('sortable')) {
      if (Utils.isTouchScreenOrShowDesktopDragHandles()) {
        $listsDom.sortable('option', 'handle', '.js-list-handle');
        console.log('List sortable: Using .js-list-handle as handle');
        console.log('Found drag handles:', $listsDom.find('.js-list-handle').length);
      } else {
        $listsDom.sortable('option', 'handle', '.js-list-header');
        console.log('List sortable: Using .js-list-header as handle');
        console.log('Found list headers:', $listsDom.find('.js-list-header').length);
      }
      
      const currentUser = ReactiveCache.getCurrentUser();
      const canModify = Utils.canModifyBoard();
      const isDisabled = !canModify;
      $listsDom.sortable('option', 'disabled', isDisabled);
      console.log('List sortable disabled:', isDisabled);
      console.log('Can modify board:', canModify);
      console.log('Current user:', currentUser ? currentUser.username : 'null');
      console.log('Is board member:', currentUser ? currentUser.isBoardMember() : 'null');
      console.log('Is comment only:', currentUser ? currentUser.isCommentOnly() : 'null');
    } else {
      console.log('List sortable not initialized yet');
    }
  });
}

BlazeComponent.extendComponent({
  onRendered() {
    const boardComponent = this.parentComponent();
    const $listsDom = this.$('.js-lists');
    
    console.log('Swimlane onRendered - DOM elements found:', $listsDom.length);
    console.log('Swimlane onRendered - DOM element:', $listsDom[0]);

    if (!Utils.getCurrentCardId()) {
      boardComponent.scrollLeft();
    }

    console.log('Calling initSortable...');
    initSortable(boardComponent, $listsDom);
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
            Utils.isTouchScreenOrShowDesktopDragHandles()
              ? ['.js-list-handle', '.js-swimlane-header-handle']
              : ['.js-list-header'],
          ).concat([
            '.js-list-resize-handle',
            '.js-swimlane-resize-handle'
          ]);

          const isResizeHandle = $(evt.target).closest('.js-list-resize-handle, .js-swimlane-resize-handle').length > 0;
          const isInNoDragArea = $(evt.target).closest(noDragInside.join(',')).length > 0;
          
          if (isResizeHandle) {
            console.log('Board drag prevented - resize handle clicked');
            return;
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
    const user = ReactiveCache.getCurrentUser();
    const swimlane = Template.currentData();
    const height = user.getSwimlaneHeightFromStorage(swimlane.boardId, swimlane._id);
    return height == -1 ? "auto" : (height + 5 + "px");
  },

  onRendered() {
    // Initialize swimlane resize functionality immediately
    this.initializeSwimlaneResize();
  },

  initializeSwimlaneResize() {
    // Check if we're still in a valid template context
    if (!Template.currentData()) {
      console.warn('No current template data available for swimlane resize initialization');
      return;
    }
    
    const swimlane = Template.currentData();
    const $swimlane = $(`#swimlane-${swimlane._id}`);
    const $resizeHandle = $swimlane.find('.js-swimlane-resize-handle');
    
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
      
      // Use the new storage method that handles both logged-in and non-logged-in users
      Meteor.call('applySwimlaneHeightToStorage', boardId, swimlaneId, finalHeight, (error, result) => {
        if (error) {
          console.error('Error saving swimlane height:', error);
        } else {
          if (process.env.DEBUG === 'true') {
          }
        }
      });
      
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
    
  },
}).register('swimlane');

BlazeComponent.extendComponent({
  onCreated() {
    this.currentBoard = Utils.getCurrentBoard();
    this.isListTemplatesSwimlane =
      this.currentBoard.isTemplatesBoard() &&
      this.currentData().isListTemplatesSwimlane();
    this.currentSwimlane = this.currentData();
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

Template.swimlane.helpers({
  canSeeAddList() {
    return ReactiveCache.getCurrentUser().isBoardAdmin();
  },
});

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
    const boardComponent = this.parentComponent();
    const $listsDom = this.$('.js-lists');
    
    console.log('ListsGroup onRendered - DOM elements found:', $listsDom.length);
    console.log('ListsGroup onRendered - DOM element:', $listsDom[0]);

    if (!Utils.getCurrentCardId()) {
      boardComponent.scrollLeft();
    }

    console.log('ListsGroup calling initSortable...');
    initSortable(boardComponent, $listsDom);
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
