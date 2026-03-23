// ============================================================================
// WeKan Client Entry Point
//
// Side-effect imports keep bootstrap order explicit without relying on
// browser-side CommonJS require().
// ============================================================================

// 1. Bootstrap — helpers polyfill (SimpleSchema is server-only)
import '/imports/collectionHelpers';

// 2. Eagerly load all app styles
import '/client/styles';

// 3. Load all application code
import '/client/imports';
