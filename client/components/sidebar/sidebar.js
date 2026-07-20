import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { InfiniteScrolling } from '/client/lib/infiniteScrolling';
import AccessibilitySettings from '/models/accessibilitySettings';
import Boards from '/models/boards';
import Attachments from '/models/attachments';
import { generateUniversalAttachmentUrl } from '/models/lib/universalUrlGenerator';
import Integrations from '/models/integrations';
import Lists from '/models/lists';
import { Filter } from '/client/lib/filter';
import { EscapeActions } from '/client/lib/escapeActions';
import { Utils } from '/client/lib/utils';
import {
  exportDependenciesJson,
  exportDependenciesSvg,
} from '/client/lib/exportDependencies';
import { parseDependencyLines } from '/client/lib/importDependencies';
import {
  clearSidebarInstance,
  setSidebarInstance,
} from '/client/features/sidebar/service';

export let Sidebar = null;

const defaultView = 'home';
const MCB = '.materialCheckBox';
const CKCLS = 'is-checked';

function getMinicardSetting(board, onMinicardField, cardField, defaultValue) {
  if (!board) return false;
  if (board[onMinicardField] !== null && board[onMinicardField] !== undefined) {
    return board[onMinicardField];
  }
  if (cardField && board[cardField] !== null && board[cardField] !== undefined) {
    return board[cardField];
  }
  return defaultValue;
}

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

// ── Right sidebar drag-to-resize (desktop only) ──────────────────────────────
// Drag the sidebar's left edge to change its width, like resizing a spreadsheet
// column (mirrors the list resize in client/components/lists/list.js). The width
// is saved to the user profile for logged-in users, or browser localStorage for
// anonymous users on a public board. On phones the sidebar stays full width.
const MIN_SIDEBAR_WIDTH = 280;
const SIDEBAR_WIDTH_STORAGE_KEY = 'wekan-sidebar-width';
const isMobileSidebar = () => window.innerWidth <= 800;
const maxSidebarWidth = () =>
  Math.max(MIN_SIDEBAR_WIDTH, Math.min(900, window.innerWidth - 80));

function readSavedSidebarWidth() {
  const user = ReactiveCache.getCurrentUser();
  if (user) return user.getSidebarWidth();
  try {
    const v = window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
    return v ? parseInt(v, 10) : undefined;
  } catch (e) {
    return undefined;
  }
}

function saveSidebarWidth(width) {
  const user = ReactiveCache.getCurrentUser();
  if (user) {
    Meteor.call('setSidebarWidth', width, err => {
      if (err) console.error('Error saving sidebar width:', err);
    });
  } else {
    try {
      window.localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(width));
    } catch (e) {
      /* localStorage unavailable (private mode) — width just isn't persisted */
    }
  }
}

function applySavedSidebarWidth($sidebar) {
  // On phones the sidebar is full width (a !important CSS rule), so never set an
  // inline width there; clear any leftover so shrinking desktop -> mobile works.
  if (isMobileSidebar()) {
    $sidebar[0].style.removeProperty('width');
    return;
  }
  const w = readSavedSidebarWidth();
  if (typeof w === 'number' && w >= MIN_SIDEBAR_WIDTH) {
    $sidebar[0].style.width = `${Math.min(w, maxSidebarWidth())}px`;
  } else {
    $sidebar[0].style.removeProperty('width'); // fall back to the CSS clamp
  }
}

