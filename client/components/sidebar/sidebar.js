import { Cookies } from 'meteor/ostrio:cookies';
const cookies = new Cookies();
Sidebar = null;

const defaultView = 'home';
const MCB = '.materialCheckBox';
const CKCLS = 'is-checked';

const viewTitles = {
  filter: 'filter-cards',
  search: 'search-cards',
  multiselection: 'multi-selection',
  customFields: 'custom-fields',
  archives: 'archives',
};

BlazeComponent.extendComponent({
  mixins() {
    return [Mixins.InfiniteScrolling, Mixins.PerfectScrollbar];
  },

  onCreated() {
    this._isOpen = new ReactiveVar(false);
    this._view = new ReactiveVar(defaultView);
    Sidebar = this;
  },

  onDestroyed() {
    Sidebar = null;
  },

  isOpen() {
    return this._isOpen.get();
  },

  open() {
    if (!this._isOpen.get()) {
      this._isOpen.set(true);
      EscapeActions.executeUpTo('detailsPane');
    }
  },

  hide() {
    if (this._isOpen.get()) {
      this._isOpen.set(false);
    }
  },

  toggle() {
    this._isOpen.set(!this._isOpen.get());
  },

  calculateNextPeak() {
    const sidebarElement = this.find('.js-board-sidebar-content');
    if (sidebarElement) {
      const altitude = sidebarElement.scrollHeight;
      this.callFirstWith(this, 'setNextPeak', altitude);
    }
  },

  reachNextPeak() {
    const activitiesComponent = this.childComponents('activities')[0];
    activitiesComponent.loadNextPage();
  },

  isTongueHidden() {
    return this.isOpen() && this.getView() !== defaultView;
  },

  scrollTop() {
    this.$('.js-board-sidebar-content').scrollTop(0);
  },

  getView() {
    return this._view.get();
  },

  setView(view) {
    view = _.isString(view) ? view : defaultView;
    if (this._view.get() !== view) {
      this._view.set(view);
      this.scrollTop();
      EscapeActions.executeUpTo('detailsPane');
    }
    this.open();
  },

  isDefaultView() {
    return this.getView() === defaultView;
  },

  getViewTemplate() {
    return `${this.getView()}Sidebar`;
  },

  getViewTitle() {
    return TAPi18n.__(viewTitles[this.getView()]);
  },

  showTongueTitle() {
    if (this.isOpen()) return `${TAPi18n.__('sidebar-close')}`;
    else return `${TAPi18n.__('sidebar-open')}`;
  },

  events() {
    return [
      {
        'click .js-hide-sidebar': this.hide,
        'click .js-toggle-sidebar': this.toggle,
        'click .js-back-home': this.setView,
        'click .js-toggle-minicard-label-text'() {
          currentUser = Meteor.user();
          if (currentUser) {
            Meteor.call('toggleMinicardLabelText');
          } else if (cookies.has('hiddenMinicardLabelText')) {
            cookies.remove('hiddenMinicardLabelText');
          } else {
            cookies.set('hiddenMinicardLabelText', 'true');
          }
        },
        'click .js-shortcuts'() {
          FlowRouter.go('shortcuts');
        },
      },
    ];
  },
}).register('sidebar');

Blaze.registerHelper('Sidebar', () => Sidebar);

Template.homeSidebar.helpers({
  hiddenMinicardLabelText() {
    currentUser = Meteor.user();
    if (currentUser) {
      return (currentUser.profile || {}).hiddenMinicardLabelText;
    } else if (cookies.has('hiddenMinicardLabelText')) {
      return true;
    } else {
      return false;
    }
  },
});

EscapeActions.register(
  'sidebarView',
  () => {
    Sidebar.setView(defaultView);
  },
  () => {
    return Sidebar && Sidebar.getView() !== defaultView;
  },
);

Template.memberPopup.helpers({
  user() {
    return Users.findOne(this.userId);
  },
  memberType() {
    const type = Users.findOne(this.userId).isBoardAdmin() ? 'admin' : 'normal';
    if (type === 'normal') {
      const currentBoard = Boards.findOne(Session.get('currentBoard'));
      const commentOnly = currentBoard.hasCommentOnly(this.userId);
      const noComments = currentBoard.hasNoComments(this.userId);
      const worker = currentBoard.hasWorker(this.userId);
      if (commentOnly) {
        return TAPi18n.__('comment-only').toLowerCase();
      } else if (noComments) {
        return TAPi18n.__('no-comments').toLowerCase();
      } else if (worker) {
        return TAPi18n.__('worker').toLowerCase();
      } else {
        return TAPi18n.__(type).toLowerCase();
      }
    } else {
      return TAPi18n.__(type).toLowerCase();
    }
  },
  isInvited() {
    return Users.findOne(this.userId).isInvitedTo(Session.get('currentBoard'));
  },
});

