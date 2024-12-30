import { ReactiveCache } from '/imports/reactiveCache';
import moment from 'moment/min/moment-with-locales';
import { TAPi18n } from '/imports/i18n';
import { DatePicker } from '/client/lib/datepicker';
import Cards from '/models/cards';
import Boards from '/models/boards';
import Checklists from '/models/checklists';
import Integrations from '/models/integrations';
import Users from '/models/users';
import Lists from '/models/lists';
import CardComments from '/models/cardComments';
import { ALLOWED_COLORS } from '/config/const';
import { UserAvatar } from '../users/userAvatar';
import { DialogWithBoardSwimlaneList } from '/client/lib/dialogWithBoardSwimlaneList';

const subManager = new SubsManager();
const { calculateIndexData } = Utils;

BlazeComponent.extendComponent({
  mixins() {
    return [Mixins.InfiniteScrolling];
  },

  calculateNextPeak() {
    const cardElement = this.find('.js-card-details');
    if (cardElement) {
      const altitude = cardElement.scrollHeight;
      this.callFirstWith(this, 'setNextPeak', altitude);
    }
  },

  reachNextPeak() {
    const activitiesComponent = this.childComponents('activities')[0];
    activitiesComponent.loadNextPage();
  },

  onCreated() {
    this.currentBoard = Utils.getCurrentBoard();
    this.isLoaded = new ReactiveVar(false);

    if (this.parentComponent() && this.parentComponent().parentComponent()) {
      const boardBody = this.parentComponent().parentComponent();
      //in Miniview parent is Board, not BoardBody.
      if (boardBody !== null) {
        boardBody.showOverlay.set(true);
        boardBody.mouseHasEnterCardDetails = false;
      }
    }
    this.calculateNextPeak();

    Meteor.subscribe('unsaved-edits');

    // this.findUsersOptions = new ReactiveVar({});
    // this.page = new ReactiveVar(1);
    // this.autorun(() => {
    //   const limitUsers = this.page.get() * Number.MAX_SAFE_INTEGER;
    //   this.subscribe('people', this.findUsersOptions.get(), limitUsers, () => {});
    // });
  },

  isWatching() {
    const card = this.currentData();
    return card.findWatcher(Meteor.userId());
  },

  customFieldsGrid() {
    return ReactiveCache.getCurrentUser().hasCustomFieldsGrid();
  },


  cardMaximized() {
    return !Utils.getPopupCardId() && ReactiveCache.getCurrentUser().hasCardMaximized();
  },

  presentParentTask() {
    let result = this.currentBoard.presentParentTask;
    if (result === null || result === undefined) {
      result = 'no-parent';
    }
    return result;
  },

  linkForCard() {
    const card = this.currentData();
    let result = '#';
    if (card) {
      const board = ReactiveCache.getBoard(card.boardId);
      if (board) {
        result = FlowRouter.path('card', {
          boardId: card.boardId,
          slug: board.slug,
          cardId: card._id,
        });
      }
    }
    return result;
  },

  showVotingButtons() {
    const card = this.currentData();
    return (
      (currentUser.isBoardMember() ||
        (currentUser && card.voteAllowNonBoardMembers())) &&
      !card.expiredVote()
    );
  },

  showPlanningPokerButtons() {
    const card = this.currentData();
    return (
      (currentUser.isBoardMember() ||
        (currentUser && card.pokerAllowNonBoardMembers())) &&
      !card.expiredPoker()
    );
  },

  isVerticalScrollbars() {
    const user = ReactiveCache.getCurrentUser();
    return user && user.isVerticalScrollbars();
  },

  /** returns if the list id is the current list id
   * @param listId list id to check
   * @return is the list id the current list id ?
   */
  isCurrentListId(listId) {
    const ret = this.data().listId == listId;
    return ret;
  },

  onRendered() {
    if (Meteor.settings.public.CARD_OPENED_WEBHOOK_ENABLED) {
      // Send Webhook but not create Activities records ---
      const card = this.currentData();
      const userId = Meteor.userId();
      const params = {
        userId,
        cardId: card._id,
        boardId: card.boardId,
        listId: card.listId,
        user: ReactiveCache.getCurrentUser().username,
        url: '',
      };

      const integrations = ReactiveCache.getIntegrations({
        boardId: { $in: [card.boardId, Integrations.Const.GLOBAL_WEBHOOK_ID] },
        enabled: true,
        activities: { $in: ['CardDetailsRendered', 'all'] },
      });

      if (integrations.length > 0) {
        integrations.forEach((integration) => {
          Meteor.call(
            'outgoingWebhooks',
            integration,
            'CardSelected',
            params,
            () => { },
          );
        });
      }
      //-------------
    }

    const $checklistsDom = this.$('.card-checklist-items');

    $checklistsDom.sortable({
      tolerance: 'pointer',
      helper: 'clone',
      handle: '.checklist-title',
      items: '.js-checklist',
      placeholder: 'checklist placeholder',
      distance: 7,
      start(evt, ui) {
        ui.placeholder.height(ui.helper.height());
        EscapeActions.clickExecute(evt.target, 'inlinedForm');
      },
      stop(evt, ui) {
        let prevChecklist = ui.item.prev('.js-checklist').get(0);
        if (prevChecklist) {
          prevChecklist = Blaze.getData(prevChecklist).checklist;
        }
        let nextChecklist = ui.item.next('.js-checklist').get(0);
        if (nextChecklist) {
          nextChecklist = Blaze.getData(nextChecklist).checklist;
        }
        const sortIndex = calculateIndexData(prevChecklist, nextChecklist, 1);

        $checklistsDom.sortable('cancel');
        const checklist = Blaze.getData(ui.item.get(0)).checklist;

        Checklists.update(checklist._id, {
          $set: {
            sort: sortIndex.base,
          },
        });
      },
    });

    const $subtasksDom = this.$('.card-subtasks-items');

    $subtasksDom.sortable({
      tolerance: 'pointer',
      helper: 'clone',
      handle: '.subtask-title',
      items: '.js-subtasks',
      placeholder: 'subtasks placeholder',
      distance: 7,
      start(evt, ui) {
        ui.placeholder.height(ui.helper.height());
        EscapeActions.executeUpTo('popup-close');
      },
      stop(evt, ui) {
        let prevChecklist = ui.item.prev('.js-subtasks').get(0);
        if (prevChecklist) {
          prevChecklist = Blaze.getData(prevChecklist).subtask;
        }
        let nextChecklist = ui.item.next('.js-subtasks').get(0);
        if (nextChecklist) {
          nextChecklist = Blaze.getData(nextChecklist).subtask;
        }
        const sortIndex = calculateIndexData(prevChecklist, nextChecklist, 1);

        $subtasksDom.sortable('cancel');
        const subtask = Blaze.getData(ui.item.get(0)).subtask;

        Subtasks.update(subtask._id, {
          $set: {
            subtaskSort: sortIndex.base,
          },
        });
      },
    });

    function userIsMember() {
      return ReactiveCache.getCurrentUser()?.isBoardMember();
    }

    // Disable sorting if the current user is not a board member
    this.autorun(() => {
      const disabled = !userIsMember();
      if (
        $checklistsDom.data('uiSortable') ||
        $checklistsDom.data('sortable')
      ) {
        $checklistsDom.sortable('option', 'disabled', disabled);
        if (Utils.isTouchScreenOrShowDesktopDragHandles()) {
          $checklistsDom.sortable({ handle: '.checklist-handle' });
        }
      }
      if ($subtasksDom.data('uiSortable') || $subtasksDom.data('sortable')) {
        $subtasksDom.sortable('option', 'disabled', disabled);
      }
    });
  },

  onDestroyed() {
    if (this.parentComponent() === null) return;
    const parentComponent = this.parentComponent().parentComponent();
    //on mobile view parent is Board, not board body.
    if (parentComponent === null) return;
    parentComponent.showOverlay.set(false);
  },

  events() {
    const events = {
      [`${CSSEvents.transitionend} .js-card-details`]() {
        this.isLoaded.set(true);
      },
      [`${CSSEvents.animationend} .js-card-details`]() {
        this.isLoaded.set(true);
      },
    };

    return [
      {
        ...events,
        'click .js-close-card-details'() {
          Utils.goBoardId(this.data().boardId);
        },
        'click .js-copy-link'(event) {
          event.preventDefault();
          const promise = Utils.copyTextToClipboard(event.target.href);

          const $tooltip = this.$('.card-details-header .copied-tooltip');
          Utils.showCopied(promise, $tooltip);
        },
        'click .js-open-card-details-menu': Popup.open('cardDetailsActions'),
        'submit .js-card-description'(event) {
          event.preventDefault();
          const description = this.currentComponent().getValue();
          this.data().setDescription(description);
        },
        'submit .js-card-details-title'(event) {
          event.preventDefault();
          const title = this.currentComponent().getValue().trim();
          if (title) {
            this.data().setTitle(title);
          } else {
            this.data().setTitle('');
          }
        },
        'submit .js-card-details-assigner'(event) {
          event.preventDefault();
          const assigner = this.currentComponent().getValue().trim();
          if (assigner) {
            this.data().setAssignedBy(assigner);
          } else {
            this.data().setAssignedBy('');
          }
        },
        'submit .js-card-details-requester'(event) {
          event.preventDefault();
          const requester = this.currentComponent().getValue().trim();
          if (requester) {
            this.data().setRequestedBy(requester);
          } else {
            this.data().setRequestedBy('');
          }
        },
        'keydown input.js-edit-card-sort'(evt) {
          // enter = save
          if (evt.keyCode === 13) {
            this.find('button[type=submit]').click();
          }
        },
        'submit .js-card-details-sort'(event) {
          event.preventDefault();
          const sort = parseFloat(this.currentComponent()
            .getValue()
            .trim());
          if (!Number.isNaN(sort)) {
            let card = this.data();
            card.move(card.boardId, card.swimlaneId, card.listId, sort);
          }
        },
        'change .js-select-card-details-lists'(event) {
          let card = this.data();
          const listSelect = this.$('.js-select-card-details-lists')[0];
          const listId = listSelect.options[listSelect.selectedIndex].value;

          const minOrder = card.getMinSort(listId, card.swimlaneId);
          card.move(card.boardId, card.swimlaneId, listId, minOrder - 1);
        },
        'click .js-go-to-linked-card'() {
          Utils.goCardId(this.data().linkedId);
        },
        'click .js-member': Popup.open('cardMember'),
        'click .js-add-members': Popup.open('cardMembers'),
        'click .js-assignee': Popup.open('cardAssignee'),
        'click .js-add-assignees': Popup.open('cardAssignees'),
        'click .js-add-labels': Popup.open('cardLabels'),
        'click .js-received-date': Popup.open('editCardReceivedDate'),
        'click .js-start-date': Popup.open('editCardStartDate'),
        'click .js-due-date': Popup.open('editCardDueDate'),
        'click .js-end-date': Popup.open('editCardEndDate'),
        'click .js-show-positive-votes': Popup.open('positiveVoteMembers'),
        'click .js-show-negative-votes': Popup.open('negativeVoteMembers'),
        'click .js-custom-fields': Popup.open('cardCustomFields'),
        'mouseenter .js-card-details'() {
          if (this.parentComponent() === null) return;
          const parentComponent = this.parentComponent().parentComponent();
          //on mobile view parent is Board, not BoardBody.
          if (parentComponent === null) return;
          parentComponent.showOverlay.set(true);
          parentComponent.mouseHasEnterCardDetails = true;
        },
        'mousedown .js-card-details'() {
          Session.set('cardDetailsIsDragging', false);
          Session.set('cardDetailsIsMouseDown', true);
        },
        'mousemove .js-card-details'() {
          if (Session.get('cardDetailsIsMouseDown')) {
            Session.set('cardDetailsIsDragging', true);
          }
        },
        'mouseup .js-card-details'() {
          Session.set('cardDetailsIsDragging', false);
          Session.set('cardDetailsIsMouseDown', false);
        },
        'click #toggleShowActivitiesCard'() {
          this.data().toggleShowActivities();
        },
        'click #toggleHideCheckedChecklistItems'() {
          this.data().toggleHideCheckedChecklistItems();
        },
        'click #toggleCustomFieldsGridButton'() {
          Meteor.call('toggleCustomFieldsGrid');
        },
        'click .js-maximize-card-details'() {
          Meteor.call('toggleCardMaximized');
          autosize($('.card-details'));
        },
        'click .js-minimize-card-details'() {
          Meteor.call('toggleCardMaximized');
          autosize($('.card-details'));
        },
        'click .js-vote'(e) {
          const forIt = $(e.target).hasClass('js-vote-positive');
          let newState = null;
          if (
            this.data().voteState() === null ||
            (this.data().voteState() === false && forIt) ||
            (this.data().voteState() === true && !forIt)
          ) {
            newState = forIt;
          }
          this.data().setVote(Meteor.userId(), newState);
        },
        'click .js-poker'(e) {
          let newState = null;
          if ($(e.target).hasClass('js-poker-vote-one')) {
            newState = 'one';
            this.data().setPoker(Meteor.userId(), newState);
          }
          if ($(e.target).hasClass('js-poker-vote-two')) {
            newState = 'two';
            this.data().setPoker(Meteor.userId(), newState);
          }
          if ($(e.target).hasClass('js-poker-vote-three')) {
            newState = 'three';
            this.data().setPoker(Meteor.userId(), newState);
          }
          if ($(e.target).hasClass('js-poker-vote-five')) {
            newState = 'five';
            this.data().setPoker(Meteor.userId(), newState);
          }
          if ($(e.target).hasClass('js-poker-vote-eight')) {
            newState = 'eight';
            this.data().setPoker(Meteor.userId(), newState);
          }
          if ($(e.target).hasClass('js-poker-vote-thirteen')) {
            newState = 'thirteen';
            this.data().setPoker(Meteor.userId(), newState);
          }
          if ($(e.target).hasClass('js-poker-vote-twenty')) {
            newState = 'twenty';
            this.data().setPoker(Meteor.userId(), newState);
          }
          if ($(e.target).hasClass('js-poker-vote-forty')) {
            newState = 'forty';
            this.data().setPoker(Meteor.userId(), newState);
          }
          if ($(e.target).hasClass('js-poker-vote-one-hundred')) {
            newState = 'oneHundred';
            this.data().setPoker(Meteor.userId(), newState);
          }
          if ($(e.target).hasClass('js-poker-vote-unsure')) {
            newState = 'unsure';
            this.data().setPoker(Meteor.userId(), newState);
          }
        },
        'click .js-poker-finish'(e) {
          if ($(e.target).hasClass('js-poker-finish')) {
            e.preventDefault();
            const now = moment().format('YYYY-MM-DD HH:mm');
            this.data().setPokerEnd(now);
          }
        },

        'click .js-poker-replay'(e) {
          if ($(e.target).hasClass('js-poker-replay')) {
            e.preventDefault();
            this.currentCard = this.currentData();
            this.currentCard.replayPoker();
            this.data().unsetPokerEnd();
            this.data().unsetPokerEstimation();
          }
        },
        'click .js-poker-estimation'(event) {
          event.preventDefault();

          const ruleTitle = this.find('#pokerEstimation').value;
          if (ruleTitle !== undefined && ruleTitle !== '') {
            this.find('#pokerEstimation').value = '';

            if (ruleTitle) {
              this.data().setPokerEstimation(parseInt(ruleTitle, 10));
            } else {
              this.data().setPokerEstimation('');
            }
          }
        },
      },
    ];
  },
}).register('cardDetails');

