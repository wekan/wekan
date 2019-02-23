const { calculateIndex, enableClickOnTouch } = Utils;

function currentCardIsInThisList(listId, swimlaneId) {
  const currentCard = Cards.findOne(Session.get('currentCard'));
  const currentUser = Meteor.user();
  if (currentUser && currentUser.profile.boardView === 'board-view-swimlanes')
    return currentCard && currentCard.listId === listId && currentCard.swimlaneId === swimlaneId;
  else // Default view: board-view-lists
    return currentCard && currentCard.listId === listId;
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

  $listsDom.sortable({
    tolerance: 'pointer',
    helper: 'clone',
    handle: '.js-list-header',
    items: '.js-list:not(.js-list-composer)',
    placeholder: 'list placeholder',
    distance: 7,
    start(evt, ui) {
      ui.placeholder.height(ui.helper.height());
      EscapeActions.executeUpTo('popup-close');
      boardComponent.setIsDragging(true);
    },
    stop(evt, ui) {
      // To attribute the new index number, we need to get the DOM element
      // of the previous and the following card -- if any.
      const prevListDom = ui.item.prev('.js-list').get(0);
      const nextListDom = ui.item.next('.js-list').get(0);
      const sortIndex = calculateIndex(prevListDom, nextListDom, 1);

      $listsDom.sortable('cancel');
      const listDomElement = ui.item.get(0);
      const list = Blaze.getData(listDomElement);

      Lists.update(list._id, {
        $set: {
          sort: sortIndex.base,
        },
      });

      boardComponent.setIsDragging(false);
    },
  });

  // ugly touch event hotfix
  enableClickOnTouch('.js-list:not(.js-list-composer)');

  function userIsMember() {
    return Meteor.user() && Meteor.user().isBoardMember() && !Meteor.user().isCommentOnly();
  }

  // Disable drag-dropping while in multi-selection mode, or if the current user
  // is not a board member
  boardComponent.autorun(() => {
    const $listDom = $listsDom;
    if ($listDom.data('sortable')) {
      $listsDom.sortable('option', 'disabled',
        MultiSelection.isActive() || !userIsMember());
    }
  });
}

BlazeComponent.extendComponent({
  onRendered() {
    const boardComponent = this.parentComponent();
    const $listsDom = this.$('.js-lists');

    if (!Session.get('currentCard')) {
      boardComponent.scrollLeft();
    }

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

  events() {
    return [{
      // Click-and-drag action
      'mousedown .board-canvas'(evt) {
        // Translating the board canvas using the click-and-drag action can
        // conflict with the build-in browser mechanism to select text. We
        // define a list of elements in which we disable the dragging because
        // the user will legitimately expect to be able to select some text with
        // his mouse.
        const noDragInside = ['a', 'input', 'textarea', 'p', '.js-list-header'];
        if ($(evt.target).closest(noDragInside.join(',')).length === 0 && this.$('.swimlane').prop('clientHeight') > evt.offsetY) {
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
}).register('swimlane');

BlazeComponent.extendComponent({
  onCreated() {
    this.currentSwimlane = this.currentData();
  },

  // Proxy
  open() {
    this.childComponents('inlinedForm')[0].open();
  },

  events() {
    return [{
      submit(evt) {
        evt.preventDefault();
        const titleInput = this.find('.list-name-input');
        const title = titleInput.value.trim();
        if (title) {
          const listType = (this.currentSwimlane.isListTemplatesSwimlane())?'template-list':'list';
          Lists.insert({
            title,
            boardId: Session.get('currentBoard'),
            sort: $('.list').length,
            type: listType,
            swimlaneId: this.currentSwimlane._id,
          });

          titleInput.value = '';
          titleInput.focus();
        }
      },
    }];
  },
}).register('addListForm');

Template.swimlane.helpers({
  canSeeAddList() {
    return Meteor.user() && Meteor.user().isBoardMember() && !Meteor.user().isCommentOnly();
  },
});

BlazeComponent.extendComponent({
  currentCardIsInThisList(listId, swimlaneId) {
    return currentCardIsInThisList(listId, swimlaneId);
  },
  onRendered() {
    const boardComponent = this.parentComponent();
    const $listsDom = this.$('.js-lists');

    if (!Session.get('currentCard')) {
      boardComponent.scrollLeft();
    }

    initSortable(boardComponent, $listsDom);
  },
}).register('listsGroup');
