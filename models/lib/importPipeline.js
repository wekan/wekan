// The source adapters decide what each document means; this writer owns the
// repeated persistence and old-id -> new-id bookkeeping.
export async function writeImportedEntity(collection, document, options = {}) {
  // Every WeKan schema's createdAt autoValue replaces the value on insert, so
  // a creation date carried by the source (#1992) was silently reset to the
  // import time. Write it back past the schema; nothing else is touched. Read
  // it BEFORE inserting: collection2 cleans the document object in place.
  const createdAt = document && document.createdAt;
  const id = await collection.direct.insertAsync(document);
  if (createdAt instanceof Date && !Number.isNaN(createdAt.getTime())
    && typeof collection.rawCollection === 'function') {
    await collection.rawCollection().updateOne({ _id: id }, { $set: { createdAt } });
  }
  if (options.touch) {
    await collection.direct.updateAsync(id, { $set: options.touch });
  }
  if (options.ids && options.sourceId != null) {
    options.ids[options.sourceId] = id;
  }
  return id;
}

// Run normalized source stages in order and carry the created board id into
// every later writer. Missing collection arrays normalize to empty arrays.
export async function runImportPipeline(creator, board, stages) {
  if (!board || typeof board !== 'object' || Array.isArray(board)) {
    throw new TypeError('Imported board must be an object');
  }
  let boardId;
  for (const stage of stages) {
    const input = stage.source ? board[stage.source] || [] : board;
    const result = await creator[stage.method](input, boardId);
    if (stage.createsBoard) boardId = result;
  }
  if (!boardId) throw new Error('Import pipeline did not create a board');
  return boardId;
}
