const { createHash } = require('node:crypto');

// Keep a retry (including another worker) on the same database primary key.
// JSON tuple encoding avoids delimiter collisions in external IDs. Use the
// entire digest; this ID is an identity, never an authorization credential.
function listSyncCardId(listId, sourceKey, externalId) {
  return `sync-${createHash('sha256')
    .update(JSON.stringify([listId, sourceKey, String(externalId)]))
    .digest('hex')}`;
}

module.exports = { listSyncCardId };
