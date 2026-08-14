import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { caretClassFor } from '/client/lib/sectionCaret';

// Which folding sections of the board's chrome are open.
//
// The same idea as an opened card's sections: the heading (or, in the header
// bar, a caret button of its own) is the handle, a caret says which way it is,
// and clicking it folds what belongs to it. Three of them so far:
//
//   'members'         the right sidebar's People / Organizations / Teams /
//                     Domains tabs and the avatars in them
//   'labels'          the right sidebar's labels, and the + that creates one
//   'board-controls'  the first header bar's board controls - Private, Muted,
//                     Sort Cards, Filter, Search, Show dependencies,
//                     Multi-Selection
//
// Module-level, so a fold survives closing and reopening the sidebar and moving
// to another board in the same session - somebody who folded Members away did
// not mean "on this board only". Unknown keys default to OPEN, so a section
// added later shows up rather than hides.
//
// Activities is NOT here: it has a stored board setting of its own
// (`board.showActivities`), which also decides what the publication sends, so
// its caret writes that instead. client/components/sidebar/sidebar.js
const foldState = new ReactiveDict();

export function isFoldOpen(key) {
  const state = foldState.get(key);
  return state === undefined ? true : state;
}

export function toggleFold(key) {
  if (!key) return;
  foldState.set(key, !isFoldOpen(key));
}

Template.registerHelper('isFoldOpen', isFoldOpen);
Template.registerHelper('foldCaret', key => caretClassFor(isFoldOpen(key)));