Template.cardDetails.helpers({
  isPopup() {
    let ret = !!Utils.getPopupCardId();
    return ret;
  }
});
Template.cardDetailsPopup.onDestroyed(() => {
  Session.delete('popupCardId');
  Session.delete('popupCardBoardId');
});
Template.cardDetailsPopup.helpers({
  popupCard() {
    const ret = Utils.getPopupCard();
    return ret;
  },
});

BlazeComponent.extendComponent({
  template() {
    return 'exportCard';
  },
  withApi() {
    return Template.instance().apiEnabled.get();
  },
  exportUrlCardPDF() {
    const params = {
      boardId: Session.get('currentBoard'),
      listId: this.listId,
      cardId: this.cardId,
    };
    const queryParams = {
      authToken: Accounts._storedLoginToken(),
    };
    return FlowRouter.path(
      '/api/boards/:boardId/lists/:listId/cards/:cardId/exportPDF',
      params,
      queryParams,
    );
  },
  exportFilenameCardPDF() {
    //const boardId = Session.get('currentBoard');
    //return `export-card-pdf-${boardId}.xlsx`;
    return `export-card.pdf`;
  },
}).register('exportCardPopup');

// only allow number input
Template.editCardSortOrderForm.onRendered(function () {
  this.$('input').on("keypress paste", function (event) {
    let keyCode = event.keyCode;
    let charCode = String.fromCharCode(keyCode);
    let regex = new RegExp('[-0-9.]');
    let ret = regex.test(charCode);
    // only working here, defining in events() doesn't handle the return value correctly
    return ret;
  });
});