Template.boardMenuPopup.events({
  'click .js-rename-board': Popup.open('boardChangeTitle'),
  'click .js-open-rules-view'() {
    Modal.openWide('rulesMain');
    Popup.close();
  },
  'click .js-custom-fields'() {
    Sidebar.setView('customFields');
    Popup.close();
  },
  'click .js-open-archives'() {
    Sidebar.setView('archives');
    Popup.close();
  },
  'click .js-change-board-color': Popup.open('boardChangeColor'),
  'click .js-change-language': Popup.open('changeLanguage'),
  'click .js-archive-board ': Popup.afterConfirm('archiveBoard', function() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    currentBoard.archive();
    // XXX We should have some kind of notification on top of the page to
    // confirm that the board was successfully archived.
    FlowRouter.go('home');
  }),
  'click .js-delete-board': Popup.afterConfirm('deleteBoard', function() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    Popup.close();
    Boards.remove(currentBoard._id);
    FlowRouter.go('home');
  }),
  'click .js-outgoing-webhooks': Popup.open('outgoingWebhooks'),
  'click .js-import-board': Popup.open('chooseBoardSource'),
  'click .js-subtask-settings': Popup.open('boardSubtaskSettings'),
  'click .js-card-settings': Popup.open('boardCardSettings'),
  'click .js-export-board': Popup.open('exportBoard'),
});

Template.boardMenuPopup.onCreated(function() {
  this.apiEnabled = new ReactiveVar(false);
  Meteor.call('_isApiEnabled', (e, result) => {
    this.apiEnabled.set(result);
  });
});

Template.boardMenuPopup.helpers({
  withApi() {
    return Template.instance().apiEnabled.get();
  },
  exportUrl() {
    const params = {
      boardId: Session.get('currentBoard'),
    };
    const queryParams = {
      authToken: Accounts._storedLoginToken(),
    };
    return FlowRouter.path('/api/boards/:boardId/export', params, queryParams);
  },
  exportFilename() {
    const boardId = Session.get('currentBoard');
    return `wekan-export-board-${boardId}.json`;
  },
});

Template.memberPopup.events({
  'click .js-filter-member'() {
    Filter.members.toggle(this.userId);
    Popup.close();
  },
  'click .js-change-role': Popup.open('changePermissions'),
  'click .js-remove-member': Popup.afterConfirm('removeMember', function() {
    const boardId = Session.get('currentBoard');
    const memberId = this.userId;
    Cards.find({ boardId, members: memberId }).forEach(card => {
      card.unassignMember(memberId);
    });
    Boards.findOne(boardId).removeMember(memberId);
    Popup.close();
  }),
  'click .js-leave-member': Popup.afterConfirm('leaveBoard', () => {
    const boardId = Session.get('currentBoard');
    Meteor.call('quitBoard', boardId, () => {
      Popup.close();
      FlowRouter.go('home');
    });
  }),
});

Template.removeMemberPopup.helpers({
  user() {
    return Users.findOne(this.userId);
  },
  board() {
    return Boards.findOne(Session.get('currentBoard'));
  },
});

Template.leaveBoardPopup.helpers({
  board() {
    return Boards.findOne(Session.get('currentBoard'));
  },
});

Template.membersWidget.helpers({
  isInvited() {
    const user = Meteor.user();
    return user && user.isInvitedTo(Session.get('currentBoard'));
  },
  isWorker() {
    const user = Meteor.user();
    if (user) {
      return Meteor.call(Boards.hasWorker(user.memberId));
    } else {
      return false;
    }
  },
});