Template.sidebar.onRendered(function() {
  const tpl = this;
  const $sidebar = tpl.$('.board-sidebar');
  const $handle = tpl.$('.js-sidebar-resize-handle');
  if (!$sidebar.length || !$handle.length) return;

  // Apply the saved width when the current user (and thus the saved value)
  // resolves, and re-apply on window resize so crossing the mobile breakpoint
  // clears/restores the inline width.
  tpl.autorun(() => {
    ReactiveCache.getCurrentUser(); // reactive dependency on login state
    applySavedSidebarWidth($sidebar);
  });
  const onWinResize = () => applySavedSidebarWidth($sidebar);
  window.addEventListener('resize', onWinResize);

  let isResizing = false;
  let startX = 0;
  let startWidth = 0;
  let lastWidth = 0;

  const getPageX = (e) => {
    const oe = e.originalEvent || e;
    if (oe.touches && oe.touches.length) return oe.touches[0].pageX;
    if (oe.changedTouches && oe.changedTouches.length) return oe.changedTouches[0].pageX;
    return e.pageX;
  };
  // Direction: the sidebar docks to the logical inline-end. In LTR that is the
  // right, so its left-edge handle widens the panel when dragged left; RTL puts
  // the panel on the left, mirroring the direction.
  const isRtl = () =>
    (document.documentElement.getAttribute('dir') || document.dir) === 'rtl';

  const startResize = (e) => {
    if (isMobileSidebar()) return; // no resize on phones
    isResizing = true;
    startX = getPageX(e);
    startWidth = $sidebar.outerWidth();
    lastWidth = startWidth;
    $('body').addClass('sidebar-resizing-active');
    e.preventDefault();
    e.stopPropagation();
  };
  const doResize = (e) => {
    if (!isResizing) return;
    const delta = (startX - getPageX(e)) * (isRtl() ? -1 : 1);
    const w = Math.max(MIN_SIDEBAR_WIDTH, Math.min(maxSidebarWidth(), startWidth + delta));
    lastWidth = w;
    $sidebar[0].style.width = `${w}px`;
    e.preventDefault();
    e.stopPropagation();
  };
  const stopResize = (e) => {
    if (!isResizing) return;
    isResizing = false;
    $('body').removeClass('sidebar-resizing-active');
    saveSidebarWidth(Math.round(lastWidth));
    if (e && e.preventDefault) e.preventDefault();
  };

  $handle.on('mousedown', startResize);
  $(document).on('mousemove', doResize);
  $(document).on('mouseup', stopResize);
  // Native touch API so { passive: false } applies and preventDefault works.
  $handle[0].addEventListener('touchstart', startResize, { passive: false });
  document.addEventListener('touchmove', doResize, { passive: false });
  document.addEventListener('touchend', stopResize, { passive: false });

  tpl._sidebarResizeCleanup = () => {
    window.removeEventListener('resize', onWinResize);
    $(document).off('mousemove', doResize);
    $(document).off('mouseup', stopResize);
    document.removeEventListener('touchmove', doResize);
    document.removeEventListener('touchend', stopResize);
  };
});

Template.sidebar.onDestroyed(function() {
  if (this._sidebarResizeCleanup) this._sidebarResizeCleanup();
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
    const user = ReactiveCache.getCurrentUser();
    if (user) user.toggleKeyboardShortcuts();
  },
  'click .js-vertical-scrollbars-toggle'() {
    ReactiveCache.getCurrentUser().toggleVerticalScrollbars();
  },
  'click .js-show-week-of-year-toggle'() {
    const user = ReactiveCache.getCurrentUser();
    if (user) {
      user.toggleShowWeekOfYear();
    } else {
      const current = window.localStorage.getItem('showWeekOfYear') === 'true';
      window.localStorage.setItem('showWeekOfYear', String(!current));
    }
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
    if (!user) return window.localStorage.getItem('showWeekOfYear') === 'true';
    return user.isShowWeekOfYear();
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
    return ReactiveCache.getCurrentUser()?.isBoardAdmin();
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
    const currentBoard = Utils.getCurrentBoard();
    Popup.back();
    if (currentBoard) {
      FlowRouter.go('board-rules', {
        id: currentBoard._id,
        slug: currentBoard.slug,
      });
    }
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
  'click .js-manage-board-backgrounds': Popup.open('boardBackgrounds'),
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
    try {
      await Meteor.callAsync('archiveBoard', currentBoard._id);
      FlowRouter.go('home');
    } catch (err) {
      alert(err?.reason || err?.message || 'Failed to archive board');
    }
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
    return ReactiveCache.getCurrentUser()?.isBoardAdmin();
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
    return ReactiveCache.getCurrentUser()?.isBoardAdmin();
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
      { name: TAPi18n.__('domains'), slug: 'domains' },
    ];
  },
});

