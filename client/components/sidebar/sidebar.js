import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

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
    return [Mixins.InfiniteScrolling];
  },

  onCreated() {
    this._isOpen = new ReactiveVar(false);
    this._view = new ReactiveVar(defaultView);
    this._hideCardCounterList = new ReactiveVar(false);
    this._hideBoardMemberList = new ReactiveVar(false);
    Sidebar = this;

    // Subscribe to accessibility settings
    Meteor.subscribe('accessibilitySettings');
  },

  onDestroyed() {
    Sidebar = null;
  },

  isOpen() {
    return this._isOpen.get();
  },

  open() {
    // setting a ReactiveVar is idempotent;
    // do not try to get(), because it will
    // react to changes...
    this._isOpen.set(true);
    EscapeActions.executeUpTo('detailsPane');
  },

  hide() {
    this._isOpen.set(false);
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
    const activitiesChildren = this.childComponents('activities');
    if (activitiesChildren && activitiesChildren.length > 0 && activitiesChildren[0] && typeof activitiesChildren[0].loadNextPage === 'function') {
      activitiesChildren[0].loadNextPage();
    }
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

  isKeyboardShortcuts() {
    const user = ReactiveCache.getCurrentUser();
    return user && user.isKeyboardShortcuts();
  },

  isVerticalScrollbars() {
    const user = ReactiveCache.getCurrentUser();
    return user && user.isVerticalScrollbars();
  },

  isAccessibilityEnabled() {
    const setting = AccessibilitySettings.findOne({});
    return setting && setting.enabled;
  },

  events() {
    return [
      {
        'click .js-hide-sidebar': this.hide,
        'click .js-toggle-sidebar': this.toggle,
        'click .js-back-home': this.setView,
        'click .js-toggle-minicard-label-text'() {
          currentUser = ReactiveCache.getCurrentUser();
          if (currentUser) {
            Meteor.call('toggleMinicardLabelText');
          } else if (window.localStorage.getItem('hiddenMinicardLabelText')) {
            window.localStorage.removeItem('hiddenMinicardLabelText');
            location.reload();
          } else {
            window.localStorage.setItem('hiddenMinicardLabelText', 'true');
            location.reload();
          }
        },
        'click .js-shortcuts'() {
          FlowRouter.go('shortcuts');
        },
        'click .js-keyboard-shortcuts-toggle'() {
          ReactiveCache.getCurrentUser().toggleKeyboardShortcuts();
        },
        'click .js-vertical-scrollbars-toggle'() {
          ReactiveCache.getCurrentUser().toggleVerticalScrollbars();
        },
        'click .js-show-week-of-year-toggle'() {
          Meteor.call('toggleShowWeekOfYear');
        },
        'click .sidebar-accessibility'() {
          FlowRouter.go('accessibility');
          Sidebar.toggle();
        },
        'click .js-close-sidebar'() {
          Sidebar.toggle()
        },
      },
    ];
  },
}).register('sidebar');

Blaze.registerHelper('Sidebar', () => Sidebar);

BlazeComponent.extendComponent({
  hiddenMinicardLabelText() {
    currentUser = ReactiveCache.getCurrentUser();
    if (currentUser) {
      return (currentUser.profile || {}).hiddenMinicardLabelText;
    } else if (window.localStorage.getItem('hiddenMinicardLabelText')) {
      return true;
    } else {
      return false;
    }
  },
  isVerticalScrollbars() {
    const user = ReactiveCache.getCurrentUser();
    return user && user.isVerticalScrollbars();
  },
  isShowWeekOfYear() {
    const user = ReactiveCache.getCurrentUser();
    return user && user.isShowWeekOfYear();
  },
  showActivities() {
    let ret = Utils.getCurrentBoard().showActivities ?? false;
    return ret;
  },
  events() {
    return [
      {
        'click .js-toggle-show-activities'() {
          Utils.getCurrentBoard().toggleShowActivities();
        },
      },
    ];
  },
}).register('homeSidebar');



Template.boardInfoOnMyBoardsPopup.helpers({
  hideCardCounterList() {
    return Utils.isMiniScreen() && Session.get('currentBoard');
  },
  hideBoardMemberList() {
    return Utils.isMiniScreen() && Session.get('currentBoard');
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
    return ReactiveCache.getUser(this.userId);
  },
  isBoardAdmin() {
    return ReactiveCache.getCurrentUser().isBoardAdmin();
  },
  memberType() {
    const type = ReactiveCache.getUser(this.userId).isBoardAdmin() ? 'admin' : 'normal';
    if (type === 'normal') {
      const currentBoard = Utils.getCurrentBoard();
      const commentOnly = currentBoard.hasCommentOnly(this.userId);
      const noComments = currentBoard.hasNoComments(this.userId);
      const worker = currentBoard.hasWorker(this.userId);
      const normalAssignedOnly = currentBoard.hasNormalAssignedOnly(this.userId);
      const commentAssignedOnly = currentBoard.hasCommentAssignedOnly(this.userId);
      const readOnly = currentBoard.hasReadOnly(this.userId);
      const readAssignedOnly = currentBoard.hasReadAssignedOnly(this.userId);
      if (readAssignedOnly) {
        return TAPi18n.__('read-assigned-only');
      } else if (readOnly) {
        return TAPi18n.__('read-only');
      } else if (commentAssignedOnly) {
        return TAPi18n.__('comment-assigned-only');
      } else if (commentOnly) {
        return TAPi18n.__('comment-only');
      } else if (normalAssignedOnly) {
        return TAPi18n.__('normal-assigned-only');
      } else if (noComments) {
        return TAPi18n.__('no-comments');
      } else if (worker) {
        return TAPi18n.__('worker');
      } else {
        return TAPi18n.__(type);
      }
    } else {
      return TAPi18n.__(type);
    }
  },
  isInvited() {
    return ReactiveCache.getUser(this.userId).isInvitedTo(Session.get('currentBoard'));
  },
});