Template.membersWidget.events({
  'click .js-member': Popup.open('member'),
  'click .js-open-board-menu': Popup.open('boardMenu'),
  'click .js-manage-board-members': Popup.open('addMember'),
  'click .js-import': Popup.open('boardImportBoard'),
  submit: this.onSubmit,
  'click .js-import-board': Popup.open('chooseBoardSource'),
  'click .js-open-archived-board'() {
    Modal.open('archivedBoards');
  },
  'click .sandstorm-powerbox-request-identity'() {
    window.sandstormRequestIdentity();
  },
  'click .js-member-invite-accept'() {
    const boardId = Session.get('currentBoard');
    Meteor.user().removeInvite(boardId);
  },
  'click .js-member-invite-decline'() {
    const boardId = Session.get('currentBoard');
    Meteor.call('quitBoard', boardId, (err, ret) => {
      if (!err && ret) {
        Meteor.user().removeInvite(boardId);
        FlowRouter.go('home');
      }
    });
  },
});

BlazeComponent.extendComponent({
  boardId() {
    return Session.get('currentBoard') || Integrations.Const.GLOBAL_WEBHOOK_ID;
  },
  integrations() {
    const boardId = this.boardId();
    return Integrations.find({ boardId: `${boardId}` }).fetch();
  },
  types() {
    return Integrations.Const.WEBHOOK_TYPES;
  },
  integration(cond) {
    const boardId = this.boardId();
    const condition = { boardId, ...cond };
    for (const k in condition) {
      if (!condition[k]) delete condition[k];
    }
    return Integrations.findOne(condition);
  },
  onCreated() {
    this.disabled = new ReactiveVar(false);
  },
  events() {
    return [
      {
        'click a.flex'(evt) {
          this.disabled.set(!this.disabled.get());
          $(evt.target).toggleClass(CKCLS, this.disabled.get());
        },
        submit(evt) {
          evt.preventDefault();
          const url = evt.target.url.value;
          const boardId = this.boardId();
          let id = null;
          let integration = null;
          const title = evt.target.title.value;
          const token = evt.target.token.value;
          const type = evt.target.type.value;
          const enabled = !this.disabled.get();
          let remove = false;
          const values = {
            url,
            type,
            token,
            title,
            enabled,
          };
          if (evt.target.id) {
            id = evt.target.id.value;
            integration = this.integration({ _id: id });
            remove = !url;
          } else if (url) {
            integration = this.integration({ url, token });
          }
          if (remove) {
            Integrations.remove(integration._id);
          } else if (integration && integration._id) {
            Integrations.update(integration._id, {
              $set: values,
            });
          } else if (url) {
            Integrations.insert({
              ...values,
              userId: Meteor.userId(),
              enabled: true,
              boardId,
              activities: ['all'],
            });
          }
          Popup.close();
        },
      },
    ];
  },
}).register('outgoingWebhooksPopup');

BlazeComponent.extendComponent({
  template() {
    return 'chooseBoardSource';
  },
}).register('chooseBoardSourcePopup');

BlazeComponent.extendComponent({
  template() {
    return 'exportBoard';
  },
  withApi() {
    return Template.instance().apiEnabled.get();
  },
  exportUrl() {
    const params = {
      boardId: Session.get('currentBoard'),
    };
    const queryParams = {
      authToken: Accounts._storedLoginToken(),
    };
    return FlowRouter.path('/api/boards/:boardId/export', params, queryParams);
  },
  exportCsvUrl() {
    const params = {
      boardId: Session.get('currentBoard'),
    };
    const queryParams = {
      authToken: Accounts._storedLoginToken(),
    };
    return FlowRouter.path(
      '/api/boards/:boardId/export/csv',
      params,
      queryParams,
    );
  },
  exportTsvUrl() {
    const params = {
      boardId: Session.get('currentBoard'),
    };
    const queryParams = {
      authToken: Accounts._storedLoginToken(),
      delimiter: '\t',
    };
    return FlowRouter.path(
      '/api/boards/:boardId/export/csv',
      params,
      queryParams,
    );
  },
  exportJsonFilename() {
    const boardId = Session.get('currentBoard');
    return `wekan-export-board-${boardId}.json`;
  },
  exportCsvFilename() {
    const boardId = Session.get('currentBoard');
    return `wekan-export-board-${boardId}.csv`;
  },
  exportTsvFilename() {
    const boardId = Session.get('currentBoard');
    return `wekan-export-board-${boardId}.tsv`;
  },
}).register('exportBoardPopup');

Template.exportBoard.events({
  'click .html-export-board': async event => {
    event.preventDefault();
    await ExportHtml(Popup)();
  },
});

Template.labelsWidget.events({
  'click .js-label': Popup.open('editLabel'),
  'click .js-add-label': Popup.open('createLabel'),
});

