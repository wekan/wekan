'use strict';

// Which element a swimlane or list link has to bring into view.
//
// Following `/b/<board>/<slug>/list/<listId>` has to end with that list on
// screen, or the address named a place and took you to the top of the board
// instead. The route cannot do it - it runs before the board has rendered, and
// on a board that is already open it runs without re-creating anything - so it
// names what to reveal and the board body reveals it once the element exists.
//
// The ids are the ones the templates already carry:
// `client/components/swimlanes/swimlanes.jade` gives a swimlane
// `id="swimlane-<id>"` and `client/components/lists/list.jade` gives a list
// `id="js-list-<id>"`. They are NOT derived from a rule of this module's own
// invention - deriving one name from another is how
// `allBoardsMultiselectionSidebar` happened - and a guard checks each one
// against the markup that draws it.
//
// 'comment' and 'activity' (issue #4757) work the same way but are named from
// the URL *hash* rather than a route param: a comment or an activity has no
// address of its own the way a swimlane or list does - it only ever appears
// inside a card - so its permalink is the card's URL plus a fragment
// (`#comment-<id>` / `#activity-<id>`), and client/lib/revealBoardItem.js
// turns that fragment into the same Session-driven reveal used here.
// `client/components/activities/comments.jade` gives a comment
// `id="comment-<id>"` and `client/components/activities/activities.jade`
// gives an activity `id="activity-<id>"`.
//
// Pure: an id in, an element id out. No DOM, no Meteor, no jQuery.
// docs/Features/Page/Board-Item-Links.md

const REVEAL_KINDS = ['swimlane', 'list', 'comment', 'activity'];

// kind -> the Session key the route writes, and how that kind's element is named.
const REVEAL_TARGETS = {
  swimlane: { sessionKey: 'revealSwimlaneId', elementId: id => `swimlane-${id}` },
  list: { sessionKey: 'revealListId', elementId: id => `js-list-${id}` },
  comment: { sessionKey: 'revealCommentId', elementId: id => `comment-${id}` },
  activity: { sessionKey: 'revealActivityId', elementId: id => `activity-${id}` },
};

// The two kinds whose Session value is set from the URL hash rather than a
// route param - see the comment above.
const HASH_REVEAL_KINDS = ['comment', 'activity'];

const REVEAL_SESSION_KEYS = REVEAL_KINDS.map(kind => REVEAL_TARGETS[kind].sessionKey);

// The element id to look for, or null when the kind is not one or there is no
// id - a caller then reveals nothing rather than searching for `list-undefined`.
function revealElementId(kind, id) {
  const target = REVEAL_TARGETS[kind];
  if (!target || typeof id !== 'string' || !id) return null;
  return target.elementId(id);
}

module.exports = {
  REVEAL_KINDS,
  REVEAL_TARGETS,
  REVEAL_SESSION_KEYS,
  HASH_REVEAL_KINDS,
  revealElementId,
};
