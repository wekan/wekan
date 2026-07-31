'use strict';

// Internal helper boards, and how to keep them out of a board list.
//
// WeKan creates boards of its own to hold machinery: a subtasks board, for one.
// They are real boards and the user "owns" them, but nobody chose to make one and
// nobody means to open one, so no list of boards shows them (#5582). They are
// recognised by their TITLE: an internal board's name is wrapped in carets, e.g.
// `^Subtasks^`.
//
// The selector for that used to be typed out at each list — five copies of
// `{ $not: { $regex: /^\^.*\^$/ } }` — and the sixth place forgot it: /public
// listed every public subtasks board on the instance beside the real ones. One
// helper, so a new list cannot forget it and an old one cannot drift.
//
// A FUNCTION, not a shared constant: Mongo selectors get merged and mutated by
// their callers, and a shared object would carry one caller's edit into the next.
//
// Pure: no Meteor, no database.

// Titles of the form `^Anything^`.
const HELPER_BOARD_TITLE_PATTERN = /^\^.*\^$/;

// The `title` clause that excludes them. Spread it into a board selector:
//   { archived: false, type: 'board', title: notHelperBoardTitle() }
function notHelperBoardTitle() {
  return { $not: { $regex: HELPER_BOARD_TITLE_PATTERN } };
}

// Is this title an internal helper board's? Used by the tests, and by anything
// that has a board in hand rather than a query to build.
function isHelperBoardTitle(title) {
  return typeof title === 'string' && HELPER_BOARD_TITLE_PATTERN.test(title);
}

module.exports = {
  HELPER_BOARD_TITLE_PATTERN,
  notHelperBoardTitle,
  isHelperBoardTitle,
};