// Board members can assign people or labels by drag-dropping elements from the
// sidebar to the cards on the board. In order to re-initialize the jquery-ui
// plugin any time a draggable member or label is modified or removed we use a
// autorun function and register a dependency on the both members and labels
// fields of the current board document.
function draggableMembersLabelsWidgets() {
  this.autorun(() => {
    const currentBoardId = Tracker.nonreactive(() => {
      return Session.get('currentBoard');
    });
    Boards.findOne(currentBoardId, {
      fields: {
        members: 1,
        labels: 1,
      },
    });
    Tracker.afterFlush(() => {
      const $draggables = this.$('.js-member,.js-label');
      $draggables.draggable({
        appendTo: 'body',
        helper: 'clone',
        revert: 'invalid',
        revertDuration: 150,
        snap: false,
        snapMode: 'both',
        start() {
          EscapeActions.executeUpTo('popup-back');
        },
      });

      function userIsMember() {
        return Meteor.user() && Meteor.user().isBoardMember();
      }

      this.autorun(() => {
        $draggables.draggable('option', 'disabled', !userIsMember());
      });
    });
  });
}

Template.membersWidget.onRendered(draggableMembersLabelsWidgets);
Template.labelsWidget.onRendered(draggableMembersLabelsWidgets);

BlazeComponent.extendComponent({
  backgroundColors() {
    return Boards.simpleSchema()._schema.color.allowedValues;
  },

  isSelected() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    return currentBoard.color === this.currentData().toString();
  },

  events() {
    return [
      {
        'click .js-select-background'(evt) {
          const currentBoard = Boards.findOne(Session.get('currentBoard'));
          const newColor = this.currentData().toString();
          currentBoard.setColor(newColor);
          evt.preventDefault();
        },
      },
    ];
  },
}).register('boardChangeColorPopup');

BlazeComponent.extendComponent({
  onCreated() {
    this.currentBoard = Boards.findOne(Session.get('currentBoard'));
  },

  allowsSubtasks() {
    return this.currentBoard.allowsSubtasks;
  },

  allowsReceivedDate() {
    return this.currentBoard.allowsReceivedDate;
  },

  isBoardSelected() {
    return this.currentBoard.subtasksDefaultBoardId === this.currentData()._id;
  },

  isNullBoardSelected() {
    return (
      this.currentBoard.subtasksDefaultBoardId === null ||
      this.currentBoard.subtasksDefaultBoardId === undefined
    );
  },

  boards() {
    return Boards.find(
      {
        archived: false,
        'members.userId': Meteor.userId(),
      },
      {
        sort: { sort: 1 /* boards default sorting */ },
      },
    );
  },

  lists() {
    return Lists.find(
      {
        boardId: this.currentBoard._id,
        archived: false,
      },
      {
        sort: ['title'],
      },
    );
  },

  hasLists() {
    return this.lists().count() > 0;
  },

  isListSelected() {
    return this.currentBoard.subtasksDefaultBoardId === this.currentData()._id;
  },

  presentParentTask() {
    let result = this.currentBoard.presentParentTask;
    if (result === null || result === undefined) {
      result = 'no-parent';
    }
    return result;
  },

  events() {
    return [
      {
        'click .js-field-has-subtasks'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsSubtasks = !this.currentBoard.allowsSubtasks;
          this.currentBoard.setAllowsSubtasks(this.currentBoard.allowsSubtasks);
          $(`.js-field-has-subtasks ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsSubtasks,
          );
          $('.js-field-has-subtasks').toggleClass(
            CKCLS,
            this.currentBoard.allowsSubtasks,
          );
          $('.js-field-deposit-board').prop(
            'disabled',
            !this.currentBoard.allowsSubtasks,
          );
        },
        'change .js-field-deposit-board'(evt) {
          let value = evt.target.value;
          if (value === 'null') {
            value = null;
          }
          this.currentBoard.setSubtasksDefaultBoardId(value);
          evt.preventDefault();
        },
        'change .js-field-deposit-list'(evt) {
          this.currentBoard.setSubtasksDefaultListId(evt.target.value);
          evt.preventDefault();
        },
        'click .js-field-show-parent-in-minicard'(evt) {
          const value =
            evt.target.id ||
            $(evt.target).parent()[0].id ||
            $(evt.target)
              .parent()[0]
              .parent()[0].id;
          const options = [
            'prefix-with-full-path',
            'prefix-with-parent',
            'subtext-with-full-path',
            'subtext-with-parent',
            'no-parent',
          ];
          options.forEach(function(element) {
            if (element !== value) {
              $(`#${element} ${MCB}`).toggleClass(CKCLS, false);
              $(`#${element}`).toggleClass(CKCLS, false);
            }
          });
          $(`#${value} ${MCB}`).toggleClass(CKCLS, true);
          $(`#${value}`).toggleClass(CKCLS, true);
          this.currentBoard.setPresentParentTask(value);
          evt.preventDefault();
        },
      },
    ];
  },
}).register('boardSubtaskSettingsPopup');

