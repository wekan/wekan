import { ReactiveVar } from 'meteor/reactive-var';
import { EscapeActions } from '/client/lib/escapeActions';

// Whether the shared page sidebar is open.
//
// Module scope, not a template instance: the header that opens it and the
// sidebar itself are separate Blaze instances - the header is rendered by the
// layout, the sidebar into the page - so an instance ReactiveVar on either is
// invisible to the other. Same reason as client/lib/allBoardsSidebar.js.
//
// docs/Features/Page/Header.md

const openVar = new ReactiveVar(false);

export function isPageSidebarOpen() {
  return openVar.get();
}

export function openPageSidebar() {
  openVar.set(true);
}

export function closePageSidebar() {
  openVar.set(false);
}

export function togglePageSidebar() {
  openVar.set(!openVar.get());
}

// Escape closes it, by KEY only: `enabledOnClick` defaults to true, and then
// every click would close it - including the clicks on its own controls, and
// the click on the hamburger that had just opened it.
EscapeActions.register(
  'sidebarView',
  () => closePageSidebar(),
  () => isPageSidebarOpen(),
  { enabledOnClick: false },
);
