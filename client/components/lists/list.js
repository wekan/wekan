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
    if (!list) return 0;

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
      return 0;
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
    if (!this.data()) {
      console.warn('No current template data available for list resize initialization');
      return;
    }

    // Check if elements exist
    if (!this.list || !this.resizeHandle) {
      console.info('List or resize handle not found, retrying in 100ms');
      Meteor.setTimeout(() => {
        if (!this.isDestroyed) {
          this.initializeListResize();
        }
      }, 100);
      return;
    }

    let isResizing = false;
    let previousLimit = false;
    // seems reasonable; better let user shrink too much that too little
    const minWidth = 280;
    // stored width
    const width = this.listWidth();
    // min-width is initially min-content; a good start
    let maxWidth = this.listConstraint() || parseInt(this.list.style.getProperty('--list-min-width', `${(minWidth)}px`), 10) || width + 100;
    if (!width || width > maxWidth) {
      width = (maxWidth + minWidth) / 2;
    }

    this.list.style.setProperty('--list-min-width', `${Math.round(minWidth)}px`);
    // actual size before fitting (usually max-content equivalent)
    this.list.style.setProperty('--list-max-width', `${Math.round(maxWidth)}px`);
    // avoid jump effect and ensure width stays consistent
    this.list.style.setProperty('--list-width', `${Math.round(width)}px`);

    const component = this;

    // wait for click to add other events
    const startResize = (e) => {
      // gain access to modern attributes e.g. isPrimary
      e = e.originalEvent;

      if (isResizing || Utils.shouldIgnorePointer(e)) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      $(document).on('pointermove', doResize);
      // e.g. debugger can cancel event without pointerup being fired
      $(document).on('pointercancel', stopResize);
      $(document).on('pointerup', stopResize);

      // --list-width can be either a stored size or "auto"; get actual computed size
      component.currentWidth = component.list.offsetWidth;
      component.list.classList.add('list-resizing');
      document.body.classList.add('list-resizing-active');

      isResizing = true;
    };

    const doResize = (e) => {
      e = e.originalEvent;

      e.preventDefault();
      e.stopPropagation();

      if (!isResizing || !e.isPrimary) {
        return;
      }

      if (!previousLimit && component.collapsed()) {
        previousLimit = true;
        component.list.classList.add('cannot-resize');
        return;
      }

      // relative to document, always >0 because pointer sticks to the right of list
      const deltaX = e.clientX - component.list.getBoundingClientRect().right;
      const candidateWidth = component.currentWidth + deltaX;
      component.currentWidth = Math.max(minWidth, Math.min(maxWidth, candidateWidth));
      const reachingMax = (maxWidth - component.currentWidth - 20) <= 0
      const reachingMin = (component.currentWidth - 20 - minWidth) <= 0
      // visual indicator to avoid trying too hard; try not to apply each tick
      if (!previousLimit && (reachingMax && deltaX > 0 || reachingMin && deltaX < 0)) {
        component.list.classList.add('cannot-resize');
        previousLimit = true;
      } else if (previousLimit && !reachingMax && !reachingMin) {
        component.list.classList.remove('cannot-resize');
        previousLimit = false;
      }
      // Apply the new width immediately for real-time feedback
      component.list.style.setProperty('--list-width', `${component.currentWidth}px`);
    };

    const stopResize = (e) => {
      e = e.originalEvent;

      e.preventDefault();
      e.stopPropagation();

      if (!isResizing || !e.isPrimary) {
        return;
      }

      // hopefully be gentler on cpu
      $(document).off('pointermove', doResize);
      $(document).off('pointercancel', stopResize);
      $(document).off('pointerup', stopResize);
      isResizing = false;

      if (previousLimit) {
        component.list.classList.remove('cannot-resize');
      }

      const finalWidth = parseInt(component.list.style.getPropertyValue('--list-width'), 10);

      // Remove visual feedback but keep the height
      component.list.classList.remove('list-resizing');
      document.body.classList.remove('list-resizing-active');

      if (component.collapse.get()) {
        return;
      }

      // Save the new width using the existing system
      const list = component.data();
      const boardId = list.boardId;
      const listId = list._id;

      // Use the new storage method that handles both logged-in and non-logged-in users
      if (process.env.DEBUG === 'true') {
      }

      const currentUser = ReactiveCache.getCurrentUser();
      if (currentUser) {
        // For logged-in users, use server method
        Meteor.call('applyListWidthToStorage', boardId, listId, finalWidth, maxWidth, (error, result) => {
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

    // handle both pointer and touch
    $(this.resizeHandle).on("pointerdown", startResize);

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