BlazeComponent.extendComponent({
  onCreated() {
    this.currentBoard = Boards.findOne(Session.get('currentBoard'));
  },

  allowsReceivedDate() {
    return this.currentBoard.allowsReceivedDate;
  },

  allowsStartDate() {
    return this.currentBoard.allowsStartDate;
  },

  allowsDueDate() {
    return this.currentBoard.allowsDueDate;
  },

  allowsEndDate() {
    return this.currentBoard.allowsEndDate;
  },

  allowsSubtasks() {
    return this.currentBoard.allowsSubtasks;
  },

  allowsMembers() {
    return this.currentBoard.allowsMembers;
  },

  allowsAssignee() {
    return this.currentBoard.allowsAssignee;
  },

  allowsAssignedBy() {
    return this.currentBoard.allowsAssignedBy;
  },

  allowsRequestedBy() {
    return this.currentBoard.allowsRequestedBy;
  },

  allowsLabels() {
    return this.currentBoard.allowsLabels;
  },

  allowsChecklists() {
    return this.currentBoard.allowsChecklists;
  },

  allowsAttachments() {
    return this.currentBoard.allowsAttachments;
  },

  allowsComments() {
    return this.currentBoard.allowsComments;
  },

  allowsDescriptionTitle() {
    return this.currentBoard.allowsDescriptionTitle;
  },

  allowsDescriptionText() {
    return this.currentBoard.allowsDescriptionText;
  },

  isBoardSelected() {
    return this.currentBoard.dateSettingsDefaultBoardID;
  },

  isNullBoardSelected() {
    return (
      this.currentBoard.dateSettingsDefaultBoardId === null ||
      this.currentBoard.dateSettingsDefaultBoardId === undefined
    );
  },

  boards() {
    return Boards.find(
      {
        archived: false,
        'members.userId': Meteor.userId(),
      },
      {
        sort: { sort: 1 /* boards default sorting */ },
      },
    );
  },

  lists() {
    return Lists.find(
      {
        boardId: this.currentBoard._id,
        archived: false,
      },
      {
        sort: ['title'],
      },
    );
  },

  hasLists() {
    return this.lists().count() > 0;
  },

  isListSelected() {
    return (
      this.currentBoard.dateSettingsDefaultBoardId === this.currentData()._id
    );
  },

  events() {
    return [
      {
        'click .js-field-has-receiveddate'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsReceivedDate = !this.currentBoard
            .allowsReceivedDate;
          this.currentBoard.setAllowsReceivedDate(
            this.currentBoard.allowsReceivedDate,
          );
          $(`.js-field-has-receiveddate ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsReceivedDate,
          );
          $('.js-field-has-receiveddate').toggleClass(
            CKCLS,
            this.currentBoard.allowsReceivedDate,
          );
        },
        'click .js-field-has-startdate'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsStartDate = !this.currentBoard
            .allowsStartDate;
          this.currentBoard.setAllowsStartDate(
            this.currentBoard.allowsStartDate,
          );
          $(`.js-field-has-startdate ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsStartDate,
          );
          $('.js-field-has-startdate').toggleClass(
            CKCLS,
            this.currentBoard.allowsStartDate,
          );
        },
        'click .js-field-has-enddate'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsEndDate = !this.currentBoard.allowsEndDate;
          this.currentBoard.setAllowsEndDate(this.currentBoard.allowsEndDate);
          $(`.js-field-has-enddate ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsEndDate,
          );
          $('.js-field-has-enddate').toggleClass(
            CKCLS,
            this.currentBoard.allowsEndDate,
          );
        },
        'click .js-field-has-duedate'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsDueDate = !this.currentBoard.allowsDueDate;
          this.currentBoard.setAllowsDueDate(this.currentBoard.allowsDueDate);
          $(`.js-field-has-duedate ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsDueDate,
          );
          $('.js-field-has-duedate').toggleClass(
            CKCLS,
            this.currentBoard.allowsDueDate,
          );
        },
        'click .js-field-has-subtasks'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsSubtasks = !this.currentBoard.allowsSubtasks;
          this.currentBoard.setAllowsSubtasks(this.currentBoard.allowsSubtasks);
          $(`.js-field-has-subtasks ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsSubtasks,
          );
          $('.js-field-has-subtasks').toggleClass(
            CKCLS,
            this.currentBoard.allowsSubtasks,
          );
        },
        'click .js-field-has-members'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsMembers = !this.currentBoard.allowsMembers;
          this.currentBoard.setAllowsMembers(this.currentBoard.allowsMembers);
          $(`.js-field-has-members ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsMembers,
          );
          $('.js-field-has-members').toggleClass(
            CKCLS,
            this.currentBoard.allowsMembers,
          );
        },
        'click .js-field-has-assignee'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsAssignee = !this.currentBoard.allowsAssignee;
          this.currentBoard.setAllowsAssignee(this.currentBoard.allowsAssignee);
          $(`.js-field-has-assignee ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsAssignee,
          );
          $('.js-field-has-assignee').toggleClass(
            CKCLS,
            this.currentBoard.allowsAssignee,
          );
        },
        'click .js-field-has-assigned-by'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsAssignedBy = !this.currentBoard
            .allowsAssignedBy;
          this.currentBoard.setAllowsAssignedBy(
            this.currentBoard.allowsAssignedBy,
          );
          $(`.js-field-has-assigned-by ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsAssignedBy,
          );
          $('.js-field-has-assigned-by').toggleClass(
            CKCLS,
            this.currentBoard.allowsAssignedBy,
          );
        },
        'click .js-field-has-requested-by'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsRequestedBy = !this.currentBoard
            .allowsRequestedBy;
          this.currentBoard.setAllowsRequestedBy(
            this.currentBoard.allowsRequestedBy,
          );
          $(`.js-field-has-requested-by ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsRequestedBy,
          );
          $('.js-field-has-requested-by').toggleClass(
            CKCLS,
            this.currentBoard.allowsRequestedBy,
          );
        },
        'click .js-field-has-labels'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsLabels = !this.currentBoard.allowsLabels;
          this.currentBoard.setAllowsLabels(this.currentBoard.allowsLabels);
          $(`.js-field-has-labels ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsAssignee,
          );
          $('.js-field-has-labels').toggleClass(
            CKCLS,
            this.currentBoard.allowsLabels,
          );
        },
        'click .js-field-has-description-title'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsDescriptionTitle = !this.currentBoard
            .allowsDescriptionTitle;
          this.currentBoard.setAllowsDescriptionTitle(
            this.currentBoard.allowsDescriptionTitle,
          );
          $(`.js-field-has-description-title ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsDescriptionTitle,
          );
          $('.js-field-has-description-title').toggleClass(
            CKCLS,
            this.currentBoard.allowsDescriptionTitle,
          );
        },
        'click .js-field-has-description-text'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsDescriptionText = !this.currentBoard
            .allowsDescriptionText;
          this.currentBoard.setAllowsDescriptionText(
            this.currentBoard.allowsDescriptionText,
          );
          $(`.js-field-has-description-text ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsDescriptionText,
          );
          $('.js-field-has-description-text').toggleClass(
            CKCLS,
            this.currentBoard.allowsDescriptionText,
          );
        },
        'click .js-field-has-checklists'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsChecklists = !this.currentBoard
            .allowsChecklists;
          this.currentBoard.setAllowsChecklists(
            this.currentBoard.allowsChecklists,
          );
          $(`.js-field-has-checklists ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsChecklists,
          );
          $('.js-field-has-checklists').toggleClass(
            CKCLS,
            this.currentBoard.allowsChecklists,
          );
        },
        'click .js-field-has-attachments'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsAttachments = !this.currentBoard
            .allowsAttachments;
          this.currentBoard.setAllowsAttachments(
            this.currentBoard.allowsAttachments,
          );
          $(`.js-field-has-attachments ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsAttachments,
          );
          $('.js-field-has-attachments').toggleClass(
            CKCLS,
            this.currentBoard.allowsAttachments,
          );
        },
        'click .js-field-has-comments'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsComments = !this.currentBoard.allowsComments;
          this.currentBoard.setAllowsComments(this.currentBoard.allowsComments);
          $(`.js-field-has-comments ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsComments,
          );
          $('.js-field-has-comments').toggleClass(
            CKCLS,
            this.currentBoard.allowsComments,
          );
        },
        'click .js-field-has-activities'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsActivities = !this.currentBoard
            .allowsActivities;
          this.currentBoard.setAllowsActivities(
            this.currentBoard.allowsActivities,
          );
          $(`.js-field-has-activities ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsActivities,
          );
          $('.js-field-has-activities').toggleClass(
            CKCLS,
            this.currentBoard.allowsActivities,
          );
        },
      },
    ];
  },
}).register('boardCardSettingsPopup');

