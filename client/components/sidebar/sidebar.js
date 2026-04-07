import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { InfiniteScrolling } from '/client/lib/infiniteScrolling';
import AccessibilitySettings from '/models/accessibilitySettings';
import Boards from '/models/boards';
import Integrations from '/models/integrations';
import Lists from '/models/lists';
import { BOARD_COLORS } from '/models/metadata/colors';
import { Filter } from '/client/lib/filter';
import { EscapeActions } from '/client/lib/escapeActions';
import { Utils } from '/client/lib/utils';
import {
  clearSidebarInstance,
  setSidebarInstance,
} from '/client/features/sidebar/service';

export let Sidebar = null;

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

Template.sidebar.onCreated(function() {
  this._isOpen = new ReactiveVar(false);
  this._view = new ReactiveVar(defaultView);
  this._hideCardCounterList = new ReactiveVar(false);
  this._hideBoardMemberList = new ReactiveVar(false);
  this.infiniteScrolling = new InfiniteScrolling();
  this.activitiesInstance = null;
  Sidebar = this;
  setSidebarInstance(this);

  // Subscribe to accessibility settings
  Meteor.subscribe('accessibilitySettings');

  // Methods on the template instance for programmatic access via the Sidebar global
  this.isOpen = function() {
    return this._isOpen.get();
  };

  this.open = function() {
    if (!this._isOpen.get()) {
      this._isOpen.set(true);
      EscapeActions.executeUpTo('detailsPane');
    }
  };

  this.hide = function() {
    if (this._isOpen.get()) {
      this._isOpen.set(false);
    }
  };

  this.toggle = function() {
    this._isOpen.set(!this._isOpen.get());
  };

  this.calculateNextPeak = function() {
    const sidebarElement = this.find('.js-board-sidebar-content');
    if (sidebarElement) {
      const altitude = sidebarElement.scrollHeight;
      this.infiniteScrolling.setNextPeak(altitude);
    }
  };

  this.reachNextPeak = function() {
    if (this.activitiesInstance && typeof this.activitiesInstance.loadNextPage === 'function') {
      this.activitiesInstance.loadNextPage();
    }
  };

  this.isTongueHidden = function() {
    return this.isOpen() && this.getView() !== defaultView;
  };

  this.scrollTop = function() {
    this.$('.js-board-sidebar-content').scrollTop(0);
  };

  this.getView = function() {
    return this._view.get();
  };

  this.setView = function(view) {
    view = typeof view === 'string' ? view : defaultView;
    if (this._view.get() !== view) {
      this._view.set(view);
      this.scrollTop();
      EscapeActions.executeUpTo('detailsPane');
    }
    this.open();
  };

  this.isDefaultView = function() {
    return this.getView() === defaultView;
  };

  this.getViewTemplate = function() {
    return `${this.getView()}Sidebar`;
  };

  this.getViewTitle = function() {
    return TAPi18n.__(viewTitles[this.getView()]);
  };

  this.showTongueTitle = function() {
    if (this.isOpen()) return `${TAPi18n.__('sidebar-close')}`;
    else return `${TAPi18n.__('sidebar-open')}`;
  };
});

Template.sidebar.onDestroyed(function() {
  clearSidebarInstance(this);
  Sidebar = null;
});

