// ============================================================================
// WeKan Server Entry Point
//
// Uses require() to guarantee bootstrap runs before any model code.
// ============================================================================

// 0. Disable jam:offline keepAll BEFORE any collections are created.
//    The package wraps Mongo.Collection constructor and registers every
//    collection for offline sync when keepAll is true (default).
//    WeKan uses modifiedAt (not updatedAt) and archived (not deleted),
//    so the default sync generates distinct() queries on non-existent fields
//    causing full collection scans (COLLSCAN) that block MongoDB and kill
//    cursors, preventing the /sign-in page from loading.
const { Offline } = require('meteor/jam:offline');
if (Offline && Offline.configure) {
  Offline.configure({ keepAll: false });
}

// 1. Helpers polyfill (server no-op for .helpers())
require('/imports/collectionHelpers');

// 2. Collection2 (server-only)
require('meteor/aldeed:collection2');

// 3. Load all application code
require('/server/imports');