// We extends the normal InlinedForm component to support UnsavedEdits draft
// feature.
(class extends InlinedForm {
  _getUnsavedEditKey() {
    return {
      fieldName: 'cardDescription',
      // XXX Recovering the currentCard identifier form a session variable is
      // fragile because this variable may change for instance if the route
      // change. We should use some component props instead.
      docId: Utils.getCurrentCardId(),
    };
  }

  close(isReset = false) {
    if (this.isOpen.get() && !isReset) {
      const draft = this.getValue().trim();
      let card = Utils.getCurrentCard();
      if (card && draft !== card.getDescription()) {
        UnsavedEdits.set(this._getUnsavedEditKey(), this.getValue());
      }
    }
    super.close();
  }

  reset() {
    UnsavedEdits.reset(this._getUnsavedEditKey());
    this.close(true);
  }

  events() {
    const parentEvents = InlinedForm.prototype.events()[0];
    return [
      {
        ...parentEvents,
        'click .js-close-inlined-form': this.reset,
      },
    ];
  }
}.register('inlinedCardDescription'));

Template.cardDetailsActionsPopup.helpers({
  isWatching() {
    return this.findWatcher(Meteor.userId());
  },

  isBoardAdmin() {
    return ReactiveCache.getCurrentUser().isBoardAdmin();
  },
});

Template.cardDetailsActionsPopup.events({
  'click .js-export-card': Popup.open('exportCard'),
  'click .js-members': Popup.open('cardMembers'),
  'click .js-assignees': Popup.open('cardAssignees'),
  'click .js-attachments': Popup.open('cardAttachments'),
  'click .js-start-voting': Popup.open('cardStartVoting'),
  'click .js-start-planning-poker': Popup.open('cardStartPlanningPoker'),
  'click .js-custom-fields': Popup.open('cardCustomFields'),
  'click .js-received-date': Popup.open('editCardReceivedDate'),
  'click .js-start-date': Popup.open('editCardStartDate'),
  'click .js-due-date': Popup.open('editCardDueDate'),
  'click .js-end-date': Popup.open('editCardEndDate'),
  'click .js-spent-time': Popup.open('editCardSpentTime'),
  'click .js-move-card': Popup.open('moveCard'),
  'click .js-copy-card': Popup.open('copyCard'),
  'click .js-convert-checklist-item-to-card': Popup.open('convertChecklistItemToCard'),
  'click .js-copy-checklist-cards': Popup.open('copyManyCards'),
  'click .js-set-card-color': Popup.open('setCardColor'),
  'click .js-move-card-to-top'(event) {
    event.preventDefault();
    const minOrder = this.getMinSort();
    this.move(this.boardId, this.swimlaneId, this.listId, minOrder - 1);
    Popup.back();
  },
  'click .js-move-card-to-bottom'(event) {
    event.preventDefault();
    const maxOrder = this.getMaxSort();
    this.move(this.boardId, this.swimlaneId, this.listId, maxOrder + 1);
    Popup.back();
  },
  'click .js-archive': Popup.afterConfirm('cardArchive', function () {
    Popup.close();
    this.archive();
    Utils.goBoardId(this.boardId);
  }),
  'click .js-more': Popup.open('cardMore'),
  'click .js-toggle-watch-card'() {
    const currentCard = this;
    const level = currentCard.findWatcher(Meteor.userId()) ? null : 'watching';
    Meteor.call('watch', 'card', currentCard._id, level, (err, ret) => {
      if (!err && ret) Popup.close();
    });
  },
});