Template.sidebar.helpers({
  isOpen() {
    return Sidebar && Sidebar.isOpen();
  },
  isTongueHidden() {
    return Sidebar && Sidebar.isTongueHidden();
  },
  isDefaultView() {
    return Sidebar && Sidebar.isDefaultView();
  },
  getViewTemplate() {
    return Sidebar && Sidebar.getViewTemplate();
  },
  getViewTitle() {
    return Sidebar && Sidebar.getViewTitle();
  },
  showTongueTitle() {
    return Sidebar && Sidebar.showTongueTitle();
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
});

Template.sidebar.events({
  'click .js-hide-sidebar'(event, tpl) {
    tpl.hide();
  },
  'click .js-toggle-sidebar'(event, tpl) {
    tpl.toggle();
  },
  'click .js-back-home'(event, tpl) {
    tpl.setView();
  },
  'click .js-toggle-minicard-label-text'() {
    const currentUser = ReactiveCache.getCurrentUser();
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
    ReactiveCache.getCurrentUser().toggleShowWeekOfYear();
  },
  'click .sidebar-accessibility'(event, tpl) {
    FlowRouter.go('accessibility');
    tpl.toggle();
  },
  'click .js-close-sidebar'(event, tpl) {
    tpl.toggle();
  },
  'scroll .js-board-sidebar-content'(event, tpl) {
    tpl.infiniteScrolling.checkScrollPosition(event.currentTarget, () => {
      tpl.reachNextPeak();
    });
  },
});

Blaze.registerHelper('Sidebar', () => Sidebar);

Template.homeSidebar.helpers({
  hiddenMinicardLabelText() {
    const currentUser = ReactiveCache.getCurrentUser();
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
});

Template.homeSidebar.events({
  async 'click .js-toggle-show-activities'() {
    await Utils.getCurrentBoard().toggleShowActivities();
  },
});



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
    if (Sidebar) {
      Sidebar.setView(defaultView);
    }
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
    if (Sidebar) {
      Sidebar.setView('customFields');
    }
    Popup.back();
  },
  'click .js-open-archives'() {
    if (Sidebar) {
      Sidebar.setView('archives');
    }
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

Template.membersWidget.onCreated(function() {
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

  this.setError = function(error) {
    this.error.set(error);
  };

  this.setLoading = function(w) {
    this.loading.set(w);
  };

  this.isLoading = function() {
    return this.loading.get();
  };
});

Template.membersWidget.onRendered(function() {
  const tpl = Template.instance();
  if (tpl.setLoading) tpl.setLoading(false);
});

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
  tabs() {
    return [
      { name: TAPi18n.__('people'), slug: 'people' },
      { name: TAPi18n.__('organizations'), slug: 'organizations' },
      { name: TAPi18n.__('teams'), slug: 'teams' },
    ];
  },
});

