const subManager = new SubsManager();
const { calculateIndex, enableClickOnTouch } = Utils;

Template.boardListHeaderBar.events({
  'click .js-open-archived-board'() {
    Modal.open('archivedBoards');
  },
});

Template.boardListHeaderBar.helpers({
  title() {
    return FlowRouter.getRouteName() === 'home' ? 'my-boards' : 'public';
  },
  templatesBoardId() {
    return Meteor.user() && Meteor.user().getTemplatesBoardId();
  },
  templatesBoardSlug() {
    return Meteor.user() && Meteor.user().getTemplatesBoardSlug();
  },
});

BlazeComponent.extendComponent({
  onCreated() {
    Meteor.subscribe('setting');
  },

  onRendered() {
    function userIsAllowedToMove() {
      return Meteor.user();
    }

    const itemsSelector = '.js-board:not(.placeholder)';

    const $boards = this.$('.js-boards');
    $boards.sortable({
      connectWith: '.js-boards',
      tolerance: 'pointer',
      appendTo: '.board-list',
      helper: 'clone',
      distance: 7,
      items: itemsSelector,
      placeholder: 'board-wrapper placeholder',
      start(evt, ui) {
        ui.helper.css('z-index', 1000);
        ui.placeholder.height(ui.helper.height());
        EscapeActions.executeUpTo('popup-close');
      },
      stop(evt, ui) {
        // To attribute the new index number, we need to get the DOM element
        // of the previous and the following card -- if any.
        const prevBoardDom = ui.item.prev('.js-board').get(0);
        const nextBoardBom = ui.item.next('.js-board').get(0);
        const sortIndex = calculateIndex(prevBoardDom, nextBoardBom, 1);

        const boardDomElement = ui.item.get(0);
        const board = Blaze.getData(boardDomElement);
        // Normally the jquery-ui sortable library moves the dragged DOM element
        // to its new position, which disrupts Blaze reactive updates mechanism
        // (especially when we move the last card of a list, or when multiple
        // users move some cards at the same time). To prevent these UX glitches
        // we ask sortable to gracefully cancel the move, and to put back the
        // DOM in its initial state. The card move is then handled reactively by
        // Blaze with the below query.
        $boards.sortable('cancel');

        board.move(sortIndex.base);
      },
    });

    // ugly touch event hotfix
    enableClickOnTouch(itemsSelector);

    // Disable drag-dropping if the current user is not a board member or is comment only
    this.autorun(() => {
      if (Utils.isMiniScreen()) {
        $boards.sortable({
          handle: '.board-handle',
        });
      }

      $boards.sortable('option', 'disabled', !userIsAllowedToMove());
    });
  },

  boards() {
    const query = {
      archived: false,
      type: 'board',
    };
    if (FlowRouter.getRouteName() === 'home')
      query['members.userId'] = Meteor.userId();
    else query.permission = 'public';

    return Boards.find(query, {
      sort: { sort: 1 /* boards default sorting */ },
    });
  },
  isStarred() {
    const user = Meteor.user();
    return user && user.hasStarred(this.currentData()._id);
  },
  isAdministrable() {
    const user = Meteor.user();
    return user && user.isBoardAdmin(this.currentData()._id);
  },

  hasOvertimeCards() {
    subManager.subscribe('board', this.currentData()._id, false);
    return this.currentData().hasOvertimeCards();
  },

  hasSpentTimeCards() {
    subManager.subscribe('board', this.currentData()._id, false);
    return this.currentData().hasSpentTimeCards();
  },

  isInvited() {
    const user = Meteor.user();
    return user && user.isInvitedTo(this.currentData()._id);
  },

  events() {
    return [
      {
        'click .js-add-board': Popup.open('createBoard'),
        'click .js-star-board'(evt) {
          const boardId = this.currentData()._id;
          Meteor.user().toggleBoardStar(boardId);
          evt.preventDefault();
        },
        'click .js-clone-board'(evt) {
          Meteor.call(
            'cloneBoard',
            this.currentData()._id,
            Session.get('fromBoard'),
            (err, res) => {
              if (err) {
                this.setError(err.error);
              } else {
                Session.set('fromBoard', null);
                Utils.goBoardId(res);
              }
            },
          );
          evt.preventDefault();
        },
        'click .js-archive-board'(evt) {
          const boardId = this.currentData()._id;
          Meteor.call('archiveBoard', boardId);
          evt.preventDefault();
        },
        'click .js-accept-invite'() {
          const boardId = this.currentData()._id;
          Meteor.call('acceptInvite', boardId);
        },
        'click .js-decline-invite'() {
          const boardId = this.currentData()._id;
          Meteor.call('quitBoard', boardId, (err, ret) => {
            if (!err && ret) {
              Meteor.call('acceptInvite', boardId);
              FlowRouter.go('home');
            }
          });
        },
      },
    ];
  },
}).register('boardList');
