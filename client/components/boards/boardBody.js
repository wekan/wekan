const subManager = new SubsManager();

BlazeComponent.extendComponent({
  template() {
    return 'board';
  },

  onCreated() {
    this.draggingActive = new ReactiveVar(false);
    this.showOverlay = new ReactiveVar(false);
    this.isBoardReady = new ReactiveVar(false);

    // The pattern we use to manually handle data loading is described here:
    // https://kadira.io/academy/meteor-routing-guide/content/subscriptions-and-data-management/using-subs-manager
    // XXX The boardId should be readed from some sort the component "props",
    // unfortunatly, Blaze doesn't have this notion.
    this.autorun(() => {
      const currentBoardId = Session.get('currentBoard');
      if (!currentBoardId)
        return;
      const handle = subManager.subscribe('board', currentBoardId);
      Tracker.nonreactive(() => {
        Tracker.autorun(() => {
          this.isBoardReady.set(handle.ready());
        });
      });
    });

    this._isDragging = false;
    this._lastDragPositionX = 0;

    // Used to set the overlay
    self.mouseHasEnterCardDetails = false;

    //Session.set('currentBoardSort', Boards.findOne(Session.get('currentBoard')).sortType);
  },

  openNewListForm() {
    this.componentChildren('addListForm')[0].open();
  },

  // XXX Flow components allow us to avoid creating these two setter methods by
  // exposing a public API to modify the component state. We need to investigate
  // best practices here.
  setIsDragging(bool) {
    this.draggingActive.set(bool);
  },

  scrollLeft(position = 0) {
    this.$('.js-lists').animate({
      scrollLeft: position,
    });
  },

  currentCardIsInThisList() {
    const currentCard = Cards.findOne(Session.get('currentCard'));
    const listId = this.currentData()._id;
    return currentCard && currentCard.listId === listId;
  },

  events() {
    return [{
      // XXX The board-overlay div should probably be moved to the parent
      // component.
      'mouseenter .board-overlay'() {
        if (this.mouseHasEnterCardDetails) {
          this.showOverlay.set(false);
        }
      },

      // Click-and-drag action
      'mousedown .board-canvas'(evt) {
        // Translating the board canvas using the click-and-drag action can
        // conflict with the build-in browser mechanism to select text. We
        // define a list of elements in which we disable the dragging because
        // the user will legitimately expect to be able to select some text with
        // his mouse.
        const noDragInside = ['a', 'input', 'textarea', 'p', '.js-list-header'];
        if ($(evt.target).closest(noDragInside.join(',')).length === 0) {
          this._isDragging = true;
          this._lastDragPositionX = evt.clientX;
        }
      },
      'mouseup'() {
        if (this._isDragging) {
          this._isDragging = false;
        }
      },
      'mousemove'(evt) {
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
    }];
  },
}).register('board');

Template.boardBody.onRendered(function() {
  const self = BlazeComponent.getComponentForElement(this.firstNode);

  self.listsDom = this.find('.js-lists');

  if (!Session.get('currentCard')) {
    self.scrollLeft();
  }

  // We want to animate the card details window closing. We rely on CSS
  // transition for the actual animation.
  self.listsDom._uihooks = {
    removeElement(node) {
      const removeNode = _.once(() => {
        node.parentNode.removeChild(node);
      });
      if ($(node).hasClass('js-card-details')) {
        $(node).css({
          flexBasis: 0,
          padding: 0,
        });
        $(self.listsDom).one(CSSEvents.transitionend, removeNode);
      } else {
        removeNode();
      }
    },
  };

  const currentBoard = Boards.findOne(Session.get('currentBoard'));
  if (!Meteor.user() || !Meteor.user().isBoardMember() ||
    (currentBoard.isCollaborate() && ! (Meteor.user().isBoardAdmin())))
    return;

  self.$(self.listsDom).sortable({
    tolerance: 'pointer',
    helper: 'clone',
    handle: '.js-list-header',
    items: '.js-list:not(.js-list-composer)',
    placeholder: 'list placeholder',
    distance: 7,
    start(evt, ui) {
      ui.placeholder.height(ui.helper.height());
      Popup.close();
    },
    stop() {
      self.$('.js-lists').find('.js-list:not(.js-list-composer)').each(
        (i, list) => {
          const data = Blaze.getData(list);
          Lists.update(data._id, {
            $set: {
              sort: i,
            },
          });
        }
      );
    },
  });

  // Disable drag-dropping while in multi-selection mode
  self.autorun(() => {
    self.$(self.listsDom).sortable('option', 'disabled',
      MultiSelection.isActive());
  });

  // If there is no data in the board (ie, no lists) we autofocus the list
  // creation form by clicking on the corresponding element.
  if (currentBoard.lists().count() === 0) {
    self.openNewListForm();
  }
});

BlazeComponent.extendComponent({
  template() {
    return 'addListForm';
  },

  // Proxy
  open() {
    this.componentChildren('inlinedForm')[0].open();
  },

  onRendered() {
    // this.updatePermission();

  },

  updatePermission(){
    
  },

  onCreated() {
    this.permissionMenuIsOpen = new ReactiveVar(false);
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    if( currentBoard.isCollaborate() && currentBoard.lists().count() === 0 )
      this.permission = new ReactiveVar('registered');
    else if( currentBoard.isCollaborate() )
      this.permission = new ReactiveVar('admin');
    else
      this.permission = new ReactiveVar('member'); 
    this.autorun(() => {
      const currentBoard = Boards.findOne(Session.get('currentBoard'));
      if( currentBoard.isCollaborate() && currentBoard.lists().count() === 0 )
        this.setPermission('registered');
      else if( currentBoard.isCollaborate() )
        this.setPermission('admin');
      else
        this.setPermission('member'); 
    });
  },

  

  permissionCheck() {
    return this.currentData() === this.permission.get();
  },

  setPermission(permission) {
    this.permission.set(permission);
    this.permissionMenuIsOpen.set(false);
  },

  togglePermissionMenu() {
    this.permissionMenuIsOpen.set(!this.permissionMenuIsOpen.get());
  },

  events() {
    return [{
      'click .js-change-permission': this.togglePermissionMenu,
      'click .js-select-permission'() {
        this.setPermission(this.currentData());
      },
      submit(evt) {
        evt.preventDefault();
        var permission = this.permission.get();
        const title = this.find('.list-name-input');
        if ($.trim(title.value)) {
          Lists.insert({
            title: title.value,
            boardId: Session.get('currentBoard'),
            sort: $('.list').length,
            permission: permission,
          });

          this.updatePermission();
          title.value = '';
          title.focus();
        }
      },
    }];
  },
}).register('addListForm');