Template.membersWidget.events({
  'click .js-member': Popup.open('member'),
  'click .js-open-board-menu': Popup.open('boardMenu'),
  'click .js-manage-board-members': Popup.open('addMember'),
  'click .js-manage-board-addOrg': Popup.open('addBoardOrg'),
  'click .js-manage-board-addTeam': Popup.open('addBoardTeam'),
  'click .js-import': Popup.open('boardImportBoard'),
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

Template.outgoingWebhooksPopup.helpers({
  boardId() {
    return Session.get('currentBoard') || Integrations.Const.GLOBAL_WEBHOOK_ID;
  },
  integrations() {
    const boardId = Session.get('currentBoard') || Integrations.Const.GLOBAL_WEBHOOK_ID;
    const ret = ReactiveCache.getIntegrations({ boardId });
    return ret;
  },
  types() {
    return Integrations.Const.WEBHOOK_TYPES;
  },
  integration(cond) {
    const boardId = Session.get('currentBoard') || Integrations.Const.GLOBAL_WEBHOOK_ID;
    const condition = { boardId, ...cond };
    for (const k in condition) {
      if (!condition[k]) delete condition[k];
    }
    return ReactiveCache.getIntegration(condition);
  },
});

Template.outgoingWebhooksPopup.events({
  'click .js-toggle-webhook-enabled'(evt) {
    evt.preventDefault();
    $(evt.currentTarget).find(MCB).toggleClass(CKCLS);
  },
  async submit(evt) {
    evt.preventDefault();
    const url = evt.target.url.value.trim();
    const boardId = Session.get('currentBoard') || Integrations.Const.GLOBAL_WEBHOOK_ID;
    let id = null;
    let integration = null;
    const title = evt.target.title.value.trim();
    const token = evt.target.token.value.trim();
    const type = evt.target.type.value.trim();
    const enabled = !$(evt.target)
      .find('.js-toggle-webhook-enabled')
      .find(MCB)
      .hasClass(CKCLS);
    let remove = false;
    const values = {
      url,
      type,
      token,
      title,
      enabled,
    };

    const findIntegration = function(cond) {
      const condition = { boardId, ...cond };
      for (const k in condition) {
        if (!condition[k]) delete condition[k];
      }
      return ReactiveCache.getIntegration(condition);
    };

    if (evt.target.id) {
      id = evt.target.id.value;
      integration = findIntegration({ _id: id });
      remove = !url;
    } else if (url) {
      integration = findIntegration({ url, token });
    }

    try {
      if (remove && integration && integration._id) {
        await Integrations.removeAsync(integration._id);
      } else if (integration && integration._id) {
        await Integrations.updateAsync(integration._id, {
          $set: values,
        });
      } else if (url) {
        await Integrations.insertAsync({
          ...values,
          userId: Meteor.userId(),
          enabled,
          boardId,
          activities: ['all'],
        });
      }
      Popup.back();
    } catch (error) {
      alert(error?.reason || error?.message || 'Failed to save webhook');
    }
  },
});

Template.exportBoardPopup.helpers({
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
});

Template.exportBoardPopup.events({
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

Template.boardChangeColorPopup.helpers({
  backgroundColors() {
    return BOARD_COLORS;
  },
  isSelected() {
    const currentBoard = Utils.getCurrentBoard();
    return currentBoard.color === Template.currentData().toString();
  },
});

Template.boardChangeColorPopup.events({
  async 'click .js-select-background'(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    const currentBoard = Utils.getCurrentBoard();
    const newColor = this.toString();
    await currentBoard.setColor(newColor);
  },
});

Template.boardChangeBackgroundImagePopup.events({
  async submit(event, tpl) {
    const currentBoard = Utils.getCurrentBoard();
    const backgroundImageURL = tpl.find('.js-board-background-image-url').value.trim();
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
});

Template.boardChangeBackgroundImagePopup.helpers({
  backgroundImageURL() {
    const currentBoard = Utils.getCurrentBoard();
    return currentBoard.backgroundImageURL;
  },
});

Template.boardInfoOnMyBoardsPopup.onCreated(function() {
  this.currentBoard = Utils.getCurrentBoard();
});

Template.boardInfoOnMyBoardsPopup.helpers({
  hideCardCounterList() {
    return Utils.isMiniScreen() && Session.get('currentBoard');
  },
  hideBoardMemberList() {
    return Utils.isMiniScreen() && Session.get('currentBoard');
  },
  allowsCardCounterList() {
    const tpl = Template.instance();
    return tpl.currentBoard.allowsCardCounterList;
  },
  allowsBoardMemberList() {
    const tpl = Template.instance();
    return tpl.currentBoard.allowsBoardMemberList;
  },
});

Template.boardInfoOnMyBoardsPopup.events({
  'click .js-field-has-cardcounterlist'(evt, tpl) {
    evt.preventDefault();
    tpl.currentBoard.allowsCardCounterList = !tpl.currentBoard
      .allowsCardCounterList;
      tpl.currentBoard.setAllowsCardCounterList(
        tpl.currentBoard.allowsCardCounterList,
    );
    $(`.js-field-has-cardcounterlist ${MCB}`).toggleClass(
      CKCLS,
      tpl.currentBoard.allowsCardCounterList,
    );
    $('.js-field-has-cardcounterlist').toggleClass(
      CKCLS,
      tpl.currentBoard.allowsCardCounterList,
    );
  },
  'click .js-field-has-boardmemberlist'(evt, tpl) {
    evt.preventDefault();
    tpl.currentBoard.allowsBoardMemberList = !tpl.currentBoard
      .allowsBoardMemberList;
      tpl.currentBoard.setAllowsBoardMemberList(
        tpl.currentBoard.allowsBoardMemberList,
    );
    $(`.js-field-has-boardmemberlist ${MCB}`).toggleClass(
      CKCLS,
      tpl.currentBoard.allowsBoardMemberList,
    );
    $('.js-field-has-boardmemberlist').toggleClass(
      CKCLS,
      tpl.currentBoard.allowsBoardMemberList,
    );
  },
});

Template.boardSubtaskSettingsPopup.onCreated(function() {
  this.currentBoard = Utils.getCurrentBoard();
});

Template.boardSubtaskSettingsPopup.helpers({
  allowsSubtasks() {
    // Get the current board reactively using board ID from Session
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    const result = currentBoard ? currentBoard.allowsSubtasks : false;
    return result;
  },
  allowsReceivedDate() {
    const tpl = Template.instance();
    return tpl.currentBoard.allowsReceivedDate;
  },
  isBoardSelected() {
    const tpl = Template.instance();
    return tpl.currentBoard.subtasksDefaultBoardId === Template.currentData()._id;
  },
  isNullBoardSelected() {
    const tpl = Template.instance();
    return (
      tpl.currentBoard.subtasksDefaultBoardId === null ||
      tpl.currentBoard.subtasksDefaultBoardId === undefined
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
    const tpl = Template.instance();
    return ReactiveCache.getLists(
      {
        boardId: tpl.currentBoard._id,
        archived: false,
      },
      {
        sort: ['title'],
      },
    );
  },
  hasLists() {
    const tpl = Template.instance();
    const lists = ReactiveCache.getLists(
      {
        boardId: tpl.currentBoard._id,
        archived: false,
      },
      {
        sort: ['title'],
      },
    );
    return lists.length > 0;
  },
  isListSelected() {
    const tpl = Template.instance();
    return tpl.currentBoard.subtasksDefaultBoardId === Template.currentData()._id;
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
});

Template.boardSubtaskSettingsPopup.events({
  'click .js-field-has-subtasks'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsSubtasks;
    Boards.update(tpl.currentBoard._id, { $set: { allowsSubtasks: newValue } });
    $('.js-field-deposit-board').prop(
      'disabled',
      !newValue,
    );
  },
  'change .js-field-deposit-board'(evt, tpl) {
    let value = evt.target.value;
    if (value === 'null') {
      value = null;
    }
    tpl.currentBoard.setSubtasksDefaultBoardId(value);
    evt.preventDefault();
  },
  'change .js-field-deposit-list'(evt, tpl) {
    tpl.currentBoard.setSubtasksDefaultListId(evt.target.value);
    evt.preventDefault();
  },
  'click .js-field-show-parent-in-minicard'(evt, tpl) {
    // Get the ID from the anchor element, not the span
    const anchorElement = $(evt.target).closest('.js-field-show-parent-in-minicard')[0];
    const value = anchorElement ? anchorElement.id : null;

    if (value) {
      Boards.update(tpl.currentBoard._id, { $set: { presentParentTask: value } });
    }
    evt.preventDefault();
  },
});

Template.boardCardSettingsPopup.onCreated(function() {
  this.currentBoard = Utils.getCurrentBoard();
});

Template.boardCardSettingsPopup.helpers({
  allowsReceivedDate() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.allowsReceivedDate : false;
  },
  allowsStartDate() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.allowsStartDate : false;
  },
  allowsDueDate() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.allowsDueDate : false;
  },
  allowsEndDate() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.allowsEndDate : false;
  },
  allowsSubtasks() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.allowsSubtasks : false;
  },
  allowsCreator() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? (currentBoard.allowsCreator ?? false) : false;
  },
  allowsCreatorOnMinicard() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? (currentBoard.allowsCreatorOnMinicard ?? false) : false;
  },
  allowsMembers() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.allowsMembers : false;
  },
  allowsAssignee() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.allowsAssignee : false;
  },
  allowsAssignedBy() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.allowsAssignedBy : false;
  },
  allowsRequestedBy() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.allowsRequestedBy : false;
  },
  allowsCardSortingByNumber() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.allowsCardSortingByNumber : false;
  },
  allowsShowLists() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.allowsShowLists : false;
  },
  allowsLabels() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.allowsLabels : false;
  },
  allowsShowListsOnMinicard() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.allowsShowListsOnMinicard : false;
  },
  allowsChecklists() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.allowsChecklists : false;
  },
  allowsAttachments() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.allowsAttachments : false;
  },
  allowsComments() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.allowsComments : false;
  },
  allowsCardNumber() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.allowsCardNumber : false;
  },
  allowsDescriptionTitle() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.allowsDescriptionTitle : false;
  },
  allowsDescriptionText() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.allowsDescriptionText : false;
  },
  isBoardSelected() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.dateSettingsDefaultBoardID : false;
  },
  isNullBoardSelected() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? (
      currentBoard.dateSettingsDefaultBoardId === null ||
      currentBoard.dateSettingsDefaultBoardId === undefined
    ) : true;
  },
  allowsDescriptionTextOnMinicard() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.allowsDescriptionTextOnMinicard : false;
  },
  allowsCoverAttachmentOnMinicard() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.allowsCoverAttachmentOnMinicard : false;
  },
  allowsBadgeAttachmentOnMinicard() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.allowsBadgeAttachmentOnMinicard : false;
  },
  allowsCardSortingByNumberOnMinicard() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.allowsCardSortingByNumberOnMinicard : false;
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
    const tpl = Template.instance();
    return ReactiveCache.getLists(
      {
        boardId: tpl.currentBoard._id,
        archived: false,
      },
      {
        sort: ['title'],
      },
    );
  },
  hasLists() {
    const tpl = Template.instance();
    const lists = ReactiveCache.getLists(
      {
        boardId: tpl.currentBoard._id,
        archived: false,
      },
      {
        sort: ['title'],
      },
    );
    return lists.length > 0;
  },
  isListSelected() {
    const tpl = Template.instance();
    return (
      tpl.currentBoard.dateSettingsDefaultBoardId === Template.currentData()._id
    );
  },
});

