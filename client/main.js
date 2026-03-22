// ============================================================================
// WeKan Client Entry Point
//
// CRITICAL: This file uses require() — NOT import.
// With ES module imports, ALL import statements are hoisted and evaluated
// in dependency-graph order (not textual order). This means we cannot
// guarantee that collection2/SimpleSchema load before model files.
//
// With require(), each call completes synchronously before the next:
//   1. collectionHelpers → loads collection2, SimpleSchema, helpers shim
//   2. App code → all models can safely use attachSchema/helpers
// ============================================================================

// 1. Bootstrap — MUST complete before any model code runs
require('/imports/collectionHelpers');

// 2. Load all application code
require('/client/imports');
