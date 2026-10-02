// RepointBleed: Triggers, Actions, Rules and Integrations are allowed to a
// board admin of the document's board - the board the document is on BEFORE
// the update. Nothing stopped the update itself from changing boardId, so an
// admin of their own board could move a rule trigger to another board, to '*'
// (every board) or unset it, and a webhook integration onto a private board -
// and receive that board's activity, or mail its cards to themselves. No client
// code changes these documents' boardId, so a change is an attempt.
// Pure apart from the record: tested by tests/repointBleed.test.cjs.

// Does this update write boardId - by $set/$unset/$inc/... or as the target of
// a $rename?
export function changesBoardId(fieldNames, modifier, fields = ['boardId']) {
  if (Array.isArray(fieldNames) && fieldNames.some(name => fields.includes(name))) return true;
  const rename = modifier && modifier.$rename;
  return !!(rename && typeof rename === 'object' && Object.values(rename).some(name => fields.includes(name)));
}

// A deny rule for a collection whose documents belong to one board. `fields`
// names what ties a document to its board (and to its parent on the board).
export function denyBoardRepoint(collectionName, fields = ['boardId']) {
  return {
    update(userId, doc, fieldNames, modifier) {
      if (!changesBoardId(fieldNames, modifier, fields)) return false;
      try {
        require('/server/lib/securityLog').record({
          key: 'authz.repoint', action: 'blocked', source: `ddp:${collectionName}.update`, userId,
          detail: `Tried to move a ${collectionName} document from board ${doc && doc.boardId} to another board.`,
        });
      } catch (e) { /* logging must never break the guard */ }
      return true;
    },
  };
}