BlazeComponent.extendComponent({
  onRendered() {
    autosize(this.$('textarea.js-edit-card-title'));
  },
  events() {
    return [
      {
        'click a.fa.fa-copy'(event) {
          const $editor = this.$('textarea');
          const promise = Utils.copyTextToClipboard($editor[0].value);

          const $tooltip = this.$('.copied-tooltip');
          Utils.showCopied(promise, $tooltip);
        },
        'keydown .js-edit-card-title'(event) {
          // If enter key was pressed, submit the data
          // Unless the shift key is also being pressed
          if (event.keyCode === 13 && !event.shiftKey) {
            $('.js-submit-edit-card-title-form').click();
          }
        },
      }
    ];
  }
}).register('editCardTitleForm');

Template.cardMembersPopup.onCreated(function () {
  let currBoard = Utils.getCurrentBoard();
  let members = currBoard.activeMembers();
  this.members = new ReactiveVar(members);
});

Template.cardMembersPopup.events({
  'keyup .card-members-filter'(event) {
    const members = filterMembers(event.target.value);
    Template.instance().members.set(members);
  }
});

Template.cardMembersPopup.helpers({
  members() {
    return _.sortBy(Template.instance().members.get(),'fullname');
  },
});

const filterMembers = (filterTerm) => {
  let currBoard = Utils.getCurrentBoard();
  let members = currBoard.activeMembers();

  if (filterTerm) {
    members = members
      .map(member => ({
        member,
        user: ReactiveCache.getUser(member.userId)
      }))
      .filter(({ user }) =>
        (user.profile.fullname !== undefined && user.profile.fullname.toLowerCase().indexOf(filterTerm.toLowerCase()) !== -1)
        || user.profile.fullname === undefined && user.profile.username !== undefined && user.profile.username.toLowerCase().indexOf(filterTerm.toLowerCase()) !== -1)
      .map(({ member }) => member);
  }
  return members;
}

Template.editCardRequesterForm.onRendered(function () {
  autosize(this.$('.js-edit-card-requester'));
});

Template.editCardRequesterForm.events({
  'keydown .js-edit-card-requester'(event) {
    // If enter key was pressed, submit the data
    if (event.keyCode === 13) {
      $('.js-submit-edit-card-requester-form').click();
    }
  },
});

Template.editCardAssignerForm.onRendered(function () {
  autosize(this.$('.js-edit-card-assigner'));
});

Template.editCardAssignerForm.events({
  'keydown .js-edit-card-assigner'(event) {
    // If enter key was pressed, submit the data
    if (event.keyCode === 13) {
      $('.js-submit-edit-card-assigner-form').click();
    }
  },
});

/** Move Card Dialog */
(class extends DialogWithBoardSwimlaneList {
  getDialogOptions() {
    const ret = ReactiveCache.getCurrentUser().getMoveAndCopyDialogOptions();
    return ret;
  }
  setDone(boardId, swimlaneId, listId, options) {
    ReactiveCache.getCurrentUser().setMoveAndCopyDialogOption(this.currentBoardId, options);
    const card = this.data();
    const minOrder = card.getMinSort(listId, swimlaneId);
    card.move(boardId, swimlaneId, listId, minOrder - 1);
  }
}).register('moveCardPopup');

/** Copy Card Dialog */
(class extends DialogWithBoardSwimlaneList {
  getDialogOptions() {
    const ret = ReactiveCache.getCurrentUser().getMoveAndCopyDialogOptions();
    return ret;
  }
  setDone(boardId, swimlaneId, listId, options) {
    ReactiveCache.getCurrentUser().setMoveAndCopyDialogOption(this.currentBoardId, options);
    const card = this.data();

    // const textarea = $('#copy-card-title');
    const textarea = this.$('#copy-card-title');
    const title = textarea.val().trim();

    if (title) {
      // insert new card to the top of new list
      const newCardId = Meteor.call('copyCard', card._id, boardId, swimlaneId, listId, true, {title: title});

      // In case the filter is active we need to add the newly inserted card in
      // the list of exceptions -- cards that are not filtered. Otherwise the
      // card will disappear instantly.
      // See https://github.com/wekan/wekan/issues/80
      Filter.addException(newCardId);
    }
  }
}).register('copyCardPopup');

/** Convert Checklist-Item to card dialog */
(class extends DialogWithBoardSwimlaneList {
  getDialogOptions() {
    const ret = ReactiveCache.getCurrentUser().getMoveAndCopyDialogOptions();
    return ret;
  }
  setDone(boardId, swimlaneId, listId, options) {
    ReactiveCache.getCurrentUser().setMoveAndCopyDialogOption(this.currentBoardId, options);
    const card = this.data();

    const textarea = this.$('#copy-card-title');
    const title = textarea.val().trim();

    if (title) {
      const _id = Cards.insert({
        title: title,
        listId: listId,
        boardId: boardId,
        swimlaneId: swimlaneId,
        sort: 0,
      });
      const card = ReactiveCache.getCard(_id);
      const minOrder = card.getMinSort();
      card.move(card.boardId, card.swimlaneId, card.listId, minOrder - 1);

      Filter.addException(_id);
    }
  }
}).register('convertChecklistItemToCardPopup');

