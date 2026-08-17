import { ReactiveVar } from 'meteor/reactive-var';
import { EscapeActions } from '/client/lib/escapeActions';
import { BoardMultiSelection } from '/client/lib/boardMultiSelection';
const {
  DEFAULT_SIDEBAR_VIEW,
  SIDEBAR_MULTISELECTION,
  resolveSidebarView,
} = require('/models/lib/allBoardsSidebar');

// Whether the All Boards right sidebar is open, and on which view.
//
// Two variables rather than "view or null", because closing must not forget
// where you were: open the sidebar with the hamburger after searching and you
// get the search you had, not an empty home. The board sidebar keeps its view
// across open/close for the same reason.
//
// Module scope, not a template instance: the header bar that opens the sidebar
// and the sidebar itself are separate Blaze instances - the bar is rendered
// into the layout's headerBar region - so an instance ReactiveVar on either is
// invisible to the other. Same reason as client/lib/allBoardsView.js.
//
// docs/Features/Page/Search.md, docs/Features/Page/Multi-Selection.md

const openVar = new ReactiveVar(false);
const viewVar = new ReactiveVar(DEFAULT_SIDEBAR_VIEW);

export function allBoardsSidebarView() {
  return resolveSidebarView(viewVar.get());
}

export function isAllBoardsSidebarOpen() {
  return openVar.get();
}

export function isAllBoardsSidebarView(view) {
  return openVar.get() && allBoardsSidebarView() === view;
}

// Open on a view. Asking for the view that is already showing while the sidebar
// is open closes it again, so the header-bar button that opened it also shuts
// it - which is what a pressed-looking button should do.
export function openAllBoardsSidebar(view) {
  // Selection mode is operated from this panel. Letting another control hide
  // it, or replace it with Search/Home, leaves checked boards on the page with
  // no visible way to act on them or turn the mode off.
  if (BoardMultiSelection.isActive()) {
    viewVar.set(SIDEBAR_MULTISELECTION);
    openVar.set(true);
    return;
  }
  const next = resolveSidebarView(view);
  if (openVar.get() && allBoardsSidebarView() === next) {
    closeAllBoardsSidebar();
    return;
  }
  viewVar.set(next);
  openVar.set(true);
}

export function closeAllBoardsSidebar() {
  if (BoardMultiSelection.isActive()) {
    viewVar.set(SIDEBAR_MULTISELECTION);
    openVar.set(true);
    return;
  }
  openVar.set(false);
}

export function toggleAllBoardsSidebar() {
  if (openVar.get()) closeAllBoardsSidebar();
  else openVar.set(true);
}

// Escape closes it, at the same level as the board sidebar's own view - so one
// Escape leaves the sidebar and the next one is free for whatever is behind it.
//
// The KEY only: `enabledOnClick` defaults to true, which would also run this
// from the global click handler, and then every click closed the sidebar -
// including clicks on its own contents, and including the header-bar button
// that had just opened it.
EscapeActions.register(
  'sidebarView',
  () => closeAllBoardsSidebar(),
  () => isAllBoardsSidebarOpen(),
  { enabledOnClick: false },
);