BlazeComponent.extendComponent({
  onCreated() {
    this.error = new ReactiveVar('');
    this.loading = new ReactiveVar(false);
  },

  onRendered() {
    this.find('.js-search-member input').focus();
    this.setLoading(false);
  },

  isBoardMember() {
    const userId = this.currentData()._id;
    const user = Users.findOne(userId);
    return user && user.isBoardMember();
  },

  isValidEmail(email) {
    return SimpleSchema.RegEx.Email.test(email);
  },

  setError(error) {
    this.error.set(error);
  },

  setLoading(w) {
    this.loading.set(w);
  },

  isLoading() {
    return this.loading.get();
  },

  inviteUser(idNameEmail) {
    const boardId = Session.get('currentBoard');
    this.setLoading(true);
    const self = this;
    Meteor.call('inviteUserToBoard', idNameEmail, boardId, (err, ret) => {
      self.setLoading(false);
      if (err) self.setError(err.error);
      else if (ret.email) self.setError('email-sent');
      else Popup.close();
    });
  },

  events() {
    return [
      {
        'keyup input'() {
          this.setError('');
        },
        'click .js-select-member'() {
          const userId = this.currentData()._id;
          const currentBoard = Boards.findOne(Session.get('currentBoard'));
          if (!currentBoard.hasMember(userId)) {
            this.inviteUser(userId);
          }
        },
        'click .js-email-invite'() {
          const idNameEmail = $('.js-search-member input').val();
          if (idNameEmail.indexOf('@') < 0 || this.isValidEmail(idNameEmail)) {
            this.inviteUser(idNameEmail);
          } else this.setError('email-invalid');
        },
      },
    ];
  },
}).register('addMemberPopup');