/** Copy many cards dialog */
(class extends DialogWithBoardSwimlaneList {
  getDialogOptions() {
    const ret = ReactiveCache.getCurrentUser().getMoveAndCopyDialogOptions();
    return ret;
  }
  setDone(boardId, swimlaneId, listId, options) {
    ReactiveCache.getCurrentUser().setMoveAndCopyDialogOption(this.currentBoardId, options);
    const card = this.data();

    const textarea = this.$('#copy-card-title');
    const title = textarea.val().trim();

    if (title) {
      const titleList = JSON.parse(title);
      for (const obj of titleList) {
        const newCardId = Meteor.call('copyCard', card._id, boardId, swimlaneId, listId, false, {title: obj.title, description: obj.description});

        // In case the filter is active we need to add the newly inserted card in
        // the list of exceptions -- cards that are not filtered. Otherwise the
        // card will disappear instantly.
        // See https://github.com/wekan/wekan/issues/80
        Filter.addException(newCardId);
      }
    }
  }
}).register('copyManyCardsPopup');

BlazeComponent.extendComponent({
  onCreated() {
    this.currentCard = this.currentData();
    this.currentColor = new ReactiveVar(this.currentCard.color);
  },

  colors() {
    return ALLOWED_COLORS.map((color) => ({ color, name: '' }));
  },

  isSelected(color) {
    if (this.currentColor.get() === null) {
      return color === 'white';
    }
    return this.currentColor.get() === color;
  },

  events() {
    return [
      {
        'click .js-palette-color'() {
          this.currentColor.set(this.currentData().color);
        },
        'click .js-submit'(event) {
          event.preventDefault();
          this.currentCard.setColor(this.currentColor.get());
          Popup.back();
        },
        'click .js-remove-color'(event) {
          event.preventDefault();
          this.currentCard.setColor(null);
          Popup.back();
        },
      },
    ];
  },
}).register('setCardColorPopup');

BlazeComponent.extendComponent({
  onCreated() {
    this.currentCard = this.currentData();
    this.parentBoard = new ReactiveVar(null);
    this.parentCard = this.currentCard.parentCard();
    if (this.parentCard) {
      const list = $('.js-field-parent-card');
      list.val(this.parentCard._id);
      this.parentBoard.set(this.parentCard.board()._id);
    } else {
      this.parentBoard.set(null);
    }
  },

  boards() {
    const ret = ReactiveCache.getBoards(
      {
        archived: false,
        'members.userId': Meteor.userId(),
        _id: { $ne: ReactiveCache.getCurrentUser().getTemplatesBoardId() },
      },
      {
        sort: { sort: 1 /* boards default sorting */ },
      },
    );
    return ret;
  },

  cards() {
    const currentId = Utils.getCurrentCardId();
    if (this.parentBoard.get()) {
      const ret = ReactiveCache.getCards({
        boardId: this.parentBoard.get(),
        _id: { $ne: currentId },
      });
      return ret;
    } else {
      return [];
    }
  },

  isParentBoard() {
    const board = this.currentData();
    if (this.parentBoard.get()) {
      return board._id === this.parentBoard.get();
    }
    return false;
  },

  isParentCard() {
    const card = this.currentData();
    if (this.parentCard) {
      return card._id === this.parentCard;
    }
    return false;
  },

  setParentCardId(cardId) {
    if (cardId) {
      this.parentCard = ReactiveCache.getCard(cardId);
    } else {
      this.parentCard = null;
    }
    this.currentCard.setParentId(cardId);
  },

  events() {
    return [
      {
        'click .js-copy-card-link-to-clipboard'(event) {
          const promise = Utils.copyTextToClipboard(location.origin + document.getElementById('cardURL').value);

          const $tooltip = this.$('.copied-tooltip');
          Utils.showCopied(promise, $tooltip);
        },
        'click .js-delete': Popup.afterConfirm('cardDelete', function () {
          Popup.close();
          // verify that there are no linked cards
          if (ReactiveCache.getCards({ linkedId: this._id }).length === 0) {
            Cards.remove(this._id);
          } else {
            // TODO: Maybe later we can list where the linked cards are.
            // Now here is popup with a hint that the card cannot be deleted
            // as there are linked cards.
            // Related:
            //   client/components/lists/listHeader.js about line 248
            //   https://github.com/wekan/wekan/issues/2785
            const message = `${TAPi18n.__(
              'delete-linked-card-before-this-card',
            )} linkedId: ${this._id
              } at client/components/cards/cardDetails.js and https://github.com/wekan/wekan/issues/2785`;
            alert(message);
          }
          Utils.goBoardId(this.boardId);
        }),
        'change .js-field-parent-board'(event) {
          const selection = $(event.currentTarget).val();
          const list = $('.js-field-parent-card');
          if (selection === 'none') {
            this.parentBoard.set(null);
          } else {
            subManager.subscribe('board', $(event.currentTarget).val(), false);
            this.parentBoard.set(selection);
            list.prop('disabled', false);
          }
          this.setParentCardId(null);
        },
        'change .js-field-parent-card'(event) {
          const selection = $(event.currentTarget).val();
          this.setParentCardId(selection);
        },
      },
    ];
  },
}).register('cardMorePopup');

BlazeComponent.extendComponent({
  onCreated() {
    this.currentCard = this.currentData();
    this.voteQuestion = new ReactiveVar(this.currentCard.voteQuestion);
  },

  events() {
    return [
      {
        'click .js-end-date': Popup.open('editVoteEndDate'),
        'submit .edit-vote-question'(evt) {
          evt.preventDefault();
          const voteQuestion = evt.target.vote.value;
          const publicVote = $('#vote-public').hasClass('is-checked');
          const allowNonBoardMembers = $('#vote-allow-non-members').hasClass(
            'is-checked',
          );
          const endString = this.currentCard.getVoteEnd();

          this.currentCard.setVoteQuestion(
            voteQuestion,
            publicVote,
            allowNonBoardMembers,
          );
          if (endString) {
            this.currentCard.setVoteEnd(endString);
          }
          Popup.back();
        },
        'click .js-remove-vote': Popup.afterConfirm('deleteVote', () => {
          event.preventDefault();
          this.currentCard.unsetVote();
          Popup.back();
        }),
        'click a.js-toggle-vote-public'(event) {
          event.preventDefault();
          $('#vote-public').toggleClass('is-checked');
        },
        'click a.js-toggle-vote-allow-non-members'(event) {
          event.preventDefault();
          $('#vote-allow-non-members').toggleClass('is-checked');
        },
      },
    ];
  },
}).register('cardStartVotingPopup');

