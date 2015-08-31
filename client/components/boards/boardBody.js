var subManager = new SubsManager();

BlazeComponent.extendComponent({
  template: function() {
    return 'board';
  },

  onCreated: function() {
    this.draggingActive = new ReactiveVar(false);
    this.showOverlay = new ReactiveVar(false);
    this.isBoardReady = new ReactiveVar(false);

    // The pattern we use to manually handle data loading is described here:
    // https://kadira.io/academy/meteor-routing-guide/content/subscriptions-and-data-management/using-subs-manager
    // XXX The boardId should be readed from some sort the component "props",
    // unfortunatly, Blaze doesn't have this notion.
    this.autorun(() => {
      let currentBoardId = Session.get('currentBoard');
      if (! currentBoardId)
        return;
      var handle = subManager.subscribe('board', currentBoardId);
      Tracker.nonreactive(() => {
        Tracker.autorun(() => {
          this.isBoardReady.set(handle.ready());
        })
      })
    });

    this._isDragging = false;
    this._lastDragPositionX = 0;

    // Used to set the overlay
    this.mouseHasEnterCardDetails = false;
  },

  openNewListForm: function() {
    this.componentChildren('addListForm')[0].open();
  },

  // XXX Flow components allow us to avoid creating these two setter methods by
  // exposing a public API to modify the component state. We need to investigate
  // best practices here.
  setIsDragging: function(bool) {
    this.draggingActive.set(bool);
  },

  scrollLeft: function(position = 0) {
    this.$('.js-lists').animate({
      scrollLeft: position
    });
  },

  currentCardIsInThisList: function() {
    var currentCard = Cards.findOne(Session.get('currentCard'));
    var listId = this.currentData()._id;
    return currentCard && currentCard.listId === listId;
  },

  events: function() {
    return [{
      // XXX The board-overlay div should probably be moved to the parent
      // component.
      'mouseenter .board-overlay': function() {
        if (this.mouseHasEnterCardDetails) {
          this.showOverlay.set(false);
        }
      },

      // Click-and-drag action
      'mousedown .board-canvas': function(evt) {
        if ($(evt.target).closest('a,.js-list-header').length === 0) {
          this._isDragging = true;
          this._lastDragPositionX = evt.clientX;
        }
      },
      'mouseup': function(evt) {
        if (this._isDragging) {
          this._isDragging = false;
        }
      },
      'mousemove': function(evt) {
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
      }
    }];
  }
}).register('board');

Template.boardBody.onRendered(function() {
  var self = BlazeComponent.getComponentForElement(this.firstNode);

  self.listsDom = this.find('.js-lists');

  if (! Session.get('currentCard')) {
    self.scrollLeft();
  }

  // We want to animate the card details window closing. We rely on CSS
  // transition for the actual animation.
  self.listsDom._uihooks = {
    removeElement: function(node) {
      var removeNode = _.once(function() {
        node.parentNode.removeChild(node);
      });
      if ($(node).hasClass('js-card-details')) {
        $(node).css({
          flexBasis: 0,
          padding: 0
        });
        $(self.listsDom).one(CSSEvents.transitionend, removeNode);
      } else {
        removeNode();
      }
    }
  };

  if (! Meteor.user() || ! Meteor.user().isBoardMember())
    return;

  self.$(self.listsDom).sortable({
    tolerance: 'pointer',
    helper: 'clone',
    handle: '.js-list-header',
    items: '.js-list:not(.js-list-composer)',
    placeholder: 'list placeholder',
    distance: 7,
    start: function(evt, ui) {
      ui.placeholder.height(ui.helper.height());
      Popup.close();
    },
    stop: function() {
      self.$('.js-lists').find('.js-list:not(.js-list-composer)').each(
        function(i, list) {
          var data = Blaze.getData(list);
          Lists.update(data._id, {
            $set: {
              sort: i
            }
          });
        }
      );
    }
  });

  // Disable drag-dropping while in multi-selection mode
  self.autorun(function() {
    self.$(self.listsDom).sortable('option', 'disabled',
      MultiSelection.isActive());
  });

  // If there is no data in the board (ie, no lists) we autofocus the list
  // creation form by clicking on the corresponding element.
  var currentBoard = Boards.findOne(Session.get('currentBoard'));
  if (currentBoard.lists().count() === 0) {
    self.openNewListForm();
  }
});

BlazeComponent.extendComponent({
  template: function() {
    return 'addListForm';
  },

  // Proxy
  open: function() {
    this.componentChildren('inlinedForm')[0].open();
  },

  events: function() {
    return [{
      submit: function(evt) {
        evt.preventDefault();
        var title = this.find('.list-name-input');
        if ($.trim(title.value)) {
          Lists.insert({
            title: title.value,
            boardId: Session.get('currentBoard'),
            sort: $('.list').length
          });

          title.value = '';
        }
      }
    }];
  }
}).register('addListForm');