Template.boardCardSettingsPopup.events({
  'click .js-field-has-receiveddate'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsReceivedDate;
    Boards.update(tpl.currentBoard._id, { $set: { allowsReceivedDate: newValue } });
  },
  'click .js-field-has-startdate'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsStartDate;
    Boards.update(tpl.currentBoard._id, { $set: { allowsStartDate: newValue } });
  },
  'click .js-field-has-enddate'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsEndDate;
    Boards.update(tpl.currentBoard._id, { $set: { allowsEndDate: newValue } });
  },
  'click .js-field-has-duedate'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsDueDate;
    Boards.update(tpl.currentBoard._id, { $set: { allowsDueDate: newValue } });
  },
  'click .js-field-has-subtasks'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsSubtasks;
    Boards.update(tpl.currentBoard._id, { $set: { allowsSubtasks: newValue } });
  },
  'click .js-field-has-creator'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsCreator;
    Boards.update(tpl.currentBoard._id, { $set: { allowsCreator: newValue } });
  },
  'click .js-field-has-creator-on-minicard'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsCreatorOnMinicard;
    Boards.update(tpl.currentBoard._id, { $set: { allowsCreatorOnMinicard: newValue } });
  },
  'click .js-field-has-members'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsMembers;
    Boards.update(tpl.currentBoard._id, { $set: { allowsMembers: newValue } });
  },
  'click .js-field-has-assignee'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsAssignee;
    Boards.update(tpl.currentBoard._id, { $set: { allowsAssignee: newValue } });
  },
  'click .js-field-has-assigned-by'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsAssignedBy;
    Boards.update(tpl.currentBoard._id, { $set: { allowsAssignedBy: newValue } });
  },
  'click .js-field-has-requested-by'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsRequestedBy;
    Boards.update(tpl.currentBoard._id, { $set: { allowsRequestedBy: newValue } });
  },
  'click .js-field-has-card-sorting-by-number'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsCardSortingByNumber;
    Boards.update(tpl.currentBoard._id, { $set: { allowsCardSortingByNumber: newValue } });
  },
  'click .js-field-has-card-show-lists'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsShowLists;
    Boards.update(tpl.currentBoard._id, { $set: { allowsShowLists: newValue } });
  },
  'click .js-field-has-labels'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsLabels;
    Boards.update(tpl.currentBoard._id, { $set: { allowsLabels: newValue } });
  },
  'click .js-field-has-card-show-lists-on-minicard'(evt, tpl) {
    evt.preventDefault();
    tpl.currentBoard.allowsShowListsOnMinicard = !tpl.currentBoard
      .allowsShowListsOnMinicard;
    tpl.currentBoard.setAllowsShowListsOnMinicard(
      tpl.currentBoard.allowsShowListsOnMinicard,
    );
    $(`.js-field-has-card-show-lists-on-minicard ${MCB}`).toggleClass(
      CKCLS,
      tpl.currentBoard.allowsShowListsOnMinicard,
    );
    $('.js-field-has-card-show-lists-on-minicard').toggleClass(
      CKCLS,
      tpl.currentBoard.allowsShowListsOnMinicard,
    );
  },
  'click .js-field-has-description-title'(evt, tpl) {
    evt.preventDefault();
    tpl.currentBoard.allowsDescriptionTitle = !tpl.currentBoard
      .allowsDescriptionTitle;
    tpl.currentBoard.setAllowsDescriptionTitle(
      tpl.currentBoard.allowsDescriptionTitle,
    );
    $(`.js-field-has-description-title ${MCB}`).toggleClass(
      CKCLS,
      tpl.currentBoard.allowsDescriptionTitle,
    );
    $('.js-field-has-description-title').toggleClass(
      CKCLS,
      tpl.currentBoard.allowsDescriptionTitle,
    );
  },
  'click .js-field-has-card-number'(evt, tpl) {
    evt.preventDefault();
    tpl.currentBoard.allowsCardNumber = !tpl.currentBoard
      .allowsCardNumber;
    tpl.currentBoard.setAllowsCardNumber(
      tpl.currentBoard.allowsCardNumber,
    );
    $(`.js-field-has-card-number ${MCB}`).toggleClass(
      CKCLS,
      tpl.currentBoard.allowsCardNumber,
    );
    $('.js-field-has-card-number').toggleClass(
      CKCLS,
      tpl.currentBoard.allowsCardNumber,
    );
  },
  'click .js-field-has-description-text-on-minicard'(evt, tpl) {
    evt.preventDefault();
    tpl.currentBoard.allowsDescriptionTextOnMinicard = !tpl.currentBoard
      .allowsDescriptionTextOnMinicard;
    tpl.currentBoard.setallowsDescriptionTextOnMinicard(
      tpl.currentBoard.allowsDescriptionTextOnMinicard,
    );
    $(`.js-field-has-description-text-on-minicard ${MCB}`).toggleClass(
      CKCLS,
      tpl.currentBoard.allowsDescriptionTextOnMinicard,
    );
    $('.js-field-has-description-text-on-minicard').toggleClass(
      CKCLS,
      tpl.currentBoard.allowsDescriptionTextOnMinicard,
    );
  },
  'click .js-field-has-description-text'(evt, tpl) {
    evt.preventDefault();
    tpl.currentBoard.allowsDescriptionText = !tpl.currentBoard
      .allowsDescriptionText;
    tpl.currentBoard.setAllowsDescriptionText(
      tpl.currentBoard.allowsDescriptionText,
    );
    $(`.js-field-has-description-text ${MCB}`).toggleClass(
      CKCLS,
      tpl.currentBoard.allowsDescriptionText,
    );
    $('.js-field-has-description-text').toggleClass(
      CKCLS,
      tpl.currentBoard.allowsDescriptionText,
    );
  },
  'click .js-field-has-checklists'(evt, tpl) {
    evt.preventDefault();
    tpl.currentBoard.allowsChecklists = !tpl.currentBoard
      .allowsChecklists;
    tpl.currentBoard.setAllowsChecklists(
      tpl.currentBoard.allowsChecklists,
    );
    $(`.js-field-has-checklists ${MCB}`).toggleClass(
      CKCLS,
      tpl.currentBoard.allowsChecklists,
    );
    $('.js-field-has-checklists').toggleClass(
      CKCLS,
      tpl.currentBoard.allowsChecklists,
    );
  },
  'click .js-field-has-attachments'(evt, tpl) {
    evt.preventDefault();
    tpl.currentBoard.allowsAttachments = !tpl.currentBoard
      .allowsAttachments;
    tpl.currentBoard.setAllowsAttachments(
      tpl.currentBoard.allowsAttachments,
    );
    $(`.js-field-has-attachments ${MCB}`).toggleClass(
      CKCLS,
      tpl.currentBoard.allowsAttachments,
    );
    $('.js-field-has-attachments').toggleClass(
      CKCLS,
      tpl.currentBoard.allowsAttachments,
    );
  },
  'click .js-field-has-comments'(evt, tpl) {
    evt.preventDefault();
    tpl.currentBoard.allowsComments = !tpl.currentBoard.allowsComments;
    tpl.currentBoard.setAllowsComments(tpl.currentBoard.allowsComments);
    $(`.js-field-has-comments ${MCB}`).toggleClass(
      CKCLS,
      tpl.currentBoard.allowsComments,
    );
    $('.js-field-has-comments').toggleClass(
      CKCLS,
      tpl.currentBoard.allowsComments,
    );
  },
  'click .js-field-has-activities'(evt, tpl) {
    evt.preventDefault();
    tpl.currentBoard.allowsActivities = !tpl.currentBoard
      .allowsActivities;
    tpl.currentBoard.setAllowsActivities(
      tpl.currentBoard.allowsActivities,
    );
    $(`.js-field-has-activities ${MCB}`).toggleClass(
      CKCLS,
      tpl.currentBoard.allowsActivities,
    );
    $('.js-field-has-activities').toggleClass(
      CKCLS,
      tpl.currentBoard.allowsActivities,
    );
  },
  'click .js-field-has-cover-attachment-on-minicard'(evt, tpl) {
    evt.preventDefault();
    tpl.currentBoard.allowsCoverAttachmentOnMinicard = !tpl.currentBoard
      .allowsCoverAttachmentOnMinicard;
    tpl.currentBoard.setallowsCoverAttachmentOnMinicard(
      tpl.currentBoard.allowsCoverAttachmentOnMinicard,
    );
    $(`.js-field-has-cover-attachment-on-minicard ${MCB}`).toggleClass(
      CKCLS,
      tpl.currentBoard.allowsCoverAttachmentOnMinicard,
    );
    $('.js-field-has-cover-attachment-on-minicard').toggleClass(
      CKCLS,
      tpl.currentBoard.allowsCoverAttachmentOnMinicard,
    );
  },
  'click .js-field-has-badge-attachment-on-minicard'(evt, tpl) {
    evt.preventDefault();
    tpl.currentBoard.allowsBadgeAttachmentOnMinicard = !tpl.currentBoard
      .allowsBadgeAttachmentOnMinicard;
    tpl.currentBoard.setallowsBadgeAttachmentOnMinicard(
      tpl.currentBoard.allowsBadgeAttachmentOnMinicard,
    );
    $(`.js-field-has-badge-attachment-on-minicard ${MCB}`).toggleClass(
      CKCLS,
      tpl.currentBoard.allowsBadgeAttachmentOnMinicard,
    );
    $('.js-field-has-badge-attachment-on-minicard').toggleClass(
      CKCLS,
      tpl.currentBoard.allowsBadgeAttachmentOnMinicard,
    );
  },
  'click .js-field-has-card-sorting-by-number-on-minicard'(evt, tpl) {
    evt.preventDefault();
    tpl.currentBoard.allowsCardSortingByNumberOnMinicard = !tpl.currentBoard
      .allowsCardSortingByNumberOnMinicard;
    tpl.currentBoard.setallowsCardSortingByNumberOnMinicard(
      tpl.currentBoard.allowsCardSortingByNumberOnMinicard,
    );
    $(`.js-field-has-card-sorting-by-number-on-minicard ${MCB}`).toggleClass(
      CKCLS,
      tpl.currentBoard.allowsCardSortingByNumberOnMinicard,
    );
    $('.js-field-has-card-sorting-by-number-on-minicard').toggleClass(
      CKCLS,
      tpl.currentBoard.allowsCardSortingByNumberOnMinicard,
    );
  },
});