// editVoteEndDatePopup
(class extends DatePicker {
  onCreated() {
    super.onCreated(moment().format('YYYY-MM-DD HH:mm'));
    this.data().getVoteEnd() && this.date.set(moment(this.data().getVoteEnd()));
  }
  events() {
    return [
      {
        'submit .edit-date'(evt) {
          evt.preventDefault();

          // if no time was given, init with 12:00
          const time =
            evt.target.time.value ||
            moment(new Date().setHours(12, 0, 0)).format('LT');

          const dateString = `${evt.target.date.value} ${time}`;

          /*
          const newDate = moment(dateString, 'L LT', true);
          if (newDate.isValid()) {
            // if active vote -  store it
            if (this.currentData().getVoteQuestion()) {
              this._storeDate(newDate.toDate());
              Popup.back();
            } else {
              this.currentData().vote = { end: newDate.toDate() }; // set vote end temp
              Popup.back();
            }


          */

          // Try to parse different date formats of all languages.
          // This code is same for vote and planning poker.
          const usaDate = moment(dateString, 'L LT', true);
          const euroAmDate = moment(dateString, 'DD.MM.YYYY LT', true);
          const euro24hDate = moment(dateString, 'DD.MM.YYYY HH.mm', true);
          const eurodotDate = moment(dateString, 'DD.MM.YYYY HH:mm', true);
          const minusDate = moment(dateString, 'YYYY-MM-DD HH:mm', true);
          const slashDate = moment(dateString, 'DD/MM/YYYY HH.mm', true);
          const dotDate = moment(dateString, 'DD/MM/YYYY HH:mm', true);
          const brezhonegDate = moment(dateString, 'DD/MM/YYYY h[e]mm A', true);
          const hrvatskiDate = moment(dateString, 'DD. MM. YYYY H:mm', true);
          const latviaDate = moment(dateString, 'YYYY.MM.DD. H:mm', true);
          const nederlandsDate = moment(dateString, 'DD-MM-YYYY HH:mm', true);
          // greekDate does not work: el Greek Ελληνικά ,
          // it has date format DD/MM/YYYY h:mm MM like 20/06/2021 11:15 MM
          // where MM is maybe some text like AM/PM ?
          // Also some other languages that have non-ascii characters in dates
          // do not work.
          const greekDate = moment(dateString, 'DD/MM/YYYY h:mm A', true);
          const macedonianDate = moment(dateString, 'D.MM.YYYY H:mm', true);

          if (usaDate.isValid()) {
            // if active poker -  store it
            if (this.currentData().getPokerQuestion()) {
              this._storeDate(usaDate.toDate());
            } else {
              this.currentData().poker = { end: usaDate.toDate() }; // set poker end temp
            }
            Popup.back();
          } else if (euroAmDate.isValid()) {
            // if active poker -  store it
            if (this.currentData().getPokerQuestion()) {
              this._storeDate(euroAmDate.toDate());
            } else {
              this.currentData().poker = { end: euroAmDate.toDate() }; // set poker end temp
            }
            Popup.back();
          } else if (euro24hDate.isValid()) {
            // if active poker -  store it
            if (this.currentData().getPokerQuestion()) {
              this._storeDate(euro24hDate.toDate());
              this.card.setPokerEnd(euro24hDate.toDate());
            } else {
              this.currentData().poker = { end: euro24hDate.toDate() }; // set poker end temp
            }
            Popup.back();
          } else if (eurodotDate.isValid()) {
            // if active poker -  store it
            if (this.currentData().getPokerQuestion()) {
              this._storeDate(eurodotDate.toDate());
              this.card.setPokerEnd(eurodotDate.toDate());
            } else {
              this.currentData().poker = { end: eurodotDate.toDate() }; // set poker end temp
            }
            Popup.back();
          } else if (minusDate.isValid()) {
            // if active poker -  store it
            if (this.currentData().getPokerQuestion()) {
              this._storeDate(minusDate.toDate());
              this.card.setPokerEnd(minusDate.toDate());
            } else {
              this.currentData().poker = { end: minusDate.toDate() }; // set poker end temp
            }
            Popup.back();
          } else if (slashDate.isValid()) {
            // if active poker -  store it
            if (this.currentData().getPokerQuestion()) {
              this._storeDate(slashDate.toDate());
              this.card.setPokerEnd(slashDate.toDate());
            } else {
              this.currentData().poker = { end: slashDate.toDate() }; // set poker end temp
            }
            Popup.back();
          } else if (dotDate.isValid()) {
            // if active poker -  store it
            if (this.currentData().getPokerQuestion()) {
              this._storeDate(dotDate.toDate());
              this.card.setPokerEnd(dotDate.toDate());
            } else {
              this.currentData().poker = { end: dotDate.toDate() }; // set poker end temp
            }
            Popup.back();
          } else if (brezhonegDate.isValid()) {
            // if active poker -  store it
            if (this.currentData().getPokerQuestion()) {
              this._storeDate(brezhonegDate.toDate());
              this.card.setPokerEnd(brezhonegDate.toDate());
            } else {
              this.currentData().poker = { end: brezhonegDate.toDate() }; // set poker end temp
            }
            Popup.back();
          } else if (hrvatskiDate.isValid()) {
            // if active poker -  store it
            if (this.currentData().getPokerQuestion()) {
              this._storeDate(hrvatskiDate.toDate());
              this.card.setPokerEnd(hrvatskiDate.toDate());
            } else {
              this.currentData().poker = { end: hrvatskiDate.toDate() }; // set poker end temp
              Popup.back();
            }
          } else if (latviaDate.isValid()) {
            // if active poker -  store it
            if (this.currentData().getPokerQuestion()) {
              this._storeDate(latviaDate.toDate());
              this.card.setPokerEnd(latviaDate.toDate());
            } else {
              this.currentData().poker = { end: latviaDate.toDate() }; // set poker end temp
            }
            Popup.back();
          } else if (nederlandsDate.isValid()) {
            // if active poker -  store it
            if (this.currentData().getPokerQuestion()) {
              this._storeDate(nederlandsDate.toDate());
              this.card.setPokerEnd(nederlandsDate.toDate());
            } else {
              this.currentData().poker = { end: nederlandsDate.toDate() }; // set poker end temp
            }
            Popup.back();
          } else if (greekDate.isValid()) {
            // if active poker -  store it
            if (this.currentData().getPokerQuestion()) {
              this._storeDate(greekDate.toDate());
              this.card.setPokerEnd(greekDate.toDate());
            } else {
              this.currentData().poker = { end: greekDate.toDate() }; // set poker end temp
            }
            Popup.back();
          } else if (macedonianDate.isValid()) {
            // if active poker -  store it
            if (this.currentData().getPokerQuestion()) {
              this._storeDate(macedonianDate.toDate());
              this.card.setPokerEnd(macedonianDate.toDate());
            } else {
              this.currentData().poker = { end: macedonianDate.toDate() }; // set poker end temp
            }
            Popup.back();
          } else {
            this.error.set('invalid-date');
            evt.target.date.focus();
          }
        },
        'click .js-delete-date'(evt) {
          evt.preventDefault();
          this._deleteDate();
          Popup.back();
        },
      },
    ];
  }
  _storeDate(newDate) {
    this.card.setVoteEnd(newDate);
  }
  _deleteDate() {
    this.card.unsetVoteEnd();
  }
}.register('editVoteEndDatePopup'));

