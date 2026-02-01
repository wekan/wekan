import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
require('/client/lib/jquery-ui.js')

const { calculateIndex } = Utils;

export const itemsSelector = '.js-minicard:not(.placeholder, .js-card-composer)';

BlazeComponent.extendComponent({
  // Proxy
  openForm(options) {
    this.childComponents('listBody')[0].openForm(options);
  },

  onCreated() {
    this.newCardFormIsVisible = new ReactiveVar(true);
    this.collapse = new ReactiveVar(Utils.getListCollapseState(this.data()));
  },

  // The jquery UI sortable library is the best solution I've found so far. I
  // tried sortable and dragula but they were not powerful enough four our use
  // case. I also considered writing/forking a drag-and-drop + sortable library
  // but it's probably too much work.
  // By calling asking the sortable library to cancel its move on the `stop`
  // callback, we basically solve all issues related to reactive updates. A
  // comment below provides further details.
  onRendered() {
    this.list = this.firstNode();
    this.resizeHandle = this.find('.js-list-resize-handle');
    this.initializeListResize();

    const ensureCollapseState = (collapsed) => {
      if (this.collapse.get() === collapsed) return;
      if (this.autoWidth() || collapsed) {
        $(this.resizeHandle).hide();
      } else {
        $(this.resizeHandle).show();
      }
      this.collapse.set(collapsed);
      this.initializeListResize();
    }

    // Reactively update collapse appearance and resize handle visibility when auto-width or collapse changes
    this.autorun(() => {
      ensureCollapseState(Utils.getListCollapseState(this.data()));
    });
  },

  collapsed() {
    return this.collapse.get();
  },


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

  initializeListResize() {
    // Check if we're still in a valid template context
    if (!Template.currentData()) {
      console.warn('No current template data available for list resize initialization');
      return;
    }

    const list = Template.currentData();
    const $list = this.$('.js-list');
    const $resizeHandle = this.$('.js-list-resize-handle');

    // Check if elements exist
    if (!$list.length || !$resizeHandle.length) {
      console.warn('List or resize handle not found, retrying in 100ms');
      Meteor.setTimeout(() => {
        if (!this.isDestroyed) {
          this.initializeListResize();
        }
      }, 100);
      return;
    }

    // Reactively show/hide resize handle based on collapse and auto-width state
    this.autorun(() => {
      const isAutoWidth = this.autoWidth();
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
    let minWidth = 100; // Minimum width as defined in the existing code
    let listConstraint = this.listConstraint(); // Store constraint value for use in event handlers
    const component = this; // Store reference to component for use in event handlers

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

      // Keep the CSS custom property for persistent width
      // The CSS custom property will remain on the element to maintain the width

      // Save the new width using the existing system
      const boardId = list.boardId;
      const listId = list._id;

      // Use the new storage method that handles both logged-in and non-logged-in users
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
    component.autorun(() => {
      const collapsed = Utils.getListCollapseState(list);
      if (component.autoWidth() || collapsed) {
        $resizeHandle.hide();
      } else {
        $resizeHandle.show();
      }
    });

    // Clean up on component destruction
    component.onDestroyed(() => {
      $(document).off('mousemove', doResize);
      $(document).off('mouseup', stopResize);
      $(document).off('touchmove', doResize);
      $(document).off('touchend', stopResize);
    });
  },
}).register('list');

Template.miniList.events({
  'click .js-select-list'() {
    const listId = this._id;
    Session.set('currentList', listId);
  },
});