'use strict';

// #6927: the ids of a board's ARCHIVED swimlanes, on the client.
//
// The first swimlane surfaces "orphaned" cards - cards whose swimlane does not
// exist (#6443) - but a card under an ARCHIVED swimlane is not orphaned: it is
// hidden with its swimlane (#6659). The client could only tell the two apart
// for swimlanes in its cache, and archived swimlanes reach the client only
// while the Archive sidebar is open. So on a board whose archived swimlane
// still holds unarchived cards (archived before #2292 archived cards with
// their swimlane - a board migrated from WeKan 6.09, for one), those cards
// appeared in the first swimlane, and vanished while the Archive was open.
//
// The `boardArchivedSwimlaneIds` publication (server/publications/
// archivedSwimlaneIds.js) sends ONE document per board, { _id: boardId, ids },
// into this client-only collection - just the ids, so no list of swimlanes
// anywhere starts showing archived ones. Lists.orphanedCardsSwimlaneIds()
// adds them to what it excludes.

const COLLECTION = 'archivedSwimlaneIds';

let collection = null;
function archivedSwimlaneIdsCollection() {
  if (collection) return collection;
  // eslint-disable-next-line global-require
  const { Meteor } = require('meteor/meteor');
  if (!Meteor.isClient) return null;
  // eslint-disable-next-line global-require
  const { Mongo } = require('meteor/mongo');
  collection = new Mongo.Collection(COLLECTION);
  return collection;
}

// The archived swimlane ids the client knows for a board, or [].
function archivedSwimlaneIdsOf(boardId) {
  const c = archivedSwimlaneIdsCollection();
  if (!c || !boardId) return [];
  const doc = c.findOne(boardId);
  return doc && Array.isArray(doc.ids) ? doc.ids.filter(id => typeof id === 'string' && id) : [];
}

// The swimlanes the first-swimlane rule looks at, with the archived ones the
// cache does not hold added as { _id, archived: true }: they are excluded from
// the orphan fallback but can never become "the first active swimlane".
function withArchivedSwimlanes(swimlanes, archivedIds) {
  const list = Array.isArray(swimlanes) ? swimlanes.slice() : [];
  const known = new Set(list.map(s => s && s._id));
  for (const id of archivedIds || []) {
    if (!known.has(id)) list.push({ _id: id, archived: true });
  }
  return list;
}

module.exports = { COLLECTION, archivedSwimlaneIdsCollection, archivedSwimlaneIdsOf, withArchivedSwimlanes };