BlazeComponent.extendComponent({
  onCreated() {
    this.currentCard = this.currentData();
    this.pokerQuestion = new ReactiveVar(this.currentCard.pokerQuestion);
  },

  events() {
    return [
      {
        'click .js-end-date': Popup.open('editPokerEndDate'),
        'submit .edit-poker-question'(evt) {
          evt.preventDefault();
          const pokerQuestion = true;
          const allowNonBoardMembers = $('#poker-allow-non-members').hasClass(
            'is-checked',
          );
          const endString = this.currentCard.getPokerEnd();

          this.currentCard.setPokerQuestion(
            pokerQuestion,
            allowNonBoardMembers,
          );
          if (endString) {
            this.currentCard.setPokerEnd(endString);
          }
          Popup.back();
        },
        'click .js-remove-poker': Popup.afterConfirm('deletePoker', (event) => {
          this.currentCard.unsetPoker();
          Popup.back();
        }),
        'click a.js-toggle-poker-allow-non-members'(event) {
          event.preventDefault();
          $('#poker-allow-non-members').toggleClass('is-checked');
        },
      },
    ];
  },
}).register('cardStartPlanningPokerPopup');

// editPokerEndDatePopup
(class extends DatePicker {
  onCreated() {
    super.onCreated(moment().format('YYYY-MM-DD HH:mm'));
    this.data().getPokerEnd() &&
      this.date.set(moment(this.data().getPokerEnd()));
  }

  /*
  Tried to use dateFormat and timeFormat from client/components/lib/datepicker.js
  to make detecting all date formats not necessary,
  but got error "language mk does not exist".
  Maybe client/components/lib/datepicker.jade could have hidden input field for
  datepicker format that could be used to detect date format?

  dateFormat() {
    return moment.localeData().longDateFormat('L');
  }

  timeFormat() {
    return moment.localeData().longDateFormat('LT');
  }

  const newDate = moment(dateString, dateformat() + ' ' + timeformat(), true);
  */

  events() {
    return [
      {
        'submit .edit-date'(evt) {
          evt.preventDefault();

          // if no time was given, init with 12:00
          const time =
            evt.target.time.value ||
            moment(new Date().setHours(12, 0, 0)).format('LT');

          const dateString = `${evt.target.date.value} ${time}`;

          /*
          Tried to use dateFormat and timeFormat from client/components/lib/datepicker.js
          to make detecting all date formats not necessary,
          but got error "language mk does not exist".
          Maybe client/components/lib/datepicker.jade could have hidden input field for
          datepicker format that could be used to detect date format?

          const newDate = moment(dateString, dateformat() + ' ' + timeformat(), true);

          if (newDate.isValid()) {
            // if active poker -  store it
            if (this.currentData().getPokerQuestion()) {
              this._storeDate(newDate.toDate());
              Popup.back();
            } else {
              this.currentData().poker = { end: newDate.toDate() }; // set poker end temp
              Popup.back();
            }
          */

          // Try to parse different date formats of all languages.
          // This code is same for vote and planning poker.
          const usaDate = moment(dateString, 'L LT', true);
          const euroAmDate = moment(dateString, 'DD.MM.YYYY LT', true);
          const euro24hDate = moment(dateString, 'DD.MM.YYYY HH.mm', true);
          const eurodotDate = moment(dateString, 'DD.MM.YYYY HH:mm', true);
          const minusDate = moment(dateString, 'YYYY-MM-DD HH:mm', true);
          const slashDate = moment(dateString, 'DD/MM/YYYY HH.mm', true);
          const dotDate = moment(dateString, 'DD/MM/YYYY HH:mm', true);
          const brezhonegDate = moment(dateString, 'DD/MM/YYYY h[e]mm A', true);
          const hrvatskiDate = moment(dateString, 'DD. MM. YYYY H:mm', true);
          const latviaDate = moment(dateString, 'YYYY.MM.DD. H:mm', true);
          const nederlandsDate = moment(dateString, 'DD-MM-YYYY HH:mm', true);
          // greekDate does not work: el Greek Ελληνικά ,
          // it has date format DD/MM/YYYY h:mm MM like 20/06/2021 11:15 MM
          // where MM is maybe some text like AM/PM ?
          // Also some other languages that have non-ascii characters in dates
          // do not work.
          const greekDate = moment(dateString, 'DD/MM/YYYY h:mm A', true);
          const macedonianDate = moment(dateString, 'D.MM.YYYY H:mm', true);

          if (usaDate.isValid()) {
            // if active poker -  store it
            if (this.currentData().getPokerQuestion()) {
              this._storeDate(usaDate.toDate());
            } else {
              this.currentData().poker = { end: usaDate.toDate() }; // set poker end temp
            }
            Popup.back();
          } else if (euroAmDate.isValid()) {
            // if active poker -  store it
            if (this.currentData().getPokerQuestion()) {
              this._storeDate(euroAmDate.toDate());
            } else {
              this.currentData().poker = { end: euroAmDate.toDate() }; // set poker end temp
            }
            Popup.back();
          } else if (euro24hDate.isValid()) {
            // if active poker -  store it
            if (this.currentData().getPokerQuestion()) {
              this._storeDate(euro24hDate.toDate());
              this.card.setPokerEnd(euro24hDate.toDate());
            } else {
              this.currentData().poker = { end: euro24hDate.toDate() }; // set poker end temp
            }
            Popup.back();
          } else if (eurodotDate.isValid()) {
            // if active poker -  store it
            if (this.currentData().getPokerQuestion()) {
              this._storeDate(eurodotDate.toDate());
              this.card.setPokerEnd(eurodotDate.toDate());
            } else {
              this.currentData().poker = { end: eurodotDate.toDate() }; // set poker end temp
            }
            Popup.back();
          } else if (minusDate.isValid()) {
            // if active poker -  store it
            if (this.currentData().getPokerQuestion()) {
              this._storeDate(minusDate.toDate());
              this.card.setPokerEnd(minusDate.toDate());
            } else {
              this.currentData().poker = { end: minusDate.toDate() }; // set poker end temp
            }
            Popup.back();
          } else if (slashDate.isValid()) {
            // if active poker -  store it
            if (this.currentData().getPokerQuestion()) {
              this._storeDate(slashDate.toDate());
              this.card.setPokerEnd(slashDate.toDate());
            } else {
              this.currentData().poker = { end: slashDate.toDate() }; // set poker end temp
            }
            Popup.back();
          } else if (dotDate.isValid()) {
            // if active poker -  store it
            if (this.currentData().getPokerQuestion()) {
              this._storeDate(dotDate.toDate());
              this.card.setPokerEnd(dotDate.toDate());
            } else {
              this.currentData().poker = { end: dotDate.toDate() }; // set poker end temp
            }
            Popup.back();
          } else if (brezhonegDate.isValid()) {
            // if active poker -  store it
            if (this.currentData().getPokerQuestion()) {
              this._storeDate(brezhonegDate.toDate());
              this.card.setPokerEnd(brezhonegDate.toDate());
            } else {
              this.currentData().poker = { end: brezhonegDate.toDate() }; // set poker end temp
            }
            Popup.back();
          } else if (hrvatskiDate.isValid()) {
            // if active poker -  store it
            if (this.currentData().getPokerQuestion()) {
              this._storeDate(hrvatskiDate.toDate());
              this.card.setPokerEnd(hrvatskiDate.toDate());
            } else {
              this.currentData().poker = { end: hrvatskiDate.toDate() }; // set poker end temp
            }
            Popup.back();
          } else if (latviaDate.isValid()) {
            // if active poker -  store it
            if (this.currentData().getPokerQuestion()) {
              this._storeDate(latviaDate.toDate());
              this.card.setPokerEnd(latviaDate.toDate());
            } else {
              this.currentData().poker = { end: latviaDate.toDate() }; // set poker end temp
            }
            Popup.back();
          } else if (nederlandsDate.isValid()) {
            // if active poker -  store it
            if (this.currentData().getPokerQuestion()) {
              this._storeDate(nederlandsDate.toDate());
              this.card.setPokerEnd(nederlandsDate.toDate());
            } else {
              this.currentData().poker = { end: nederlandsDate.toDate() }; // set poker end temp
            }
            Popup.back();
          } else if (greekDate.isValid()) {
            // if active poker -  store it
            if (this.currentData().getPokerQuestion()) {
              this._storeDate(greekDate.toDate());
              this.card.setPokerEnd(greekDate.toDate());
            } else {
              this.currentData().poker = { end: greekDate.toDate() }; // set poker end temp
            }
            Popup.back();
          } else if (macedonianDate.isValid()) {
            // if active poker -  store it
            if (this.currentData().getPokerQuestion()) {
              this._storeDate(macedonianDate.toDate());
              this.card.setPokerEnd(macedonianDate.toDate());
            } else {
              this.currentData().poker = { end: macedonianDate.toDate() }; // set poker end temp
            }
            Popup.back();
          } else {
            // this.error.set('invalid-date);
            this.error.set('invalid-date' + ' ' + dateString);
            evt.target.date.focus();
          }
        },
        'click .js-delete-date'(evt) {
          evt.preventDefault();
          this._deleteDate();
          Popup.back();
        },
      },
    ];
  }
  _storeDate(newDate) {
    this.card.setPokerEnd(newDate);
  }
  _deleteDate() {
    this.card.unsetPokerEnd();
  }
}.register('editPokerEndDatePopup'));

