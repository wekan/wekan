// ============================================================================
// WeKan Server Entry Point
//
// Uses require() to guarantee bootstrap runs before any model code.
// ============================================================================

// 1. Helpers polyfill (server no-op for .helpers())
require('/imports/collectionHelpers');

// 2. Collection2 (server-only)
require('meteor/aldeed:collection2');

// 3. Load all application code
require('/server/imports');
