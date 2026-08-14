import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { caretClassFor } from '/client/lib/sectionCaret';

// Which sections of the board's right sidebar are open.
//
// The same idea as an opened card's sections: the heading is the button, a
// caret in front of it says which way it is, and clicking it folds what belongs
// to that heading. Members folds the People / Organizations / Teams / Domains
// tabs and the avatars in them; Labels folds the labels under it.
//
// Module-level, so it survives closing and reopening the sidebar and moving to
// another board in the same session - somebody who folded Members away did not
// mean "on this board only". Unknown sections default to OPEN, so a section
// added later shows up rather than hides.
//
// Activities is NOT here: it has a stored board setting of its own
// (`board.showActivities`), which also decides what the publication sends, so
// its caret writes that instead. client/components/sidebar/sidebar.js
const sidebarSectionState = new ReactiveDict();

export function isSidebarSectionOpen(section) {
  const state = sidebarSectionState.get(section);
  return state === undefined ? true : state;
}

export function toggleSidebarSection(section) {
  if (!section) return;
  sidebarSectionState.set(section, !isSidebarSectionOpen(section));
}

Template.registerHelper('isSidebarSectionOpen', isSidebarSectionOpen);
Template.registerHelper('sidebarSectionCaret', section =>
  caretClassFor(isSidebarSectionOpen(section)));