// Close the card details pane by pressing escape
EscapeActions.register(
  'detailsPane',
  () => {
    // if card description diverges from database due to editing
    // ask user whether changes should be applied
    if (ReactiveCache.getCurrentUser()) {
      if (ReactiveCache.getCurrentUser().profile.rescueCardDescription == true) {
        currentDescription = document.getElementsByClassName("editor js-new-description-input").item(0)
        if (currentDescription?.value && !(currentDescription.value === Utils.getCurrentCard().getDescription())) {
          if (confirm(TAPi18n.__('rescue-card-description-dialogue'))) {
            Utils.getCurrentCard().setDescription(document.getElementsByClassName("editor js-new-description-input").item(0).value);
            // Save it!
            console.log(document.getElementsByClassName("editor js-new-description-input").item(0).value);
            console.log("current description", Utils.getCurrentCard().getDescription());
          } else {
            // Do nothing!
            console.log('Description changes were not saved to the database.');
          }
        }
      }
    }
    if (Session.get('cardDetailsIsDragging')) {
      // Reset dragging status as the mouse landed outside the cardDetails template area and this will prevent a mousedown event from firing
      Session.set('cardDetailsIsDragging', false);
      Session.set('cardDetailsIsMouseDown', false);

    } else {
      // Prevent close card when the user is selecting text and moves the mouse cursor outside the card detail area
      Utils.goBoardId(Session.get('currentBoard'));
    }
  },
  () => {
    return !Session.equals('currentCard', null);
  },
  {
    noClickEscapeOn: '.js-card-details,.board-sidebar,#header',
  },
);

Template.cardAssigneesPopup.onCreated(function () {
  let currBoard = Utils.getCurrentBoard();
  let members = currBoard.activeMembers();
  this.members = new ReactiveVar(members);
});

Template.cardAssigneesPopup.events({
  'click .js-select-assignee'(event) {
    const card = Utils.getCurrentCard();
    const assigneeId = this.userId;
    card.toggleAssignee(assigneeId);
    event.preventDefault();
  },
  'keyup .card-assignees-filter'(event) {
    const members = filterMembers(event.target.value);
    Template.instance().members.set(members);
  },
});

Template.cardAssigneesPopup.helpers({
  isCardAssignee() {
    const card = Template.parentData();
    const cardAssignees = card.getAssignees();

    return _.contains(cardAssignees, this.userId);
  },

  members() {
    return _.sortBy(Template.instance().members.get(),'fullname');
  },

  user() {
    return ReactiveCache.getUser(this.userId);
  },
});

Template.cardAssigneePopup.helpers({
  userData() {
    return ReactiveCache.getUser(this.userId, {
      fields: {
        profile: 1,
        username: 1,
      },
    });
  },

  memberType() {
    const user = ReactiveCache.getUser(this.userId);
    return user && user.isBoardAdmin() ? 'admin' : 'normal';
  },

  isCardAssignee() {
    const card = Template.parentData();
    const cardAssignees = card.getAssignees();

    return _.contains(cardAssignees, this.userId);
  },

  user() {
    return ReactiveCache.getUser(this.userId);
  },
});

Template.cardAssigneePopup.events({
  'click .js-remove-assignee'() {
    ReactiveCache.getCard(this.cardId).unassignAssignee(this.userId);
    Popup.back();
  },
  'click .js-edit-profile': Popup.open('editProfile'),
});
