import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { ReactiveCache } from '/imports/reactiveCache';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import Announcements, {
  announcementVersion,
  shouldShowAnnouncement,
} from '/models/announcements';
import { Utils } from '/client/lib/utils';
// What this bar calls the page you are on. models/lib/pageTitles.js
import { headerTitle } from '/models/lib/pageTitles';
// The right sidebar the hamburger opens. On a board that is the board's own; on
// every other page it is the shared page sidebar.
import { getSidebarInstance } from '/client/features/sidebar/service';
import { toggleAllBoardsSidebar } from '/client/lib/allBoardsSidebar';
import { togglePageSidebar } from '/client/lib/pageSidebar';
import { hasOwnSidebar, hasPageSidebar } from '/models/lib/pageSidebar';
import { ADMIN_PANEL_ROUTES } from '/models/lib/adminUrls';
// The All Boards sections - Public has no Lists/Table choice, so it is not one.
const ALL_BOARDS_VIEW_ROUTES = ['home', 'allboards', 'allboards-templates', 'allboards-remaining'];
// Three pages carry a name of their own rather than a fixed one: an admin can
// rename Support and Accessibility, and Import names the source it is importing
// from. Asked for here rather than computed a second time.
import { supportPageTitle } from '/client/components/main/support';
import { accessibilityPageTitle } from '/client/components/main/accessibility';
import { importPageTitle } from '/client/components/import/import';

function customPageTitle(routeName) {
  if (routeName === 'support') return supportPageTitle();
  if (routeName === 'accessibility') return accessibilityPageTitle();
  if (routeName === 'import') return importPageTitle();
  return '';
}
// Drag-to-scroll on the two top header bars (they are not scroll containers
// themselves, so the drag is forwarded to the board canvas / page scroller).
import '/client/lib/headerDragscroll';

Meteor.subscribe('user-admin');
Meteor.subscribe('boards');
Meteor.subscribe('setting');
Meteor.subscribe('announcements');
Template.header.onCreated(function () {
  const templateInstance = this;
  templateInstance.currentSetting = new ReactiveVar();
  templateInstance.isLoading = new ReactiveVar(false);

  Meteor.subscribe('setting', {
    onReady() {
      templateInstance.currentSetting.set(ReactiveCache.getCurrentSetting());
      let currSetting = templateInstance.currentSetting.curValue;
      if (
        currSetting &&
        currSetting !== undefined &&
        currSetting.customLoginLogoImageUrl !== undefined &&
        document.getElementById('headerIsSettingDatabaseCallDone') != null
      )
        document.getElementById(
          'headerIsSettingDatabaseCallDone',
        ).style.display = 'none';
      else if (
        document.getElementById('headerIsSettingDatabaseCallDone') != null
      )
        document.getElementById(
          'headerIsSettingDatabaseCallDone',
        ).style.display = 'block';
      return this.stop();
    },
  });
});
Template.header.helpers({
  // The page's title, beside the house icon. A board's own title wherever there
  // is a board; otherwise the page's, by route name. Two helpers rather than
  // one string, because a translated title has to go through {{_ }} and a board
  // title must NOT (it is user text, and a board called "settings" is not the
  // Admin Panel). docs/Design/Page/Header.md
  // Which page's view menu to draw, if any.
  isBoardPage() {
    return Boolean(Utils.getCurrentBoardId());
  },
  isAllBoardsPage() {
    return ALL_BOARDS_VIEW_ROUTES.includes(FlowRouter.getRouteName());
  },

  // The Admin Panel is four routes; its tabs show on all of them.
  isAdminPanel() {
    return ADMIN_PANEL_ROUTES.includes(FlowRouter.getRouteName());
  },

  // Whether to draw the hamburger at all. A page with no sidebar and nothing to
  // put in one must not offer a control that opens an empty panel.
  hasSidebar() {
    const route = FlowRouter.getRouteName();
    return Boolean(Utils.getCurrentBoardId()) || hasOwnSidebar(route) || hasPageSidebar(route);
  },

  headerTitleKey() {
    const route = FlowRouter.getRouteName();
    const board = Utils.getCurrentBoard();
    return headerTitle(route, board && board.title, customPageTitle(route)).key || '';
  },
  headerTitleText() {
    const route = FlowRouter.getRouteName();
    const board = Utils.getCurrentBoard();
    return headerTitle(route, board && board.title, customPageTitle(route)).title || '';
  },

  wrappedHeader() {
    return !Session.get('currentBoard');
  },

  hideLogo() {
    return Utils.isMiniScreen() && Session.get('currentBoard');
  },

  appIsOffline() {
    const status = Meteor.status();
    return ['waiting', 'failed', 'offline'].includes(status.status);
  },

  appOfflineMessage() {
    const status = Meteor.status();

    if (status.status === 'failed' && status.reason) {
      return status.reason;
    }

    if (status.status === 'offline') {
      return 'Connection is paused.';
    }

    return null;
  },

  canReconnectNow() {
    const status = Meteor.status();
    return ['waiting', 'failed', 'offline'].includes(status.status);
  },

  hasAnnouncement() {
    const announcement = Announcements.findOne();
    if (!announcement || !announcement.enabled) {
      return false;
    }
    const version = announcementVersion(announcement);
    const user = Meteor.user();
    const dismissedVersion =
      (user && user.profile && user.profile.dismissedAnnouncementVersion) || null;
    return shouldShowAnnouncement({
      enabled: announcement.enabled,
      version,
      dismissedVersion,
    });
  },

  announcement() {
    $('.announcement').show();
    const announcement = Announcements.findOne();
    return announcement && announcement.body;
  },

  mobileMode() {
    const sessionMode = Session.get('wekan-mobile-mode');
    if (sessionMode !== undefined) {
      return sessionMode;
    }
    return Utils.getMobileMode();
  },
});

