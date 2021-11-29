require('/client/lib/jquery-ui.js')

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

    function userIsMember() {
      return (
        Meteor.user() &&
        Meteor.user().isBoardMember() &&
        !Meteor.user().isCommentOnly()
      );
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
            helper.append(
              $(
                Blaze.toHTML(
                  HTML.DIV(
                    { class: 'and-n-other' },
                    TAPi18n.__('and-n-other-card', { count: andNOthers }),
                  ),
                ),
              ),
            );
          }
        }
        return helper;
      },
      distance: 7,
      items: itemsSelector,
      placeholder: 'minicard-wrapper placeholder',
      start(evt, ui) {
        ui.helper.css('z-index', 1000);
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
        const currentBoard = Boards.findOne(Session.get('currentBoard'));
        const defaultSwimlaneId = currentBoard.getDefaultSwimline()._id;
        let targetSwimlaneId = null;

        // only set a new swimelane ID if the swimlanes view is active
        if (
          Utils.boardView() === 'board-view-swimlanes' ||
          currentBoard.isTemplatesBoard()
        )
          targetSwimlaneId = Blaze.getData(ui.item.parents('.swimlane').get(0))
            ._id;

        // Normally the jquery-ui sortable library moves the dragged DOM element
        // to its new position, which disrupts Blaze reactive updates mechanism
        // (especially when we move the last card of a list, or when multiple
        // users move some cards at the same time). To prevent these UX glitches
        // we ask sortable to gracefully cancel the move, and to put back the
        // DOM in its initial state. The card move is then handled reactively by
        // Blaze with the below query.
        $cards.sortable('cancel');

        if (MultiSelection.isActive()) {
          Cards.find(MultiSelection.getMongoSelector(), {sort: ['sort']}).forEach((card, i) => {
            const newSwimlaneId = targetSwimlaneId
              ? targetSwimlaneId
              : card.swimlaneId || defaultSwimlaneId;
            card.move(
              currentBoard._id,
              newSwimlaneId,
              listId,
              sortIndex.base + i * sortIndex.increment,
            );
          });
        } else {
          const cardDomElement = ui.item.get(0);
          const card = Blaze.getData(cardDomElement);
          const newSwimlaneId = targetSwimlaneId
            ? targetSwimlaneId
            : card.swimlaneId || defaultSwimlaneId;
          card.move(currentBoard._id, newSwimlaneId, listId, sortIndex.base);
        }
        boardComponent.setIsDragging(false);
      },
      sort(event, ui) {
        const $boardCanvas = $('.board-canvas');
        const  boardCanvas = $boardCanvas[0];

        if (event.pageX < 10)
        { // scroll to the left
          boardCanvas.scrollLeft -= 15;
          ui.helper[0].offsetLeft -= 15;
        }
        if (
          event.pageX > boardCanvas.offsetWidth - 10 &&
          boardCanvas.scrollLeft < $boardCanvas.data('scrollLeftMax') // don't scroll more than possible
        )
        { // scroll to the right
          boardCanvas.scrollLeft += 15;
        }
        if (
          event.pageY > boardCanvas.offsetHeight - 10 &&
          event.pageY + boardCanvas.scrollTop < $boardCanvas.data('scrollTopMax') // don't scroll more than possible
        )
        { // scroll to the bottom
          boardCanvas.scrollTop += 15;
        }
        if (event.pageY < 10)
        { // scroll to the top
          boardCanvas.scrollTop -= 15;
        }
      },
      activate(event, ui) {
        const $boardCanvas = $('.board-canvas');
        const  boardCanvas = $boardCanvas[0];
        // scrollTopMax and scrollLeftMax only available at Firefox (https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollTopMax)
        // https://www.it-swarm.com.de/de/javascript/so-erhalten-sie-den-maximalen-dokument-scrolltop-wert/1069126844/
        $boardCanvas.data('scrollTopMax', boardCanvas.scrollHeight - boardCanvas.clientTop);
        // https://stackoverflow.com/questions/5138373/how-do-i-get-the-max-value-of-scrollleft/5704386#5704386
        $boardCanvas.data('scrollLeftMax', boardCanvas.scrollWidth - boardCanvas.clientWidth);
      },
    });

    this.autorun(() => {
      if (Utils.isMiniScreenOrShowDesktopDragHandles()) {
        $cards.sortable({
          handle: '.handle',
        });
      } else {
        $cards.sortable({
          handle: '.minicard',
        });
      }

      if ($cards.data('uiSortable') || $cards.data('sortable')) {
        $cards.sortable(
          'option',
          'disabled',
          // Disable drag-dropping when user is not member
          !userIsMember(),
          // Not disable drag-dropping while in multi-selection mode
          // MultiSelection.isActive() || !userIsMember(),
        );
      }
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
