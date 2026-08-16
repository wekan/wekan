import { ReactiveVar } from 'meteor/reactive-var';
const {
  VIEWS,
  STORAGE_KEY,
  normalizeAllBoardsView,
  resolveAllBoardsView,
} = require('/models/lib/allBoardsView');

// The state the All Boards controls share, and where the view choice is kept.
// Design: docs/Features/Page/All-Boards.md
//
// The controls live in `boardListHeaderBar` and the boards live in `boardList`.
// Those are two SEPARATE Blaze template instances - the header bar is rendered
// into the layout's headerBar region, the page into its content region - so a
// ReactiveVar on either instance is invisible to the other. The state they share
// lives here instead, at module scope, which is what lets the search field in the
// header bar filter the list in the page.
//
// Which views exist and which is the default is models/lib/allBoardsView.js: that
// part is pure and unit-tested, this part is the Meteor and browser glue.

// Remembered per BROWSER, not on the user document: it is a view preference for
// one page, it changes nothing anybody else can see, and it is not worth a
// profile field or a round trip. A board's view IS on the profile, because it
// follows the user between devices; this deliberately does not.
const viewVar = new ReactiveVar(null);

function readStoredView() {
  try {
    return normalizeAllBoardsView(window.localStorage.getItem(STORAGE_KEY));
  } catch (e) {
    return null; // private mode, or storage disabled
  }
}

export function allBoardsView() {
  return resolveAllBoardsView(viewVar.get() || readStoredView());
}

export function setAllBoardsView(view) {
  if (!VIEWS.includes(view)) return;
  viewVar.set(view);
  try {
    window.localStorage.setItem(STORAGE_KEY, view);
  } catch (e) {
    /* the choice still applies for this session */
  }
}

export function isAllBoardsView(view) {
  return allBoardsView() === view;
}

// The search term and the selected section, shared for the same reason: the
// controls are in the header bar and the boards they act on are in the page.
//
// Exported as the ReactiveVars themselves, not behind getters, because
// `boardList` assigns them onto its own instance (`this.boardSearchVar = …`) -
// so every `tpl.boardSearchVar.get()` already written against an instance
// variable keeps working, and the two templates read one object instead of two.
export const allBoardsSearchVar = new ReactiveVar('');
export const allBoardsMenuVar = new ReactiveVar('starred');

export function allBoardsSearch() {
  return allBoardsSearchVar.get();
}

export function setAllBoardsSearch(term) {
  allBoardsSearchVar.set(typeof term === 'string' ? term : '');
}