Template.header.events({
  // The one hamburger, in the bar that is always on screen. Which sidebar it
  // toggles depends on where you are: a board has its own, and every other page
  // shares one. docs/Design/Page/Header.md
  'click .js-toggle-page-sidebar'(evt) {
    evt.preventDefault();
    const boardSidebar = Utils.getCurrentBoardId() ? getSidebarInstance() : null;
    if (boardSidebar && typeof boardSidebar.toggle === 'function') {
      boardSidebar.toggle();
      return;
    }
    // All Boards and Public keep their own; every other page shares one.
    if (hasOwnSidebar(FlowRouter.getRouteName())) {
      toggleAllBoardsSidebar();
      return;
    }
    togglePageSidebar();
  },
  'click .js-create-board': Popup.open('headerBarCreateBoard'),
  'click .js-mobile-mode-toggle'() {
    const currentMode = Utils.getMobileMode();
    Utils.setMobileMode(!currentMode);
  },
  'click .js-open-bookmarks'(evt) {
    // Already added but ensure single definition -- safe guard
  },
  'click .js-close-announcement'() {
    $('.announcement').hide();
    // Permanently dismiss the current announcement for this user (#6051).
    // The banner reappears only when the admin changes the announcement text.
    Meteor.call('dismissAnnouncement', (err) => {
      if (err && process.env.DEBUG === 'true') {
        console.error('dismissAnnouncement error', err);
      }
    });
  },
  'click .js-select-list'() {
    Session.set('currentList', this._id);
    Session.set('currentCard', null);
  },
  'click .js-toggle-desktop-drag-handles'() {
    // Toggle the EFFECTIVE state and store it EXPLICITLY, so the choice sticks on
    // a touch screen too. Storing "off" as a real `false` (rather than removing
    // the setting) is what lets Utils.showDragHandles() tell "turned off" apart
    // from "never chosen", which is the only reason the toggle could not hide the
    // handles on a touch device.
    const show = !Utils.showDragHandles();
    const currentUser = Meteor.user();
    if (currentUser) {
      Meteor.call('toggleDesktopDragHandles', show);
    } else {
      window.localStorage.setItem('showDesktopDragHandles', show ? 'true' : 'false');
      location.reload();
    }
  },
  'click .js-open-bookmarks'(evt) {
    // Desktop: open popup, Mobile: route to page
    if (Utils.isMiniScreen()) {
      FlowRouter.go('bookmarks');
    } else {
      Popup.open('bookmarks')(evt);
    }
  },
});

Template.offlineWarning.events({
  'click a.app-try-reconnect'(event) {
    event.preventDefault();
    Meteor.reconnect();
  },
});
