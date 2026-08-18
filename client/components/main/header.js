import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import Announcements, {
  announcementVersion,
  shouldShowAnnouncement,
} from '/models/announcements';
import { Utils } from '/client/lib/utils';
// What this bar calls the page you are on. models/lib/pageTitles.js
import { headerTitle } from '/models/lib/pageTitles';
// The bookmark rules. docs/Features/Board/Starred.md
import { isStarrablePageUrl } from '/models/lib/starredPages';
import { headerPathVar } from '/client/lib/headerPathVar';
// The right sidebar the hamburger opens. On a board that is the board's own; on
// every other page it is the shared page sidebar.
import { getSidebarInstance } from '/client/features/sidebar/service';
import { toggleAllBoardsSidebar } from '/client/lib/allBoardsSidebar';
import { togglePageSidebar } from '/client/lib/pageSidebar';
import { hasOwnSidebar, hasPageSidebar, hasHamburger } from '/models/lib/pageSidebar';
import {
  ADMIN_PAGE_KEYS,
  ADMIN_PAGES,
  ADMIN_PANEL_ROUTES,
  adminPaneTitle,
} from '/models/lib/adminUrls';
// All Boards is four lists of boards under one name, and a workspace is a tree
// under one of them. models/lib/allBoardsUrls.js
import {
  SECTION_WORKSPACES,
  resolveSection,
  sectionTitleKey,
  splitWorkspacePath,
  workspaceNamePath,
} from '/models/lib/allBoardsUrls';
// The same slugifier a board URL and a workspace URL are built with.
import getSlug from 'limax';
// The All Boards sections - Public has no Lists/Table choice, so it is not one.
const ALL_BOARDS_VIEW_ROUTES = ['home', 'allboards', 'allboards-templates', 'allboards-remaining'];
// Three pages carry a name of their own rather than a fixed one: an admin can
// rename Support and Accessibility, and Import names the source it is importing
// from. Asked for here rather than computed a second time.
import {
  supportPageTitle,
  accessibilityPageTitle,
  importPageTitle,
} from '/client/lib/pageTitleSources';

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

  // Publish the page's path so the browser tab can carry it too. Here rather
  // than in `Utils`, because this is the one place that already works it out
  // and the header is on every page. client/lib/headerPathVar.js
  templateInstance.autorun(() => {
    headerPathVar.set(headerFullPath());
  });

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
  // Admin Panel). docs/Features/Page/Header.md
  // How many boards are starred, shown on the button the way a board's own star
  // shows its count. Nothing is shown when none are.
  // The button carries no star icon any more, so this number IS its label -
  // shown even at zero, or the button would be a bare caret with nothing to
  // say what it opens.
  starredBoardsCount() {
    const user = ReactiveCache.getCurrentUser();
    if (!user) return 0;
    // Boards AND pages: the group is one list of the places you keep, like a
    // browser's bookmarks, so a count that left the pages out would say 2 above
    // a dropdown showing five rows. docs/Features/Board/Starred.md
    const boards = user.starredBoards ? user.starredBoards() : [];
    const pages = user.starredPages ? user.starredPages() : [];
    return boards.length + pages.length;
  },

  // The star at the end of the group, on a page that is not a board: it stars
  // THIS PAGE. On a board the board's own star is drawn there instead - the
  // board is what you are looking at, and its star is the one that already
  // counts stars from every member.
  isPageStarrable() {
    if (Utils.getCurrentBoardId()) return false;
    return isStarrablePageUrl(currentPagePath());
  },

  isCurrentPageStarred() {
    const user = ReactiveCache.getCurrentUser();
    return Boolean(user && user.hasStarredPage && user.hasStarredPage(currentPagePath()));
  },

  // Which page's view menu to draw, if any.
  isBoardPage() {
    return Boolean(Utils.getCurrentBoardId());
  },
  // True when the title in this bar is a BOARD's title and the user may rename
  // it: the title text itself is then the rename button. The pencil that used
  // to sit beside it is gone - one thing to click, not two that did the same.
  canEditBoardTitle() {
    return Boolean(
      Utils.getCurrentBoardId() && ReactiveCache.getCurrentUser()?.isBoardAdmin(),
    );
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
    // All Boards has a sidebar but no hamburger: its controls are in this bar,
    // and Search and Multi-Selection open the sidebar into their own view. A
    // hamburger there would open a menu listing what is already one click away.
    if (!hasHamburger(route)) return false;
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
  // The whole path as ONE string, for the title's tooltip: "All Boards /
  // Starred", "Admin Panel / Settings / Version".
  //
  // The bar shows only the ROOT now. The path is what the page is, but it grows
  // - a workspace nests as deep as its tree does - and this bar is the one
  // strip always on screen and already short of width. The root names the
  // place; the tooltip carries the rest.
  //
  // Resolved here rather than in the template because a `title` attribute is
  // plain text: it cannot hold the `{{_ }}` calls the visible version used. A
  // workspace's own name still does NOT go through the translator.
  headerTitleFullPath() {
    return headerFullPath();
  },
});

// The whole path as ONE string: "All Boards / Starred", "Admin Panel /
// Settings / Version". A plain function, because both the tooltip helper and
// the browser tab need it and a Blaze helper cannot be called from outside its
// template.
function headerFullPath() {
  const route = FlowRouter.getRouteName();
  const board = Utils.getCurrentBoard();
  const title = headerTitle(route, board && board.title, customPageTitle(route));
  const root = title.key ? TAPi18n.__(title.key) : title.title;
  const parts = [root].concat(
    headerTitleTrailOf().map(part => (part.key ? TAPi18n.__(part.key) : part.title)),
  );
  return parts.filter(Boolean).join(' / ');
}