Template.changePermissionsPopup.events({
  'click .js-set-admin, click .js-set-normal, click .js-set-no-comments, click .js-set-comment-only, click .js-set-worker'(
    event,
  ) {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    const memberId = this.userId;
    const isAdmin = $(event.currentTarget).hasClass('js-set-admin');
    const isCommentOnly = $(event.currentTarget).hasClass(
      'js-set-comment-only',
    );
    const isNoComments = $(event.currentTarget).hasClass('js-set-no-comments');
    const isWorker = $(event.currentTarget).hasClass('js-set-worker');
    currentBoard.setMemberPermission(
      memberId,
      isAdmin,
      isNoComments,
      isCommentOnly,
      isWorker,
    );
    Popup.back(1);
  },
});

Template.changePermissionsPopup.helpers({
  isAdmin() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    return currentBoard.hasAdmin(this.userId);
  },

  isNormal() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    return (
      !currentBoard.hasAdmin(this.userId) &&
      !currentBoard.hasNoComments(this.userId) &&
      !currentBoard.hasCommentOnly(this.userId) &&
      !currentBoard.hasWorker(this.userId)
    );
  },

  isNoComments() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    return (
      !currentBoard.hasAdmin(this.userId) &&
      currentBoard.hasNoComments(this.userId)
    );
  },

  isCommentOnly() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    return (
      !currentBoard.hasAdmin(this.userId) &&
      currentBoard.hasCommentOnly(this.userId)
    );
  },

  isWorker() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    return (
      !currentBoard.hasAdmin(this.userId) && currentBoard.hasWorker(this.userId)
    );
  },

  isLastAdmin() {
    const currentBoard = Boards.findOne(Session.get('currentBoard'));
    return (
      currentBoard.hasAdmin(this.userId) && currentBoard.activeAdmins() === 1
    );
  },
});