Template.boardMenuPopup.events({
  'click .js-rename-board': Popup.open('boardChangeTitle'),
  'click .js-open-rules-view'() {
    Modal.openWide('rulesMain');
    Popup.back();
  },
  'click .js-custom-fields'() {
    Sidebar.setView('customFields');
    Popup.back();
  },
  'click .js-open-archives'() {
    Sidebar.setView('archives');
    Popup.back();
  },
  'click .js-change-board-color': Popup.open('boardChangeColor'),
  'click .js-change-background-image': Popup.open('boardChangeBackgroundImage'),
  'click .js-board-info-on-my-boards': Popup.open('boardInfoOnMyBoards'),
  'click .js-change-language': Popup.open('changeLanguage'),
  'click .js-delete-duplicate-lists': Popup.afterConfirm('deleteDuplicateLists', function() {
    const currentBoard = Utils.getCurrentBoard();
    if (!currentBoard) return;

    // Get all lists in the current board
    const allLists = ReactiveCache.getLists({ boardId: currentBoard._id, archived: false });

    // Group lists by title to find duplicates
    const listsByTitle = {};
    allLists.forEach(list => {
      if (!listsByTitle[list.title]) {
        listsByTitle[list.title] = [];
      }
      listsByTitle[list.title].push(list);
    });

    // Find and delete duplicate lists that have no cards
    let deletedCount = 0;
    Object.keys(listsByTitle).forEach(title => {
      const listsWithSameTitle = listsByTitle[title];
      if (listsWithSameTitle.length > 1) {
        // Keep the first list, delete the rest if they have no cards
        for (let i = 1; i < listsWithSameTitle.length; i++) {
          const list = listsWithSameTitle[i];
          const cardsInList = ReactiveCache.getCards({ listId: list._id, archived: false });

          if (cardsInList.length === 0) {
            Lists.remove(list._id);
            deletedCount++;
          }
        }
      }
    });

    // Show notification
    if (deletedCount > 0) {
      // You could add a toast notification here if available
    }
  }),
  'click .js-archive-board ': Popup.afterConfirm('archiveBoard', async function() {
    const currentBoard = Utils.getCurrentBoard();
    await currentBoard.archive();
    // XXX We should have some kind of notification on top of the page to
    // confirm that the board was successfully archived.
    FlowRouter.go('home');
  }),
  'click .js-delete-board': Popup.afterConfirm('deleteBoard', function() {
    const currentBoard = Utils.getCurrentBoard();
    Popup.back();
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
  isBoardAdmin() {
    return ReactiveCache.getCurrentUser().isBoardAdmin();
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
  exportFilename() {
    const boardId = Session.get('currentBoard');
    return `export-board-${boardId}.json`;
  },
});

Template.memberPopup.events({
  'click .js-filter-member'() {
    Filter.members.toggle(this.userId);
    Popup.back();
  },
  'click .js-change-role': Popup.open('changePermissions'),
  'click .js-remove-member': Popup.afterConfirm('removeMember', async function() {
    // This works from removing member from board, card members and assignees.
    const boardId = Session.get('currentBoard');
    const memberId = this.userId;
    ReactiveCache.getCards({ boardId, members: memberId }).forEach(card => {
      card.unassignMember(memberId);
    });
    ReactiveCache.getCards({ boardId, assignees: memberId }).forEach(card => {
      card.unassignAssignee(memberId);
    });
    await ReactiveCache.getBoard(boardId).removeMember(memberId);
    Popup.back();
  }),
  'click .js-leave-member': Popup.afterConfirm('leaveBoard', () => {
    const boardId = Session.get('currentBoard');
    Meteor.call('quitBoard', boardId, () => {
      Popup.back();
      FlowRouter.go('home');
    });
  }),

});

Template.removeMemberPopup.helpers({
  user() {
    return ReactiveCache.getUser(this.userId);
  },
  board() {
    return Utils.getCurrentBoard();
  },
});

Template.leaveBoardPopup.helpers({
  board() {
    return Utils.getCurrentBoard();
  },
});
BlazeComponent.extendComponent({
  onCreated() {
    this.error = new ReactiveVar('');
    this.loading = new ReactiveVar(false);
    this.findOrgsOptions = new ReactiveVar({});
    this.findTeamsOptions = new ReactiveVar({});

    this.page = new ReactiveVar(1);
    this.teamPage = new ReactiveVar(1);
    this.autorun(() => {
      const limitOrgs = this.page.get() * Number.MAX_SAFE_INTEGER;
      this.subscribe('org', this.findOrgsOptions.get(), limitOrgs, () => {});
    });

    this.autorun(() => {
      const limitTeams = this.teamPage.get() * Number.MAX_SAFE_INTEGER;
      this.subscribe('team', this.findTeamsOptions.get(), limitTeams, () => {});
    });
  },

  onRendered() {
    this.setLoading(false);
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

  tabs() {
    return [
      { name: TAPi18n.__('people'), slug: 'people' },
      { name: TAPi18n.__('organizations'), slug: 'organizations' },
      { name: TAPi18n.__('teams'), slug: 'teams' },
    ];
  },
}).register('membersWidget');

Template.membersWidget.helpers({
  isInvited() {
    const user = ReactiveCache.getCurrentUser();
    return user && user.isInvitedTo(Session.get('currentBoard'));
  },
  isWorker() {
    const user = ReactiveCache.getCurrentUser();
    if (user) {
      return Meteor.call(Boards.hasWorker(user.memberId));
    } else {
      return false;
    }
  },
  isBoardAdmin() {
    return ReactiveCache.getCurrentUser().isBoardAdmin();
  },
  AtLeastOneOrgWasCreated(){
    let orgs = ReactiveCache.getOrgs({}, {sort: { createdAt: -1 }});
    if(orgs === undefined)
      return false;

    return orgs.length > 0;
  },

  AtLeastOneTeamWasCreated(){
    let teams = ReactiveCache.getTeams({}, {sort: { createdAt: -1 }});
    if(teams === undefined)
      return false;

    return teams.length > 0;
  },
});

Template.membersWidget.events({
  'click .js-member': Popup.open('member'),
  'click .js-open-board-menu': Popup.open('boardMenu'),
  'click .js-manage-board-members': Popup.open('addMember'),
  'click .js-manage-board-addOrg': Popup.open('addBoardOrg'),
  'click .js-manage-board-addTeam': Popup.open('addBoardTeam'),
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
    ReactiveCache.getCurrentUser().removeInvite(boardId);
  },
  'click .js-member-invite-decline'() {
    const boardId = Session.get('currentBoard');
    Meteor.call('quitBoard', boardId, (err, ret) => {
      if (!err && ret) {
        ReactiveCache.getCurrentUser().removeInvite(boardId);
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
    const ret = ReactiveCache.getIntegrations({ boardId });
    return ret;
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
    return ReactiveCache.getIntegration(condition);
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
          Popup.back();
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
  exportUrlExcel() {
    const params = {
      boardId: Session.get('currentBoard'),
    };
    const queryParams = {
      authToken: Accounts._storedLoginToken(),
    };
    return FlowRouter.path(
      '/api/boards/:boardId/exportExcel',
      params,
      queryParams,
    );
  },
  exportFilenameExcel() {
    const boardId = Session.get('currentBoard');
    return `export-board-excel-${boardId}.xlsx`;
  },
  exportCsvUrl() {
    const params = {
      boardId: Session.get('currentBoard'),
    };
    const queryParams = {
      authToken: Accounts._storedLoginToken(),
      delimiter: ',',
    };
    return FlowRouter.path(
      '/api/boards/:boardId/export/csv',
      params,
      queryParams,
    );
  },
  exportScsvUrl() {
    const params = {
      boardId: Session.get('currentBoard'),
    };
    const queryParams = {
      authToken: Accounts._storedLoginToken(),
      delimiter: ';',
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
    return `export-board-${boardId}.json`;
  },
  exportCsvFilename() {
    const boardId = Session.get('currentBoard');
    return `export-board-${boardId}.csv`;
  },
  exportTsvFilename() {
    const boardId = Session.get('currentBoard');
    return `export-board-${boardId}.tsv`;
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

Template.labelsWidget.helpers({
  isBoardAdmin() {
    return ReactiveCache.getCurrentUser().isBoardAdmin();
  },
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
    ReactiveCache.getBoard(currentBoardId, {
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
        return ReactiveCache.getCurrentUser()?.isBoardMember();
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
    const currentBoard = Utils.getCurrentBoard();
    return currentBoard.color === this.currentData().toString();
  },

  events() {
    return [
      {
        async 'click .js-select-background'(evt) {
          const currentBoard = Utils.getCurrentBoard();
          const newColor = this.currentData().toString();
          await currentBoard.setColor(newColor);
          evt.preventDefault();
        },
      },
    ];
  },
}).register('boardChangeColorPopup');

BlazeComponent.extendComponent({
  events() {
    return [
      {
        async submit(event) {
          const currentBoard = Utils.getCurrentBoard();
          const backgroundImageURL = this.find('.js-board-background-image-url').value.trim();
          await currentBoard.setBackgroundImageURL(backgroundImageURL);
          Utils.setBackgroundImage();
          Popup.back();
          event.preventDefault();
        },
        'click .js-remove-background-image'() {
          const currentBoard = Utils.getCurrentBoard();
          currentBoard.setBackgroundImageURL("");
          Popup.back();
          Utils.reload();
          event.preventDefault();
        },
      },
    ];
  },
}).register('boardChangeBackgroundImagePopup');

Template.boardChangeBackgroundImagePopup.helpers({
  backgroundImageURL() {
    const currentBoard = Utils.getCurrentBoard();
    return currentBoard.backgroundImageURL;
  },
});

BlazeComponent.extendComponent({
  onCreated() {
    this.currentBoard = Utils.getCurrentBoard();
  },

  allowsCardCounterList() {
    return this.currentBoard.allowsCardCounterList;
  },

  allowsBoardMemberList() {
    return this.currentBoard.allowsBoardMemberList;
  },

  events() {
    return [
      {
        'click .js-field-has-cardcounterlist'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsCardCounterList = !this.currentBoard
            .allowsCardCounterList;
            this.currentBoard.setAllowsCardCounterList(
              this.currentBoard.allowsCardCounterList,
          );
          $(`.js-field-has-cardcounterlist ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsCardCounterList,
          );
          $('.js-field-has-cardcounterlist').toggleClass(
            CKCLS,
            this.currentBoard.allowsCardCounterList,
          );
        },
        'click .js-field-has-boardmemberlist'(evt) {
          evt.preventDefault();
          this.currentBoard.allowsBoardMemberList = !this.currentBoard
            .allowsBoardMemberList;
            this.currentBoard.setAllowsBoardMemberList(
              this.currentBoard.allowsBoardMemberList,
          );
          $(`.js-field-has-boardmemberlist ${MCB}`).toggleClass(
            CKCLS,
            this.currentBoard.allowsBoardMemberList,
          );
          $('.js-field-has-boardmemberlist').toggleClass(
            CKCLS,
            this.currentBoard.allowsBoardMemberList,
          );
        },
      },
    ];
  },
}).register('boardInfoOnMyBoardsPopup');

BlazeComponent.extendComponent({
  onCreated() {
    this.currentBoard = Utils.getCurrentBoard();
  },

  allowsSubtasks() {
    // Get the current board reactively using board ID from Session
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    const result = currentBoard ? currentBoard.allowsSubtasks : false;
    return result;
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
    const ret = ReactiveCache.getBoards(
      {
        archived: false,
        'members.userId': Meteor.userId(),
      },
      {
        sort: { sort: 1 /* boards default sorting */ },
      },
    );
    return ret;
  },

  lists() {
    return ReactiveCache.getLists(
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
    return this.lists().length > 0;
  },

  isListSelected() {
    return this.currentBoard.subtasksDefaultBoardId === this.currentData()._id;
  },

  presentParentTask() {
    // Get the current board reactively using board ID from Session
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);

    let result = currentBoard ? currentBoard.presentParentTask : null;
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
          const newValue = !this.allowsSubtasks();
          Boards.update(this.currentBoard._id, { $set: { allowsSubtasks: newValue } });
          $('.js-field-deposit-board').prop(
            'disabled',
            !newValue,
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
          // Get the ID from the anchor element, not the span
          const anchorElement = $(evt.target).closest('.js-field-show-parent-in-minicard')[0];
          const value = anchorElement ? anchorElement.id : null;

          if (value) {
            Boards.update(this.currentBoard._id, { $set: { presentParentTask: value } });
          }
          evt.preventDefault();
        },
      },
    ];
  },
}).register('boardSubtaskSettingsPopup');

BlazeComponent.extendComponent({
  onCreated() {
    this.currentBoard = Utils.getCurrentBoard();
  },

  boards() {
    const ret = ReactiveCache.getBoards(
      {
        archived: false,
        'members.userId': Meteor.userId(),
      },
      {
        sort: { sort: 1 /* boards default sorting */ },
      },
    );
    return ret;
  },

  lists() {
    return ReactiveCache.getLists(
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
    return this.lists().length > 0;
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
          const newValue = !Utils.allowsReceivedDate();
          this.currentBoard.setAllowsReceivedDate(newValue);
        },
        'click .js-field-has-startdate'(evt) {
          evt.preventDefault();
          const newValue = !Utils.allowsStartDate();
          this.currentBoard.setAllowsStartDate(newValue);
        },
        'click .js-field-has-enddate'(evt) {
          evt.preventDefault();
          const newValue = !Utils.allowsEndDate();
          this.currentBoard.setAllowsEndDate(newValue);
        },
        'click .js-field-has-duedate'(evt) {
          evt.preventDefault();
          const newValue = !Utils.allowsDueDate();
          this.currentBoard.setAllowsDueDate(newValue);
        },
        'click .js-field-has-subtasks'(evt) {
          evt.preventDefault();
          const newValue = !Utils.allowsSubtasks();
          this.currentBoard.setAllowsSubtasks(newValue);
        },
        'click .js-field-has-creator'(evt) {
          evt.preventDefault();
          const newValue = !Utils.allowsCreator();
          this.currentBoard.setAllowsCreator(newValue);
        },
        'click .js-field-has-creator-on-minicard'(evt) {
          evt.preventDefault();
          const newValue = !Utils.allowsCreatorOnMinicard();
          this.currentBoard.setAllowsCreatorOnMinicard(newValue);
        },
        'click .js-field-has-members'(evt) {
          evt.preventDefault();
          const newValue = !Utils.allowsMembers();
          this.currentBoard.setAllowsMembers(newValue);
        },
        'click .js-field-has-assignee'(evt) {
          evt.preventDefault();
          const newValue = !Utils.allowsAssignee();
          this.currentBoard.setAllowsAssignee(newValue);
        },
        'click .js-field-has-assigned-by'(evt) {
          evt.preventDefault();
          const newValue = !Utils.allowsAssignedBy();
          this.currentBoard.setAllowsAssignedBy(newValue);
        },
        'click .js-field-has-requested-by'(evt) {
          evt.preventDefault();
          const newValue = !Utils.allowsRequestedBy();
          this.currentBoard.setAllowsRequestedBy(newValue);
        },
        'click .js-field-has-card-sorting-by-number'(evt) {
          evt.preventDefault();
          const newValue = !Utils.allowsCardSortingByNumber();
          this.currentBoard.setAllowsCardSortingByNumber(newValue);
        },
        'click .js-field-has-card-show-lists'(evt) {
          evt.preventDefault();
          const newValue = !Utils.allowsShowLists();
          this.currentBoard.setAllowsShowLists(newValue);
        },
        'click .js-field-has-labels'(evt) {
          evt.preventDefault();
          const newValue = !Utils.allowsLabels();
          this.currentBoard.setAllowsLabels(newValue);
        },
        'click .js-field-has-card-show-lists-on-minicard'(evt) {
          evt.preventDefault();
          const newValue = !Utils.allowsShowListsOnMinicard();
          this.currentBoard.setAllowsShowListsOnMinicard(newValue);
          $(`.js-field-has-card-show-lists-on-minicard ${MCB}`).toggleClass(
            CKCLS,
            Utils.allowsShowListsOnMinicard(),
          );
          $('.js-field-has-card-show-lists-on-minicard').toggleClass(
            CKCLS,
            Utils.allowsShowListsOnMinicard(),
          );
        },
        'click .js-field-has-description-title'(evt) {
          evt.preventDefault();
          const newValue = !Utils.allowsDescriptionTitle();
          this.currentBoard.setAllowsDescriptionTitle(newValue);
          $(`.js-field-has-description-title ${MCB}`).toggleClass(
            CKCLS,
            Utils.allowsDescriptionTitle(),
          );
          $('.js-field-has-description-title').toggleClass(
            CKCLS,
            Utils.allowsDescriptionTitle(),
          );
        },
        'click .js-field-has-card-number'(evt) {
          evt.preventDefault();
          const newValue = !Utils.allowsCardNumber();
          this.currentBoard.setAllowsCardNumber(newValue);
          $(`.js-field-has-card-number ${MCB}`).toggleClass(
            CKCLS,
            Utils.allowsCardNumber(),
          );
          $('.js-field-has-card-number').toggleClass(
            CKCLS,
            Utils.allowsCardNumber(),
          );
        },
        'click .js-field-has-description-text-on-minicard'(evt) {
          evt.preventDefault();
          const newValue = !Utils.allowsDescriptionTextOnMinicard();
          this.currentBoard.setAllowsDescriptionTextOnMinicard(newValue);
          $(`.js-field-has-description-text-on-minicard ${MCB}`).toggleClass(
            CKCLS,
            Utils.allowsDescriptionTextOnMinicard(),
          );
          $('.js-field-has-description-text-on-minicard').toggleClass(
            CKCLS,
            Utils.allowsDescriptionTextOnMinicard(),
          );
        },
        'click .js-field-has-description-text'(evt) {
          evt.preventDefault();
          const newValue = !Utils.allowsDescriptionText();
          this.currentBoard.setAllowsDescriptionText(newValue);
          $(`.js-field-has-description-text ${MCB}`).toggleClass(
            CKCLS,
            Utils.allowsDescriptionText(),
          );
          $('.js-field-has-description-text').toggleClass(
            CKCLS,
            Utils.allowsDescriptionText(),
          );
        },
        'click .js-field-has-checklists'(evt) {
          evt.preventDefault();
          const newValue = !Utils.allowsChecklists();
          this.currentBoard.setAllowsChecklists(newValue);
          $(`.js-field-has-checklists ${MCB}`).toggleClass(
            CKCLS,
            Utils.allowsChecklists(),
          );
          $('.js-field-has-checklists').toggleClass(
            CKCLS,
            Utils.allowsChecklists(),
          );
        },
        'click .js-field-has-attachments'(evt) {
          evt.preventDefault();
          const newValue = !Utils.allowsAttachments();
          this.currentBoard.setAllowsAttachments(newValue);
          $(`.js-field-has-attachments ${MCB}`).toggleClass(
            CKCLS,
            Utils.allowsAttachments(),
          );
          $('.js-field-has-attachments').toggleClass(
            CKCLS,
            Utils.allowsAttachments(),
          );
        },
        'click .js-field-has-comments'(evt) {
          evt.preventDefault();
          const newValue = !Utils.allowsComments();
          this.currentBoard.setAllowsComments(newValue);
          $(`.js-field-has-comments ${MCB}`).toggleClass(
            CKCLS,
            Utils.allowsComments(),
          );
          $('.js-field-has-comments').toggleClass(
            CKCLS,
            Utils.allowsComments(),
          );
        },
        'click .js-field-has-activities'(evt) {
          evt.preventDefault();
          const newValue = !Utils.allowsActivities();
          this.currentBoard.setAllowsActivities(newValue);
          $(`.js-field-has-activities ${MCB}`).toggleClass(
            CKCLS,
            Utils.allowsActivities(),
          );
          $('.js-field-has-activities').toggleClass(
            CKCLS,
            Utils.allowsActivities(),
          );
        },
        'click .js-field-has-cover-attachment-on-minicard'(evt) {
          evt.preventDefault();
          const newValue = !Utils.allowsCoverAttachmentOnMinicard();
          this.currentBoard.setAllowsCoverAttachmentOnMinicard(newValue);
          $(`.js-field-has-cover-attachment-on-minicard ${MCB}`).toggleClass(
            CKCLS,
            Utils.allowsCoverAttachmentOnMinicard(),
          );
          $('.js-field-has-cover-attachment-on-minicard').toggleClass(
            CKCLS,
            Utils.allowsCoverAttachmentOnMinicard(),
          );
        },
        'click .js-field-has-badge-attachment-on-minicard'(evt) {
          evt.preventDefault();
          const newValue = !Utils.allowsBadgeAttachmentOnMinicard();
          this.currentBoard.setAllowsBadgeAttachmentOnMinicard(newValue);
          $(`.js-field-has-badge-attachment-on-minicard ${MCB}`).toggleClass(
            CKCLS,
            Utils.allowsBadgeAttachmentOnMinicard(),
          );
          $('.js-field-has-badge-attachment-on-minicard').toggleClass(
            CKCLS,
            Utils.allowsBadgeAttachmentOnMinicard(),
          );
        },
        'click .js-field-has-card-sorting-by-number-on-minicard'(evt) {
          evt.preventDefault();
          const newValue = !Utils.allowsCardSortingByNumberOnMinicard();
          this.currentBoard.setAllowsCardSortingByNumberOnMinicard(newValue);
          $(`.js-field-has-card-sorting-by-number-on-minicard ${MCB}`).toggleClass(
            CKCLS,
            Utils.allowsCardSortingByNumberOnMinicard(),
          );
          $('.js-field-has-card-sorting-by-number-on-minicard').toggleClass(
            CKCLS,
            Utils.allowsCardSortingByNumberOnMinicard(),
          );
        },
      },
    ];
  },
}).register('boardCardSettingsPopup');

// Use Session variables instead of global ReactiveVars
Session.setDefault('addMemberPopup.searchResults', []);
Session.setDefault('addMemberPopup.searching', false);
Session.setDefault('addMemberPopup.noResults', false);
Session.setDefault('addMemberPopup.loading', false);
Session.setDefault('addMemberPopup.error', '');


BlazeComponent.extendComponent({
  onCreated() {
    // Use Session variables
    this.searchTimeout = null;
  },

  onRendered() {
    this.find('.js-search-member-input').focus();
    this.setLoading(false);
  },

  isBoardMember() {
    const userId = this.currentData()._id;
    const boardId = Session.get('currentBoard');
    const board = ReactiveCache.getBoard(boardId);
    return board && board.hasMember(userId);
  },

  isValidEmail(email) {
    return SimpleSchema.RegEx.Email.test(email);
  },

  setError(error) {
    Session.set('addMemberPopup.error', error);
  },

  setLoading(w) {
    Session.set('addMemberPopup.loading', w);
  },

  isLoading() {
    return Session.get('addMemberPopup.loading');
  },

  performSearch(query) {
    if (!query || query.length < 2) {
      Session.set('addMemberPopup.searchResults', []);
      Session.set('addMemberPopup.noResults', false);
      return;
    }

    Session.set('addMemberPopup.searching', true);
    Session.set('addMemberPopup.noResults', false);

    const boardId = Session.get('currentBoard');
    Meteor.call('searchUsers', query, boardId, (error, results) => {
      Session.set('addMemberPopup.searching', false);
      if (error) {
        console.error('Search error:', error);
        Session.set('addMemberPopup.searchResults', []);
        Session.set('addMemberPopup.noResults', true);
      } else {
        Session.set('addMemberPopup.searchResults', results);
        if (results.length === 0) {
          Session.set('addMemberPopup.noResults', true);
        }
      }
    });
  },

  inviteUser(idNameEmail) {
    const boardId = Session.get('currentBoard');
    this.setLoading(true);
    const self = this;
    Meteor.call('inviteUserToBoard', idNameEmail, boardId, (err, ret) => {
      self.setLoading(false);
      if (err) {
        self.setError(err.error);
      } else {
        Popup.back();
      }
    });
  },

  events() {
    return [
      {
        'keyup .js-search-member-input'(event) {
          Session.set('addMemberPopup.error', '');
          const query = event.target.value.trim();
          this.searchQuery.set(query);

          // Clear previous timeout
          if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
          }

          // Debounce search
          this.searchTimeout = setTimeout(() => {
            this.performSearch(query);
          }, 300);
        },
        'click .js-select-member'() {
          const userId = this.currentData()._id;
          this.inviteUser(userId);
        },
        'click .js-email-invite'() {
          const idNameEmail = $('.js-search-member-input').val();
          if (idNameEmail.indexOf('@') < 0 || this.isValidEmail(idNameEmail)) {
            this.inviteUser(idNameEmail);
          } else Session.set('addMemberPopup.error', 'email-invalid');
        },
      },
    ];
  },
}).register('addMemberPopup');

Template.addMemberPopup.helpers({
  searchResults() {
    const results = Session.get('addMemberPopup.searchResults');
    return results;
  },
  searching() {
    return Session.get('addMemberPopup.searching');
  },
  noResults() {
    return Session.get('addMemberPopup.noResults');
  },
  loading() {
    return Session.get('addMemberPopup.loading');
  },
  error() {
    return Session.get('addMemberPopup.error');
  },
  isBoardMember() {
    const userId = this._id;
    const boardId = Session.get('currentBoard');
    const board = ReactiveCache.getBoard(boardId);
    return board && board.hasMember(userId);
  }
})

Template.addMemberPopupTest.helpers({
  searchResults() {
    return Session.get('addMemberPopup.searchResults') || [];
  }
})

BlazeComponent.extendComponent({
  onCreated() {
    this.error = new ReactiveVar('');
    this.loading = new ReactiveVar(false);
    this.findOrgsOptions = new ReactiveVar({});

    this.page = new ReactiveVar(1);
    this.autorun(() => {
      const limitOrgs = this.page.get() * Number.MAX_SAFE_INTEGER;
      this.subscribe('org', this.findOrgsOptions.get(), limitOrgs, () => {});
    });
  },

  onRendered() {
    this.setLoading(false);
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

  events() {
    return [
      {
        'keyup input'() {
          this.setError('');
        },
        'change #jsBoardOrgs'() {
          let currentBoard = Utils.getCurrentBoard();
          let selectElt = document.getElementById("jsBoardOrgs");
          let selectedOrgId = selectElt.options[selectElt.selectedIndex].value;
          let selectedOrgDisplayName = selectElt.options[selectElt.selectedIndex].text;
          let boardOrganizations = [];
          if(currentBoard.orgs !== undefined){
            for(let i = 0; i < currentBoard.orgs.length; i++){
              boardOrganizations.push(currentBoard.orgs[i]);
            }
          }

          if(!boardOrganizations.some((org) => org.orgDisplayName == selectedOrgDisplayName)){
            boardOrganizations.push({
              "orgId": selectedOrgId,
              "orgDisplayName": selectedOrgDisplayName,
              "isActive" : true,
            })

            if (selectedOrgId != "-1") {
              Meteor.call('setBoardOrgs', boardOrganizations, currentBoard._id);
            }
          }

          Popup.back();
        },
      },
    ];
  },
}).register('addBoardOrgPopup');

Template.addBoardOrgPopup.helpers({
  orgsDatas() {
    let ret = ReactiveCache.getOrgs({}, {sort: { orgDisplayName: 1 }});
    return ret;
  },
});

BlazeComponent.extendComponent({
  onCreated() {
    this.error = new ReactiveVar('');
    this.loading = new ReactiveVar(false);
    this.findOrgsOptions = new ReactiveVar({});

    this.page = new ReactiveVar(1);
    this.autorun(() => {
      const limitTeams = this.page.get() * Number.MAX_SAFE_INTEGER;
      this.subscribe('team', this.findOrgsOptions.get(), limitTeams, () => {});
    });

    this.findUsersOptions = new ReactiveVar({});
    this.userPage = new ReactiveVar(1);
    this.autorun(() => {
      const limitUsers = this.userPage.get() * Number.MAX_SAFE_INTEGER;
      this.subscribe('people', this.findUsersOptions.get(), limitUsers, () => {});
    });
  },

  onRendered() {
    this.setLoading(false);
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

  events() {
    return [
      {
        'keyup input'() {
          this.setError('');
        },
        'click #leaveBoardBtn'(){
          let stringOrgId = document.getElementById('hideOrgId').value;
          let currentBoard = Utils.getCurrentBoard();
          let boardOrganizations = [];
          if(currentBoard.orgs !== undefined){
            for(let i = 0; i < currentBoard.orgs.length; i++){
              if(currentBoard.orgs[i].orgId != stringOrgId){
                boardOrganizations.push(currentBoard.orgs[i]);
              }
            }
          }

          Meteor.call('setBoardOrgs', boardOrganizations, currentBoard._id);

          Popup.back();
        },
        'click #cancelLeaveBoardBtn'(){
          Popup.back();
        },
      },
    ];
  },
}).register('removeBoardOrgPopup');

Template.removeBoardOrgPopup.helpers({
  org() {
    return ReactiveCache.getOrg(this.orgId);
  },
});

BlazeComponent.extendComponent({
  onCreated() {
    this.error = new ReactiveVar('');
    this.loading = new ReactiveVar(false);
    this.findOrgsOptions = new ReactiveVar({});

    this.page = new ReactiveVar(1);
    this.autorun(() => {
      const limitTeams = this.page.get() * Number.MAX_SAFE_INTEGER;
      this.subscribe('team', this.findOrgsOptions.get(), limitTeams, () => {});
    });

    this.findUsersOptions = new ReactiveVar({});
    this.userPage = new ReactiveVar(1);
    this.autorun(() => {
      const limitUsers = this.userPage.get() * Number.MAX_SAFE_INTEGER;
      this.subscribe('people', this.findUsersOptions.get(), limitUsers, () => {});
    });
  },

  onRendered() {
    this.setLoading(false);
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

  events() {
    return [
      {
        'keyup input'() {
          this.setError('');
        },
        'change #jsBoardTeams'() {
          let currentBoard = Utils.getCurrentBoard();
          let selectElt = document.getElementById("jsBoardTeams");
          let selectedTeamId = selectElt.options[selectElt.selectedIndex].value;
          let selectedTeamDisplayName = selectElt.options[selectElt.selectedIndex].text;
          let boardTeams = [];
          if(currentBoard.teams !== undefined){
            for(let i = 0; i < currentBoard.teams.length; i++){
              boardTeams.push(currentBoard.teams[i]);
            }
          }

          if(!boardTeams.some((team) => team.teamDisplayName == selectedTeamDisplayName)){
            boardTeams.push({
              "teamId": selectedTeamId,
              "teamDisplayName": selectedTeamDisplayName,
              "isActive" : true,
            })

            if (selectedTeamId != "-1") {
              let members = currentBoard.members;

              let query = {
                "teams.teamId": { $in: boardTeams.map(t => t.teamId) },
              };

              const boardTeamUsers = ReactiveCache.getUsers(query, {
                sort: { sort: 1 },
              });

              if(boardTeams !== undefined && boardTeams.length > 0){
                let index;
                if (boardTeamUsers && boardTeamUsers.length > 0) {
                  boardTeamUsers.forEach((u) => {
                    index = members.findIndex(function(m){ return m.userId == u._id});
                    if(index == -1){
                      members.push({
                        "isActive": true,
                        "isAdmin": u.isAdmin !== undefined ? u.isAdmin : false,
                        "isCommentOnly" : false,
                        "isNoComments" : false,
                        "userId": u._id,
                      });
                    }
                  });
                }
              }

              Meteor.call('setBoardTeams', boardTeams, members, currentBoard._id);
            }
          }

          Popup.back();
        },
      },
    ];
  },
}).register('addBoardTeamPopup');

Template.addBoardTeamPopup.helpers({
  teamsDatas() {
    let ret = ReactiveCache.getTeams({}, {sort: { teamDisplayName: 1 }});
    return ret;
  },
});

BlazeComponent.extendComponent({
  onCreated() {
    this.error = new ReactiveVar('');
    this.loading = new ReactiveVar(false);
    this.findOrgsOptions = new ReactiveVar({});

    this.page = new ReactiveVar(1);
    this.autorun(() => {
      const limitTeams = this.page.get() * Number.MAX_SAFE_INTEGER;
      this.subscribe('team', this.findOrgsOptions.get(), limitTeams, () => {});
    });

    this.findUsersOptions = new ReactiveVar({});
    this.userPage = new ReactiveVar(1);
    this.autorun(() => {
      const limitUsers = this.userPage.get() * Number.MAX_SAFE_INTEGER;
      this.subscribe('people', this.findUsersOptions.get(), limitUsers, () => {});
    });
  },

  onRendered() {
    this.setLoading(false);
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

  events() {
    return [
      {
        'keyup input'() {
          this.setError('');
        },
        'click #leaveBoardTeamBtn'(){
          let stringTeamId = document.getElementById('hideTeamId').value;
          let currentBoard = Utils.getCurrentBoard();
          let boardTeams = [];
          if(currentBoard.teams !== undefined){
            for(let i = 0; i < currentBoard.teams.length; i++){
              if(currentBoard.teams[i].teamId != stringTeamId){
                boardTeams.push(currentBoard.teams[i]);
              }
            }
          }

          let members = currentBoard.members;
          let query = {
            "teams.teamId": stringTeamId
          };

          const boardTeamUsers = ReactiveCache.getUsers(query, {
            sort: { sort: 1 },
          });

          if(currentBoard.teams !== undefined && currentBoard.teams.length > 0){
            let index;
            if (boardTeamUsers && boardTeamUsers.length > 0) {
              boardTeamUsers.forEach((u) => {
                index = members.findIndex(function(m){ return m.userId == u._id});
                if(index !== -1 && (u.isAdmin === undefined || u.isAdmin == false)){
                  members.splice(index, 1);
                }
              });
            }
          }

          Meteor.call('setBoardTeams', boardTeams, members, currentBoard._id);

          Popup.back();
        },
        'click #cancelLeaveBoardTeamBtn'(){
          Popup.back();
        },
      },
    ];
  },
}).register('removeBoardTeamPopup');

Template.removeBoardTeamPopup.helpers({
  team() {
    return ReactiveCache.getTeam(this.teamId);
  },
});

Template.changePermissionsPopup.events({
  async 'click .js-set-admin, click .js-set-normal, click .js-set-normal-assigned-only, click .js-set-no-comments, click .js-set-comment-only, click .js-set-comment-assigned-only, click .js-set-read-only, click .js-set-read-assigned-only, click .js-set-worker'(
    event,
  ) {
    const currentBoard = Utils.getCurrentBoard();
    const memberId = this.userId;
    const isAdmin = $(event.currentTarget).hasClass('js-set-admin');
    const isCommentOnly = $(event.currentTarget).hasClass(
      'js-set-comment-only',
    );
    const isNormalAssignedOnly = $(event.currentTarget).hasClass(
      'js-set-normal-assigned-only',
    );
    const isCommentAssignedOnly = $(event.currentTarget).hasClass(
      'js-set-comment-assigned-only',
    );
    const isReadOnly = $(event.currentTarget).hasClass('js-set-read-only');
    const isReadAssignedOnly = $(event.currentTarget).hasClass('js-set-read-assigned-only');
    const isNoComments = $(event.currentTarget).hasClass('js-set-no-comments');
    const isWorker = $(event.currentTarget).hasClass('js-set-worker');
    await currentBoard.setMemberPermission(
      memberId,
      isAdmin,
      isNoComments,
      isCommentOnly,
      isWorker,
      isNormalAssignedOnly,
      isCommentAssignedOnly,
      isReadOnly,
      isReadAssignedOnly,
    );
    Popup.back(1);
  },
});

Template.changePermissionsPopup.helpers({
  isAdmin() {
    const currentBoard = Utils.getCurrentBoard();
    return currentBoard.hasAdmin(this.userId);
  },

  isNormal() {
    const currentBoard = Utils.getCurrentBoard();
    return (
      !currentBoard.hasAdmin(this.userId) &&
      !currentBoard.hasNoComments(this.userId) &&
      !currentBoard.hasCommentOnly(this.userId) &&
      !currentBoard.hasNormalAssignedOnly(this.userId) &&
      !currentBoard.hasCommentAssignedOnly(this.userId) &&
      !currentBoard.hasReadOnly(this.userId) &&
      !currentBoard.hasReadAssignedOnly(this.userId) &&
      !currentBoard.hasWorker(this.userId)
    );
  },

  isNormalAssignedOnly() {
    const currentBoard = Utils.getCurrentBoard();
    return (
      !currentBoard.hasAdmin(this.userId) &&
      currentBoard.hasNormalAssignedOnly(this.userId)
    );
  },

  isNoComments() {
    const currentBoard = Utils.getCurrentBoard();
    return (
      !currentBoard.hasAdmin(this.userId) &&
      currentBoard.hasNoComments(this.userId)
    );
  },

  isCommentOnly() {
    const currentBoard = Utils.getCurrentBoard();
    return (
      !currentBoard.hasAdmin(this.userId) &&
      currentBoard.hasCommentOnly(this.userId)
    );
  },

  isCommentAssignedOnly() {
    const currentBoard = Utils.getCurrentBoard();
    return (
      !currentBoard.hasAdmin(this.userId) &&
      currentBoard.hasCommentAssignedOnly(this.userId)
    );
  },

  isReadOnly() {
    const currentBoard = Utils.getCurrentBoard();
    return (
      !currentBoard.hasAdmin(this.userId) &&
      currentBoard.hasReadOnly(this.userId)
    );
  },

  isReadAssignedOnly() {
    const currentBoard = Utils.getCurrentBoard();
    return (
      !currentBoard.hasAdmin(this.userId) &&
      currentBoard.hasReadAssignedOnly(this.userId)
    );
  },

  isWorker() {
    const currentBoard = Utils.getCurrentBoard();
    return (
      !currentBoard.hasAdmin(this.userId) && currentBoard.hasWorker(this.userId)
    );
  },

  isLastAdmin() {
    const currentBoard = Utils.getCurrentBoard();
    return (
      currentBoard.hasAdmin(this.userId) && currentBoard.activeAdmins() === 1
    );
  },
});