// The page's own address, relative - what a bookmark stores.
//
// From the ROUTER rather than from `window.location`, so it is reactive: the
// star has to turn hollow the moment you navigate away from a page you starred,
// and `window.location.pathname` is not something Blaze can watch.
//
// The query string comes with it. `/allboards/workspaces/engineering` and the
// same page with a filter on are two different things to bookmark, and dropping
// the query would silently star the wrong one.
function currentPagePath() {
  const current = FlowRouter.current();
  if (!current) return '';
  const path = current.path || '';
  return typeof path === 'string' ? path : '';
}

// The path after the page's own name: "Settings / Version" under Admin Panel,
// "Workspaces / Engineering / Backend" under All Boards.
//
// ONE list rather than a helper per segment, because the two pages that have a
// path do not have the same NUMBER of segments - the Admin Panel always has
// two, and a workspace has as many as its tree is deep. A fixed set of helpers
// can only serve whichever page was written first.
//
// Each entry is one of the two forms a left-menu entry has: `key` for something
// translated, `title` for text that must NOT go through the translator - a
// workspace's name is what the person typed, and a workspace called "starred"
// is not the Starred section.
//
// A plain function, not a helper: the tooltip needs it too, and a Blaze helper
// cannot call a sibling helper (`this` there is the data context).
//
// Read from the URL and from the user document, never from the pages
// themselves: the header is a separate Blaze instance, and importing a page
// module from here once ran it before its own template was registered, which
// threw and aborted every module after it.
function headerTitleTrailOf() {
    const route = FlowRouter.getRouteName();

    // A board's title is the whole name of that page, so there is no path.
    if (Utils.getCurrentBoardId()) return [];

    const page = ADMIN_PAGE_KEYS.find(k => ADMIN_PAGES[k].routeName === route);
    if (page) {
      const subKey = headerTitle(route).subKey;
      const params = FlowRouter.current().params || {};
      const pane = adminPaneTitle(page, params.pane || ADMIN_PAGES[page].defaultSlug);
      const trail = subKey ? [{ key: subKey }] : [];
      if (pane.titleKey) trail.push({ key: pane.titleKey });
      else if (pane.title) trail.push({ title: pane.title });
      return trail;
    }

    if (!ALL_BOARDS_VIEW_ROUTES.includes(route)) return [];
    const params = FlowRouter.current().params || {};
    const section = resolveSection(params.section);
    const trail = [{ key: sectionTitleKey(section) }];
    if (section !== SECTION_WORKSPACES) return trail;
    // The workspaces the URL walks through, by NAME. The tree is on the user
    // document, which is where the All Boards page reads it from too.
    const user = ReactiveCache.getCurrentUser();
    const tree = (user && user.profile && user.profile.boardWorkspacesTree) || [];
    for (const name of workspaceNamePath(tree, splitWorkspacePath(params.path), getSlug)) {
      trail.push({ title: name });
    }
    return trail;
}

Template.header.helpers({

  // Settings arrive after the header's first render. Keep an accessible name
  // on the stock logo during that short loading interval as well.
  headerLogoAlt() {
    return ReactiveCache.getCurrentSetting()?.productName || 'WeKan';
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
  // The starred boards, by name. They were listed inline in this bar; the bar
  // is one row now and the names are in the popup. docs/Features/Page/Header.md
  // Titled "Starred Boards", from the key the app already has for that phrase,
  // rather than a `starredBoardsPopup-title` of its own: the convention key
  // would be a second copy of one phrase in all 147 language files, English in
  // every one of them at first, so most languages would show English for
  // something they have already translated. A title also gives the popup its
  // header, and with it the close button - without one it renders as a
  // `no-title` pop-over with nothing to shut it but clicking away.
  'click .js-open-starred-boards': Popup.open('starredBoards', { titleKey: 'allboards.starred' }),

  // Rename the board by clicking its name. The popup is the EXISTING
  // `boardChangeTitlePopup` - the same form the pencil opened, with the title
  // and the description in it - so this changes only what you click to get
  // there. It is opened with the board as its data context, because this bar's
  // context is the page and not the board, and the form fills its fields from
  // `title` and `description`.
  'click .js-edit-board-title'(evt) {
    const board = Utils.getCurrentBoard();
    if (!board || !ReactiveCache.getCurrentUser()?.isBoardAdmin()) return;
    Popup.open('boardChangeTitle').call(board, evt);
  },

  // Star the page you are on, or unstar it. The title stored with it is the
  // one in the browser tab - "Product name - All Boards / Remaining" - because
  // that is what the dropdown lists, and a row saying `/allboards/remaining`
  // would make the reader parse a path to find out where it goes.
  'click .js-star-page'(evt) {
    evt.preventDefault();
    const url = currentPagePath();
    if (!isStarrablePageUrl(url)) return;
    Meteor.call('toggleStarredPage', url, document.title || url, (err) => {
      if (err) console.error(err);
    });
  },
  // The one hamburger, in the bar that is always on screen. Which sidebar it
  // toggles depends on where you are: a board has its own, and every other page
  // shares one. docs/Features/Page/Header.md
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

// The dropdown lists two kinds of thing, so "is it empty" is a question about
// both. Without this the "Star a board to add a shortcut" line was drawn under
// a list of starred pages, because the `each` it hung off only knew about
// boards. docs/Features/Board/Starred.md
Template.starredBoardsPopup.helpers({
  hasAnyStarred() {
    const user = ReactiveCache.getCurrentUser();
    if (!user) return false;
    const boards = user.starredBoards ? user.starredBoards() : [];
    const pages = user.starredPages ? user.starredPages() : [];
    return boards.length + pages.length > 0;
  },
});
