'use strict';
// One item of the REST card lists - GET /api/boards/:boardId/lists/:listId/cards
// and GET /api/boards/:boardId/swimlanes/:swimlaneId/cards. Both routes build
// their items here, so they cannot drift apart again.
//
// #6928: a client syncing boards had to GET every card on its own to learn its
// labels, members or custom field values, or whether it changed since the last
// sync. These fields are now in the list itself. The single-card GET already
// returns the whole card to the same caller, after the same board access
// check, and admin-only custom field values are concealed by the same
// boundary (sendJsonResult), so nothing here is exposed that was not before.
// They come from the documents the route already read: no extra query.
// A field the card does not have is left out, as JSON leaves out undefined.

// customFields as [{ _id, value }]: the stored entries carry nothing else a
// client needs, and this keeps the answer that shape even if they ever do.
function customFieldValues(customFields) {
  if (!Array.isArray(customFields)) return undefined;
  return customFields
    .filter(field => field && typeof field._id === 'string')
    .map(field => ({ _id: field._id, value: field.value === undefined ? null : field.value }));
}

// by: 'list' (the item says its swimlaneId) or 'swimlane' (its listId).
function restCardListItem(doc, by) {
  const placement = by === 'swimlane' ? 'listId' : 'swimlaneId';
  return {
    _id: doc._id,
    // Not only for the client: sendJsonResult conceals admin-only custom field
    // values (server/apiMiddleware.js), and it scopes each object by its own
    // boardId. Without it an admin-only field shared by several boards would
    // be hidden from an admin of this one, who may read it.
    boardId: doc.boardId,
    title: doc.title,
    description: doc.description,
    [placement]: doc[placement],
    receivedAt: doc.receivedAt,
    startAt: doc.startAt,
    dueAt: doc.dueAt,
    endAt: doc.endAt,
    assignees: doc.assignees,
    sort: doc.sort,
    modifiedAt: doc.modifiedAt,
    dateLastActivity: doc.dateLastActivity,
    labelIds: doc.labelIds,
    members: doc.members,
    customFields: customFieldValues(doc.customFields),
  };
}

module.exports = { restCardListItem, customFieldValues };
