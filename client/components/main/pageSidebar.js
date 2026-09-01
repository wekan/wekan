import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import {
  isPageSidebarOpen,
  closePageSidebar,
} from '/client/lib/pageSidebar';
import { pageSidebarTemplate, hasPageSidebar } from '/models/lib/pageSidebar';
import { DEFAULT_GLOBAL_THEME_COLOR } from '/config/const';

// The shared page sidebar. docs/Design/Page/Header.md

Template.pageSidebar.helpers({
  // Drawn at all only where there is something to put in it: a panel that opens
  // empty is worse than no panel.
  hasPageSidebar() {
    return hasPageSidebar(FlowRouter.getRouteName());
  },
  isSidebarOpen() {
    return isPageSidebarOpen();
  },
  controlsTemplate() {
    return pageSidebarTemplate(FlowRouter.getRouteName());
  },
  // A themed thing outside a board, like the All Boards sidebar: without a
  // `.board-color-*` ancestor a `.sidebar-btn` is white text on light grey.
  themeClass() {
    return `board-color-${DEFAULT_GLOBAL_THEME_COLOR}`;
  },
});

Template.pageSidebar.events({
  'click .js-close-page-sidebar'(evt) {
    evt.preventDefault();
    closePageSidebar();
  },
});