// Use Session variables instead of global ReactiveVars
Session.setDefault('addMemberPopup.searchResults', []);
Session.setDefault('addMemberPopup.searching', false);
Session.setDefault('addMemberPopup.noResults', false);
Session.setDefault('addMemberPopup.loading', false);
Session.setDefault('addMemberPopup.error', '');


Template.addMemberPopup.onCreated(function() {
  // Use Session variables
  this.searchTimeout = null;
  Session.set('addMemberPopup.searchResults', []);
  Session.set('addMemberPopup.searching', false);
  Session.set('addMemberPopup.noResults', false);
  Session.set('addMemberPopup.loading', false);
  Session.set('addMemberPopup.error', '');

  this.setError = function(error) {
    Session.set('addMemberPopup.error', error);
  };

  this.setLoading = function(w) {
    Session.set('addMemberPopup.loading', w);
  };

  this.isLoading = function() {
    return Session.get('addMemberPopup.loading');
  };

  this.isValidEmail = function(email) {
    return /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(email);
  };

  this.performSearch = function(query) {
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
  };

  this.inviteUser = function(idNameEmail) {
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
  };
});

Template.addMemberPopup.onDestroyed(function() {
  if (this.searchTimeout) {
    clearTimeout(this.searchTimeout);
  }
  Session.set('addMemberPopup.searching', false);
  Session.set('addMemberPopup.loading', false);
});