Template.membersWidget.events({
  'click .js-member': Popup.open('member'),
  'click .js-open-board-menu': Popup.open('boardMenu'),
  'click .js-manage-board-members': Popup.open('addMember'),
  'click .js-manage-board-addOrg': Popup.open('addBoardOrg'),
  'click .js-manage-board-addTeam': Popup.open('addBoardTeam'),
  'click .js-manage-board-addDomain': Popup.open('addBoardDomain'),
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
  // #5870: JSON export omitting base64 attachment data, so very large boards
  // (whose inlined attachments would otherwise overflow the JSON serializer)
  // can still be exported.
  exportUrlNoAttachments() {
    const params = {
      boardId: Session.get('currentBoard'),
    };
    const queryParams = {
      authToken: Accounts._storedLoginToken(),
      attachments: 'false',
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
  exportUrlPDF() {
    const params = {
      boardId: Session.get('currentBoard'),
    };
    const queryParams = {
      authToken: Accounts._storedLoginToken(),
    };
    return FlowRouter.path('/api/boards/:boardId/exportPDF', params, queryParams);
  },
  exportFilenamePDF() {
    const boardId = Session.get('currentBoard');
    return `export-board-${boardId}.pdf`;
  },
  exportUrlKanboard() {
    const params = {
      boardId: Session.get('currentBoard'),
    };
    const queryParams = {
      authToken: Accounts._storedLoginToken(),
    };
    return FlowRouter.path('/api/boards/:boardId/export/kanboard', params, queryParams);
  },
  exportFilenameKanboard() {
    const boardId = Session.get('currentBoard');
    return `export-board-kanboard-${boardId}.json`;
  },
  // Generalized export URL/filename for the external tools (Deck, OpenProject,
  // GitHub, GitLab, Gitea, Forgejo).
  exportUrlExternal(format) {
    return FlowRouter.path(
      `/api/boards/:boardId/export/${format}`,
      { boardId: Session.get('currentBoard') },
      { authToken: Accounts._storedLoginToken() },
    );
  },
  exportFilenameExternal(format) {
    return `export-board-${format}-${Session.get('currentBoard')}.json`;
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
  // #3392: export the board's card dependency ("Red Strings") lines.
  'click .js-export-dependencies-json'(event) {
    event.preventDefault();
    exportDependenciesJson(Session.get('currentBoard'));
    Popup.close();
  },
  'click .js-export-dependencies-svg'(event) {
    event.preventDefault();
    exportDependenciesSvg(Session.get('currentBoard'));
    Popup.close();
  },
});

// #3392: import dependency ("Red Strings") lines from a JSON/SVG file into a
// chosen board. Reachable from All Boards / New / Import / Dependencies.
Template.chooseBoardSourcePopup.events({
  'click .js-import-dependencies': Popup.open('importDependencies'),
});

Template.importDependenciesPopup.onCreated(function () {
  this.fileText = new ReactiveVar('');
  this.importResult = new ReactiveVar('');
});

Template.importDependenciesPopup.helpers({
  boardsForDependencyImport() {
    const userId = Meteor.userId();
    return ReactiveCache.getBoards(
      { 'members.userId': userId, archived: false },
      { sort: { sort: 1, title: 1 } },
    );
  },
  importResult() {
    return Template.instance().importResult.get();
  },
});

Template.importDependenciesPopup.events({
  'change .js-import-dependencies-file'(event, tpl) {
    const file = event.currentTarget.files && event.currentTarget.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => tpl.fileText.set(e.target.result || '');
    reader.readAsText(file);
  },
  'submit .js-import-dependencies-form'(event, tpl) {
    event.preventDefault();
    const boardId = tpl.find('.js-import-dependencies-board').value;
    const fileEl = tpl.find('.js-import-dependencies-file');
    const filename =
      fileEl && fileEl.files && fileEl.files[0] ? fileEl.files[0].name : '';
    const text =
      tpl.fileText.get() || tpl.find('.js-import-dependencies-text').value || '';
    let lines = [];
    try {
      lines = parseDependencyLines(text, filename);
    } catch (e) {
      tpl.importResult.set(TAPi18n.__('import-dependencies-parse-error'));
      return;
    }
    if (!boardId || lines.length === 0) {
      tpl.importResult.set(TAPi18n.__('import-dependencies-empty'));
      return;
    }
    Meteor.call('importBoardDependencies', boardId, lines, (err, res) => {
      if (err) {
        tpl.importResult.set(err.reason || err.message || String(err));
        return;
      }
      tpl.importResult.set(
        TAPi18n.__('import-dependencies-done', {
          imported: res.imported,
          unmatched: res.unmatched,
        }),
      );
    });
  },
});

Template.labelsWidget.events({
  'click .js-label': Popup.open('editLabel'),
  'click .js-add-label': Popup.open('createLabel'),
});

Template.labelsWidget.helpers({
  isBoardAdmin() {
    return ReactiveCache.getCurrentUser()?.isBoardAdmin();
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

// docs/Theme/Theme.md: the board color popup now renders the shared themeColorPicker
// (scope="board"); its logic lives in client/components/main/themeColorPicker.js.

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

// Manage the board's stored background images (upload / set active / download /
// delete). Backgrounds are board-level Attachments (meta.boardId, no cardId,
// meta.source === 'board-background') in the default attachments storage.
Template.boardBackgroundsPopup.onCreated(function () {
  this.uploading = new ReactiveVar(false);
  this.error = new ReactiveVar('');
  const board = Utils.getCurrentBoard();
  this.boardId = board && board._id;
  if (this.boardId) {
    this.subscribe('boardBackgrounds', this.boardId);
  }
});

Template.boardBackgroundsPopup.helpers({
  uploading() {
    return Template.instance().uploading;
  },
  error() {
    return Template.instance().error;
  },
  backgrounds() {
    // Raw collection docs don't carry the .link() helper, so compute the URL.
    return Attachments.collection
      .find({
        'meta.boardId': Template.instance().boardId,
        'meta.source': 'board-background',
      })
      .fetch()
      .map(att => ({
        _id: att._id,
        name: att.name,
        link: generateUniversalAttachmentUrl(att._id),
      }));
  },
  isActiveBackground() {
    const board = Utils.getCurrentBoard();
    return board && board.backgroundImageId === this._id;
  },
});

Template.boardBackgroundsPopup.events({
  'click .js-bg-upload-button'(event, tpl) {
    event.preventDefault();
    tpl.find('.js-bg-upload-input').click();
  },
  async 'change .js-bg-upload-input'(event, tpl) {
    const file = event.currentTarget.files && event.currentTarget.files[0];
    if (!file) return;
    tpl.error.set('');
    tpl.uploading.set(true);
    const uploader = await Attachments.insertAsync(
      {
        file,
        chunkSize: 'dynamic',
        meta: { boardId: tpl.boardId, source: 'board-background' },
      },
      false,
    );
    uploader.on('end', (err) => {
      tpl.uploading.set(false);
      if (err) tpl.error.set(err.reason || 'upload-failed');
    });
    uploader.on('error', (err) => {
      tpl.uploading.set(false);
      tpl.error.set((err && err.reason) || 'upload-failed');
    });
    uploader.start();
    // allow re-selecting the same file later
    event.currentTarget.value = '';
  },
  async 'click .js-set-board-background'() {
    const board = Utils.getCurrentBoard();
    await board.setBackgroundImage(this._id);
    Utils.setBackgroundImage();
  },
  'click .js-delete-board-background': Popup.afterConfirm('deleteBoardBackground', function () {
    Meteor.call('removeBoardBackground', this._id);
    Popup.back();
  }),
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
  cardAging() {
    const tpl = Template.instance();
    return tpl.currentBoard.cardAging;
  },
  cardAgingDays1() {
    return Template.instance().currentBoard.cardAgingDays1 ?? 7;
  },
  cardAgingDays2() {
    return Template.instance().currentBoard.cardAgingDays2 ?? 14;
  },
  cardAgingDays3() {
    return Template.instance().currentBoard.cardAgingDays3 ?? 28;
  },
  allowsBoardMemberList() {
    const tpl = Template.instance();
    return tpl.currentBoard.allowsBoardMemberList;
  },
  allowsPersonalListWidth() {
    const tpl = Template.instance();
    return tpl.currentBoard.allowsPersonalListWidth;
  },
});

Template.boardInfoOnMyBoardsPopup.events({
  'click .js-field-has-personal-list-width'(evt, tpl) {
    // #6409: toggle whether list widths are shared (board default, everyone
    // sees the same) or personal (per user).
    evt.preventDefault();
    tpl.currentBoard.allowsPersonalListWidth = !tpl.currentBoard
      .allowsPersonalListWidth;
    tpl.currentBoard.setAllowsPersonalListWidth(
      tpl.currentBoard.allowsPersonalListWidth,
    );
    $(`.js-field-has-personal-list-width ${MCB}`).toggleClass(
      CKCLS,
      tpl.currentBoard.allowsPersonalListWidth,
    );
    $('.js-field-has-personal-list-width').toggleClass(
      CKCLS,
      tpl.currentBoard.allowsPersonalListWidth,
    );
  },
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
  'click .js-field-has-cardaging'(evt, tpl) {
    evt.preventDefault();
    tpl.currentBoard.cardAging = !tpl.currentBoard.cardAging;
    tpl.currentBoard.setCardAging(tpl.currentBoard.cardAging);
    $(`.js-field-has-cardaging ${MCB}`).toggleClass(CKCLS, tpl.currentBoard.cardAging);
    $('.js-field-has-cardaging').toggleClass(CKCLS, tpl.currentBoard.cardAging);
  },
  'change .js-card-aging-days'(evt, tpl) {
    // #3984: save the three board-configurable card-aging day thresholds.
    const vals = $('.js-card-aging-days')
      .map((i, el) => parseInt(el.value, 10) || 0)
      .get();
    tpl.currentBoard.setCardAgingDays(vals[0], vals[1], vals[2]);
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
  // Same reactive-snapshot fix as boardCardSettingsPopup (#6385): the
  // allowsSubtasks toggle reads tpl.currentBoard, so keep it current in an
  // autorun so the setting can be reversed without a page refresh.
  this.autorun(() => {
    this.currentBoard = Utils.getCurrentBoard();
  });
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
    // The landing list belongs to the configured deposit board
    // (subtasksDefaultBoardId), which may differ from the current board
    // (#3414): when a different deposit board is chosen, show its lists.
    const depositBoardId =
      tpl.currentBoard.subtasksDefaultBoardId || tpl.currentBoard._id;
    return ReactiveCache.getLists(
      {
        boardId: depositBoardId,
        archived: false,
      },
      {
        sort: ['title'],
      },
    );
  },
  hasLists() {
    const tpl = Template.instance();
    const depositBoardId =
      tpl.currentBoard.subtasksDefaultBoardId || tpl.currentBoard._id;
    const lists = ReactiveCache.getLists(
      {
        boardId: depositBoardId,
        archived: false,
      },
      {
        sort: ['title'],
      },
    );
    return lists.length > 0;
  },
  isListSelected() {
    // #3876 / #4947: the selected landing list must be compared against
    // subtasksDefaultListId (the stored list id), NOT subtasksDefaultBoardId.
    const tpl = Template.instance();
    return tpl.currentBoard.subtasksDefaultListId === Template.currentData()._id;
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
    // #4849: changing the deposit board makes any previously-stored landing
    // list (which belongs to the old board) stale and would otherwise
    // override the new board's setting. Reset it so the list dropdown for the
    // newly-selected board starts fresh.
    if (value !== tpl.currentBoard.subtasksDefaultBoardId) {
      tpl.currentBoard.setSubtasksDefaultListId(null);
    }
    tpl.currentBoard.setSubtasksDefaultBoardId(value);
    evt.preventDefault();
  },
  'change .js-field-deposit-list'(evt, tpl) {
    let value = evt.target.value;
    if (value === 'null' || value === '') {
      value = null;
    }
    tpl.currentBoard.setSubtasksDefaultListId(value);
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
  // Keep currentBoard reactive. The toggle handlers compute the new value from
  // tpl.currentBoard.allowsX, so a one-time snapshot went stale after the first
  // toggle: reversing a setting (e.g. "Mark as complete") recomputed !oldValue
  // and never switched back until the page was refreshed (#6385). Re-reading the
  // board in an autorun keeps it current, so every Card Settings toggle works
  // both ways without a refresh.
  this.autorun(() => {
    this.currentBoard = Utils.getCurrentBoard();
  });
});

Template.boardCardSettingsPopup.helpers({
  allowsReceivedDate() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.allowsReceivedDate : false;
  },
  allowsDueComplete() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.allowsDueComplete : false;
  },
  allowsDueCompleteOnMinicard() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.allowsDueCompleteOnMinicard : false;
  },
  allowsReceivedDateOnMinicard() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return getMinicardSetting(currentBoard, 'allowsReceivedDateOnMinicard', 'allowsReceivedDate', true);
  },
  allowsStartDate() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.allowsStartDate : false;
  },
  allowsStartDateOnMinicard() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return getMinicardSetting(currentBoard, 'allowsStartDateOnMinicard', 'allowsStartDate', true);
  },
  allowsDueDate() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.allowsDueDate : false;
  },
  allowsDueDateOnMinicard() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return getMinicardSetting(currentBoard, 'allowsDueDateOnMinicard', 'allowsDueDate', true);
  },
  allowsEndDate() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.allowsEndDate : false;
  },
  allowsEndDateOnMinicard() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return getMinicardSetting(currentBoard, 'allowsEndDateOnMinicard', 'allowsEndDate', true);
  },
  allowsSubtasks() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.allowsSubtasks : false;
  },
  allowsSubtasksOnMinicard() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return getMinicardSetting(currentBoard, 'allowsSubtasksOnMinicard', 'allowsSubtasks', true);
  },
  allowsCreator() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? (currentBoard.allowsCreator ?? false) : false;
  },
  allowsCreatorOnMinicard() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return getMinicardSetting(currentBoard, 'allowsCreatorOnMinicard', 'allowsCreator', false);
  },
  allowsMembers() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.allowsMembers : false;
  },
  allowsMembersOnMinicard() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return getMinicardSetting(currentBoard, 'allowsMembersOnMinicard', 'allowsMembers', true);
  },
  allowsAssignee() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.allowsAssignee : false;
  },
  allowsAssigneeOnMinicard() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return getMinicardSetting(currentBoard, 'allowsAssigneeOnMinicard', 'allowsAssignee', true);
  },
  allowsAssignedBy() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.allowsAssignedBy : false;
  },
  allowsAssignedByOnMinicard() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return getMinicardSetting(currentBoard, 'allowsAssignedByOnMinicard', 'allowsAssignedBy', true);
  },
  allowsRequestedBy() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.allowsRequestedBy : false;
  },
  allowsRequestedByOnMinicard() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return getMinicardSetting(currentBoard, 'allowsRequestedByOnMinicard', 'allowsRequestedBy', true);
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
  allowsLabelsOnMinicard() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return getMinicardSetting(currentBoard, 'allowsLabelsOnMinicard', 'allowsLabels', true);
  },
  allowsShowListsOnMinicard() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return getMinicardSetting(currentBoard, 'allowsShowListsOnMinicard', 'allowsShowLists', false);
  },
  allowsChecklists() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.allowsChecklists : false;
  },
  allowsChecklistsOnMinicard() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return getMinicardSetting(currentBoard, 'allowsChecklistsOnMinicard', 'allowsChecklists', true);
  },
  // #6431: compact checklist count badge on minicard, opt-in and OFF by default.
  allowsChecklistCountBadgeOnMinicard() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.allowsChecklistCountBadgeOnMinicard : false;
  },
  // #6431 follow-up: new opt-in (OFF by default) card-side options.
  allowsChecklistCountBadgeOnCard() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.allowsChecklistCountBadgeOnCard : false;
  },
  allowsAttachmentCountOnCard() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.allowsAttachmentCountOnCard : false;
  },
  allowsCoverAttachmentOnCard() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.allowsCoverAttachmentOnCard : false;
  },
  allowsAttachments() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.allowsAttachments : false;
  },
  allowsAttachmentsOnMinicard() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return getMinicardSetting(currentBoard, 'allowsAttachmentsOnMinicard', 'allowsAttachments', true);
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
  allowsCardNumberOnMinicard() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return getMinicardSetting(currentBoard, 'allowsCardNumberOnMinicard', 'allowsCardNumber', false);
  },
  allowsDescriptionTitle() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.allowsDescriptionTitle : false;
  },
  allowsDescriptionTitleOnMinicard() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return getMinicardSetting(currentBoard, 'allowsDescriptionTitleOnMinicard', 'allowsDescriptionTitle', true);
  },
  allowsDescriptionText() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.allowsDescriptionText : false;
  },
  isBoardSelected() {
    const boardId = Session.get('currentBoard');
    const currentBoard = ReactiveCache.getBoard(boardId);
    return currentBoard ? currentBoard.dateSettingsDefaultBoardId : false;
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
    return getMinicardSetting(currentBoard, 'allowsDescriptionTextOnMinicard', 'allowsDescriptionText', false);
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
    return getMinicardSetting(currentBoard, 'allowsCardSortingByNumberOnMinicard', 'allowsCardSortingByNumber', false);
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
  'click .js-field-has-duecomplete'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsDueComplete;
    Boards.update(tpl.currentBoard._id, { $set: { allowsDueComplete: newValue } });
  },
  'click .js-field-has-duecomplete-on-minicard'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsDueCompleteOnMinicard;
    Boards.update(tpl.currentBoard._id, { $set: { allowsDueCompleteOnMinicard: newValue } });
  },
  'click .js-field-has-receiveddate-on-minicard'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsReceivedDateOnMinicard;
    Boards.update(tpl.currentBoard._id, { $set: { allowsReceivedDateOnMinicard: newValue } });
  },
  'click .js-field-has-startdate'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsStartDate;
    Boards.update(tpl.currentBoard._id, { $set: { allowsStartDate: newValue } });
  },
  'click .js-field-has-startdate-on-minicard'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsStartDateOnMinicard;
    Boards.update(tpl.currentBoard._id, { $set: { allowsStartDateOnMinicard: newValue } });
  },
  'click .js-field-has-enddate'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsEndDate;
    Boards.update(tpl.currentBoard._id, { $set: { allowsEndDate: newValue } });
  },
  'click .js-field-has-enddate-on-minicard'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsEndDateOnMinicard;
    Boards.update(tpl.currentBoard._id, { $set: { allowsEndDateOnMinicard: newValue } });
  },
  'click .js-field-has-duedate'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsDueDate;
    Boards.update(tpl.currentBoard._id, { $set: { allowsDueDate: newValue } });
  },
  'click .js-field-has-duedate-on-minicard'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsDueDateOnMinicard;
    Boards.update(tpl.currentBoard._id, { $set: { allowsDueDateOnMinicard: newValue } });
  },
  'click .js-field-has-subtasks'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsSubtasks;
    Boards.update(tpl.currentBoard._id, { $set: { allowsSubtasks: newValue } });
  },
  'click .js-field-has-subtasks-on-minicard'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsSubtasksOnMinicard;
    Boards.update(tpl.currentBoard._id, { $set: { allowsSubtasksOnMinicard: newValue } });
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
  'click .js-field-has-members-on-minicard'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsMembersOnMinicard;
    Boards.update(tpl.currentBoard._id, { $set: { allowsMembersOnMinicard: newValue } });
  },
  'click .js-field-has-assignee'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsAssignee;
    Boards.update(tpl.currentBoard._id, { $set: { allowsAssignee: newValue } });
  },
  'click .js-field-has-assignee-on-minicard'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsAssigneeOnMinicard;
    Boards.update(tpl.currentBoard._id, { $set: { allowsAssigneeOnMinicard: newValue } });
  },
  'click .js-field-has-assigned-by'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsAssignedBy;
    Boards.update(tpl.currentBoard._id, { $set: { allowsAssignedBy: newValue } });
  },
  'click .js-field-has-assigned-by-on-minicard'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsAssignedByOnMinicard;
    Boards.update(tpl.currentBoard._id, { $set: { allowsAssignedByOnMinicard: newValue } });
  },
  'click .js-field-has-requested-by'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsRequestedBy;
    Boards.update(tpl.currentBoard._id, { $set: { allowsRequestedBy: newValue } });
  },
  'click .js-field-has-requested-by-on-minicard'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsRequestedByOnMinicard;
    Boards.update(tpl.currentBoard._id, { $set: { allowsRequestedByOnMinicard: newValue } });
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
  'click .js-field-has-labels-on-minicard'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsLabelsOnMinicard;
    Boards.update(tpl.currentBoard._id, { $set: { allowsLabelsOnMinicard: newValue } });
  },
  'click .js-field-has-card-show-lists-on-minicard'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsShowListsOnMinicard;
    Boards.update(tpl.currentBoard._id, { $set: { allowsShowListsOnMinicard: newValue } });
  },
  'click .js-field-has-description-title'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsDescriptionTitle;
    Boards.update(tpl.currentBoard._id, { $set: { allowsDescriptionTitle: newValue } });
  },
  'click .js-field-has-description-title-on-minicard'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsDescriptionTitleOnMinicard;
    Boards.update(tpl.currentBoard._id, { $set: { allowsDescriptionTitleOnMinicard: newValue } });
  },
  'click .js-field-has-card-number'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsCardNumber;
    Boards.update(tpl.currentBoard._id, { $set: { allowsCardNumber: newValue } });
  },
  'click .js-field-has-card-number-on-minicard'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsCardNumberOnMinicard;
    Boards.update(tpl.currentBoard._id, { $set: { allowsCardNumberOnMinicard: newValue } });
  },
  'click .js-field-has-description-text-on-minicard'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsDescriptionTextOnMinicard;
    Boards.update(tpl.currentBoard._id, { $set: { allowsDescriptionTextOnMinicard: newValue } });
  },
  'click .js-field-has-description-text'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsDescriptionText;
    Boards.update(tpl.currentBoard._id, { $set: { allowsDescriptionText: newValue } });
  },
  'click .js-field-has-checklists'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsChecklists;
    Boards.update(tpl.currentBoard._id, { $set: { allowsChecklists: newValue } });
  },
  'click .js-field-has-checklists-on-minicard'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsChecklistsOnMinicard;
    Boards.update(tpl.currentBoard._id, { $set: { allowsChecklistsOnMinicard: newValue } });
  },
  'click .js-field-has-checklist-count-on-minicard'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsChecklistCountBadgeOnMinicard;
    Boards.update(tpl.currentBoard._id, { $set: { allowsChecklistCountBadgeOnMinicard: newValue } });
  },
  'click .js-field-has-checklist-count'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsChecklistCountBadgeOnCard;
    Boards.update(tpl.currentBoard._id, { $set: { allowsChecklistCountBadgeOnCard: newValue } });
  },
  'click .js-field-has-attachment-count'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsAttachmentCountOnCard;
    Boards.update(tpl.currentBoard._id, { $set: { allowsAttachmentCountOnCard: newValue } });
  },
  'click .js-field-has-cover-attachment-on-card'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsCoverAttachmentOnCard;
    Boards.update(tpl.currentBoard._id, { $set: { allowsCoverAttachmentOnCard: newValue } });
  },
  'click .js-field-has-attachments'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsAttachments;
    Boards.update(tpl.currentBoard._id, { $set: { allowsAttachments: newValue } });
  },
  'click .js-field-has-attachments-on-minicard'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsAttachmentsOnMinicard;
    Boards.update(tpl.currentBoard._id, { $set: { allowsAttachmentsOnMinicard: newValue } });
  },
  'click .js-field-has-comments'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsComments;
    Boards.update(tpl.currentBoard._id, { $set: { allowsComments: newValue } });
  },
  'click .js-field-has-activities'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsActivities;
    Boards.update(tpl.currentBoard._id, { $set: { allowsActivities: newValue } });
  },
  'click .js-field-has-cover-attachment-on-minicard'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsCoverAttachmentOnMinicard;
    Boards.update(tpl.currentBoard._id, { $set: { allowsCoverAttachmentOnMinicard: newValue } });
  },
  'click .js-field-has-badge-attachment-on-minicard'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsBadgeAttachmentOnMinicard;
    Boards.update(tpl.currentBoard._id, { $set: { allowsBadgeAttachmentOnMinicard: newValue } });
  },
  'click .js-field-has-card-sorting-by-number-on-minicard'(evt, tpl) {
    evt.preventDefault();
    const newValue = !tpl.currentBoard.allowsCardSortingByNumberOnMinicard;
    Boards.update(tpl.currentBoard._id, { $set: { allowsCardSortingByNumberOnMinicard: newValue } });
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

// #5850: free-form "share board with an email domain" popups. Unlike orgs/teams
// (which are a managed collection shown in a <select>), the owner simply types a
// domain such as example.com.
Template.addBoardDomainPopup.onCreated(function() {
  this.error = new ReactiveVar('');

  this.setError = function(error) {
    this.error.set(error);
  };
});

Template.addBoardDomainPopup.helpers({
  error() {
    return { get: () => Template.instance().error.get() };
  },
});

Template.addBoardDomainPopup.events({
  'keyup input'(event, tpl) {
    tpl.setError('');
  },
  'submit .js-add-board-domain'(event, tpl) {
    event.preventDefault();
    const input = document.getElementById('jsBoardDomainInput');
    const domain = (input ? input.value : '').trim().toLowerCase();

    // Basic validation: must contain a '.', and no '@' or whitespace.
    if (
      domain.length === 0 ||
      domain.indexOf('.') < 0 ||
      domain.indexOf('@') >= 0 ||
      /\s/.test(domain)
    ) {
      tpl.setError('invalid-domain');
      return;
    }

    const currentBoard = Utils.getCurrentBoard();
    const boardDomains = [];
    if (currentBoard.domains !== undefined) {
      for (let i = 0; i < currentBoard.domains.length; i++) {
        boardDomains.push(currentBoard.domains[i]);
      }
    }

    if (!boardDomains.some(d => d.domain === domain)) {
      boardDomains.push({
        domain,
        isActive: true,
      });
      Meteor.call('setBoardDomains', boardDomains, currentBoard._id);
    }

    Popup.back();
  },
});

Template.removeBoardDomainPopup.events({
  'keyup input'(event, tpl) {
    // no-op, kept for parity with the org/team remove popups
  },
  'click #leaveBoardDomainBtn'(){
    const stringDomain = document.getElementById('hideDomain').value;
    const currentBoard = Utils.getCurrentBoard();
    const boardDomains = [];
    if (currentBoard.domains !== undefined) {
      for (let i = 0; i < currentBoard.domains.length; i++) {
        if (currentBoard.domains[i].domain != stringDomain) {
          boardDomains.push(currentBoard.domains[i]);
        }
      }
    }

    Meteor.call('setBoardDomains', boardDomains, currentBoard._id);

    Popup.back();
  },
  'click #cancelLeaveBoardDomainBtn'(){
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
