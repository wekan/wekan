const { calculateIndex } = Utils;

BlazeComponent.extendComponent({
  // Proxy
  openForm(options) {
    this.childComponents('listBody')[0].openForm(options);
  },

  onCreated() {
    this.newCardFormIsVisible = new ReactiveVar(true);
  },

  // The jquery UI sortable library is the best solution I've found so far. I
  // tried sortable and dragula but they were not powerful enough four our use
  // case. I also considered writing/forking a drag-and-drop + sortable library
  // but it's probably too much work.
  // By calling asking the sortable library to cancel its move on the `stop`
  // callback, we basically solve all issues related to reactive updates. A
  // comment below provides further details.
  onRendered() {
    const boardComponent = this.parentComponent().parentComponent();
    const $listsDom = boardComponent.$('.js-lists');

    if (!Session.get('currentCard')) {
      boardComponent.scrollLeft();
    }

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

    // If there is no data in the board (ie, no lists) we autofocus the list
    // creation form by clicking on the corresponding element.
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    if (userIsMember() && currentBoard.lists().count() === 0) {
      boardComponent.openNewListForm();
    }

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
            helper.append($(Blaze.toHTML(HTML.DIV(
              { 'class': 'and-n-other' },
              TAPi18n.__('and-n-other-card', { count: andNOthers })
            ))));
          }
        }
        return helper;
      },
      distance: 7,
      items: itemsSelector,
      placeholder: 'minicard-wrapper placeholder',
      start(evt, ui) {
        ui.placeholder.height(ui.helper.height());
        EscapeActions.executeUpTo('popup-close');
        boardComponent.setIsDragging(true);
      },
      stop(evt, ui) {
        // To attribute the new index number, we need to get the DOM element
        // of the previous and the following card -- if any.
        const prevCardDom = ui.item.prev('.js-minicard').get(0);
        const nextCardDom = ui.item.next('.js-minicard').get(0);
        const nCards = MultiSelection.isActive() ? MultiSelection.count() : 1;
        const sortIndex = calculateIndex(prevCardDom, nextCardDom, nCards);
        const listId = Blaze.getData(ui.item.parents('.list').get(0))._id;
        const swimlaneId = Blaze.getData(ui.item.parents('.swimlane').get(0))._id;

        // Normally the jquery-ui sortable library moves the dragged DOM element
        // to its new position, which disrupts Blaze reactive updates mechanism
        // (especially when we move the last card of a list, or when multiple
        // users move some cards at the same time). To prevent these UX glitches
        // we ask sortable to gracefully cancel the move, and to put back the
        // DOM in its initial state. The card move is then handled reactively by
        // Blaze with the below query.
        $cards.sortable('cancel');

        if (MultiSelection.isActive()) {
          Cards.find(MultiSelection.getMongoSelector()).forEach((card, i) => {
            card.move(swimlaneId, listId, sortIndex.base + i * sortIndex.increment);
          });
        } else {
          const cardDomElement = ui.item.get(0);
          const card = Blaze.getData(cardDomElement);
          card.move(swimlaneId, listId, sortIndex.base);
        }
        boardComponent.setIsDragging(false);
      },
    });

    // Disable drag-dropping if the current user is not a board member or is comment only
    this.autorun(() => {
      $cards.sortable('option', 'disabled', !userIsMember());
    });

    // We want to re-run this function any time a card is added.
    this.autorun(() => {
      const currentBoardId = Tracker.nonreactive(() => {
        return Session.get('currentBoard');
      });
      Cards.find({ boardId: currentBoardId }).fetch();
      Tracker.afterFlush(() => {
        $cards.find(itemsSelector).droppable({
          hoverClass: 'draggable-hover-card',
          accept: '.js-member,.js-label',
          drop(event, ui) {
            const cardId = Blaze.getData(this)._id;
            const card = Cards.findOne(cardId);

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
  },
}).register('list');

Template.miniList.events({
  'click .js-select-list'() {
    const listId = this._id;
    Session.set('currentList', listId);
  },
});
