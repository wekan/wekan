'use strict';
// The pure half of server/lib/scrumSnapshotStore.js: how a snapshot's rows are
// cut into immutable chunk documents, and the header the sprint keeps. The
// store and the transfer import (server/lib/scrumTransferImport.js) cut them
// the same way, so a chunk always has the same id and content. Tested by
// tests/scrumSnapshotRows.test.cjs.
const SNAPSHOT_CHUNK = 2000;

const chunkId = (sprintId, kind, at, chunk) => `${sprintId}:${kind}:${new Date(at).getTime()}:${chunk}`;

// Everything but the rows, and where they are.
function snapshotHeader(snapshot, chunks = Math.ceil((snapshot.cards || []).length / SNAPSHOT_CHUNK)) {
  const { cards, ...header } = snapshot;
  return { ...header, stored: 'rows', rowCount: (cards || []).length, chunks };
}

// `kind` is 'start', 'close' or 'daily'.
function chunkSnapshot({ boardId, sprintId, kind, snapshot }) {
  const rows = snapshot.cards || [];
  const docs = [];
  for (let chunk = 0; chunk * SNAPSHOT_CHUNK < rows.length; chunk += 1) {
    docs.push({ _id: chunkId(sprintId, kind, snapshot.at, chunk), boardId, sprintId, kind, at: new Date(snapshot.at),
      chunk, rows: rows.slice(chunk * SNAPSHOT_CHUNK, (chunk + 1) * SNAPSHOT_CHUNK) });
  }
  return { header: snapshotHeader(snapshot, docs.length), docs };
}

// A snapshot as the client sees it: never the rows.
function withoutRows(snapshot) {
  if (!snapshot) return snapshot;
  const { cards, ...header } = snapshot;
  return { ...header, rowCount: snapshot.rowCount ?? (cards || []).length };
}

module.exports = { SNAPSHOT_CHUNK, chunkId, snapshotHeader, chunkSnapshot, withoutRows };
