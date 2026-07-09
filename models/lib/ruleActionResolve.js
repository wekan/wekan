'use strict';

// #5536 "Automated Rule Cannot Move Card to a Different Board".
//
// When an automated rule moves ("move card to top/bottom") or links a card onto
// another board, the destination swimlane and list have to be resolved on THAT
// board. The old resolver in server/rulesHelper.js did, as its fallback:
//
//     swimlaneId = (await getSwimlane({ title: 'Default', boardId }))._id;
//
// which threw `TypeError: Cannot read properties of undefined (reading '_id')`
// — surfaced to the user as a generic "Internal Server Error" — whenever the
// destination board had no swimlane whose title was exactly `Default`
// (renamed, translated to another language, or deleted). The same unguarded
// `._id` dereference existed in the createCard and linkCard actions. This is
// exactly the crash the issue reporter saw when a rule tried to move a card to
// a board they did not themselves create.
//
// These helpers pick a valid id from the already-fetched candidates and NEVER
// throw. They return '' when nothing is resolvable, so the caller can proceed
// with an empty (unassigned) value instead of crashing the whole rule.

// Choose the swimlane id to use on the destination board.
//   named           - swimlane matched by the action's swimlaneName, or (on a
//                     cross-board move with swimlaneName === '*') the swimlane
//                     whose title equals the source card's swimlane title.
//                     May be undefined when no such swimlane exists.
//   defaultSwimlane - the destination board's real default swimlane, obtained
//                     from Board.getDefaultSwimline()/getDefaultSwimlineAsync()
//                     (which self-heals and is not tied to the literal title
//                     'Default'). May be undefined on a board with no swimlanes.
function resolveRuleSwimlaneId(named, defaultSwimlane) {
  if (named && named._id) return named._id;
  if (defaultSwimlane && defaultSwimlane._id) return defaultSwimlane._id;
  return '';
}

// Choose the list id to use on the destination board. A rule may target a board
// that has no list with the wanted title; '' is a safe "unassigned" value that
// does not crash — unlike the old unguarded `list._id` dereference.
function resolveRuleListId(named) {
  return named && named._id ? named._id : '';
}

module.exports = { resolveRuleSwimlaneId, resolveRuleListId };
