const { calculateIndex } = Utils;

BlazeComponent.extendComponent({
  onRendered() {
    const boardComponent = this.parentComponent();
    const $swimlanesDom = boardComponent.$('.js-swimlanes');

    $swimlanesDom.sortable({
      tolerance: 'pointer',
      appendTo: 'body',
      helper: 'clone',
      handle: '.js-swimlane-header',
      items: '.js-swimlane:not(.placeholder)',
      placeholder: 'swimlane placeholder',
      distance: 7,
      start(evt, ui) {
        ui.placeholder.height(ui.helper.height());
        EscapeActions.executeUpTo('popup-close');
        boardComponent.setIsDragging(true);
      },
      stop(evt, ui) {
        // To attribute the new index number, we need to get the DOM element
        // of the previous and the following card -- if any.
        const prevSwimlaneDom = ui.item.prev('.js-swimlane').get(0);
        const nextSwimlaneDom = ui.item.next('.js-swimlane').get(0);
        const sortIndex = calculateIndex(prevSwimlaneDom, nextSwimlaneDom, 1);

        $swimlanesDom.sortable('cancel');
        const swimlaneDomElement = ui.item.get(0);
        const swimlane = Blaze.getData(swimlaneDomElement);

        Swimlanes.update(swimlane._id, {
          $set: {
            sort: sortIndex.base,
          },
        });

        boardComponent.setIsDragging(false);
      },
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

  // XXX Flow components allow us to avoid creating these two setter methods by
  // exposing a public API to modify the component state. We need to investigate
  // best practices here.
  setIsDragging(bool) {
    this.draggingActive.set(bool);
  },

  scrollLeft(position = 0) {
    const lists = this.$('.js-lists');
    lists && lists.animate({
      scrollLeft: position,
    });
  },

  currentCardIsInThisList(listId, swimlaneId) {
    const currentCard = Cards.findOne(Session.get('currentCard'));
    const currentBoardId = Session.get('currentBoard');
    const board = Boards.findOne(currentBoardId);
    if (board.view === 'board-view-lists')
      return currentCard && currentCard.listId === listId;
    else if (board.view === 'board-view-swimlanes')
      return currentCard && currentCard.listId === listId && currentCard.swimlaneId === swimlaneId;
    else
      return false;
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
          Lists.insert({
            title,
            boardId: Session.get('currentBoard'),
            sort: $('.list').length,
          });

          titleInput.value = '';
          titleInput.focus();
        }
      },
    }];
  },
}).register('addListForm');

BlazeComponent.extendComponent({
  // Proxy
  open() {
    this.childComponents('inlinedForm')[0].open();
  },

  events() {
    return [{
      submit(evt) {
        evt.preventDefault();
        let titleInput = this.find('.list-name-input');
        if (titleInput) {
          const title = titleInput.value.trim();
          if (title) {
            Lists.insert({
              title,
              boardId: Session.get('currentBoard'),
              sort: $('.list').length,
            });

            titleInput.value = '';
            titleInput.focus();
          }
        } else {
          titleInput = this.find('.swimlane-name-input');
          const title = titleInput.value.trim();
          if (title) {
            Swimlanes.insert({
              title,
              boardId: Session.get('currentBoard'),
              sort: $('.swimlane').length,
            });

            titleInput.value = '';
            titleInput.focus();
          }
        }
      },
    }];
  },
}).register('addListAndSwimlaneForm');

Template.swimlane.helpers({
  canSeeAddList() {
    return Meteor.user() && Meteor.user().isBoardMember() && !Meteor.user().isCommentOnly();
  },
});