Template.addMemberPopup.onRendered(function() {
  this.find('.js-search-member-input').focus();
  this.setLoading(false);
});

Template.addMemberPopup.events({
  'keyup .js-search-member-input'(event, tpl) {
    Session.set('addMemberPopup.error', '');
    const query = event.target.value.trim();

    // Clear previous timeout
    if (tpl.searchTimeout) {
      clearTimeout(tpl.searchTimeout);
    }

    // Debounce search
    tpl.searchTimeout = setTimeout(() => {
      tpl.performSearch(query);
    }, 300);
  },
  'click .js-select-member'(event, tpl) {
    const userId = this._id;
    tpl.inviteUser(userId);
  },
  'click .js-email-invite'(event, tpl) {
    const idNameEmail = $('.js-search-member-input').val();
    if (idNameEmail.indexOf('@') < 0 || tpl.isValidEmail(idNameEmail)) {
      tpl.inviteUser(idNameEmail);
    } else Session.set('addMemberPopup.error', 'email-invalid');
  },
});

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
    return { get() { return Session.get('addMemberPopup.loading'); } };
  },
  error() {
    return { get() { return Session.get('addMemberPopup.error'); } };
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

Template.addBoardOrgPopup.onCreated(function() {
  this.error = new ReactiveVar('');
  this.loading = new ReactiveVar(false);
  this.findOrgsOptions = new ReactiveVar({});

  this.page = new ReactiveVar(1);
  this.autorun(() => {
    const limitOrgs = this.page.get() * Number.MAX_SAFE_INTEGER;
    this.subscribe('org', this.findOrgsOptions.get(), limitOrgs, () => {});
  });

  this.setError = function(error) {
    this.error.set(error);
  };

  this.setLoading = function(w) {
    this.loading.set(w);
  };

  this.isLoading = function() {
    return this.loading.get();
  };
});

Template.addBoardOrgPopup.onRendered(function() {
  this.setLoading(false);
});

Template.addBoardOrgPopup.helpers({
  orgsDatas() {
    let ret = ReactiveCache.getOrgs({}, {sort: { orgDisplayName: 1 }});
    return ret;
  },
});

Template.addBoardOrgPopup.events({
  'keyup input'(event, tpl) {
    tpl.setError('');
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
});

Template.removeBoardOrgPopup.onCreated(function() {
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

  this.setError = function(error) {
    this.error.set(error);
  };

  this.setLoading = function(w) {
    this.loading.set(w);
  };

  this.isLoading = function() {
    return this.loading.get();
  };
});

Template.removeBoardOrgPopup.onRendered(function() {
  this.setLoading(false);
});

Template.removeBoardOrgPopup.helpers({
  org() {
    return ReactiveCache.getOrg(this.orgId);
  },
});

Template.removeBoardOrgPopup.events({
  'keyup input'(event, tpl) {
    tpl.setError('');
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
});

Template.addBoardTeamPopup.onCreated(function() {
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

  this.setError = function(error) {
    this.error.set(error);
  };

  this.setLoading = function(w) {
    this.loading.set(w);
  };

  this.isLoading = function() {
    return this.loading.get();
  };
});

Template.addBoardTeamPopup.onRendered(function() {
  this.setLoading(false);
});

Template.addBoardTeamPopup.helpers({
  teamsDatas() {
    let ret = ReactiveCache.getTeams({}, {sort: { teamDisplayName: 1 }});
    return ret;
  },
});

Template.addBoardTeamPopup.events({
  'keyup input'(event, tpl) {
    tpl.setError('');
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
                  "isAdmin": false,
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
});

Template.removeBoardTeamPopup.onCreated(function() {
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

  this.setError = function(error) {
    this.error.set(error);
  };

  this.setLoading = function(w) {
    this.loading.set(w);
  };

  this.isLoading = function() {
    return this.loading.get();
  };
});

Template.removeBoardTeamPopup.onRendered(function() {
  this.setLoading(false);
});

Template.removeBoardTeamPopup.helpers({
  team() {
    return ReactiveCache.getTeam(this.teamId);
  },
});

Template.removeBoardTeamPopup.events({
  'keyup input'(event, tpl) {
    tpl.setError('');
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
          if(index !== -1 && !members[index].isAdmin){
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
